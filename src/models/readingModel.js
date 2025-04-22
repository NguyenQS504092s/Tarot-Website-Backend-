const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID người dùng là bắt buộc']
    },
    spread: {
      type: String,
      required: [true, 'Kiểu trải bài là bắt buộc']
    },
    question: {
      type: String,
      trim: true
    },
    cards: [
      {
        cardId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Card',
          required: [true, 'ID lá bài là bắt buộc']
        },
        position: {
          type: Number,
          required: [true, 'Vị trí lá bài là bắt buộc']
        },
        isReversed: {
          type: Boolean,
          default: false
        }
      }
    ],
    interpretation: {
      type: String
    },
    readerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
      // Optional - chỉ có khi được đọc bài bởi người đọc bài thực sự
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String
      }
    },
    isPublic: {
      type: Boolean,
      default: false
      // Cho phép chia sẻ công khai kết quả đọc bài
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Tạo index để tối ưu tìm kiếm
ReadingSchema.index({ userId: 1, createdAt: -1 });
ReadingSchema.index({ readerId: 1, createdAt: -1 });

// Virtual populate để lấy thông tin người dùng
ReadingSchema.virtual('userDetail', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate để lấy thông tin người đọc bài
ReadingSchema.virtual('readerDetail', {
  ref: 'User',
  localField: 'readerId',
  foreignField: '_id',
  justOne: true
});

// Middleware: Populate các thông tin liên quan khi query
ReadingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'cards.cardId',
    select: 'name imageUrl uprightMeaning reversedMeaning'
  });
  
  // Thêm populate cho userId và readerId nhưng chỉ lấy thông tin cơ bản (loại bỏ avatar vì chưa có trong User model)
  this.populate({
    path: 'userId',
    select: 'name email' // Removed avatar
  })
  .populate({
    path: 'readerId',
    select: 'name email' // Removed avatar
  });
  
  next();
});

module.exports = mongoose.model('Reading', ReadingSchema);
