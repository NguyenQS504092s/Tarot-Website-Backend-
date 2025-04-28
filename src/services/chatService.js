/**
 * Chat Service - Xử lý logic liên quan đến trò chuyện và tin nhắn
 */
const Chat = require('../models/chatModel');
// const Message = require('../models/messageModel'); // Removed unused import
const User = require('../models/userModel');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Tạo hoặc tìm cuộc trò chuyện giữa người dùng và reader.
 * @param {String} userId ID của người dùng (người khởi tạo)
 * @param {String} readerId ID của reader
 * @returns {Promise<Object>} Cuộc trò chuyện đã tồn tại hoặc mới được tạo
 */
exports.createChat = async (userId, readerId) => {
  try {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(readerId)) {
      throw new ApiError('ID người dùng hoặc reader không hợp lệ', 400);
    }
    if (userId === readerId) {
        throw new ApiError('Người dùng không thể tự tạo cuộc trò chuyện với chính mình', 400);
    }

    // Kiểm tra xem reader có tồn tại và có vai trò là 'reader' không
    const reader = await User.findById(readerId);
    if (!reader || reader.role !== 'reader') {
        throw new ApiError('Reader không hợp lệ hoặc không tìm thấy', 404);
    }

    // Tìm cuộc trò chuyện hiện có giữa hai người tham gia
    // Sử dụng $all để đảm bảo cả hai ID đều có trong mảng participants
    let chat = await Chat.findOne({
      participants: { $all: [userId, readerId] }
    });

    // Nếu chưa có, tạo cuộc trò chuyện mới
    if (!chat) {
      chat = await Chat.create({
        participants: [userId, readerId],
        // lastMessage có thể được cập nhật khi có tin nhắn đầu tiên
      });
      console.log(`Chat Service: Created new chat between ${userId} and ${readerId}`);
    } else {
        console.log(`Chat Service: Found existing chat between ${userId} and ${readerId}`);
    }

    return chat;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`Chat Service Error in createChat: ${error.message}`);
    throw new ApiError(`Lỗi khi tạo hoặc tìm cuộc trò chuyện: ${error.message}`, 500);
  }
};

/**
 * Gửi tin nhắn mới vào cuộc trò chuyện.
 * @param {String} chatId ID của cuộc trò chuyện
 * @param {String} senderId ID của người gửi
 * @param {String} content Nội dung tin nhắn
 * @returns {Promise<Object>} Tin nhắn mới được tạo
 */
