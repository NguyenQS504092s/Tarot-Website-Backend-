const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config'); // Để lấy thông tin PORT, HOST nếu cần

const options = {
  definition: {
    openapi: '3.0.0', // Chỉ định phiên bản OpenAPI
    info: {
      title: 'Tarot Website Backend API', // Tên API
      version: '1.0.0', // Phiên bản API
      description:
        'API documentation for the Tarot Website Backend application, providing endpoints for user management, tarot readings, astrology, and more.',
      contact: {
        name: 'Your Name/Team', // Thông tin liên hệ (tùy chọn)
        // url: 'your-website.com',
        // email: 'your-email@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`, // URL server development
        description: 'Development server',
      },
      // Thêm các server khác nếu có (staging, production)
      // {
      //   url: 'https://staging.yourdomain.com/api',
      //   description: 'Staging server',
      // },
      // {
      //   url: 'https://api.yourdomain.com/api',
      //   description: 'Production server',
       // },
     ],
     // Định nghĩa các components chung như securitySchemes và schemas
     components: {
       securitySchemes: {
         bearerAuth: { // Tên của security scheme (có thể đặt tùy ý)
           type: 'http',
           scheme: 'bearer',
           bearerFormat: 'JWT',
           description: 'Enter JWT Bearer token **_only_**', // Mô tả cách nhập token
         },
       },
       // Định nghĩa các Schemas chung
       schemas: {
         // Schema cho đối tượng User (chỉ bao gồm các trường public)
         User: {
           type: 'object',
           properties: {
             _id: {
               type: 'string',
               description: 'Unique identifier for the user',
               example: '60564fcb544047cdc3844818'
             },
             name: {
               type: 'string',
               description: 'User\'s name',
               example: 'John Doe'
             },
             email: {
               type: 'string',
               format: 'email',
               description: 'User\'s email address',
               example: 'john.doe@example.com'
             },
             role: {
               type: 'string',
               enum: ['user', 'reader', 'admin'],
               description: 'User\'s role',
               example: 'user'
             },
             // Thêm các trường public khác nếu cần
             createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Timestamp of user creation'
             },
             updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Timestamp of last user update'
             }
           }
         },
         // Schema cho cấu trúc response chung
         ApiResponse: {
           type: 'object',
           properties: {
             success: {
               type: 'boolean',
               description: 'Indicates if the request was successful',
               example: true
             },
             status: {
               type: 'string',
               description: 'Status text (e.g., "success", "fail")',
               example: 'success'
             },
             message: {
               type: 'string',
               description: 'A descriptive message about the response',
               example: 'Operation completed successfully'
             },
             data: {
               type: 'object', // Hoặc array, hoặc kiểu cụ thể nếu biết trước
               description: 'The actual data payload of the response',
               nullable: true,
               example: { id: 1, name: 'Example Data' }
             },
             // Có thể thêm các trường khác như pagination info nếu cần
           }
         },
         // Schema cho response khi đăng nhập/đăng ký thành công
         UserResponse: {
           allOf: [ // Kế thừa từ ApiResponse
             { $ref: '#/components/schemas/ApiResponse' },
             { // Ghi đè hoặc thêm trường data
               type: 'object',
               properties: {
                 data: {
                   type: 'object',
                   properties: {
                     user: {
                       $ref: '#/components/schemas/User' // Tham chiếu đến User schema
                     },
                     token: {
                       type: 'string',
                       description: 'JWT access token',
                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                     },
                     refreshToken: {
                       type: 'string',
                       description: 'JWT refresh token',
                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                     }
                   }
                 }
               }
             }
           ]
         },
         // Schema cho lỗi chung
         ErrorResponse: {
            allOf: [
                { $ref: '#/components/schemas/ApiResponse' },
                {
                    type: 'object',
                    properties: {
                        success: { example: false },
                        status: { example: 'fail' },
                        data: { nullable: true, example: null }
                        // message sẽ được cung cấp bởi lỗi cụ thể
                    }
                }
            ]
         }
       }
     },
     // Áp dụng security scheme mặc định cho tất cả endpoints (tùy chọn)
     // Nếu không muốn áp dụng mặc định, bạn sẽ cần thêm `security` vào từng endpoint yêu cầu xác thực
     // security: [
    //     bearerAuth: {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT',
    //     },
    //   },
    // },
    // security: [ // Áp dụng security scheme mặc định cho tất cả endpoints
    //   {
     //   {
     //     bearerAuth: [], // Tham chiếu đến tên security scheme đã định nghĩa ở trên
     //   },
     // ],
  },
  // Đường dẫn đến các file chứa JSDoc comments để tạo tài liệu
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js'], // Điều chỉnh nếu cần
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
