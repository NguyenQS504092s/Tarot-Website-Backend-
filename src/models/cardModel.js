const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên lá bài là bắt buộc'],
      trim: true,
      unique: true
    },
    deck: {
      type: String,
      required: [true, 'Bộ bài là bắt buộc'],
      trim: true
    },
    imageUrl: {
      type: String,
      required: [true, 'URL hình ảnh là bắt buộc']
    },
    type: {
      type: String,
      enum: ['Major Arcana', 'Minor Arcana'],
      required: [true, 'Loại bài là bắt buộc']
     },
     suit: {
       type: String,
       enum: ['Gậy', 'Cốc', 'Kiếm', 'Tiền', null], // Allow null for Major Arcana
       // Chỉ bắt buộc cho Minor Arcana
       validate: {
         validator: function(val) {
           // Nếu là Minor Arcana thì bắt buộc phải có suit (không null)
           return this.type !== 'Minor Arcana' || val !== null;
         },
         message: 'Suit là bắt buộc và phải là một trong các giá trị hợp lệ cho Minor Arcana'
      }
    },
    number: {
      type: Number
    },
    keywords: [{
      type: String,
      trim: true
    }],
    uprightMeaning: {
      type: String,
      required: [true, 'Ý nghĩa xuôi là bắt buộc']
    },
    reversedMeaning: {
      type: String,
      required: [true, 'Ý nghĩa ngược là bắt buộc']
    },
    description: {
      type: String,
      required: [true, 'Mô tả là bắt buộc']
    }
  },
  {
    timestamps: true
  }
);

// Index để tối ưu tìm kiếm
CardSchema.index({ name: 1 });
CardSchema.index({ type: 1 });
CardSchema.index({ suit: 1 });

module.exports = mongoose.model('Card', CardSchema);
