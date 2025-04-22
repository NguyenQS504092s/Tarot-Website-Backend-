const mongoose = require('mongoose');

/**
 * Schema cho gói dịch vụ
 */
const SubscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên gói dịch vụ không được để trống'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Mô tả gói dịch vụ không được để trống'],
  },
  price: {
    type: Number,
    required: [true, 'Giá gói dịch vụ không được để trống'],
    min: [0, 'Giá gói dịch vụ không thể âm'],
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD']
  },
  duration: {
    type: Number,
    required: [true, 'Thời hạn gói dịch vụ không được để trống'],
    min: [1, 'Thời hạn gói dịch vụ phải lớn hơn 0'],
  },
  durationUnit: {
    type: String,
    enum: ['day', 'month', 'year'],
    default: 'month'
  },
  features: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  stripePriceId: {
    type: String
  },
  stripeProductId: {
    type: String
  }
}, { timestamps: true });

/**
 * Schema cho giao dịch thanh toán
 */
const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Số tiền thanh toán không được để trống'],
    min: [0, 'Số tiền thanh toán không thể âm']
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'momo', 'zalopay'],
    required: [true, 'Phương thức thanh toán không được để trống']
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan'
  },
  transactionId: {
    type: String
  },
  metadata: {
    type: Object
  },
  receiptUrl: {
    type: String
  },
  description: {
    type: String
  }
}, { timestamps: true });

/**
 * Schema cho gói dịch vụ của người dùng
 */
const UserSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  stripeSubscriptionId: {
    type: String
  },
  canceledAt: {
    type: Date
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }]
}, { timestamps: true });

/**
 * Tính toán ngày kết thúc gói đăng ký
 * @param {Object} plan - Đối tượng gói đăng ký
 * @param {Date} startDate - Ngày bắt đầu gói đăng ký
 * @returns {Date} Ngày kết thúc gói đăng ký
 */
UserSubscriptionSchema.statics.calculateEndDate = function(plan, startDate = new Date()) {
  const endDate = new Date(startDate);
  
  switch (plan.durationUnit) {
    case 'day':
      endDate.setDate(endDate.getDate() + plan.duration);
      break;
    case 'month':
      endDate.setMonth(endDate.getMonth() + plan.duration);
      break;
    case 'year':
      endDate.setFullYear(endDate.getFullYear() + plan.duration);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1); // Mặc định 1 tháng
  }
  
  return endDate;
};

/**
 * Kiểm tra xem người dùng có gói đăng ký còn hoạt động không
 * @param {String} userId - ID người dùng
 * @returns {Promise<Boolean>} true nếu có gói đang hoạt động
 */
UserSubscriptionSchema.statics.hasActiveSubscription = async function(userId) {
  const activeSubscription = await this.findOne({
    userId: userId,
    isActive: true,
    endDate: { $gt: new Date() }
  });
  
  return !!activeSubscription;
};

/**
 * Tìm gói đăng ký đang hoạt động của người dùng
 * @param {String} userId - ID người dùng
 * @returns {Promise<Object|null>} Đối tượng gói đăng ký hoặc null
 */
UserSubscriptionSchema.statics.findActiveSubscription = async function(userId) {
  return this.findOne({
    userId: userId,
    isActive: true,
    endDate: { $gt: new Date() }
  }).populate('plan');
};

// Pre save hook để tính ngày kết thúc nếu không được cung cấp
UserSubscriptionSchema.pre('save', async function(next) {
  // Nếu đây là một subscription mới và endDate chưa được set
  if (this.isNew && !this.endDate) {
    try {
      const plan = await mongoose.model('SubscriptionPlan').findById(this.plan);
      if (!plan) {
        return next(new Error('Không tìm thấy gói dịch vụ'));
      }
      
      this.endDate = UserSubscriptionSchema.statics.calculateEndDate(plan, this.startDate);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Export các model
const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const UserSubscription = mongoose.model('UserSubscription', UserSubscriptionSchema);

module.exports = {
  SubscriptionPlan,
  Payment,
  UserSubscription
};