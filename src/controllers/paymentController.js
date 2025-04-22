const { SubscriptionPlan, Payment, UserSubscription } = require('../models/paymentModel');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * @desc    Lấy danh sách tất cả các gói dịch vụ
 * @route   GET /api/payments/plans
 * @access  Public
 */
exports.getAllPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort('price');

    res.status(200).json(ApiResponse.success(
      { plans, count: plans.length }, 
      'Lấy danh sách gói dịch vụ thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy chi tiết một gói dịch vụ
 * @route   GET /api/payments/plans/:id
 * @access  Public
 */
exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return next(new ApiError('Không tìm thấy gói dịch vụ', 404));
    }

    res.status(200).json(ApiResponse.success({ plan }, 'Lấy chi tiết gói dịch vụ thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo mới gói dịch vụ
 * @route   POST /api/payments/plans
 * @access  Private (Admin)
 */
exports.createPlan = async (req, res, next) => {
  try {
    const { name, description, price, currency, duration, durationUnit, features } = req.body;

    // Tạo sản phẩm trong Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description,
      metadata: {
        duration,
        durationUnit
      }
    });

    // Tạo giá cho sản phẩm
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100), // Convert to cents/smallest currency unit
      currency: currency.toLowerCase(),
      recurring: {
        interval: durationUnit === 'month' ? 'month' : durationUnit === 'year' ? 'year' : 'day',
        interval_count: duration
      }
    });

    // Tạo gói dịch vụ trong database
    const plan = await SubscriptionPlan.create({
      name,
      description,
      price,
      currency,
      duration,
      durationUnit,
      features,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id
    });

    res.status(201).json(ApiResponse.success(plan, 'Tạo gói dịch vụ thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật gói dịch vụ
 * @route   PUT /api/payments/plans/:id
 * @access  Private (Admin)
 */
exports.updatePlan = async (req, res, next) => {
  try {
    const { name, description, price, isActive, features } = req.body;

    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return next(new ApiError('Không tìm thấy gói dịch vụ', 404));
    }

    // Cập nhật thông tin trong Stripe nếu cần
    if (name || description) {
      await stripe.products.update(plan.stripeProductId, {
        name: name || plan.name,
        description: description || plan.description,
        active: isActive !== undefined ? isActive : plan.isActive
      });
    }

    // Cập nhật thông tin gói dịch vụ
    if (name) plan.name = name;
    if (description) plan.description = description;
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    // Nếu giá thay đổi, tạo một price mới trong Stripe và cập nhật trong DB
    if (price && price !== plan.price) {
      const stripePrice = await stripe.prices.create({
        product: plan.stripeProductId,
        unit_amount: Math.round(price * 100),
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: plan.durationUnit === 'month' ? 'month' : plan.durationUnit === 'year' ? 'year' : 'day',
          interval_count: plan.duration
        }
      });

      plan.stripePriceId = stripePrice.id;
      plan.price = price;
    }

    await plan.save();

    res.status(200).json(ApiResponse.success(plan, 'Cập nhật gói dịch vụ thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo phiên thanh toán Stripe
 * @route   POST /api/payments/create-checkout-session
 * @access  Private
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { planId } = req.body;

    // Tìm gói dịch vụ
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return next(new ApiError('Gói dịch vụ không tồn tại hoặc không khả dụng', 404));
    }

    // Lấy thông tin user
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError('Không tìm thấy thông tin người dùng', 404));
    }

    // Tạo customer trong Stripe nếu chưa có
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Tạo session thanh toán
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer: customerId,
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        planId: plan._id.toString(),
        userId: user._id.toString()
      }
    });

    res.status(200).json(ApiResponse.success({
      sessionId: session.id,
      url: session.url
    }, 'Tạo phiên thanh toán thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Webhook xử lý sự kiện từ Stripe
 * @route   POST /api/payments/webhook
 * @access  Public
 */
exports.stripeWebhook = async (req, res) => {
  let signature = req.headers['stripe-signature'];
  let event;

  try {
    // Kiểm tra xem STRIPE_WEBHOOK_SECRET đã được cấu hình chưa
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not defined');
      return res.status(500).send('Server không được cấu hình đúng');
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Xử lý các sự kiện
    switch (event.type) {
      case 'checkout.session.completed':
        try {
          await handleCheckoutSessionCompleted(event.data.object);
        } catch (error) {
          console.error(`Error handling checkout.session.completed: ${error.message}`);
          // Không return ở đây để tránh Stripe gửi lại sự kiện
        }
        break;
      case 'invoice.paid':
        try {
          await handleInvoicePaid(event.data.object);
        } catch (error) {
          console.error(`Error handling invoice.paid: ${error.message}`);
        }
        break;
      case 'customer.subscription.deleted':
        try {
          await handleSubscriptionDeleted(event.data.object);
        } catch (error) {
          console.error(`Error handling customer.subscription.deleted: ${error.message}`);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Trả về thành công cho Stripe để không gửi lại webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`General webhook processing error: ${error.message}`);
    // Trả về 200 để Stripe không gửi lại sự kiện
    // Các lỗi được ghi log nhưng không trả về client
    res.status(200).send('Webhook received');
  }
};

/**
 * @desc    Xử lý sự kiện checkout.session.completed từ Stripe
 * @private
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    const { planId, userId } = session.metadata;
    
    // Lấy thông tin gói dịch vụ
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw new Error('Không tìm thấy gói dịch vụ');

    // Lấy thông tin subscription từ Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    // Tạo payment record
    const payment = await Payment.create({
      userId,
      amount: plan.price,
      currency: plan.currency,
      status: 'completed',
      paymentMethod: 'stripe',
      subscriptionPlan: planId,
      transactionId: session.payment_intent,
      metadata: {
        stripeSessionId: session.id,
        stripeSubscriptionId: session.subscription
      },
      description: `Thanh toán cho gói ${plan.name}`
    });

    // Tính ngày kết thúc
    const startDate = new Date();
    const endDate = UserSubscription.calculateEndDate(plan, startDate);

    // Kiểm tra xem người dùng đã có gói dịch vụ đang hoạt động chưa
    const existingSubscription = await UserSubscription.findActiveSubscription(userId);
    
    if (existingSubscription) {
      // Nếu đã có gói đang hoạt động, vô hiệu hóa gói cũ
      existingSubscription.isActive = false;
      existingSubscription.autoRenew = false;
      await existingSubscription.save();
    }

    // Tạo subscription mới
    await UserSubscription.create({
      userId,
      plan: planId,
      startDate,
      endDate,
      isActive: true,
      autoRenew: true,
      stripeSubscriptionId: session.subscription,
      payments: [payment._id]
    });

    // Cập nhật vai trò người dùng nếu cần
    const user = await User.findById(userId);
    if (user && user.role === 'user') {
      user.role = 'premium_user';
      await user.save();
    }
  } catch (error) {
    console.error(`Error handling checkout.session.completed: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Xử lý sự kiện invoice.paid từ Stripe (cho thanh toán tự động)
 * @private
 */
async function handleInvoicePaid(invoice) {
  try {
    // Tìm subscription id
    const stripeSubscriptionId = invoice.subscription;
    
    // Tìm subscription trong database
    const subscription = await UserSubscription.findOne({ 
      stripeSubscriptionId,
      isActive: true
    });
    
    if (!subscription) return;
    
    // Tìm plan
    const plan = await SubscriptionPlan.findById(subscription.plan);
    if (!plan) return;

    // Tạo payment record mới
    const payment = await Payment.create({
      userId: subscription.userId,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: 'completed',
      paymentMethod: 'stripe',
      subscriptionPlan: subscription.plan,
      transactionId: invoice.payment_intent,
      metadata: {
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId
      },
      description: `Thanh toán tự động cho gói ${plan.name}`
    });

    // Cập nhật ngày kết thúc subscription
    const newEndDate = UserSubscription.calculateEndDate(
      plan,
      subscription.endDate > new Date() ? subscription.endDate : new Date()
    );
    
    subscription.endDate = newEndDate;
    subscription.payments.push(payment._id);
    await subscription.save();
  } catch (error) {
    console.error(`Error handling invoice.paid: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Xử lý sự kiện customer.subscription.deleted từ Stripe
 * @private
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  try {
    // Tìm subscription trong database
    const subscription = await UserSubscription.findOne({ 
      stripeSubscriptionId: stripeSubscription.id
    });
    
    if (!subscription) return;
    
    // Đánh dấu subscription đã bị hủy
    subscription.isActive = false;
    subscription.autoRenew = false;
    subscription.canceledAt = new Date();
    await subscription.save();

    // Kiểm tra xem người dùng có còn subscription nào active không
    const userId = subscription.userId;
    const hasActiveSubscription = await UserSubscription.hasActiveSubscription(userId);

    // Nếu không còn subscription active nào và người dùng có role là premium_user, chuyển về user
    if (!hasActiveSubscription) {
      const user = await User.findById(userId);
      if (user && user.role === 'premium_user') {
        user.role = 'user';
        await user.save();
      }
    }
  } catch (error) {
    console.error(`Error handling subscription.deleted: ${error.message}`);
    throw error;
  }
}

/**
 * @desc    Lấy thông tin subscription hiện tại của người dùng
 * @route   GET /api/payments/subscription
 * @access  Private
 */
exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const subscription = await UserSubscription.findActiveSubscription(req.user._id);
    
    const response = {
      hasActiveSubscription: !!subscription
    };

    if (subscription) {
      response.subscription = {
        ...subscription.toObject(),
        remainingDays: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
      };
    }

    res.status(200).json(ApiResponse.success(response, 'Lấy thông tin gói dịch vụ thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Hủy đăng ký gói hiện tại
 * @route   DELETE /api/payments/subscription
 * @access  Private
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    // Tìm subscription đang active
    const subscription = await UserSubscription.findActiveSubscription(req.user._id);
    
    if (!subscription) {
      return next(new ApiError('Bạn không có gói dịch vụ đang hoạt động', 404));
    }

    // Nếu đã có Stripe subscription ID, hủy trong Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Cập nhật trong database
    subscription.autoRenew = false;
    await subscription.save();

    res.status(200).json(ApiResponse.success(
      { message: 'Gói dịch vụ sẽ tự động hủy khi hết hạn' }, 
      'Hủy đăng ký gói dịch vụ thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lịch sử thanh toán của người dùng
 * @route   GET /api/payments/history
 * @access  Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('subscriptionPlan', 'name description price currency')
      .sort({ createdAt: -1 });

    res.status(200).json(ApiResponse.success({
      count: payments.length,
      payments
    }, 'Lấy lịch sử thanh toán thành công'));
  } catch (error) {
    next(error);
  }
};