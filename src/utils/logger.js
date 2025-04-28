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
  transports: [] // Start with empty transports, add console later
});

// Conditionally add file transports only for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%-error.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m', // Max size 20MB
    maxFiles: '14d', // Keep logs for 14 days
    level: 'error'
  }));
  logger.add(new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%-combined.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  }));
}

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

// Always add Console transport
logger.add(new winston.transports.Console({
  format: consoleFormat,
  // Log level is already set based on NODE_ENV in createLogger
}));

module.exports = logger;
