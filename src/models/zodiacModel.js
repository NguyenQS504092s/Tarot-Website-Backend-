const mongoose = require('mongoose');

/**
 * Schema cho cung hoàng đạo
 */
const ZodiacSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên cung hoàng đạo là bắt buộc'],
      unique: true,
      trim: true,
      // Use the standard enum for consistency
      enum: [
        'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 
        'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 
        'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
      ]
    },
    nameEn: {
      type: String,
      required: [true, 'Tên tiếng Anh là bắt buộc'],
      unique: true,
      trim: true
    },
    symbol: {
      type: String,
      required: [true, 'Ký hiệu là bắt buộc']
    },
    element: {
      type: String,
      enum: ['Lửa', 'Đất', 'Khí', 'Nước'],
      required: [true, 'Nguyên tố là bắt buộc']
    },
    period: {
      type: String,
      required: [true, 'Thời gian là bắt buộc']
    },
    ruling_planet: {
      type: String,
      required: [true, 'Hành tinh chủ quản là bắt buộc']
    },
    description: {
      type: String,
      required: [true, 'Mô tả là bắt buộc']
    },
    strengths: [{
      type: String,
      trim: true
    }],
    weaknesses: [{
      type: String,
      trim: true
     }],
     compatibility: [{
       sign: {
         type: String,
         trim: true,
         // Use the standard enum here as well
         enum: [
           'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 
           'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 
           'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
         ]
       },
       score: {
        type: Number,
        min: 1,
        max: 100
      },
      description: String
    }],
    tarotRelations: [{
      cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
      },
      description: String
    }]
  },
  {
     timestamps: true
   }
 );
 
 // Add indexes for common lookups
 ZodiacSchema.index({ name: 1 });
 ZodiacSchema.index({ nameEn: 1 });
 
 module.exports = mongoose.model('Zodiac', ZodiacSchema);
