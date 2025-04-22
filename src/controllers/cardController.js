const Card = require('../models/cardModel');
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
    
    const cards = await Card.find(filter);
    
    res.status(200).json(ApiResponse.success(
      cards, 
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
    const card = await Card.findById(req.params.id);
    
    if (!card) {
      return next(new ApiError('Không tìm thấy lá bài', 404));
    }
    
    res.status(200).json(ApiResponse.success(
      card,
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
    // Use case-insensitive regex
    const cards = await Card.find({ deck: { $regex: new RegExp(`^${deckName}$`, 'i') } });
    
    res.status(200).json(ApiResponse.success(
      cards,
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
    // Use case-insensitive regex
    const cards = await Card.find({ type: { $regex: new RegExp(`^${cardType}$`, 'i') } });
    
    res.status(200).json(ApiResponse.success(
      cards,
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
    const newCard = await Card.create(req.body);
    
    res.status(201).json(ApiResponse.success(
      newCard,
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
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!card) {
      return next(new ApiError('Không tìm thấy lá bài', 404));
    }
    
    res.status(200).json(ApiResponse.success(
      card,
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
    const card = await Card.findByIdAndDelete(req.params.id);
    
    if (!card) {
      return next(new ApiError('Không tìm thấy lá bài', 404));
    }
    
    res.status(200).json(ApiResponse.success(
      null,
      'Lá bài đã được xóa'
    ));
  } catch (error) {
    next(error);
  }
};
