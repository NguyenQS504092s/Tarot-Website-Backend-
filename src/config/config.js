/**
 * Cấu hình chung cho ứng dụng
 */
const config = {
  // Môi trường
  env: process.env.NODE_ENV || 'development',
  
  // Cấu hình server
  port: process.env.PORT || 5000,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Database
  dbUri: process.env.MONGODB_URI,
  dbTestUri: process.env.MONGODB_TEST_URI,
  
  // Rate limiting
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 phút
  rateLimitMax: process.env.RATE_LIMIT_MAX || 100,
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Cấu hình liên quan đến tính năng cụ thể
  defaultTarotDeck: 'Rider Waite Smith',
  
  // Giới hạn số phiên đọc bài miễn phí mỗi ngày
  freeReadingsPerDay: 3
};

module.exports = config;