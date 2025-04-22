const logger = require('../utils/logger');

// Hàm kiểm tra biến môi trường quan trọng
const checkRequiredEnv = (name) => {
  if (!process.env[name]) {
    logger.warn(`Biến môi trường quan trọng ${name} không được định nghĩa!`);
    return false;
  }
  return true;
};

// Cấu hình chính của ứng dụng
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Các giá trị mặc định cho biến môi trường
  jwtSecret: process.env.JWT_SECRET, // Không còn fallback value nữa
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  mongoUri: process.env.MONGODB_URI,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Ứng dụng
  apiPrefix: process.env.API_PREFIX || '/api',
  freeReadingsPerDay: parseInt(process.env.FREE_READINGS_PER_DAY) || 3,
  
  // External services
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Kiểm tra các biến môi trường bắt buộc
  isValid: function() {
    // Kiểm tra các biến môi trường bắt buộc
    let isValid = true;
    
    isValid = checkRequiredEnv('JWT_SECRET') && isValid;
    isValid = checkRequiredEnv('MONGODB_URI') && isValid;
    
    if (process.env.NODE_ENV === 'production') {
      isValid = checkRequiredEnv('STRIPE_SECRET_KEY') && isValid;
      isValid = checkRequiredEnv('STRIPE_WEBHOOK_SECRET') && isValid;
    }
    
    return isValid;
  }
};

module.exports = config;