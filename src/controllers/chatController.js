

const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const Reading = require('../models/readingModel');
const chatService = require('../services/chatService'); // Import the service
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse'); // Import ApiResponse

/**
 * @desc    Lấy danh sách cuộc trò chuyện của người dùng hiện tại
 * @route   GET /api/chats
 * @access  Private
 */
exports.getUserChats = async (req, res, next) => {
  try {
    // findChatsForUser already populates correctly after model fix
    const chats = await Chat.findChatsForUser(req.user._id); 

    res.status(200).json(ApiResponse.success(chats, 'Lấy danh sách cuộc trò chuyện thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin chi tiết một cuộc trò chuyện
 * @route   GET /api/chats/:id
 * @access  Private
 */
exports.getChatById = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name email role') // Removed avatar
      .populate('relatedReading');

    // Kiểm tra xem cuộc trò chuyện có tồn tại không
    if (!chat) {
      return next(new ApiError('Không tìm thấy cuộc trò chuyện', 404));
    }

    // Kiểm tra xem người dùng có quyền truy cập cuộc trò chuyện không
    const isParticipant = chat.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return next(new ApiError('Bạn không có quyền truy cập cuộc trò chuyện này', 403));
    }

    // Đánh dấu tin nhắn là đã đọc (markAllAsRead no longer saves)
    chat.markAllAsRead(req.user._id); 
    await chat.save(); // Explicitly save after marking as read

    // Re-fetch or use the modified chat instance for response
    const updatedChat = await Chat.findById(req.params.id)
                                  .populate('participants', 'name email role')
                                  .populate('relatedReading');


    res.status(200).json(ApiResponse.success(updatedChat, 'Lấy thông tin cuộc trò chuyện thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo cuộc trò chuyện mới
 * @route   POST /api/chats
 * @access  Private
 */
exports.createChat = async (req, res, next) => {
  try {
    // Validator should ensure receiverId exists
    const { receiverId } = req.body;
    const userId = req.user._id;

    // Call the service to find or create the chat
    const chat = await chatService.createChat(userId.toString(), receiverId);

    // Service handles validation (is reader, not self) and creation/finding logic

    // Populate participants for the response
    const populatedChat = await Chat.findById(chat._id)
                                    .populate('participants', 'name email role')
                                    .populate('relatedReading'); // Keep relatedReading populate if needed

    // Determine status code based on whether chat was created or found
    // (Assuming service doesn't explicitly return this info, default to 200 for find, 201 for create)
    // For simplicity, let's return 200 if found, 201 if created (though service doesn't tell us)
    // Let's default to 200 for now, can refine later if needed.
    const statusCode = 200; // Or determine based on service response if possible
    const message = 'Tìm hoặc tạo cuộc trò chuyện thành công';

    res.status(statusCode).json(ApiResponse.success(populatedChat, message, statusCode));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Gửi tin nhắn mới trong cuộc trò chuyện
 * @route   POST /api/chats/:id/messages
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    // Validator should ensure content exists
    const { content } = req.body;
    const chatId = req.params.id; // Validator should ensure chatId is valid MongoId
    const senderId = req.user._id;

    // Call the service function
    const newMessage = await chatService.sendMessage(chatId, senderId.toString(), content);

    // Service handles chat existence, participant check, status check, message creation, and chat update

    // Populate sender info for the response
    await newMessage.populate('sender', 'name role'); // Populate sender details

    res.status(201).json(ApiResponse.success(newMessage, 'Gửi tin nhắn thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách tin nhắn của một cuộc trò chuyện
 * @route   GET /api/chats/:id/messages
 * @access  Private
 */
exports.getChatMessages = async (req, res, next) => {
  try {
    const chatId = req.params.id; // Validated by getChatByIdValidator
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20; // Default limit 20 messages

    // Call the service function
    const result = await chatService.getChatMessages(chatId, userId.toString(), { page, limit });

    // Service handles permission check, fetching, and pagination logic

    res.status(200).json(ApiResponse.pagination(
        result.messages,
        result.currentPage,
        limit, // Use the same limit passed to service
        result.totalMessages,
        'Lấy tin nhắn thành công'
    ));
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Đánh dấu tin nhắn là đã đọc
 * @route   PUT /api/chats/:id/read
 * @access  Private
 */
exports.markChatAsRead = async (req, res, next) => {
  try {
    const chatId = req.params.id; // Validated by getChatByIdValidator
    const userId = req.user._id;

    // Call the service function
    const updatedCount = await chatService.markChatAsRead(chatId, userId.toString());

    // Service handles permission check and update logic

    res.status(200).json(ApiResponse.success(
        { updatedCount }, // Optionally return the count of messages marked as read
        'Đã đánh dấu tin nhắn là đã đọc'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật trạng thái cuộc trò chuyện
 * @route   PUT /api/chats/:id
 * @access  Private (Reader, Admin)
 */
exports.updateChatStatus = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    const { status, scheduledTime, title } = req.body;

    // Kiểm tra xem cuộc trò chuyện có tồn tại không
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return next(new ApiError('Không tìm thấy cuộc trò chuyện', 404));
    }

    // Kiểm tra xem người dùng có quyền cập nhật cuộc trò chuyện không
    const isParticipant = chat.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if ((!isParticipant && req.user.role !== 'admin') || 
        (req.user.role === 'user' && status)) {
      return next(new ApiError('Bạn không có quyền cập nhật trạng thái cuộc trò chuyện này', 403));
    }

    // Cập nhật các trường
    if (status) chat.status = status;
    if (scheduledTime) chat.scheduledTime = scheduledTime;
    if (title) chat.title = title;

    // Nếu đổi trạng thái sang completed hoặc canceled, thêm tin nhắn hệ thống (addSystemMessage no longer saves)
    if (status === 'completed') {
      chat.addSystemMessage(`Cuộc trò chuyện đã kết thúc bởi ${req.user.name || 'Người dùng'}`);
    } else if (status === 'canceled') {
      chat.addSystemMessage(`Cuộc trò chuyện đã bị hủy bởi ${req.user.name || 'Người dùng'}`);
    }
    
    // Save unconditionally after modifications
    await chat.save(); 

    // Lấy cuộc trò chuyện đã cập nhật và populate participants
    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name email role') // Removed avatar
      .populate('relatedReading');

    res.status(200).json(ApiResponse.success(updatedChat, 'Cập nhật trạng thái cuộc trò chuyện thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lên lịch cuộc trò chuyện mới
 * @route   POST /api/chats/schedule
 * @access  Private
 */
exports.scheduleChat = async (req, res, next) => {
  try {
    // Validator ensures readerId and scheduledTime are present and valid format
    const { readerId, scheduledTime, title, question } = req.body;
    const userId = req.user._id;

    // Call the service function
    const newChat = await chatService.scheduleChat(
        userId.toString(),
        readerId,
        scheduledTime,
        title,
        question
    );

    // Service handles validation, chat creation, and initial message creation

    // Populate participants for the response
    const populatedChat = await Chat.findById(newChat._id)
                                    .populate('participants', 'name email role'); // Populate necessary fields

    res.status(201).json(ApiResponse.success(populatedChat, 'Lên lịch cuộc trò chuyện thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách lịch hẹn sắp tới (cho reader hoặc user)
 * @route   GET /api/chats/schedules/upcoming
 * @access  Private
 */
exports.getUpcomingSchedules = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Call the service function
    const schedules = await chatService.getUpcomingSchedules(userId.toString());

    // Service handles fetching and sorting logic

    res.status(200).json(ApiResponse.success(schedules, 'Lấy danh sách lịch hẹn sắp tới thành công'));
  } catch (error) {
    next(error);
  }
};
