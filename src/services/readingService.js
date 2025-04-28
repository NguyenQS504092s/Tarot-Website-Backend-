/**
 * Reading Service - Xử lý các chức năng liên quan đến phiên đọc bài Tarot
 */
const Reading = require('../models/readingModel');
const User = require('../models/userModel');
const Spread = require('../models/spreadModel'); // Import Spread model
const cardService = require('./cardService');
const ApiError = require('../utils/apiError');

/**
 * Tạo phiên đọc bài mới với lá bài ngẫu nhiên
 * @param {String} userId ID của người dùng
 * @param {String} spreadName Tên kiểu trải bài
 * @param {String} question Câu hỏi của người dùng
 * @param {String} deckName Tên bộ bài (tùy chọn)
 * @param {Boolean} allowReversed Cho phép lá bài ngược (tùy chọn)
 * @returns {Promise<Object>} Thông tin phiên đọc bài mới tạo
 */
exports.createReading = async (userId, spreadName, question, deckName = 'Rider Waite Smith', allowReversed = true) => { // Renamed spreadType to spreadName for clarity
  try {
    // Tìm thông tin spread trong DB
    const spreadInfo = await Spread.findOne({ name: spreadName, isActive: true });
    if (!spreadInfo) {
      throw new ApiError(`Kiểu trải bài không hợp lệ hoặc không hoạt động: ${spreadName}`, 400);
    }

    // Rút lá bài ngẫu nhiên dựa trên cardCount từ spreadInfo
    const drawnCards = await cardService.drawCards(deckName, spreadInfo.cardCount, allowReversed); // Use drawCards directly

    // Gán vị trí cho từng lá bài dựa trên index (1-based)
    // drawnCards is an array of { card: CardObject, isReversed: boolean }
    const cards = drawnCards.map((drawnCard, index) => ({
      cardId: drawnCard.card._id, // Correctly access the card ID
      position: index + 1,        // Assign position based on index
      isReversed: drawnCard.isReversed // Access isReversed directly
    }));
    
    // Tạo phiên đọc bài mới
    const newReading = await Reading.create({
      userId,
      spread: spreadName, // Use the validated spreadName
      question,
      cards // Use the cards array with positions
    });

    // Lấy thông tin người dùng để cập nhật số lần đọc bài
    const user = await User.findById(userId);
    
    // Tăng số lần đọc bài trong ngày nếu người dùng là user thường (incrementDailyReadings no longer saves)
    if (user && user.role === 'user') {
      user.incrementDailyReadings();
      await user.save(); // Explicitly save user after incrementing
    }
    
    // Populate thông tin chi tiết lá bài trực tiếp
    await newReading.populate({
      path: 'cards.cardId',
      select: 'name type suit number imageUrl uprightMeaning reversedMeaning'
    });
    await newReading.populate({ // Also populate user info
        path: 'userId',
        select: 'name email'
    });
    
    return newReading; // Return the populated object directly
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Log the unexpected error for debugging
    console.error('Unexpected error in createReading:', error); 
    throw new ApiError(`Lỗi khi tạo phiên đọc bài: ${error.message}`, 500);
  }
};

/**
 * Lấy thông tin chi tiết về một phiên đọc bài
 * @param {String} readingId ID phiên đọc bài
 * @returns {Promise<Object>} Thông tin chi tiết phiên đọc bài
 */