exports.sendMessage = async (chatId, senderId, content) => {
  try {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      throw new ApiError('ID cuộc trò chuyện hoặc người gửi không hợp lệ', 400);
    }
    if (!content || content.trim() === '') {
        throw new ApiError('Nội dung tin nhắn không được để trống', 400);
    }

    // Tìm cuộc trò chuyện và kiểm tra người tham gia
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ApiError('Không tìm thấy cuộc trò chuyện', 404);
    }

    const isParticipant = chat.participants.some(p => p.toString() === senderId);
    if (!isParticipant) {
      // Consider allowing admin to send messages even if not participant? For now, restrict.
      throw new ApiError('Người gửi không phải là thành viên của cuộc trò chuyện này', 403);
    }

    // Kiểm tra trạng thái cuộc trò chuyện (optional, can be handled in controller or here)
    if (chat.status === 'canceled' || chat.status === 'completed') {
      throw new ApiError(`Không thể gửi tin nhắn vào cuộc trò chuyện đã ${chat.status === 'canceled' ? 'bị hủy' : 'kết thúc'}.`, 400);
    }
    // Handle scheduled chats (optional, can be handled in controller or here)
    // if (chat.scheduledTime && new Date() < chat.scheduledTime && chat.status === 'pending') {
    //   const sender = await User.findById(senderId); // Need sender role
    //   if (sender && sender.role === 'user') {
    //      throw new ApiError('Cuộc trò chuyện chưa bắt đầu theo lịch hẹn', 400);
    //   }
    // }

    // Sử dụng instance method của Chat model để thêm tin nhắn vào mảng nhúng
    // Lưu ý: addMessage không tự save, cần gọi chat.save() sau đó.
    // Chúng ta sẽ thêm tin nhắn và cập nhật trạng thái trước khi lưu.
    const messageData = {
        sender: senderId,
        content: content.trim(),
        contentType: 'text', // Giả định là text, có thể mở rộng sau
        isRead: false // Tin nhắn mới chưa được đọc bởi người nhận
    };
    chat.messages.push(messageData);
    chat.lastMessage = new Date(); // Cập nhật thời gian tin nhắn cuối cùng

    if (chat.status === 'pending') {
        chat.status = 'active'; // Kích hoạt chat khi có tin nhắn đầu tiên
    }

    // Lưu thay đổi vào chat document
    await chat.save();

    // Lấy tin nhắn vừa được thêm (tin nhắn cuối cùng trong mảng) để trả về
    // Lưu ý: Tin nhắn này chưa được populate sender
    const newMessage = chat.messages[chat.messages.length - 1];

    console.log(`Chat Service: Added message to chat ${chatId} by ${senderId}`);
    return newMessage; // Trả về object tin nhắn vừa thêm (chưa populate)

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`Chat Service Error in sendMessage: ${error.message}`);
    throw new ApiError(`Lỗi khi gửi tin nhắn: ${error.message}`, 500);
  }
};

/**
 * Lấy danh sách tin nhắn của một cuộc trò chuyện với phân trang.
 * @param {String} chatId ID của cuộc trò chuyện
 * @param {String} userId ID của người dùng yêu cầu (để kiểm tra quyền)
 * @param {Object} options Tùy chọn phân trang { page, limit }
 * @returns {Promise<Object>} Đối tượng chứa tin nhắn và thông tin phân trang
 */
exports.getChatMessages = async (chatId, userId, options = {}) => {
  try {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError('ID cuộc trò chuyện hoặc người dùng không hợp lệ', 400);
    }

    // Kiểm tra xem chat có tồn tại và người dùng có quyền truy cập không
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ApiError('Không tìm thấy cuộc trò chuyện', 404);
    }

    const isParticipant = chat.participants.some(p => p.toString() === userId);
    // Fetch user role if needed for admin access check
    let isAdmin = false;
    if (!isParticipant) {
        const user = await User.findById(userId);
        isAdmin = user && user.role === 'admin';
    }

    if (!isParticipant && !isAdmin) {
      throw new ApiError('Bạn không có quyền truy cập cuộc trò chuyện này', 403);
    }

    // Lấy tổng số tin nhắn từ mảng nhúng
    const totalMessages = chat.messages.length;

    // Thực hiện phân trang trên mảng messages nhúng
    // Sắp xếp theo thời gian tạo (mới nhất trước) để lấy đúng trang
    const sortedMessages = chat.messages.sort((a, b) => b.createdAt - a.createdAt);
    const paginatedMessages = sortedMessages.slice(skip, skip + limit);

    // Populate thông tin người gửi cho các tin nhắn trong trang hiện tại
    // Cần thực hiện populate thủ công vì chúng ta đang làm việc với mảng con
    const populatedMessages = await Promise.all(paginatedMessages.map(async (msg) => {
        // Chỉ populate nếu sender tồn tại (không phải tin nhắn hệ thống)
        if (msg.sender) {
            const senderInfo = await User.findById(msg.sender).select('name role').lean(); // lean() để lấy object thuần
            // Trả về object tin nhắn mới với sender đã populate
            // Cần chuyển đổi msg thành object thuần nếu nó là Mongoose subdocument
            const msgObject = msg.toObject ? msg.toObject() : { ...msg };
            return { ...msgObject, sender: senderInfo };
        }
        return msg.toObject ? msg.toObject() : { ...msg }; // Trả về object thuần cho tin nhắn hệ thống
    }));

    // Đảo ngược lại để hiển thị theo thứ tự thời gian tăng dần trên trang hiện tại
    const reversedMessages = populatedMessages.reverse();

    return {
      messages: reversedMessages, // Trả về tin nhắn đã populate sender
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
    };

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`Chat Service Error in getChatMessages: ${error.message}`);
    throw new ApiError(`Lỗi khi lấy tin nhắn: ${error.message}`, 500);
  }
};

