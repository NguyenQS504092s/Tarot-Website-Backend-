const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: [true, 'ID cuộc trò chuyện là bắt buộc'],
    index: true, // Index for faster querying by chat
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người gửi là bắt buộc'],
  },
  // Receiver is implicitly the other participant in the chat
  content: {
    type: String,
    required: [true, 'Nội dung tin nhắn là bắt buộc'],
    trim: true,
  },
  readBy: [{ // Track who has read the message
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Optional: Add message type (text, image, system notification, etc.)
  // messageType: {
  //   type: String,
  //   enum: ['text', 'image', 'system'],
  //   default: 'text',
  // },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt
});

// Optional: Add pre-save hooks if needed

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
