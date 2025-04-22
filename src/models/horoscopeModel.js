const mongoose = require('mongoose');

/**
 * Schema cho tử vi hàng ngày
 */
const HoroscopeSchema = new mongoose.Schema(
  {
    sign: {
      type: String,
      required: [true, 'Cung hoàng đạo là bắt buộc'],
      trim: true,
      // Use the same enum as in userModel for consistency
      enum: [
        'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 
        'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 
        'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
      ]
    },
    date: {
      type: Date,
      required: [true, 'Ngày là bắt buộc']
      // Default removed, will be handled by pre-save hook
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

// Pre-save hook to normalize the date to the start of the day
HoroscopeSchema.pre('save', function(next) {
  if (this.date) {
    this.date.setHours(0, 0, 0, 0);
  } else {
    // If date is not provided, set it to the start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.date = today;
  }
  next();
});


// Thêm method để tìm tử vi cho một cung hoàng đạo trong một ngày cụ thể
HoroscopeSchema.statics.findDailyHoroscope = async function(sign, date = new Date()) {
  // Định dạng ngày cho đúng (loại bỏ phần thời gian, chỉ giữ ngày) - Date is already normalized in DB
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0); // Normalize the query date as well

  // Tìm tử vi cho cung hoàng đạo trong ngày (date field is already normalized)
  return this.findOne({
    sign: sign,
    date: targetDate, // Exact match on the normalized date
    isActive: true
  });
};

module.exports = mongoose.model('Horoscope', HoroscopeSchema);
