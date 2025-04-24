/**
 * Card Service - Xử lý các chức năng liên quan đến lá bài Tarot
 */
const Card = require('../models/cardModel');
const ApiError = require('../utils/apiError');

/**
 * Trộn một mảng (thuật toán Fisher-Yates)
 * @param {Array} array Mảng cần trộn
 * @returns {Array} Mảng đã được trộn ngẫu nhiên
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Lấy tất cả lá bài từ bộ bài được chỉ định
 * @param {String} deckName Tên bộ bài
 * @returns {Promise<Array>} Danh sách các lá bài
 */
exports.getCardsByDeck = async (deckName) => {
  try {
    // Use case-insensitive regex
    const cards = await Card.find({ deck: { $regex: new RegExp(`^${deckName}$`, 'i') } });
    
    if (cards.length === 0) {
      throw new ApiError(`Không tìm thấy lá bài nào thuộc bộ ${deckName}`, 404);
    }
    
    return cards;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi lấy lá bài theo bộ: ${error.message}`, 500);
  }
};

/**
 * Lấy các lá bài theo loại (Major Arcana, Minor Arcana, Suit)
 * @param {String} cardType Loại bài cần lấy
 * @returns {Promise<Array>} Danh sách các lá bài
 */
exports.getCardsByType = async (cardType) => {
  try {
    const query = {};
    const typeLower = cardType.toLowerCase();

    // Xác định query dựa trên loại bài
    if (typeLower === 'major arcana' || typeLower === 'minor arcana') {
      query.type = { $regex: new RegExp(`^${cardType}$`, 'i') };
    } else {
      // Giả định các loại khác là suit (Wands, Cups, Swords, Pentacles)
      // Cần chuẩn hóa tên suit nếu cần (ví dụ: 'Gậy' thay vì 'Wands')
      // Tạm thời dùng regex không phân biệt hoa thường
      query.suit = { $regex: new RegExp(`^${cardType}$`, 'i') };
      query.type = 'Minor Arcana'; // Chỉ tìm trong Minor Arcana nếu là suit
    }

    const cards = await Card.find(query);

    if (cards.length === 0) {
      throw new ApiError(`Không tìm thấy lá bài nào thuộc loại/suit "${cardType}"`, 404);
    }

    return cards;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi lấy lá bài theo loại: ${error.message}`, 500);
  }
};


/**
 * Xáo trộn các lá bài
 * @param {Array} cards Mảng các lá bài
 * @returns {Array} Mảng lá bài đã được xáo trộn
 */
exports.shuffleCards = (cards) => {
  return shuffleArray(cards);
};

/**
 * Rút ngẫu nhiên một số lượng lá bài từ bộ bài
 * @param {String} deckName Tên bộ bài
 * @param {Number} count Số lượng lá cần rút
 * @param {Boolean} allowReversed Cho phép lá bài ngược
 * @returns {Promise<Array>} Mảng các đối tượng lá bài đã rút (bao gồm cả thông tin lá bài và trạng thái xuôi/ngược)
 */
