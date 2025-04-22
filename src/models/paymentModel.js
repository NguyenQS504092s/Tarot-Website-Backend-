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

// Static method để tìm gói dịch vụ hiện tại của user
UserSubscriptionSchema.statics.findActiveSubscription = async function(userId) {
  const now = new Date();
  return this.findOne({
    userId,
    isActive: true,
    endDate: { $gt: now }
  }).populate('plan');
};

// Static method để kiểm tra xem user có gói dịch vụ active không
UserSubscriptionSchema.statics.hasActiveSubscription = async function(userId) {
  const subscription = await this.findActiveSubscription(userId);
  return !!subscription;
};

// Static method để tính ngày kết thúc dựa vào gói dịch vụ
UserSubscriptionSchema.statics.calculateEndDate = function(plan, startDate = new Date()) {
  const start = new Date(startDate);
  
  switch(plan.durationUnit) {
    case 'day':
      return new Date(start.setDate(start.getDate() + plan.duration));
    case 'month':
      return new Date(start.setMonth(start.getMonth() + plan.duration));
    case 'year':
      return new Date(start.setFullYear(start.getFullYear() + plan.duration));
    default:
      return new Date(start.setMonth(start.getMonth() + plan.duration));
  }
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