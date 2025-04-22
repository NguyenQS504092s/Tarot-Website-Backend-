const mongoose = require('mongoose');

/**
 * Schema cho tin nhắn trò chuyện
 */
const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Sender is not required for system messages
      required: [
        function() { return this.contentType !== 'system'; },
        'Sender is required for non-system messages'
      ]
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

// Middleware: Tự động populate thông tin người dùng
ChatSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'participants',
    select: 'name email role' // Removed avatar
  });

  // Thêm populate cho relatedReading
  this.populate({
    path: 'relatedReading',
    select: 'spread question cards createdAt'
  });
  
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
  // Caller is responsible for saving
  // return this.save(); 
};

// Tạo tin nhắn hệ thống
ChatSchema.methods.addSystemMessage = async function(content) {
  // Pass null for sender in system messages
  return this.addMessage(null, content, 'system'); 
};

// Đánh dấu tất cả tin nhắn là đã đọc
ChatSchema.methods.markAllAsRead = async function(userId) {
  // Chỉ cập nhật trạng thái đã đọc cho tin nhắn của người khác
  const messages = this.messages.filter(
    message => message.sender.toString() !== userId.toString() && !message.isRead
  );

  for (let message of messages) {
    message.isRead = true;
    // message.readAt = new Date(); // Field doesn't exist in schema
  }

  // Caller is responsible for saving
  // await this.save(); 
};

// Static để tìm tất cả cuộc trò chuyện của một người dùng
ChatSchema.statics.findChatsForUser = async function(userId) {
  return this.find({
    participants: userId,
    isActive: true
  })
    .populate('participants', 'name email role') // Removed avatar
    .populate('relatedReading', 'spread question createdAt')
    .sort({ lastMessage: -1 });
};

module.exports = mongoose.model('Chat', ChatSchema);
