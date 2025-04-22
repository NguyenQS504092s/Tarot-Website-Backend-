const mongoose = require('mongoose');

/**
 * Schema cho tin nhắn trò chuyện
 */
const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Nội dung tin nhắn không được để trống'],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    attachments: [{
      type: String, // URL đến tệp đính kèm
      trim: true
    }],
    contentType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    }
  },
  { timestamps: true }
);

/**
 * Schema cho phiên trò chuyện
 */
const ChatSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    messages: [MessageSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    lastMessage: {
      type: Date,
      default: Date.now
    },
    title: {
      type: String,
      default: ''
    },
    relatedReading: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reading'
    },
    scheduledTime: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'canceled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Trước khi lưu, cập nhật lastMessage
ChatSchema.pre('save', function(next) {
  if (this.isModified('messages') && this.messages.length > 0) {
    this.lastMessage = this.messages[this.messages.length - 1].createdAt || Date.now();
  }
  next();
});

// Method để thêm tin nhắn mới
ChatSchema.methods.addMessage = async function(sender, content, contentType = 'text', attachments = []) {
  this.messages.push({
    sender,
    content,
    contentType,
    attachments
  });
  this.lastMessage = Date.now();
  return this.save();
};

// Tạo tin nhắn hệ thống
ChatSchema.methods.addSystemMessage = async function(content) {
  return this.addMessage(this.participants[0], content, 'system');
};

// Đánh dấu tất cả tin nhắn là đã đọc
ChatSchema.methods.markAllAsRead = async function(userId) {
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString()) {
      message.isRead = true;
    }
  });
  return this.save();
};

// Static để tìm tất cả cuộc trò chuyện của một người dùng
ChatSchema.statics.findChatsForUser = async function(userId) {
  return this.find({
    participants: userId,
    isActive: true
  })
    .populate('participants', 'name avatar email role')
    .populate('relatedReading', 'spread question createdAt')
    .sort({ lastMessage: -1 });
};

module.exports = mongoose.model('Chat', ChatSchema);