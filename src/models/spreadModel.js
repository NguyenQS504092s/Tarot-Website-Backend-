const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema({
  positionNumber: {
    type: Number,
    required: [true, 'Số thứ tự vị trí là bắt buộc']
  },
  name: {
    type: String,
    required: [true, 'Tên vị trí là bắt buộc'],
    trim: true
  },
  meaning: {
    type: String,
    required: [true, 'Ý nghĩa vị trí là bắt buộc']
  }
}, { _id: false }); // Không cần _id cho subdocument này

const SpreadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên kiểu trải bài là bắt buộc'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Mô tả là bắt buộc']
    },
    cardCount: {
      type: Number,
      required: [true, 'Số lượng lá bài là bắt buộc'],
      min: [1, 'Số lượng lá bài phải lớn hơn 0']
    },
    positions: [PositionSchema], // Mảng các vị trí và ý nghĩa
    isActive: {
      type: Boolean,
      default: true // Mặc định là active khi tạo mới
    }
  },
  {
    timestamps: true
  }
);

// Index để tối ưu tìm kiếm theo tên
// SpreadSchema.index({ name: 1 }); // unique: true đã tạo index này

module.exports = mongoose.model('Spread', SpreadSchema);
