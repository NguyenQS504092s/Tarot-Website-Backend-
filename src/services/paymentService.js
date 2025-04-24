/**
 * Payment Service - Xử lý logic liên quan đến thanh toán, gói dịch vụ, và subscriptions
 */
const { SubscriptionPlan, Payment, UserSubscription } = require('../models/paymentModel');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Lấy tất cả các gói dịch vụ đang hoạt động
 * @returns {Promise<Array>} Danh sách các gói dịch vụ
 */
exports.getAllActivePlans = async () => {
  try {
    return await SubscriptionPlan.find({ isActive: true }).sort('price');
  } catch (error) {
    throw new ApiError(`Lỗi khi lấy danh sách gói dịch vụ: ${error.message}`, 500);
  }
};

/**
 * Lấy chi tiết một gói dịch vụ theo ID
 * @param {String} planId ID của gói dịch vụ
 * @returns {Promise<Object>} Chi tiết gói dịch vụ
 */
exports.getPlanById = async (planId) => {
  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      throw new ApiError('Không tìm thấy gói dịch vụ', 404);
    }
    return plan;
  } catch (error) {
     if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi lấy chi tiết gói dịch vụ: ${error.message}`, 500);
  }
};

/**
 * Tạo mới gói dịch vụ (Admin)
 * @param {Object} planData Dữ liệu gói dịch vụ
 * @returns {Promise<Object>} Gói dịch vụ mới được tạo
 */
exports.createSubscriptionPlan = async (planData) => {
  const { name, description, price, currency, duration, durationUnit, features } = planData;
  try {
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
    const newPlan = await SubscriptionPlan.create({
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

    return newPlan;
  } catch (error) {
     if (error.name === 'ValidationError') {
        throw new ApiError(`Lỗi validation khi tạo gói dịch vụ: ${error.message}`, 400);
    }
    // Consider handling Stripe errors specifically if needed
    throw new ApiError(`Lỗi khi tạo gói dịch vụ: ${error.message}`, 500);
  }
};

/**
 * Cập nhật gói dịch vụ (Admin)
 * @param {String} planId ID của gói dịch vụ
 * @param {Object} updateData Dữ liệu cập nhật
 * @returns {Promise<Object>} Gói dịch vụ đã được cập nhật
 */
exports.updateSubscriptionPlan = async (planId, updateData) => {
  const { name, description, price, isActive, features } = updateData;
  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      throw new ApiError('Không tìm thấy gói dịch vụ', 404);
    }

    // Cập nhật thông tin trong Stripe nếu cần
    if (name || description || isActive !== undefined) {
      await stripe.products.update(plan.stripeProductId, {
        name: name || plan.name,
        description: description || plan.description,
        active: isActive !== undefined ? isActive : plan.isActive // Use current isActive if not provided
      });
    }

    // Cập nhật thông tin gói dịch vụ trong DB
    if (name) plan.name = name;
    if (description) plan.description = description;
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    // Nếu giá thay đổi, tạo một price mới trong Stripe và cập nhật trong DB
    // Lưu ý: Việc thay đổi giá của subscription hiện có phức tạp hơn,
    // cách tiếp cận này tạo giá mới và plan mới sẽ sử dụng giá này.
    // Các subscription cũ sẽ tiếp tục dùng giá cũ trừ khi được migrate.
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
      // Cập nhật stripePriceId và giá trong DB
      plan.stripePriceId = stripePrice.id;
      plan.price = price;
    }

    await plan.save();
    return plan;
  } catch (error) {
     if (error instanceof ApiError) {
      throw error;
    }
     if (error.name === 'ValidationError') {
        throw new ApiError(`Lỗi validation khi cập nhật gói dịch vụ: ${error.message}`, 400);
    }
    throw new ApiError(`Lỗi khi cập nhật gói dịch vụ: ${error.message}`, 500);
  }
};

/**
 * Xóa (hủy kích hoạt) gói dịch vụ (Admin)
 * @param {String} planId ID của gói dịch vụ
 * @returns {Promise<void>}
 */
exports.deleteSubscriptionPlan = async (planId) => {
  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      throw new ApiError('Không tìm thấy gói dịch vụ', 404);
    }

    // Deactivate the plan instead of hard deleting
    plan.isActive = false;

    // Optionally deactivate Stripe product (consider implications for existing subscriptions)
    // await stripe.products.update(plan.stripeProductId, { active: false });

    await plan.save();
  } catch (error) {
     if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi xóa gói dịch vụ: ${error.message}`, 500);
  }
};

