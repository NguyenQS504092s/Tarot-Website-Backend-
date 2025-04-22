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

// Nếu không phải môi trường production, log ra console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
