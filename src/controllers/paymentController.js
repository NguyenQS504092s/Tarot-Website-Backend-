const { SubscriptionPlan, Payment, UserSubscription } = require('../models/paymentModel');
const User = require('../models/userModel');
const paymentService = require('../services/paymentService'); // Import the service
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Keep stripe for checkout/webhook

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
 * @route   POST /api/payments/admin/plans
 * @access  Private (Admin)
 */
exports.createSubscriptionPlan = async (req, res, next) => {
  try {
    // Data is validated by createSubscriptionPlanValidator
    const planData = req.body;

    // Call the service function
    const newPlan = await paymentService.createSubscriptionPlan(planData);

    // Service handles Stripe interaction and DB creation

    res.status(201).json(ApiResponse.success(newPlan, 'Tạo gói dịch vụ thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật gói dịch vụ
 * @route   PUT /api/payments/admin/plans/:id
 * @access  Private (Admin)
 */
exports.updateSubscriptionPlan = async (req, res, next) => {
  try {
    const planId = req.params.id; // ID is validated by updateSubscriptionPlanValidator
    const updateData = req.body; // Data is validated by updateSubscriptionPlanValidator

    // Call the service function
    const updatedPlan = await paymentService.updateSubscriptionPlan(planId, updateData);

    // Service handles Stripe interaction, DB update, and 'not found' errors

    res.status(200).json(ApiResponse.success(updatedPlan, 'Cập nhật gói dịch vụ thành công'));
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
exports.stripeWebhook = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  try {
    // Gọi service để xử lý webhook, truyền signature và raw body
    // Lưu ý: req.body ở đây phải là raw buffer, được cấu hình trong app.js
    await paymentService.handleStripeWebhook(signature, req.body);

    // Nếu service không throw lỗi (signature hợp lệ và xử lý xong hoặc lỗi nội bộ đã log)
    res.status(200).json({ received: true });

  } catch (error) {
    // Bắt lỗi từ service (chủ yếu là lỗi signature hoặc lỗi cấu hình secret)
    if (error instanceof ApiError) {
      // Trả về lỗi cụ thể nếu là ApiError (ví dụ: 400 cho signature sai)
      return res.status(error.statusCode).send(`Webhook Error: ${error.message}`);
    } else {
      // Lỗi không mong muốn khác
      console.error(`Unexpected error in stripeWebhook controller: ${error.message}`);
      return res.status(500).send('Internal Server Error');
    }
    // Không cần gọi next(error) vì đây là endpoint đặc biệt
  }
};

// Các hàm helper handleCheckoutSessionCompleted, handleInvoicePaid, handleSubscriptionDeleted đã được chuyển sang paymentService.js

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

/**
 * @desc    Xóa (hủy kích hoạt) gói dịch vụ
 * @route   DELETE /api/payments/admin/plans/:id
 * @access  Private (Admin)
 */
exports.deleteSubscriptionPlan = async (req, res, next) => {
  try {
    const planId = req.params.id; // ID is validated by deleteSubscriptionPlanValidator

    // Call the service function
    await paymentService.deleteSubscriptionPlan(planId);

    // Service handles 'not found' error and deactivation logic

    res.status(200).json(ApiResponse.success(null, 'Gói dịch vụ đã được hủy kích hoạt'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy tất cả lịch sử thanh toán (Admin)
 * @route   GET /api/payments/admin/payments
 * @access  Private (Admin)
 */
exports.getAllPayments = async (req, res, next) => {
  try {
    // Basic Pagination (can be enhanced)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const totalPayments = await Payment.countDocuments();
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .populate('subscriptionPlan', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(ApiResponse.pagination(
      payments,
      page,
      limit,
      totalPayments,
      'Lấy tất cả lịch sử thanh toán thành công'
    ));
  } catch (error) {
    next(error);
  }
};
