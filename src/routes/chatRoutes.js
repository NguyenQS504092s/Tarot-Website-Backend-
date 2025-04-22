const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');

// Tất cả routes cần đăng nhập
router.use(authMiddleware.protect);

// Routes cụ thể phải đặt trước routes có params
router.get('/', trackPerformance('getUserChats'), chatController.getUserChats);
router.post('/', trackPerformance('createChat'), chatController.createChat);
router.post('/schedule', trackPerformance('scheduleChat'), chatController.scheduleChat);
router.get('/schedules/upcoming', trackPerformance('getUpcomingSchedules'), chatController.getUpcomingSchedules);

// Routes với params phải đặt sau route cụ thể
router.get('/:id', trackPerformance('getChatById'), chatController.getChatById);
router.put('/:id', trackPerformance('updateChatStatus'), chatController.updateChatStatus);
router.post('/:id/messages', trackPerformance('sendMessage'), chatController.sendMessage);
router.put('/:id/read', trackPerformance('markChatAsRead'), chatController.markChatAsRead);

module.exports = router;