// --- Webhook Handling ---

/**
 * Xử lý sự kiện checkout.session.completed từ Stripe
 * @param {Object} session Đối tượng session từ Stripe event
 * @returns {Promise<void>}
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    const { planId, userId } = session.metadata;
    if (!planId || !userId) {
        throw new Error('Missing planId or userId in checkout session metadata');
    }

    // --- Idempotency Check ---
    // Check if UserSubscription for this Stripe subscription already exists
    const existingUserSub = await UserSubscription.findOne({ stripeSubscriptionId: session.subscription });
    if (existingUserSub) {
        console.log(`Webhook Info: UserSubscription for ${session.subscription} already exists. Skipping checkout.session.completed handling.`);
        return; // Already processed
    }
    // Check if Payment for this intent already exists
    if (session.payment_intent) {
        const existingPayment = await Payment.findOne({ transactionId: session.payment_intent });
        if (existingPayment) {
            console.log(`Webhook Info: Payment for intent ${session.payment_intent} already exists. Skipping checkout.session.completed handling.`);
            return; // Already processed
        }
    }
    // --- End Idempotency Check ---


    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw new Error(`Webhook Error: Plan not found with ID: ${planId}`);

    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    if (!subscription) throw new Error(`Webhook Error: Stripe subscription not found: ${session.subscription}`);

    const payment = await Payment.create({
      userId,
      amount: plan.price,
      currency: plan.currency,
      status: 'completed',
      paymentMethod: 'stripe',
      subscriptionPlan: planId,
      transactionId: session.payment_intent, // Use payment_intent for payment record
      metadata: {
        stripeSessionId: session.id,
        stripeSubscriptionId: session.subscription
      },
      description: `Thanh toán cho gói ${plan.name}`
    });

    const startDate = new Date();
    const endDate = UserSubscription.calculateEndDate(plan, startDate);

    const existingSubscription = await UserSubscription.findActiveSubscription(userId);
    if (existingSubscription) {
      existingSubscription.isActive = false;
      existingSubscription.autoRenew = false;
      // Optionally add a note about replacement
      await existingSubscription.save();
      console.log(`Webhook Info: Deactivated existing subscription ${existingSubscription._id} for user ${userId}`);
    }

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

    const user = await User.findById(userId);
    if (user && user.role === 'user') {
      user.role = 'premium_user';
      await user.save();
      console.log(`Webhook Info: Upgraded user ${userId} to premium_user`);
    }
     console.log(`Webhook Success: Processed checkout.session.completed for session ${session.id}`);

  } catch (error) {
    console.error(`Webhook Error in handleCheckoutSessionCompleted for session ${session?.id}: ${error.message}`);
    // Do not re-throw here to allow main webhook handler to return 200
  }
}

/**
 * Xử lý sự kiện invoice.paid từ Stripe (cho thanh toán tự động)
 * @param {Object} invoice Đối tượng invoice từ Stripe event
 * @returns {Promise<void>}
 */
