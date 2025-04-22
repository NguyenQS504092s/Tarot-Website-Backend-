const mongoose = require('mongoose');

/**
 * Schema cho tử vi hàng ngày
 */
const HoroscopeSchema = new mongoose.Schema(
  {
    sign: {
      type: String,
      required: [true, 'Cung hoàng đạo là bắt buộc'],
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Ngày là bắt buộc'],
      default: Date.now
    },
    general: {
      type: String,
      required: [true, 'Nội dung tử vi chung là bắt buộc']
    },
    love: {
      type: String,
      required: [true, 'Nội dung tử vi tình yêu là bắt buộc']
    },
    career: {
      type: String,
      required: [true, 'Nội dung tử vi sự nghiệp là bắt buộc']
    },
    health: {
      type: String,
      required: [true, 'Nội dung tử vi sức khỏe là bắt buộc']
    },
    lucky_number: {
      type: Number
    },
    lucky_color: {
      type: String
    },
    lucky_time: {
      type: String
    },
    mood: {
      type: String
    },
    compatibility: {
      type: String
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    // Tạo index cho việc tìm kiếm nhanh theo cung hoàng đạo và ngày
    indexes: [
      { sign: 1, date: -1 }
    ]
  }
);

// Thêm method để tìm tử vi cho một cung hoàng đạo trong một ngày cụ thể
HoroscopeSchema.statics.findDailyHoroscope = async function(sign, date = new Date()) {
  // Định dạng ngày cho đúng (loại bỏ phần thời gian, chỉ giữ ngày)
  const formattedDate = new Date(date);
  formattedDate.setHours(0, 0, 0, 0);
  
  // Tìm tử vi cho cung hoàng đạo trong ngày
  return this.findOne({
    sign: sign,
    date: {
      $gte: formattedDate,
      $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
    },
    isActive: true
  });
};

module.exports = mongoose.model('Horoscope', HoroscopeSchema);