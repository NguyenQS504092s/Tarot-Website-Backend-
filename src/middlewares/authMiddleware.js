const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Middleware bảo vệ các routes yêu cầu đăng nhập
 * Kiểm tra và xác thực JWT token từ header
 */
exports.protect = async (req, res, next) => {
  try {
    // Lấy token từ header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Nếu không có token
    if (!token) {
      return next(new ApiError('Bạn cần đăng nhập để truy cập tài nguyên này', 401));
    }

    // Kiểm tra xem JWT_SECRET đã được định nghĩa chưa
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET không được định nghĩa trong biến môi trường');
      return next(new ApiError('Lỗi server: JWT_SECRET chưa được cấu hình', 500));
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm người dùng dựa trên ID từ token
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new ApiError('Người dùng không còn tồn tại', 401));
    }

    // Gắn thông tin người dùng vào request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError('Token không hợp lệ', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Token đã hết hạn, vui lòng đăng nhập lại', 401));
    }
    return next(new ApiError('Lỗi xác thực: ' + error.message, 401));
  }
};

/**
 * Middleware hạn chế quyền truy cập theo vai trò
 * @param  {...String} roles Các vai trò được phép truy cập
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra xem middleware protect đã chạy chưa
    if (!req.user) {
      return next(new ApiError('Không có thông tin người dùng, vui lòng đăng nhập trước', 401));
    }

    // Kiểm tra quyền người dùng
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('Bạn không có quyền thực hiện hành động này', 403));
    }
    next();
  };
};