async function handleInvoicePaid(invoice) {
  try {
    // Ignore draft invoices or invoices without subscription
    if (invoice.status !== 'paid' || !invoice.subscription) {
        console.log(`Webhook Info: Skipping invoice.paid handling for invoice ${invoice.id} (status: ${invoice.status}, subscription: ${invoice.subscription})`);
        return;
    }

    const stripeSubscriptionId = invoice.subscription;

    // --- Idempotency Check ---
    // Check if Payment for this invoice already exists
    const existingPayment = await Payment.findOne({ 'metadata.stripeInvoiceId': invoice.id });
     if (existingPayment) {
        console.log(`Webhook Info: Payment for invoice ${invoice.id} already exists. Skipping invoice.paid handling.`);
        return; // Already processed
    }
    // --- End Idempotency Check ---

    const subscription = await UserSubscription.findOne({
      stripeSubscriptionId,
      isActive: true // Only update active subscriptions
    });

    if (!subscription) {
        console.warn(`Webhook Warning: Active UserSubscription not found for stripeSubscriptionId ${stripeSubscriptionId} during invoice.paid handling.`);
        return; // Cannot process without active subscription
    }

    const plan = await SubscriptionPlan.findById(subscription.plan);
    if (!plan) {
        console.error(`Webhook Error: Plan ${subscription.plan} not found for active UserSubscription ${subscription._id}`);
        return; // Cannot process without plan
    }

    const payment = await Payment.create({
      userId: subscription.userId,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: 'completed',
      paymentMethod: 'stripe',
      subscriptionPlan: subscription.plan,
      transactionId: invoice.payment_intent, // Use payment_intent if available
      metadata: {
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId
      },
      description: `Thanh toán tự động cho gói ${plan.name}`
    });

    // Calculate new end date based on the *current* end date if it's in the future,
    // otherwise base it on today (handles cases where webhook is delayed)
    const calculationBaseDate = subscription.endDate > new Date() ? subscription.endDate : new Date();
    const newEndDate = UserSubscription.calculateEndDate(plan, calculationBaseDate);

    subscription.endDate = newEndDate;
    subscription.payments.push(payment._id);
    await subscription.save();
    console.log(`Webhook Success: Processed invoice.paid for subscription ${stripeSubscriptionId}, new end date: ${newEndDate}`);

  } catch (error) {
    console.error(`Webhook Error in handleInvoicePaid for invoice ${invoice?.id}: ${error.message}`);
  }
}

/**
 * Xử lý sự kiện customer.subscription.deleted từ Stripe
 * @param {Object} stripeSubscription Đối tượng subscription từ Stripe event
 * @returns {Promise<void>}
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  try {
    const subscription = await UserSubscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (!subscription) {
        console.warn(`Webhook Warning: UserSubscription not found for stripeSubscriptionId ${stripeSubscription.id} during customer.subscription.deleted handling.`);
        return; // Nothing to update
    }

    // Check if already marked as inactive to handle potential duplicate events
    if (!subscription.isActive) {
        console.log(`Webhook Info: UserSubscription ${subscription._id} already inactive. Skipping customer.subscription.deleted handling.`);
        return;
    }

    subscription.isActive = false;
    subscription.autoRenew = false;
    subscription.canceledAt = new Date(stripeSubscription.canceled_at * 1000); // Use timestamp from Stripe
    await subscription.save();
    console.log(`Webhook Success: Deactivated UserSubscription ${subscription._id} due to Stripe event.`);

    const userId = subscription.userId;
    const hasActiveSubscription = await UserSubscription.hasActiveSubscription(userId);

    if (!hasActiveSubscription) {
      const user = await User.findById(userId);
      if (user && user.role === 'premium_user') {
        user.role = 'user';
        await user.save();
        console.log(`Webhook Info: Downgraded user ${userId} to user role.`);
      }
    }
  } catch (error) {
    console.error(`Webhook Error in handleSubscriptionDeleted for subscription ${stripeSubscription?.id}: ${error.message}`);
  }
}


/**
 * Xử lý sự kiện webhook đến từ Stripe
 * @param {String} signature Chữ ký từ header 'stripe-signature'
 * @param {Buffer} rawBody Body thô của request
 * @returns {Promise<void>}
 * @throws {ApiError} Nếu chữ ký không hợp lệ hoặc có lỗi cấu hình
 */
exports.handleStripeWebhook = async (signature, rawBody) => {
    let event;

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('CRITICAL: STRIPE_WEBHOOK_SECRET is not defined');
      throw new ApiError('Webhook secret not configured', 500); // Throw error for critical config issue
    }

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      throw new ApiError(`Webhook signature error: ${err.message}`, 400); // Throw error for invalid signature
    }

    console.log(`Webhook Received: Event type ${event.type}, ID: ${event.id}`);

    // Xử lý các sự kiện (không cần try...catch ở đây vì các hàm helper đã có)
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      // Add other event types as needed
      // case 'customer.subscription.updated':
      //   await handleSubscriptionUpdated(event.data.object);
      //   break;
      default:
        console.log(`Webhook Info: Unhandled event type ${event.type}`);
    }

    // Không cần trả về gì, controller sẽ trả về 200
};

// TODO: Add other payment related service functions
// e.g., createCheckoutSession, getUserSubscription, cancelSubscription, getPaymentHistory, getAllPayments
