// Simple script to seed initial spread data
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Spread = require('../src/models/spreadModel'); // Adjust path as needed
const { connectDB, closeDB } = require('../src/config/database'); // Adjust path as needed
const logger = require('../src/utils/logger'); // Adjust path as needed
const config = require('../src/config/config'); // Import config

// dotenv.config() is handled by dotenv-cli in package.json script now

const spreadsToSeed = [
  {
    name: "Ba Lá Bài",
    description: "Cách trải bài đơn giản cho quá khứ, hiện tại, tương lai hoặc tình huống, hành động, kết quả.",
    cardCount: 3,
    positions: [
      { positionNumber: 1, name: "Quá khứ / Nền tảng", meaning: "Các yếu tố hoặc sự kiện trong quá khứ ảnh hưởng đến tình hình hiện tại." },
      { positionNumber: 2, name: "Hiện tại / Vấn đề", meaning: "Tình hình hoặc thách thức hiện tại bạn đang đối mặt." },
      { positionNumber: 3, name: "Tương lai / Kết quả", meaning: "Kết quả hoặc hướng đi tiềm năng nếu tình hình hiện tại tiếp diễn." }
    ],
    isActive: true
  },
  {
    name: "Celtic Cross",
    description: "Một cách trải bài chi tiết, khám phá nhiều khía cạnh của một vấn đề phức tạp.",
    cardCount: 10,
    positions: [
      { positionNumber: 1, name: "Hiện tại / Trái tim vấn đề", meaning: "Bản chất cốt lõi của tình huống hoặc câu hỏi." },
      { positionNumber: 2, name: "Thách thức / Chướng ngại vật", meaning: "Yếu tố cản trở hoặc thách thức trực tiếp." },
      { positionNumber: 3, name: "Nền tảng / Quá khứ gần", meaning: "Các sự kiện hoặc ảnh hưởng trong quá khứ gần đây dẫn đến tình hình hiện tại." },
      { positionNumber: 4, name: "Tiềm thức / Gốc rễ", meaning: "Những ảnh hưởng sâu xa, tiềm ẩn hoặc niềm tin cốt lõi liên quan." },
      { positionNumber: 5, name: "Mục tiêu / Ý thức", meaning: "Mục tiêu, hy vọng hoặc những gì bạn nhận thức được về tình huống." },
      { positionNumber: 6, name: "Tương lai gần", meaning: "Những gì có khả năng xảy ra tiếp theo trong thời gian ngắn." },
      { positionNumber: 7, name: "Bản thân / Thái độ", meaning: "Thái độ, vị trí hoặc cách tiếp cận hiện tại của bạn đối với vấn đề." },
      { positionNumber: 8, name: "Môi trường / Ảnh hưởng bên ngoài", meaning: "Ảnh hưởng từ người khác, hoàn cảnh hoặc môi trường xung quanh." },
      { positionNumber: 9, name: "Hy vọng và Lo sợ", meaning: "Những hy vọng, nỗi sợ hãi hoặc khát vọng sâu sắc nhất của bạn liên quan đến vấn đề." },
      { positionNumber: 10, name: "Kết quả cuối cùng", meaning: "Kết quả có khả năng xảy ra nhất dựa trên các yếu tố hiện tại." }
    ],
    isActive: true
  },
   {
    name: "Năm Lá Bài",
    description: "Cách trải bài khám phá tình hình hiện tại, quá khứ, tương lai, lý do và lời khuyên.",
    cardCount: 5,
    positions: [
        { positionNumber: 1, name: "Hiện tại", meaning: "Tình hình hoặc trọng tâm hiện tại." },
        { positionNumber: 2, name: "Ảnh hưởng quá khứ", meaning: "Các sự kiện quá khứ tác động đến hiện tại." },
        { positionNumber: 3, name: "Tương lai tiềm năng", meaning: "Hướng đi hoặc kết quả có thể xảy ra." },
        { positionNumber: 4, name: "Lý do / Nguyên nhân", meaning: "Nguyên nhân gốc rễ hoặc lý do đằng sau tình huống." },
        { positionNumber: 5, name: "Hành động / Lời khuyên", meaning: "Lời khuyên hoặc hành động nên thực hiện." }
    ],
    isActive: true
  }
  // Add more spreads here if needed
];

const seedDB = async () => {
  try {
    // Check if config.mongoUri is actually defined before connecting
    if (!config.mongoUri) {
        logger.error('Lỗi: config.mongoUri không được định nghĩa!');
        process.exit(1);
    }

    await connectDB(); // Connect to the database

    logger.info('Bắt đầu seeding dữ liệu Spread...');

    for (const spreadData of spreadsToSeed) {
      const existingSpread = await Spread.findOne({ name: spreadData.name });
      if (!existingSpread) {
        await Spread.create(spreadData);
        logger.info(`Đã tạo Spread: ${spreadData.name}`);
      } else {
        logger.info(`Spread "${spreadData.name}" đã tồn tại, bỏ qua.`);
      }
    }

    logger.info('Seeding dữ liệu Spread hoàn tất.');
  } catch (error) {
    logger.error('Lỗi khi seeding dữ liệu Spread:', error);
    process.exit(1); // Exit with error code
  } finally {
    await closeDB(); // Ensure database connection is closed
    logger.info('Đã đóng kết nối DB.');
  }
};

// Run the seeding function
seedDB();
