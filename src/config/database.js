const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Thiết lập kết nối database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info(`MongoDB kết nối thành công: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Lỗi kết nối MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;