// const Card = require('../models/cardModel'); // Model interaction moved to service
const cardService = require('../services/cardService'); // Import the service
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * @desc    Lấy danh sách tất cả các lá bài
 * @route   GET /api/cards
 * @access  Public
 */
exports.getAllCards = async (req, res, next) => {
  try {
    const { deck, type, suit } = req.query;
    const filter = {};
    
    // Áp dụng các bộ lọc từ query parameters (case-insensitive)
    if (deck) filter.deck = { $regex: new RegExp(`^${deck}$`, 'i') };
    if (type) filter.type = { $regex: new RegExp(`^${type}$`, 'i') };
    if (suit) filter.suit = { $regex: new RegExp(`^${suit}$`, 'i') };

    // Call service function
    const cards = await cardService.getAllCards(filter);

    res.status(200).json(ApiResponse.success(
      { cards }, // Wrap in object with 'cards' key
      'Lấy danh sách lá bài thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin một lá bài theo ID
 * @route   GET /api/cards/:id
 * @access  Public
 */
exports.getCard = async (req, res, next) => {
  try {
    // Call service function
    const card = await cardService.getCardById(req.params.id);

    // Service should handle not found error, but controller can double check
    if (!card) {
      return next(new ApiError('Không tìm thấy lá bài', 404)); // Keep this check just in case
    }

    res.status(200).json(ApiResponse.success(
      { card }, // Wrap in object with 'card' key
      'Lấy thông tin lá bài thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy lá bài theo bộ bài
 * @route   GET /api/cards/deck/:deckName
 * @access  Public
 */
exports.getCardsByDeck = async (req, res, next) => {
  try {
    const { deckName } = req.params;
    // Call service function
    const cards = await cardService.getCardsByDeck(deckName);

    res.status(200).json(ApiResponse.success(
      { cards }, // Wrap in object with 'cards' key
      `Lấy danh sách lá bài từ bộ ${deckName} thành công`
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy lá bài theo loại (Major/Minor Arcana)
 * @route   GET /api/cards/type/:cardType
 * @access  Public
 */
exports.getCardsByType = async (req, res, next) => {
  try {
    const { cardType } = req.params;
    // Call the service function
    const cards = await cardService.getCardsByType(cardType);

    // Service handles the 'not found' error, controller returns success with potentially empty array

    res.status(200).json(ApiResponse.success(
      { cards }, // Wrap in object with 'cards' key
      `Lấy danh sách lá bài loại ${cardType} thành công`
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo lá bài mới
 * @route   POST /api/cards
 * @access  Admin
 */
exports.createCard = async (req, res, next) => {
  try {
    // Call the service function
    const newCard = await cardService.createCard(req.body);

    res.status(201).json(ApiResponse.success(
      { card: newCard }, // Wrap in object with 'card' key
      'Tạo lá bài mới thành công',
      201
    ));
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError('Lá bài với tên này đã tồn tại', 400));
    }
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin lá bài
 * @route   PUT /api/cards/:id
 * @access  Admin
 */
exports.updateCard = async (req, res, next) => {
  try {
    // Call the service function
    const updatedCard = await cardService.updateCard(req.params.id, req.body);

    // Service handles the 'not found' error, so no need to check here

    res.status(200).json(ApiResponse.success(
      { card: updatedCard }, // Wrap in object with 'card' key
      'Cập nhật lá bài thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa lá bài
 * @route   DELETE /api/cards/:id
 * @access  Admin
 */
exports.deleteCard = async (req, res, next) => {
  try {
    // Call the service function
    await cardService.deleteCard(req.params.id);
    
    // Service handles the 'not found' error
    
    res.status(200).json(ApiResponse.success(
      null, // No data to return on successful deletion
      'Lá bài đã được xóa'
    ));
  } catch (error) {
    next(error);
  }
};
