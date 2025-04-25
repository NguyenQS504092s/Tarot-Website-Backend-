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

// JWT errors are handled in authMiddleware and converted to ApiError (operational)
// const handleJWTError = () => new ApiError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401);
// const handleJWTExpiredError = () => new ApiError('Token đã hết hạn. Vui lòng đăng nhập lại.', 401);


const errorMiddleware = (err, req, res, next) => {
  // Log the original error received by the middleware
  console.error('--- ERROR MIDDLEWARE RECEIVED ---');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Status Code:', err.statusCode);
  console.error('Error Stack:', err.stack);
  console.error('---------------------------------');

  let error = { ...err }; // Create a copy to avoid mutating the original err object directly
  error.message = err.message; // Ensure message is copied
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';
  let finalStatusCode = error.statusCode; // Store initial status code

  // Luôn trả về cấu trúc JSON nhất quán cho lỗi
  const response = {
    success: false, // Luôn là false khi có lỗi
    status: error.status || 'error', // 'fail' cho lỗi client, 'error' cho lỗi server
    message: error.message || 'Đã xảy ra lỗi không mong muốn'
  };

  // Môi trường development: thêm chi tiết lỗi
  if (process.env.NODE_ENV === 'development') {
    response.error = { ...err }; // Sao chép lỗi gốc
    response.stack = err.stack;
  }
  // Môi trường production: xử lý lỗi cụ thể để có thông báo thân thiện hơn
  else {
    // Xử lý các lỗi cụ thể trước khi gửi response
    let processedError = error; // Use a temporary variable
    if (processedError.name === 'CastError') processedError = handleCastErrorDB(processedError);
    if (processedError.name === 'ValidationError') processedError = handleValidationErrorDB(processedError);
    // JWT errors đã được xử lý và chuyển thành ApiError (isOperational=true)

    // Nếu lỗi là operational (đã biết, ví dụ ApiError), sử dụng thông báo và status code của nó
    if (processedError.isOperational) {
      response.status = processedError.status;
      response.message = processedError.message;
      finalStatusCode = processedError.statusCode; // Update status code from processed error
    }
    // Nếu là lỗi không xác định (lỗi server), ghi log và gửi thông báo chung
    else {
      logger.error('ERROR 💥', err); // Log lỗi gốc không xác định
      response.status = 'error';
      response.message = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
      finalStatusCode = 500; // Ensure statusCode is 500 for unknown server errors
    }
  }

  // Gửi response lỗi using the final determined status code
  res.status(finalStatusCode).json(response);
};

module.exports = errorMiddleware;
