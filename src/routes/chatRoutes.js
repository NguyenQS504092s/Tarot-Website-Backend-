const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');
const {
    sendMessageValidator,
    getChatByIdValidator, // Used for routes targeting a specific chat by ID
    createChatValidator,
    scheduleChatValidator,
    updateChatStatusValidator,
} = require('../validators/chatValidators');

// Tất cả routes cần đăng nhập
router.use(authMiddleware.protect);

// Routes cụ thể phải đặt trước routes có params
router.get('/', trackPerformance('getUserChats'), chatController.getUserChats); // Any logged-in user can get their chats
router.post('/', createChatValidator, trackPerformance('createChat'), chatController.createChat); // Any logged-in user can initiate a chat
router.post('/schedule', authMiddleware.restrictTo('user'), scheduleChatValidator, trackPerformance('scheduleChat'), chatController.scheduleChat); // Only users can schedule
router.get('/schedules/upcoming', trackPerformance('getUpcomingSchedules'), chatController.getUpcomingSchedules); // User/Reader can get their schedules (logic in controller)

// Routes với params phải đặt sau route cụ thể
router.get('/:id', getChatByIdValidator, trackPerformance('getChatById'), chatController.getChatById); // User/Reader/Admin involved can get chat (logic in controller)
router.put('/:id', authMiddleware.restrictTo('reader', 'admin'), getChatByIdValidator, updateChatStatusValidator, trackPerformance('updateChatStatus'), chatController.updateChatStatus); // Only reader/admin can update status
// Route để lấy tin nhắn của cuộc trò chuyện (GET)
router.get('/:id/messages', getChatByIdValidator, trackPerformance('getChatMessages'), chatController.getChatMessages); // Added GET route for messages
// sendMessageValidator checks body message and optional param chatId
router.post('/:id/messages', getChatByIdValidator, sendMessageValidator, trackPerformance('sendMessage'), chatController.sendMessage); // User/Reader involved can send message
router.put('/:id/read', getChatByIdValidator, trackPerformance('markChatAsRead'), chatController.markChatAsRead); // User/Reader involved can mark as read

module.exports = router;
