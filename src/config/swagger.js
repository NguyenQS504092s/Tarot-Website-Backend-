const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config'); // Để lấy PORT nếu cần

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tarot Website Backend API',
      version: '1.0.0',
      description: 'API documentation for the Tarot Website Backend application.',
      contact: {
        name: 'API Support',
        // url: 'http://www.example.com/support', // Optional
        // email: 'support@example.com', // Optional
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development server',
      },
      // Add other servers like staging or production here if needed
    ],
    components: {
      securitySchemes: {
        bearerAuth: { // Tên của security scheme, có thể dùng trong JSDoc
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Optional
          description: 'Enter JWT token **_only_**', // Mô tả cách sử dụng
        },
      },
    },
    security: [ // Áp dụng security scheme mặc định cho tất cả các endpoint
      {
        bearerAuth: [], // Tham chiếu đến security scheme đã định nghĩa ở trên
      },
    ],
  },
  // Đường dẫn đến các tệp chứa JSDoc comments cho API endpoints
  apis: ['./src/routes/*.js'], // Quét tất cả các file .js trong thư mục routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
