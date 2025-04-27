const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Email không hợp lệ']
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false // không trả về password khi query
    },
    name: {
      type: String,
      required: [true, 'Tên là bắt buộc'],
      trim: true
    },
    birthDate: {
      type: Date
    },
    zodiacSign: {
      type: String
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
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Middleware: Mã hóa password trước khi lưu
UserSchema.pre('save', async function (next) {
  // Chỉ hash password khi nó bị thay đổi
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash password với độ khó là 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Phương thức: So sánh password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Phương thức: Tạo JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Phương thức: Tạo token refresh
UserSchema.methods.getRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });
};

module.exports = mongoose.model('User', UserSchema);