exports.drawCards = async (deckName, count, allowReversed = true) => {
  try {
    const cards = await this.getCardsByDeck(deckName);
    
    if (cards.length < count) {
      throw new ApiError(`Bộ bài ${deckName} không đủ lá để rút (yêu cầu ${count} lá)`, 400);
    }
    
    // Xáo trộn bài
    const shuffledCards = this.shuffleCards(cards);
    
    // Rút ngẫu nhiên số lá bài cần thiết
    const drawnCards = shuffledCards.slice(0, count);
    
    // Xác định ngẫu nhiên lá bài xuôi hay ngược và trả về đối tượng đầy đủ
    return drawnCards.map(card => ({
      card: card.toObject(), // Trả về object đầy đủ của lá bài
      isReversed: allowReversed ? Math.random() < 0.5 : false
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi rút bài: ${error.message}`, 500);
  }
};

/**
 * Lấy các lá bài ngẫu nhiên
 * @param {Number} count Số lượng lá cần lấy
 * @param {String} deckName Tên bộ bài
 * @param {Boolean} allowReversed Cho phép lá bài ngược
 * @returns {Promise<Array>} Các lá bài ngẫu nhiên
 */
exports.getRandomCards = async (count, deckName = 'Rider Waite Smith', allowReversed = true) => {
  try {
    // drawCards giờ đã trả về thông tin chi tiết
    const drawnCardsWithDetails = await this.drawCards(deckName, count, allowReversed);
    return drawnCardsWithDetails;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi lấy lá bài ngẫu nhiên: ${error.message}`, 500);
  }
};

/**
 * Rút các lá bài cho một kiểu trải bài cụ thể
 * @param {String} spreadName Tên kiểu trải bài
 * @param {String} deckName Tên bộ bài
 * @param {Boolean} allowReversed Cho phép lá bài ngược
 * @returns {Promise<Array>} Các lá bài đã rút với vị trí tương ứng
 */
exports.drawCardsForSpread = async (spreadName, deckName = 'Rider Waite Smith', allowReversed = true) => {
  try {
    // Xác định số lượng lá bài cần rút dựa trên kiểu trải bài
    let cardCount;
    
    switch (spreadName) {
      case 'Celtic Cross':
        cardCount = 10;
        break;
      case 'Ba Lá Bài':
        cardCount = 3;
        break;
      case 'Năm Lá Bài':
        cardCount = 5;
        break;
      default:
        throw new ApiError(`Không hỗ trợ kiểu trải bài "${spreadName}"`, 400);
    }
    
    // Rút các lá bài
    const drawnCards = await this.drawCards(deckName, cardCount, allowReversed);
    
    // Gán vị trí cho từng lá bài (drawnCards giờ chứa { card: object, isReversed: boolean })
    return drawnCards.map((drawnCard, index) => ({
      cardId: drawnCard.card._id, // Lấy ID từ object card
      isReversed: drawnCard.isReversed,
      position: index + 1
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi rút bài cho trải bài: ${error.message}`, 500);
  }
};

// --- Admin CRUD Operations ---

/**
 * Tạo một lá bài mới (Admin)
 * @param {Object} cardData Dữ liệu lá bài từ request body
 * @returns {Promise<Object>} Lá bài mới được tạo
 */
exports.createCard = async (cardData) => {
  try {
    // Kiểm tra xem tên lá bài đã tồn tại chưa (unique)
    const existingCard = await Card.findOne({ name: cardData.name });
    if (existingCard) {
      throw new ApiError(`Lá bài với tên "${cardData.name}" đã tồn tại`, 400);
    }
    
    // Tạo lá bài mới
    const newCard = await Card.create(cardData);
    return newCard;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle Mongoose validation errors specifically if needed
    if (error.name === 'ValidationError') {
        throw new ApiError(`Lỗi validation khi tạo lá bài: ${error.message}`, 400);
    }
    throw new ApiError(`Lỗi khi tạo lá bài: ${error.message}`, 500);
  }
};

/**
 * Cập nhật một lá bài (Admin)
 * @param {String} cardId ID của lá bài cần cập nhật
 * @param {Object} updateData Dữ liệu cập nhật từ request body
 * @returns {Promise<Object>} Lá bài đã được cập nhật
 */
exports.updateCard = async (cardId, updateData) => {
  try {
    const card = await Card.findByIdAndUpdate(cardId, updateData, {
      new: true, // Trả về document sau khi cập nhật
      runValidators: true // Chạy validators của Mongoose khi cập nhật
    });

    if (!card) {
      throw new ApiError(`Không tìm thấy lá bài với ID: ${cardId}`, 404);
    }
    
    return card;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'ValidationError') {
        throw new ApiError(`Lỗi validation khi cập nhật lá bài: ${error.message}`, 400);
    }
    // Handle potential duplicate key error if name is updated to an existing one
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
        throw new ApiError(`Tên lá bài "${updateData.name}" đã tồn tại`, 400);
    }
    throw new ApiError(`Lỗi khi cập nhật lá bài: ${error.message}`, 500);
  }
};

/**
 * Xóa một lá bài (Admin)
 * @param {String} cardId ID của lá bài cần xóa
 * @returns {Promise<void>}
 */
exports.deleteCard = async (cardId) => {
  try {
    const card = await Card.findByIdAndDelete(cardId);

    if (!card) {
      throw new ApiError(`Không tìm thấy lá bài với ID: ${cardId}`, 404);
    }
    // Không cần trả về gì khi xóa thành công
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi xóa lá bài: ${error.message}`, 500);
  }
};
