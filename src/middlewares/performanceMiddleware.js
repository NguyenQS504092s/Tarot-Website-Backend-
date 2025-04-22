const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Middleware theo dõi thời gian xử lý request
 * @param {String} name Tên của route/endpoint
 */
const trackPerformance = (name) => {
  return (req, res, next) => {
    // Lưu thời điểm bắt đầu
    const start = Date.now();
    
    // Sau khi request hoàn thành
    res.on('finish', () => {
      // Tính thời gian đã trôi qua
      const elapsedMs = Date.now() - start;
      
      // Ghi log nếu thời gian xử lý vượt quá ngưỡng cấu hình
      if (elapsedMs > config.performanceThresholdMs) {
        logger.warn(`[HIỆU SUẤT CHẬM] ${name} - ${req.method} ${req.originalUrl} - ${elapsedMs}ms (Ngưỡng: ${config.performanceThresholdMs}ms)`);
      } else {
        logger.debug(`[HIỆU SUẤT] ${name} - ${req.method} ${req.originalUrl} - ${elapsedMs}ms`);
      }
    });
    
    next();
  };
};

module.exports = { trackPerformance };
