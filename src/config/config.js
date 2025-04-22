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
  freeReadingsPerDay: parseInt(process.env.FREE_READINGS_PER_DAY, 10) || 3,
  
  // External services
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Performance
  performanceThresholdMs: parseInt(process.env.PERFORMANCE_THRESHOLD_MS, 10) || 1000,

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
};

module.exports = config;
