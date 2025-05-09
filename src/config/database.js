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

    // Mongoose 6+ defaults useNewUrlParser and useUnifiedTopology to true
    const conn = await mongoose.connect(config.mongoUri);

    logger.info(`MongoDB đã kết nối: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Lỗi kết nối MongoDB: ${error.message}`);
    // process.exit(1); // Don't exit abruptly, let the caller handle it
    throw error; // Throw the error so Jest/beforeAll can catch it
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
    // Log the error but don't necessarily exit the process during shutdown
    logger.error(`Lỗi khi đóng kết nối MongoDB: ${error.message}`);
  }
};

module.exports = { connectDB, closeDB };
