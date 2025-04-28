const winston = require('winston');
require('winston-daily-rotate-file'); // Import the daily rotate file transport

// Định nghĩa cấu hình cho logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'tarot-backend' },
  transports: [
    // Ghi log lỗi vào file error.log với xoay vòng hàng ngày
    new winston.transports.DailyRotateFile({
      filename: 'logs/%DATE%-error.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m', // Max size 20MB
      maxFiles: '14d', // Keep logs for 14 days
      level: 'error'
    }),
    // Ghi tất cả các log vào file combined.log với xoay vòng hàng ngày
    new winston.transports.DailyRotateFile({
      filename: 'logs/%DATE%-combined.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Luôn log ra console
// Sử dụng định dạng đơn giản, có màu cho development, JSON cho production
const consoleFormat = process.env.NODE_ENV === 'production'
  ? winston.format.combine(
      winston.format.timestamp(), // Thêm timestamp vào JSON log
      winston.format.json()
    )
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    );

logger.add(new winston.transports.Console({
  format: consoleFormat,
  // Mức log cho console có thể khác nếu muốn, ví dụ chỉ log 'info' trở lên trong production
  // level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
}));

// Có thể tùy chọn giữ lại File transports nếu vẫn muốn có bản sao lưu log dạng file,
// nhưng Console transport nên là ưu tiên cho Docker.

module.exports = logger;
