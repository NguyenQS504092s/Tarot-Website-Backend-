/**
 * Middleware xử lý lỗi toàn cục
 */
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError'); // Import ApiError for clarity and potential future use

// Helper function to handle specific errors
const handleCastErrorDB = err => {
  const message = `Giá trị không hợp lệ ${err.path}: ${err.value}.`;
  return new ApiError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Dữ liệu nhập không hợp lệ. ${errors.join('. ')}`;
  return new ApiError(message, 400);
};

const handleJWTError = () => new ApiError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401);
const handleJWTExpiredError = () => new ApiError('Token đã hết hạn. Vui lòng đăng nhập lại.', 401);


const errorMiddleware = (err, req, res, next) => {
  let error = { ...err }; // Create a copy to avoid mutating the original err object directly
  error.message = err.message; // Ensure message is copied
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  // Môi trường development: gửi toàn bộ thông tin lỗi
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  } 
  // Môi trường production: chỉ gửi thông báo lỗi đơn giản
  else {
    // Lỗi hoạt động (operational error): gửi thông báo đến client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } 
    // Lỗi lập trình hoặc lỗi không xác định: Xử lý các lỗi cụ thể trước
    else {
      // Handle specific errors first
      if (error.name === 'CastError') error = handleCastErrorDB(error);
      if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
      if (error.name === 'JsonWebTokenError') error = handleJWTError();
      if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

      // Log the original error for internal debugging, regardless of type
      logger.error('ERROR 💥', err); // Log the original error stack

      // Send response based on the potentially transformed error
      // If it's still not an operational error after specific checks, send generic message
      if (error.isOperational) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message
        });
      } else {
        // Send generic message for truly unknown errors
        res.status(500).json({
          status: 'error',
          message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
        });
      }
    }
  }
};

module.exports = errorMiddleware;