/**
 * Đánh dấu tất cả tin nhắn trong cuộc trò chuyện là đã đọc bởi người dùng.
 * @param {String} chatId ID của cuộc trò chuyện
 * @param {String} userId ID của người dùng đã đọc
 * @returns {Promise<Number>} Số lượng tin nhắn được cập nhật
 */
exports.markChatAsRead = async (chatId, userId) => {
  try {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError('ID cuộc trò chuyện hoặc người dùng không hợp lệ', 400);
    }

    // Kiểm tra xem chat có tồn tại và người dùng có quyền truy cập không
    // (Quyền truy cập đã được kiểm tra trong controller trước khi gọi service này)
    const chat = await Chat.findById(chatId);
     if (!chat) {
       throw new ApiError('Không tìm thấy cuộc trò chuyện', 404);
     }
     // Double check participant for safety, though controller should handle it
     const isParticipant = chat.participants.some(p => p.toString() === userId);
     if (!isParticipant) {
         // Fetch user role if needed for admin access check
         const user = await User.findById(userId);
         const isAdmin = user && user.role === 'admin';
         if (!isAdmin) {
             throw new ApiError('Bạn không có quyền đánh dấu đã đọc cho cuộc trò chuyện này', 403);
         }
     }
    // Tìm các tin nhắn trong chat này mà người gửi không phải là userId và isRead là false
    let updateCount = 0;
    let modified = false;
    chat.messages.forEach(message => {
        // Chỉ đánh dấu đã đọc cho tin nhắn của người khác và chưa được đọc
        if (message.sender && message.sender.toString() !== userId.toString() && !message.isRead) {
            message.isRead = true;
            updateCount++;
            modified = true;
        }
    });

    // Chỉ lưu lại nếu có thay đổi
    if (modified) {
        await chat.save();
        console.log(`Chat Service: Marked ${updateCount} messages as read by ${userId} in chat ${chatId}.`);
    } else {
        console.log(`Chat Service: No new messages to mark as read by ${userId} in chat ${chatId}.`);
    }

    // Trả về số lượng tin nhắn đã được cập nhật trạng thái đọc
    return updateCount;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`Chat Service Error in markChatAsRead: ${error.message}`);
    throw new ApiError(`Lỗi khi đánh dấu tin nhắn đã đọc: ${error.message}`, 500);
  }
};

/**
 * Lên lịch một cuộc trò chuyện mới giữa người dùng và reader.
 * @param {String} userId ID của người dùng yêu cầu
 * @param {String} readerId ID của reader
 * @param {Date} scheduledTime Thời gian hẹn
 * @param {String} [title] Tiêu đề cuộc trò chuyện (tùy chọn)
 * @param {String} [initialQuestion] Câu hỏi ban đầu của người dùng (tùy chọn)
 * @returns {Promise<Object>} Cuộc trò chuyện mới được lên lịch
 */
