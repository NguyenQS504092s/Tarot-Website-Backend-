const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

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
      return res.status(401).json(
        ApiResponse.error('Bạn cần đăng nhập để truy cập tài nguyên này', 401)
      );
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm người dùng dựa trên ID từ token
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json(
        ApiResponse.error('Người dùng không còn tồn tại', 401)
      );
    }

    // Gắn thông tin người dùng vào request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        ApiResponse.error('Token không hợp lệ', 401)
      );
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        ApiResponse.error('Token đã hết hạn, vui lòng đăng nhập lại', 401)
      );
    }
    
    return res.status(500).json(
      ApiResponse.error('Lỗi xác thực: ' + error.message, 500)
    );
  }
};

/**
 * Middleware giới hạn quyền truy cập cho các vai trò cụ thể
 * @param  {...String} roles - Danh sách các vai trò được phép
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Middleware protect phải được gọi trước để req.user có giá trị
    if (!req.user) {
      return res.status(500).json(
        ApiResponse.error('Lỗi xác thực người dùng', 500)
      );
    }

    // Kiểm tra vai trò
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        ApiResponse.error('Bạn không có quyền thực hiện thao tác này', 403)
      );
    }

    next();
  };
};