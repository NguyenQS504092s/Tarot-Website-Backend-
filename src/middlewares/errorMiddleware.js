/**
 * Middleware xử lý lỗi toàn cục
 */
const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

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
    // Lỗi lập trình hoặc lỗi không xác định: không gửi chi tiết
    else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
      });
    }
  }
};

module.exports = errorMiddleware;