exports.getReadingDetails = async (readingId) => {
  try {
    const reading = await Reading.findById(readingId);
    
    if (!reading) {
      throw new ApiError('Không tìm thấy phiên đọc bài', 404);
    }
    
    return reading;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi lấy thông tin phiên đọc bài: ${error.message}`, 500);
  }
};

/**
 * Lấy danh sách phiên đọc bài của một người dùng
 * @param {String} userId ID người dùng
 * @param {Number} page Số trang (bắt đầu từ 1)
 * @param {Number} limit Số phiên đọc bài trên một trang
 * @returns {Promise<Object>} Danh sách phiên đọc bài và thông tin phân trang
 */
exports.getUserReadingHistory = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const totalReadings = await Reading.countDocuments({ userId });
    const readings = await Reading.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return {
      readings,
      pagination: {
        total: totalReadings,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalReadings / limit)
      }
    };
  } catch (error) {
    throw new ApiError(`Lỗi khi lấy lịch sử đọc bài: ${error.message}`, 500);
  }
};

/**
 * Thêm diễn giải cho phiên đọc bài
 * @param {String} readingId ID phiên đọc bài
 * @param {String} readerId ID người đọc bài
 * @param {String} interpretation Nội dung diễn giải
 * @returns {Promise<Object>} Thông tin phiên đọc bài đã cập nhật
 */
exports.addInterpretation = async (readingId, readerId, interpretation) => {
  try {
    const reading = await Reading.findById(readingId);
    
    if (!reading) {
      throw new ApiError('Không tìm thấy phiên đọc bài', 404);
    }
    
    // Kiểm tra xem phiên đọc này đã có diễn giải chưa
    if (reading.interpretation) {
      throw new ApiError('Phiên đọc bài này đã có diễn giải', 400);
    }
    
    // Cập nhật diễn giải và người đọc bài
    reading.interpretation = interpretation;
    reading.readerId = readerId;
    
    await reading.save();
    
    return reading;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi thêm diễn giải: ${error.message}`, 500);
  }
};

/**
 * Thêm phản hồi cho phiên đọc bài
 * @param {String} readingId ID phiên đọc bài
 * @param {String} userId ID người dùng
 * @param {Number} rating Đánh giá (1-5 sao)
 * @param {String} comment Bình luận (tùy chọn)
 * @returns {Promise<Object>} Thông tin phiên đọc bài đã cập nhật
 */
