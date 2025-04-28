const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Import config để lấy secret và expiration

/**
 * Tạo JWT token cho user.
 * @param {object} payload - Dữ liệu muốn đưa vào token (thường là id và role).
 * @returns {string} JWT token.
 */
const generateToken = (payload) => {
  if (!config.jwtSecret || !config.jwtExpiresIn) {
    // Ném lỗi nếu thiếu cấu hình JWT, giúp debug dễ hơn
    throw new Error('JWT_SECRET hoặc JWT_EXPIRES_IN chưa được cấu hình!');
  }
  // Đảm bảo payload là một object thuần túy với id là string
  // Chuyển đổi payload (có thể là ObjectId) thành string
  const userIdString = payload.toString();
  const tokenPayload = { id: userIdString }; // Luôn tạo object { id: string }

  return jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Xác thực JWT token.
 * @param {string} token - JWT token cần xác thực.
 * @returns {object} Payload đã giải mã nếu token hợp lệ.
 * @throws {Error} Nếu token không hợp lệ hoặc hết hạn.
 */
const verifyToken = (token) => {
   if (!config.jwtSecret) {
    throw new Error('JWT_SECRET chưa được cấu hình!');
  }
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    // Có thể log lỗi chi tiết hơn ở đây nếu cần
    // logger.error('Lỗi xác thực token:', error.message);
    throw new Error('Token không hợp lệ hoặc đã hết hạn.');
  }
};


module.exports = {
  generateToken,
  verifyToken,
  // Có thể thêm các hàm liên quan đến refresh token ở đây nếu cần
};
