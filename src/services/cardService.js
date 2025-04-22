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
    const cards = await Card.find({ deck: deckName });
    
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
 * @returns {Promise<Array>} Các lá bài đã rút
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
    
    // Xác định ngẫu nhiên lá bài xuôi hay ngược
    return drawnCards.map(card => ({
      cardId: card._id,
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
    const drawnCards = await this.drawCards(deckName, count, allowReversed);
    
    // Thêm thông tin chi tiết của lá bài
    const cardsWithDetails = await Promise.all(
      drawnCards.map(async (card) => {
        const cardDetails = await Card.findById(card.cardId);
        return {
          ...card,
          details: cardDetails
        };
      })
    );
    
    return cardsWithDetails;
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
    
    // Gán vị trí cho từng lá bài
    return drawnCards.map((card, index) => ({
      ...card,
      position: index + 1
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi rút bài cho trải bài: ${error.message}`, 500);
  }
};