exports.addFeedback = async (readingId, userId, rating, comment) => {
  try {
    const reading = await Reading.findById(readingId);
    
    if (!reading) {
      throw new ApiError('Không tìm thấy phiên đọc bài', 404);
    }
    
    // Kiểm tra quyền - chỉ chủ sở hữu mới có thể thêm phản hồi
    // Sửa: So sánh _id của đối tượng userId (nếu đã populate) hoặc chính userId (nếu chưa)
    const readingUserIdString = reading.userId._id ? reading.userId._id.toString() : reading.userId.toString();
    if (readingUserIdString !== userId.toString()) {
      throw new ApiError('Bạn không có quyền thêm phản hồi cho phiên đọc bài này', 403);
    }
    
    // Kiểm tra giá trị đánh giá
    if (rating < 1 || rating > 5) {
      throw new ApiError('Đánh giá phải từ 1 đến 5 sao', 400);
    }
    
    reading.feedback = { rating, comment };
    await reading.save();
    
    return reading;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi thêm phản hồi: ${error.message}`, 500);
  }
};

/**
 * Tìm các phiên đọc bài đang chờ diễn giải
 * @param {Number} page Số trang
 * @param {Number} limit Số phiên đọc bài trên một trang
 * @returns {Promise<Object>} Danh sách phiên đọc bài chờ diễn giải và thông tin phân trang
 */
exports.getPendingReadings = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const totalPending = await Reading.countDocuments({ 
      interpretation: { $exists: false } 
    });
    
    const pendingReadings = await Reading.find({ 
      interpretation: { $exists: false } 
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return {
      readings: pendingReadings,
      pagination: {
        total: totalPending,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalPending / limit)
      }
    };
  } catch (error) {
    throw new ApiError(`Lỗi khi lấy danh sách phiên đọc bài chờ diễn giải: ${error.message}`, 500);
  }
};

/**
 * Phân tích lá bài và vị trí để tạo diễn giải tự động
 * @param {String} readingId ID phiên đọc bài
 * @returns {Promise<String>} Diễn giải tự động
 */
exports.generateAutomaticInterpretation = async (readingId) => {
  try {
    const reading = await Reading.findById(readingId)
      .populate({
        path: 'cards.cardId',
        select: 'name uprightMeaning reversedMeaning'
      });
    
    if (!reading) {
      throw new ApiError('Không tìm thấy phiên đọc bài', 404);
    }
    
    // Tạo diễn giải tự động dựa trên từng lá bài và vị trí
    let interpretation = `## Diễn giải cho trải bài ${reading.spread}\n\n`;
    
    if (reading.question) {
      interpretation += `*Câu hỏi: ${reading.question}*\n\n`;
    }
    
    // Thêm diễn giải cho từng lá bài
    for (let i = 0; i < reading.cards.length; i++) {
      const card = reading.cards[i];
      const cardInfo = card.cardId;
      const positionName = getPositionName(reading.spread, i + 1);
      
      interpretation += `### Lá ${i + 1}: ${cardInfo.name} ${card.isReversed ? '(Ngược)' : '(Xuôi)'}\n`;
      interpretation += `**Vị trí: ${positionName}**\n\n`;
      
      // Lấy nội dung diễn giải dựa trên hướng lá bài
      const meaningText = card.isReversed ? cardInfo.reversedMeaning : cardInfo.uprightMeaning;
      
      // Diễn giải theo vị trí
      interpretation += `Ở vị trí ${positionName}, lá ${cardInfo.name} cho thấy:\n${meaningText}\n\n`;
    }
    
    // Thêm diễn giải tổng thể
    interpretation += `## Diễn giải tổng thể\n\n`;
    interpretation += `Những lá bài xuất hiện trong trải bài này cho thấy ${generateOverallInsight(reading)}\n\n`;
    
    return interpretation;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi tạo diễn giải tự động: ${error.message}`, 500);
  }
};

/**
 * Lấy tên vị trí cho mỗi lá bài trong một kiểu trải bài
 * @param {String} spreadName Tên kiểu trải bài
 * @param {Number} position Vị trí lá bài (từ 1)
 * @returns {String} Tên vị trí
 */
function getPositionName(spreadName, position) {
  const positions = {
    'Celtic Cross': [
      'Hiện tại', 'Thách thức', 'Quá khứ', 'Tương lai', 
      'Tầm nhìn cao', 'Tầm nhìn sâu', 'Bản thân', 'Môi trường', 
      'Hy vọng và Lo sợ', 'Kết quả cuối cùng'
    ],
    'Ba Lá Bài': ['Quá khứ', 'Hiện tại', 'Tương lai'],
    'Năm Lá Bài': [
      'Hiện tại', 'Ảnh hưởng quá khứ', 'Tương lai tiềm năng', 
      'Lý do tình huống', 'Hành động khuyên dùng'
    ]
  };
  
  const positionArray = positions[spreadName] || [];
  return positionArray[position - 1] || `Vị trí ${position}`;
}

/**
 * Tạo diễn giải tổng thể dựa trên các lá bài
 * @param {Object} reading Thông tin phiên đọc bài
 * @returns {String} Diễn giải tổng thể
 */
function generateOverallInsight(reading) {
  // Đây là một ví dụ đơn giản, trong thực tế có thể phức tạp hơn nhiều
  const majorArcanaCount = reading.cards.filter(
    card => card.cardId.type === 'Major Arcana'
  ).length;
  
  const reversedCount = reading.cards.filter(
    card => card.isReversed
  ).length;
  
  let insight = '';
  
  // Diễn giải dựa trên tỷ lệ lá Major Arcana
  if (majorArcanaCount > reading.cards.length / 2) {
    insight += 'có những sự kiện quan trọng và có tính định mệnh đang diễn ra trong cuộc sống của bạn. ';
  } else {
    insight += 'những vấn đề hiện tại của bạn liên quan nhiều đến cuộc sống hàng ngày và các quyết định cá nhân. ';
  }
  
  // Diễn giải dựa trên tỷ lệ lá ngược
  if (reversedCount > reading.cards.length / 2) {
    insight += 'Với nhiều lá bài ngược, có vẻ như bạn đang gặp nhiều trở ngại và thách thức cần phải vượt qua. ';
  } else {
    insight += 'Phần lớn các lá bài đều xuôi, cho thấy năng lượng tích cực và thuận lợi đang hỗ trợ bạn. ';
  }
  
  // Diễn giải dựa trên số lượng lá bài
  if (reading.cards.length <= 3) {
    insight += 'Đây là một trải bài ngắn gọn, chỉ ra những điểm chính bạn cần lưu ý.';
  } else {
    insight += 'Trải bài phức tạp này cho thấy nhiều khía cạnh khác nhau của tình huống, cần xem xét mối quan hệ giữa các lá bài để hiểu rõ hơn.';
  }
  
  return insight;
}

/**
 * Lấy tất cả các phiên đọc bài (dành cho Admin)
 * @param {Number} page Số trang
 * @param {Number} limit Số phiên đọc bài trên một trang
 * @returns {Promise<Object>} Danh sách tất cả phiên đọc bài và thông tin phân trang
 */
exports.getAllReadings = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const limitInt = parseInt(limit);
    const pageInt = parseInt(page);

    const totalReadings = await Reading.countDocuments();
    const readings = await Reading.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt)
      .populate({ path: 'userId', select: 'name email' }) // Populate user info
      .populate({ path: 'readerId', select: 'name email' }) // Populate reader info if available
      .populate({ path: 'cards.cardId', select: 'name imageUrl' }); // Populate basic card info

    return {
      readings,
      pagination: {
        total: totalReadings,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(totalReadings / limitInt)
      }
    };
  } catch (error) {
    throw new ApiError(`Lỗi khi lấy tất cả phiên đọc bài: ${error.message}`, 500);
  }
};

/**
 * Xóa một phiên đọc bài (dành cho Admin)
 * @param {String} readingId ID của phiên đọc bài cần xóa
 * @returns {Promise<Object>} Thông tin xác nhận xóa
 */
exports.deleteReading = async (readingId) => {
  try {
    const reading = await Reading.findByIdAndDelete(readingId);

    if (!reading) {
      throw new ApiError('Không tìm thấy phiên đọc bài để xóa', 404);
    }

    // Có thể thêm logic khác ở đây nếu cần, ví dụ: xóa các dữ liệu liên quan

    return { message: 'Phiên đọc bài đã được xóa thành công', deletedReadingId: readingId };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi xóa phiên đọc bài: ${error.message}`, 500);
  }
};

