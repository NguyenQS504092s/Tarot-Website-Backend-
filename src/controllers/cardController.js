const Card = require('../models/cardModel');

/**
 * @desc    Lấy danh sách tất cả các lá bài
 * @route   GET /api/cards
 * @access  Public
 */
exports.getAllCards = async (req, res, next) => {
  try {
    const { deck, type, suit } = req.query;
    const filter = {};
    
    // Áp dụng các bộ lọc từ query parameters
    if (deck) filter.deck = deck;
    if (type) filter.type = type;
    if (suit) filter.suit = suit;
    
    const cards = await Card.find(filter);
    
    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lá bài'
      });
    }
    
    res.status(200).json({
      success: true,
      data: card
    });
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
    const cards = await Card.find({ deck: deckName });
    
    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards
    });
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
    const cards = await Card.find({ type: cardType });
    
    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards
    });
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
    
    res.status(201).json({
      success: true,
      data: newCard
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Lá bài với tên này đã tồn tại'
      });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lá bài'
      });
    }
    
    res.status(200).json({
      success: true,
      data: card
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lá bài'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Lá bài đã được xóa'
    });
  } catch (error) {
    next(error);
  }
};