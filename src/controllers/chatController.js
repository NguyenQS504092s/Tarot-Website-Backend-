const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const Reading = require('../models/readingModel');
const ApiError = require('../utils/apiError');

/**
 * @desc    Lấy danh sách cuộc trò chuyện của người dùng hiện tại
 * @route   GET /api/chats
 * @access  Private
 */
exports.getUserChats = async (req, res, next) => {
  try {
    const chats = await Chat.findChatsForUser(req.user._id);

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
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
      .populate('participants', 'name avatar email role')
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

    // Đánh dấu tin nhắn là đã đọc
    await chat.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      data: chat
    });
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
    const { receiverId, message, relatedReadingId, title, scheduledTime } = req.body;

    // Kiểm tra xem người nhận có tồn tại không
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return next(new ApiError('Không tìm thấy người dùng', 404));
    }

    // Kiểm tra xem người nhận có phải là người đọc bài không (nếu người dùng thông thường tạo cuộc trò chuyện)
    if (req.user.role === 'user' && receiver.role !== 'reader' && receiver.role !== 'admin') {
      return next(new ApiError('Bạn chỉ có thể trò chuyện với người đọc bài hoặc quản trị viên', 400));
    }

    // Nếu có relatedReadingId, kiểm tra xem reading có tồn tại không
    let reading;
    if (relatedReadingId) {
      reading = await Reading.findById(relatedReadingId);
      if (!reading) {
        return next(new ApiError('Không tìm thấy lịch sử đọc bài', 404));
      }

      // Kiểm tra xem người dùng có quyền liên kết với reading này không
      if (reading.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new ApiError('Bạn không có quyền liên kết với lịch sử đọc bài này', 403));
      }
    }

    // Tạo cuộc trò chuyện mới
    const newChat = new Chat({
      participants: [req.user._id, receiverId],
      messages: [],
      title: title || 'Cuộc trò chuyện mới',
      relatedReading: relatedReadingId,
      scheduledTime: scheduledTime
    });

    // Thêm tin nhắn đầu tiên nếu có
    if (message) {
      await newChat.addMessage(req.user._id, message);
    }

    // Thêm tin nhắn hệ thống
    await newChat.addSystemMessage(`Cuộc trò chuyện đã được tạo bởi ${req.user.name || 'Người dùng'}`);

    // Lưu cuộc trò chuyện và populate participants
    await newChat.save();
    
    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants', 'name avatar email role')
      .populate('relatedReading');

    res.status(201).json({
      success: true,
      data: populatedChat
    });
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
    const { content, contentType, attachments } = req.body;
    const chatId = req.params.id;

    // Kiểm tra xem cuộc trò chuyện có tồn tại không
    const chat = await Chat.findById(chatId).populate('participants');
    if (!chat) {
      return next(new ApiError('Không tìm thấy cuộc trò chuyện', 404));
    }

    // Kiểm tra xem người dùng có quyền gửi tin nhắn trong cuộc trò chuyện này không
    const isParticipant = chat.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return next(new ApiError('Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này', 403));
    }

    // Kiểm tra trạng thái cuộc trò chuyện
    if (chat.status === 'canceled') {
      return next(new ApiError('Cuộc trò chuyện đã bị hủy', 400));
    }
    
    if (chat.status === 'completed') {
      return next(new ApiError('Cuộc trò chuyện đã kết thúc', 400));
    }

    // Nếu cuộc trò chuyện có lịch hẹn và chưa đến thời gian, chỉ admin và người đọc mới có thể gửi tin
    if (chat.scheduledTime && new Date() < chat.scheduledTime && 
        req.user.role === 'user' && chat.status === 'pending') {
      return next(new ApiError('Cuộc trò chuyện chưa bắt đầu theo lịch hẹn', 400));
    }

    // Cập nhật trạng thái cuộc trò chuyện thành active nếu đang ở trạng thái pending
    if (chat.status === 'pending') {
      chat.status = 'active';
    }

    // Thêm tin nhắn mới
    await chat.addMessage(req.user._id, content, contentType, attachments);

    // Lấy cuộc trò chuyện đã cập nhật và populate participants
    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name avatar email role')
      .populate('relatedReading');

    res.status(201).json({
      success: true,
      data: updatedChat
    });
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
    const chatId = req.params.id;

    // Kiểm tra xem cuộc trò chuyện có tồn tại không
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return next(new ApiError('Không tìm thấy cuộc trò chuyện', 404));
    }

    // Kiểm tra xem người dùng có quyền truy cập cuộc trò chuyện không
    const isParticipant = chat.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return next(new ApiError('Bạn không có quyền truy cập cuộc trò chuyện này', 403));
    }

    // Đánh dấu tất cả tin nhắn là đã đọc
    await chat.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả tin nhắn là đã đọc'
    });
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

    // Nếu đổi trạng thái sang completed hoặc canceled, thêm tin nhắn hệ thống
    if (status === 'completed') {
      await chat.addSystemMessage(`Cuộc trò chuyện đã kết thúc bởi ${req.user.name || 'Người dùng'}`);
    } else if (status === 'canceled') {
      await chat.addSystemMessage(`Cuộc trò chuyện đã bị hủy bởi ${req.user.name || 'Người dùng'}`);
    } else {
      await chat.save();
    }

    // Lấy cuộc trò chuyện đã cập nhật và populate participants
    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'name avatar email role')
      .populate('relatedReading');

    res.status(200).json({
      success: true,
      data: updatedChat
    });
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
    const { readerId, scheduledTime, title, question } = req.body;

    // Kiểm tra xem người đọc bài có tồn tại không
    const reader = await User.findById(readerId);
    if (!reader || reader.role !== 'reader') {
      return next(new ApiError('Không tìm thấy người đọc bài', 404));
    }

    // Tạo cuộc trò chuyện mới với lịch hẹn
    const newChat = new Chat({
      participants: [req.user._id, readerId],
      messages: [],
      title: title || 'Cuộc đọc bài theo lịch hẹn',
      scheduledTime: new Date(scheduledTime),
      status: 'pending'
    });

    // Thêm tin nhắn hệ thống
    await newChat.addSystemMessage(`Cuộc trò chuyện đã được lên lịch cho ${new Date(scheduledTime).toLocaleString()}`);

    // Thêm tin nhắn về câu hỏi của người dùng nếu có
    if (question) {
      await newChat.addMessage(req.user._id, `Câu hỏi của tôi: ${question}`);
    }

    // Lưu cuộc trò chuyện và populate participants
    await newChat.save();
    
    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants', 'name avatar email role');

    res.status(201).json({
      success: true,
      data: populatedChat
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách lịch hẹn sắp tới (cho reader hoặc user)
 * @route   GET /api/chats/schedules
 * @access  Private
 */
exports.getUpcomingSchedules = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Tìm các cuộc trò chuyện có lịch hẹn trong tương lai
    const schedules = await Chat.find({
      participants: req.user._id,
      scheduledTime: { $gt: now },
      status: 'pending',
      isActive: true
    })
      .populate('participants', 'name avatar email role')
      .sort({ scheduledTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};