/**
 * Cập nhật thông tin một phiên đọc bài (dành cho Admin)
 * @param {String} readingId ID của phiên đọc bài cần cập nhật
 * @param {Object} updateData Dữ liệu cần cập nhật
 * @returns {Promise<Object>} Thông tin phiên đọc bài đã được cập nhật
 */
exports.updateReading = async (readingId, updateData) => {
  try {
    // Xác định các trường được phép cập nhật bởi admin
    const allowedUpdates = ['question', 'interpretation', 'readerId', 'isPublic']; // Removed 'status'
    const filteredUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

    // Kiểm tra xem có dữ liệu hợp lệ để cập nhật không
    if (Object.keys(filteredUpdateData).length === 0) {
      throw new ApiError('Không có dữ liệu hợp lệ để cập nhật', 400);
    }

    // Tìm và cập nhật reading
    const updatedReading = await Reading.findByIdAndUpdate(
      readingId,
      filteredUpdateData,
      { new: true, runValidators: true } // Trả về document mới và chạy validators
    )
    .populate({ path: 'userId', select: 'name email' })
    .populate({ path: 'readerId', select: 'name email' })
    .populate({ path: 'cards.cardId', select: 'name imageUrl' });

    if (!updatedReading) {
      throw new ApiError('Không tìm thấy phiên đọc bài để cập nhật', 404);
    }

    return updatedReading;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Xử lý lỗi validation từ Mongoose
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        throw new ApiError(`Lỗi validation: ${messages.join('. ')}`, 400);
    }
    throw new ApiError(`Lỗi khi cập nhật phiên đọc bài: ${error.message}`, 500);
  }
};
