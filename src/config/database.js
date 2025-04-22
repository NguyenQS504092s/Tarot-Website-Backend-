const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./config');

/**
 * Kết nối đến MongoDB
 * @returns {Promise}
 */
const connectDB = async () => {
  try {
    if (!config.mongoUri) {
      logger.error('MONGODB_URI không được định nghĩa trong biến môi trường');
      process.exit(1);
    }

    const conn = await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB đã kết nối: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Lỗi kết nối MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Đóng kết nối đến MongoDB
 * @returns {Promise}
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Đã đóng kết nối MongoDB');
  } catch (error) {
    logger.error(`Lỗi khi đóng kết nối MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, closeDB };