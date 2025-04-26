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

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: Get a list of chats for the current user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters: # Add pagination/sorting if needed
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: -updatedAt }
 *         description: Sort order (e.g., '-updatedAt')
 *     responses:
 *       200:
 *         description: A list of the user's chats
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         chats:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Chat' } # Define Chat schema later
 *                         pagination: { type: object } # Add pagination details
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Server error' }
 */
router.get('/', trackPerformance('getUserChats'), chatController.getUserChats); // Any logged-in user can get their chats

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Initiate a new chat session
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [readerId] # Assuming user initiates chat with a specific reader
 *             properties:
 *               readerId:
 *                 type: string
 *                 format: objectId
 *                 description: The ID of the reader the user wants to chat with
 *               initialMessage: # Optional initial message
 *                 type: string
 *                 description: The first message from the user (optional)
 *                 example: 'Hello, I would like a reading.'
 *     responses:
 *       201:
 *         description: Chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Chat' }
 *       400: { description: 'Invalid input data (e.g., invalid readerId)' }
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'Reader not found' }
 *       500: { description: 'Server error' }
 */
router.post('/', createChatValidator, trackPerformance('createChat'), chatController.createChat); // Any logged-in user can initiate a chat

/**
 * @swagger
 * /chats/schedule:
 *   post:
 *     summary: Schedule a future chat session (User only)
 *     tags: [Chats, Scheduling]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [readerId, scheduledTime]
 *             properties:
 *               readerId:
 *                 type: string
 *                 format: objectId
 *                 description: The ID of the reader for the scheduled chat
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 description: The requested date and time for the chat session
 *                 example: '2025-05-10T14:00:00Z'
 *               notes: # Optional notes
 *                 type: string
 *                 description: Optional notes for the reader about the scheduled chat
 *     responses:
 *       201:
 *         description: Chat scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Chat' } # Return the scheduled chat object
 *       400: { description: 'Invalid input data (e.g., invalid readerId, past time)' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (Only users can schedule)' }
 *       404: { description: 'Reader not found' }
 *       500: { description: 'Server error' }
 */
router.post('/schedule', authMiddleware.restrictTo('user'), scheduleChatValidator, trackPerformance('scheduleChat'), chatController.scheduleChat); // Only users can schedule

/**
 * @swagger
 * /chats/schedules/upcoming:
 *   get:
 *     summary: Get upcoming scheduled chats for the current user or reader
 *     tags: [Chats, Scheduling]
 *     security:
 *       - bearerAuth: []
 *     parameters: # Add pagination/sorting if needed
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: scheduledTime }
 *         description: Sort order (e.g., 'scheduledTime')
 *     responses:
 *       200:
 *         description: A list of upcoming scheduled chats
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         schedules:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Chat' } # Scheduled chats are still Chat objects
 *                         pagination: { type: object }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Server error' }
 */
router.get('/schedules/upcoming', trackPerformance('getUpcomingSchedules'), chatController.getUpcomingSchedules); // User/Reader can get their schedules (logic in controller)

// Routes với params phải đặt sau route cụ thể

/**
 * @swagger
 * /chats/{id}:
 *   get:
 *     summary: Get details of a specific chat session
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the chat session
 *     responses:
 *       200:
 *         description: Chat details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Chat' }
 *       400: { description: 'Invalid ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (User not involved in this chat)' }
 *       404: { description: 'Chat not found' }
 *       500: { description: 'Server error' }
 */
router.get('/:id', getChatByIdValidator, trackPerformance('getChatById'), chatController.getChatById); // User/Reader/Admin involved can get chat (logic in controller)

/**
 * @swagger
 * /chats/{id}:
 *   put:
 *     summary: Update the status of a chat session (Reader/Admin only)
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the chat session to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, completed, cancelled, scheduled] # Example statuses
 *                 description: The new status for the chat session
 *                 example: 'active'
 *     responses:
 *       200:
 *         description: Chat status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Chat' } # Return updated chat
 *       400: { description: 'Invalid input data or ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (User is not Reader/Admin)' }
 *       404: { description: 'Chat not found' }
 *       500: { description: 'Server error' }
 */
router.put('/:id', authMiddleware.restrictTo('reader', 'admin'), getChatByIdValidator, updateChatStatusValidator, trackPerformance('updateChatStatus'), chatController.updateChatStatus); // Only reader/admin can update status

/**
 * @swagger
 * /chats/{id}/messages:
 *   get:
 *     summary: Get messages for a specific chat session
 *     tags: [Chats, Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the chat session
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: -createdAt }
 *         description: Sort order (e.g., '-createdAt')
 *     responses:
 *       200:
 *         description: A list of messages for the chat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         messages:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Message' } # Define Message schema later
 *                         pagination: { type: object }
 *       400: { description: 'Invalid ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (User not involved in this chat)' }
 *       404: { description: 'Chat not found' }
 *       500: { description: 'Server error' }
 */
// Route để lấy tin nhắn của cuộc trò chuyện (GET)
router.get('/:id/messages', getChatByIdValidator, trackPerformance('getChatMessages'), chatController.getChatMessages); // Added GET route for messages

/**
 * @swagger
 * /chats/{id}/messages:
 *   post:
 *     summary: Send a message in a specific chat session
 *     tags: [Chats, Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the chat session to send a message to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the message
 *                 example: 'Thank you for the reading!'
 *               messageType: # Optional message type
 *                 type: string
 *                 enum: [text, image, system] # Example types
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Message' } # Return the created message
 *       400: { description: 'Invalid input data or ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (User not involved or chat inactive)' }
 *       404: { description: 'Chat not found' }
 *       500: { description: 'Server error' }
 */
// sendMessageValidator checks body message and optional param chatId
router.post('/:id/messages', getChatByIdValidator, sendMessageValidator, trackPerformance('sendMessage'), chatController.sendMessage); // User/Reader involved can send message

/**
 * @swagger
 * /chats/{id}/read:
 *   put:
 *     summary: Mark messages in a chat as read by the current user
 *     tags: [Chats, Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the chat session
 *     responses:
 *       200:
 *         description: Chat marked as read successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiResponse' } # Maybe return updated chat or just success
 *       400: { description: 'Invalid ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden (User not involved)' }
 *       404: { description: 'Chat not found' }
 *       500: { description: 'Server error' }
 */
router.put('/:id/read', getChatByIdValidator, trackPerformance('markChatAsRead'), chatController.markChatAsRead); // User/Reader involved can mark as read

module.exports = router;