exports.scheduleChat = async (userId, readerId, scheduledTime, title, initialQuestion) => {
  try {
    // Validate IDs and time
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(readerId)) {
      throw new ApiError('ID người dùng hoặc reader không hợp lệ', 400);
    }
    if (userId === readerId) {
        throw new ApiError('Người dùng không thể tự lên lịch với chính mình', 400);
    }
    const scheduleDate = new Date(scheduledTime);
    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
        throw new ApiError('Thời gian hẹn không hợp lệ hoặc phải ở trong tương lai', 400);
    }

    // Kiểm tra reader
    const reader = await User.findById(readerId);
    if (!reader || reader.role !== 'reader') {
      throw new ApiError('Reader không hợp lệ hoặc không tìm thấy', 404);
    }

    // Tạo cuộc trò chuyện mới với trạng thái pending và lịch hẹn
    const newChat = new Chat({
      participants: [userId, readerId],
      messages: [], // Sẽ thêm tin nhắn hệ thống và câu hỏi sau
      title: title || `Lịch hẹn với ${reader.name}`, // Default title
      scheduledTime: scheduleDate,
      status: 'pending', // Initial status is pending
      isActive: true // Scheduled chats are active until completed/canceled
    });

    // Thêm tin nhắn hệ thống (không lưu chat ở đây, sẽ lưu cùng tin nhắn ban đầu hoặc riêng)
    const systemMessageData = {
        sender: null, // Tin nhắn hệ thống không có sender cụ thể
        content: `Cuộc trò chuyện đã được lên lịch cho ${scheduleDate.toLocaleString('vi-VN')}`,
        contentType: 'system',
        isRead: false // Tin nhắn hệ thống cũng cần được đọc
    };
    newChat.messages.push(systemMessageData);
    newChat.lastMessage = new Date(); // Cập nhật lastMessage

    // Lưu chat với tin nhắn hệ thống trước
    await newChat.save();

    // Nếu có câu hỏi ban đầu, thêm nó vào mảng messages và lưu lại chat
    if (initialQuestion && initialQuestion.trim() !== '') {
        const initialMessageData = {
            sender: userId,
            content: `Câu hỏi ban đầu: ${initialQuestion.trim()}`,
            contentType: 'text',
            isRead: false // Chỉ người gửi đọc ban đầu
        };
        newChat.messages.push(initialMessageData);
        // Cập nhật lastMessage nếu tin nhắn này là mới nhất (thường là vậy)
        newChat.lastMessage = new Date();
        await newChat.save(); // Lưu lại chat với tin nhắn ban đầu
    }


    console.log(`Chat Service: Scheduled chat ${newChat._id} between ${userId} and ${readerId} for ${scheduleDate}`);

    // Populate participants for the response if needed, or handle in controller
    // await newChat.populate('participants', 'name role');
    return newChat;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`Chat Service Error in scheduleChat: ${error.message}`);
    throw new ApiError(`Lỗi khi lên lịch cuộc trò chuyện: ${error.message}`, 500);
  }
};

/**
 * Lấy danh sách các cuộc trò chuyện đã được lên lịch sắp tới cho một người dùng.
 * @param {String} userId ID của người dùng (user hoặc reader)
 * @returns {Promise<Array>} Danh sách các cuộc trò chuyện đã lên lịch
 */
exports.getUpcomingSchedules = async (userId) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new ApiError('ID người dùng không hợp lệ', 400);
        }

        const now = new Date();

        // Tìm các cuộc trò chuyện có lịch hẹn trong tương lai, trạng thái pending,
        // và người dùng là một trong các participants
        const schedules = await Chat.find({
          participants: userId, // User must be a participant
          scheduledTime: { $gt: now },
          status: 'pending',
          isActive: true // Ensure the chat itself is considered active
        })
          .populate('participants', 'name email role') // Populate participant details
          .sort({ scheduledTime: 1 }); // Sort by soonest first

        console.log(`Chat Service: Found ${schedules.length} upcoming schedules for user ${userId}`);
        return schedules;

    } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        console.error(`Chat Service Error in getUpcomingSchedules: ${error.message}`);
        throw new ApiError(`Lỗi khi lấy lịch hẹn sắp tới: ${error.message}`, 500);
    }
};


// TODO: Implement other chat service functions:
// - getUserChats(userId)
