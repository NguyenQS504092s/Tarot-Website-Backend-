const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

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
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để truy cập tài nguyên này'
      });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm người dùng dựa trên ID từ token
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không còn tồn tại'
      });
    }

    // Gắn thông tin người dùng vào request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn, vui lòng đăng nhập lại'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực: ' + error.message
    });
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
      return res.status(500).json({
        success: false,
        message: 'Lỗi xác thực người dùng'
      });
    }

    // Kiểm tra vai trò
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này'
      });
    }

    next();
  };
};