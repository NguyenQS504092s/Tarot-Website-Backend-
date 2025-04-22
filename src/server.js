const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');
const { connectDB, closeDB } = require('./config/database');
const logger = require('./utils/logger');
const config = require('./config/config');

// Load environment variables
dotenv.config();

// Kiểm tra biến môi trường cần thiết
function checkRequiredEnvVars() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI'
  ];
  
  // Chỉ kiểm tra Stripe trong môi trường production
  if (process.env.NODE_ENV === 'production') {
    requiredEnvVars.push('STRIPE_SECRET_KEY');
    requiredEnvVars.push('STRIPE_WEBHOOK_SECRET');
  }
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Thiếu các biến môi trường sau: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('LỖI KHÔNG XỬ LÝ ĐƯỢC! Đang tắt ứng dụng...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Hàm khởi động server
async function startServer() {
  try {
    // Kiểm tra biến môi trường
    if (!checkRequiredEnvVars()) {
      logger.error('Không thể khởi động server do thiếu biến môi trường');
      process.exit(1);
    }
    
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    const PORT = config.port;
    const server = app.listen(PORT, () => {
      logger.info(`Server đang chạy trên cổng ${PORT} ở chế độ ${config.env}`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('LỖI PROMISE KHÔNG XỬ LÝ! Đang tắt ứng dụng...');
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack);
      server.close(() => {
        process.exit(1);
      });
    });
    
    // Handle SIGTERM
    process.on('SIGTERM', () => {
     logger.info('NHẬN ĐƯỢC SIGTERM. Đang tắt ứng dụng...');
     server.close(() => {
       logger.info('HTTP server đã đóng.');
       closeDB()
         .catch(err => {
           // Log error during DB closing but proceed with shutdown
           logger.error('Lỗi khi đóng kết nối DB trong quá trình tắt:', err);
         })
         .finally(() => {
           logger.info('Quá trình đã kết thúc!');
           process.exit(0);
         });
     });
   });
  } catch (error) {
    logger.error(`Lỗi khởi động server: ${error.message}`);
    process.exit(1);
  }
}

// Start server
startServer();
