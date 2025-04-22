const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng cung cấp tên'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Vui lòng cung cấp email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Vui lòng cung cấp email hợp lệ']
    },
    password: {
      type: String,
      required: [true, 'Vui lòng cung cấp mật khẩu'],
      minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
      select: false
    },
    birthDate: {
      type: Date
    },
    zodiacSign: {
      type: String,
      enum: [
        'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 
        'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 
        'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
      ]
    },
    role: {
      type: String,
      enum: ['user', 'premium_user', 'reader', 'admin'],
      default: 'user'
    },
    subscription: {
      type: {
        type: String,
        enum: ['free', 'basic', 'premium'],
        default: 'free'
      },
      expiresAt: {
        type: Date
      }
    },
    dailyReadings: {
      count: {
        type: Number,
        default: 0
      },
      lastReset: {
        type: Date,
        default: Date.now
      }
    },
    stripeCustomerId: {
      type: String
    },
    passwordResetToken: String,
    passwordResetExpires: Date
  }, 
  {
    timestamps: true
  }
);

// Middleware: Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  // Chỉ chạy khi password được thay đổi
  if (!this.isModified('password')) return next();

  // Hash password với độ phức tạp 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method: So sánh mật khẩu nhập vào với mật khẩu đã hash
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method: Tạo JWT token - Phương thức cũ
userSchema.methods.generateAuthToken = function() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET không được định nghĩa trong biến môi trường');
  }
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Method: Tạo JWT token (để tương thích với userController)
userSchema.methods.getSignedJwtToken = function() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET không được định nghĩa trong biến môi trường');
  }
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Method: Tạo refresh token
userSchema.methods.generateRefreshToken = function() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET không được định nghĩa trong biến môi trường');
  }
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// Method: Tạo refresh token (để tương thích với userController)
userSchema.methods.getRefreshToken = function() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET không được định nghĩa trong biến môi trường');
  }
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// Method: Kiểm tra và reset số lần đọc miễn phí hàng ngày
userSchema.methods.checkAndResetDailyReadings = function() {
  const now = new Date();
  const lastReset = this.dailyReadings.lastReset;
  
  // Kiểm tra xem có phải ngày mới không
  if (
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    // Reset lại số lần đọc bài hàng ngày
    this.dailyReadings.count = 0;
    this.dailyReadings.lastReset = now;
    this.save();
    return true;
  }
  
  // Kiểm tra xem còn lượt đọc bài miễn phí không
  const maxFreeReadings = process.env.FREE_READINGS_PER_DAY || config.freeReadingsPerDay || 3;
  return this.dailyReadings.count < maxFreeReadings;
};

// Method: Tăng số lần đọc bài trong ngày
userSchema.methods.incrementDailyReadings = function() {
  this.dailyReadings.count += 1;
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;