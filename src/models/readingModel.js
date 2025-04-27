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

// Virtual populate để lấy thông tin chi tiết về lá bài
ReadingSchema.virtual('cardsDetail', {
  ref: 'Card',
  localField: 'cards.cardId',
  foreignField: '_id'
});

// Middleware: Populate các thông tin liên quan khi query
ReadingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'cardsDetail',
    select: 'name imageUrl uprightMeaning reversedMeaning'
  });
  next();
});

module.exports = mongoose.model('Reading', ReadingSchema);