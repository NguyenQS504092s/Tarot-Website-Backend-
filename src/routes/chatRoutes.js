const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Tất cả routes cần đăng nhập
router.use(protect);

// Lấy danh sách các cuộc trò chuyện của người dùng
router.get('/', chatController.getUserChats);

// Lấy thông tin chi tiết một cuộc trò chuyện
router.get('/:id', chatController.getChatById);

// Tạo cuộc trò chuyện mới
router.post('/', chatController.createChat);

// Gửi tin nhắn mới trong cuộc trò chuyện
router.post('/:id/messages', chatController.sendMessage);

// Đánh dấu tin nhắn là đã đọc
router.put('/:id/read', chatController.markChatAsRead);

// Cập nhật trạng thái cuộc trò chuyện
router.put('/:id', chatController.updateChatStatus);

// Lên lịch hẹn trò chuyện mới
router.post('/schedule', chatController.scheduleChat);

// Lấy danh sách lịch hẹn sắp tới
router.get('/schedules/upcoming', chatController.getUpcomingSchedules);

module.exports = router;