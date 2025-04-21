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
      enum: ['user', 'reader', 'admin'],
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

// Method: Kiểm tra mật khẩu có khớp không
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method: Tạo JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// Method: Tạo refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
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
    this.dailyReadings.count = 0;
    this.dailyReadings.lastReset = now;
  }
  
  return this.dailyReadings.count < config.freeReadingsPerDay;
};

// Method: Tăng số lần đọc bài trong ngày
userSchema.methods.incrementDailyReadings = function() {
  this.dailyReadings.count += 1;
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;