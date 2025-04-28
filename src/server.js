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
  // Tạm thời vô hiệu hóa kiểm tra Stripe để triển khai mà không cần secret
  // if (process.env.NODE_ENV === 'production') {
  //   requiredEnvVars.push('STRIPE_SECRET_KEY');
  //   requiredEnvVars.push('STRIPE_WEBHOOK_SECRET');
  // }
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Thiếu các biến môi trường sau: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}

// Handle uncaught exceptions (Khôi phục lại)
process.on('uncaughtException', (err) => {
  // Sử dụng console.error ở đây vì logger có thể chưa sẵn sàng
  console.error('LỖI KHÔNG XỬ LÝ ĐƯỢC! Đang tắt ứng dụng...');
  console.error(`${err.name}: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

// Hàm khởi động server
async function startServer() {
  let server = null; // Khai báo server ở phạm vi ngoài try block

  // Handle unhandled promise rejections (gắn sớm hơn)
  process.on('unhandledRejection', (err) => {
    console.error('LỖI PROMISE KHÔNG XỬ LÝ (SỚM)! Đang tắt ứng dụng...');
      console.error(`${err.name}: ${err.message}`);
      console.error(err.stack);
      // Cố gắng đóng server nếu nó đã khởi động
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });

    // Handle SIGTERM (gắn sớm hơn)
    process.on('SIGTERM', () => {
     console.info('NHẬN ĐƯỢC SIGTERM. Đang tắt ứng dụng...');
     if (server) {
       server.close(() => {
         console.info('HTTP server đã đóng.');
         closeDB()
           .catch(err => {
             console.error('Lỗi khi đóng kết nối DB trong quá trình tắt:', err);
           })
           .finally(() => {
             console.info('Quá trình đã kết thúc!');
             process.exit(0);
           });
       });
     } else {
       closeDB()
         .catch(err => {
           console.error('Lỗi khi đóng kết nối DB trong quá trình tắt (server chưa chạy):', err);
         })
         .finally(() => {
           console.info('Quá trình đã kết thúc (server chưa chạy)!');
           process.exit(0);
         });
     }
   });

  try { // Thêm lại try block bị thiếu
    // Kiểm tra biến môi trường
    console.log('--- DEBUG: Kiểm tra biến môi trường...');
    if (!checkRequiredEnvVars()) {
      console.error('Không thể khởi động server do thiếu biến môi trường'); // Dùng console vì logger có thể chưa sẵn sàng
     process.exit(1);
     }
     console.log('--- DEBUG: Biến môi trường OK.');
     
     // Connect to MongoDB
     console.log('--- DEBUG: Đang kết nối tới MongoDB...');
     await connectDB();
     console.log('--- DEBUG: Kết nối MongoDB thành công.');
     
     // Start the server
     const PORT = config.port;
     const HOST = '0.0.0.0'; // Lắng nghe trên tất cả các interface
     console.log(`--- DEBUG: Chuẩn bị lắng nghe trên host ${HOST} cổng ${PORT}...`); 
     // Gán giá trị cho server đã khai báo ở trên
     server = app.listen(PORT, HOST, () => { // Thêm HOST vào listen
       // Sử dụng logger ở đây vì server đã khởi động thành công
       logger.info(`Server đang chạy trên host ${HOST} cổng ${PORT} ở chế độ ${config.env}`);
     });

     // Gắn lỗi 'error' cho server instance để bắt lỗi EADDRINUSE etc.
     server.on('error', (err) => {
       console.error(`LỖI SERVER LISTEN: ${err.name}: ${err.message}`);
       console.error(err.stack);
       process.exit(1);
     });

  } catch (error) {
    // Sử dụng console.error thay vì logger vì logger có thể chưa sẵn sàng hoặc bị lỗi
    console.error(`Lỗi khởi động server: ${error.message}`);
    console.error(error.stack); // In stack trace để dễ debug hơn
    process.exit(1);
  }
}

// Start server
startServer();
