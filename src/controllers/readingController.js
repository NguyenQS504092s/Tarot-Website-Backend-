const Reading = require('../models/readingModel');
const Card = require('../models/cardModel');
const mongoose = require('mongoose');
const readingService = require('../services/readingService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * @desc    Tạo phiên đọc bài mới
 * @route   POST /api/readings
 * @access  Private
 */
exports.createReading = async (req, res, next) => {
  try {
    const { spread, question, cards } = req.body;
    
    if (!spread || !cards || !Array.isArray(cards)) {
      return next(new ApiError('Vui lòng cung cấp đầy đủ thông tin cần thiết', 400));
    }

    // Kiểm tra xem tất cả các lá bài có tồn tại không
    for (const card of cards) {
      const cardExists = await Card.findById(card.cardId);
      if (!cardExists) {
        return next(new ApiError(`Không tìm thấy lá bài với ID ${card.cardId}`, 404));
      }
    }

    // Tạo phiên đọc bài mới
    const newReading = await Reading.create({
      userId: req.user._id,
      spread,
      question,
      userId: req.user._id,
      spread,
      question,
      cards,
    });

    // Populate thông tin chi tiết của lá bài trực tiếp
    await newReading.populate({
      path: 'cards.cardId',
      select: 'name imageUrl uprightMeaning reversedMeaning'
    });
    await newReading.populate({
      path: 'userId',
      select: 'name email'
    });


    res.status(201).json(ApiResponse.success(newReading, 'Tạo phiên đọc bài thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo phiên đọc bài ngẫu nhiên
 * @route   POST /api/readings/random
 * @access  Private
 */
exports.createRandomReading = async (req, res, next) => {
  try {
    const { spread, question, deck, allowReversed } = req.body;
    
    if (!spread) {
      return next(new ApiError('Vui lòng cung cấp kiểu trải bài', 400));
    }
    
    // Sử dụng service để tạo phiên đọc bài ngẫu nhiên
    const reading = await readingService.createRandomReading(
      req.user._id,
      spread,
      question || '',
      deck || 'Rider Waite Smith',
      allowReversed !== false
    );
    
    res.status(201).json(ApiResponse.success(reading, 'Tạo phiên đọc bài thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy lịch sử đọc bài của người dùng
 * @route   GET /api/readings/history
 * @access  Private
 */
exports.getUserReadingHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Sử dụng service để lấy lịch sử đọc bài
    const result = await readingService.getUserReadingHistory(
      req.user._id,
      page,
      limit
    );
    
    res.status(200).json(ApiResponse.pagination(
      result.readings,
      parseInt(page),
      parseInt(limit),
      result.pagination.total,
      'Lấy lịch sử đọc bài thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin chi tiết một phiên đọc bài
 * @route   GET /api/readings/:id
 * @access  Private
 */
exports.getReadingById = async (req, res, next) => {
  try {
    const reading = await Reading.findById(req.params.id);
    
    if (!reading) {
      return next(new ApiError('Không tìm thấy phiên đọc bài', 404));
    }
    
    // Kiểm tra quyền truy cập (chỉ cho phép chủ sở hữu, reader đã được gán hoặc admin)
    const isOwner = reading.userId.toString() === req.user._id.toString();
    const isReader = reading.readerId && reading.readerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isReader && !isAdmin && !reading.isPublic) {
      return next(new ApiError('Bạn không có quyền xem phiên đọc bài này', 403));
    }
    
    res.status(200).json(ApiResponse.success(reading, 'Lấy thông tin phiên đọc bài thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo diễn giải tự động cho phiên đọc bài
 * @route   GET /api/readings/:id/auto-interpretation
 * @access  Private
 */
exports.getAutoInterpretation = async (req, res, next) => {
  try {
    const readingId = req.params.id;
    const reading = await Reading.findById(readingId);
    
    if (!reading) {
      return next(new ApiError('Không tìm thấy phiên đọc bài', 404));
    }
    
    // Kiểm tra quyền truy cập
    const isOwner = reading.userId.toString() === req.user._id.toString();
    const isReader = reading.readerId && reading.readerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isReader && !isAdmin && !reading.isPublic) {
      return next(new ApiError('Bạn không có quyền xem phiên đọc bài này', 403));
    }
    
    // Tạo diễn giải tự động
    const interpretation = await readingService.generateAutomaticInterpretation(readingId);
    
    res.status(200).json(ApiResponse.success(
      { interpretation },
      'Tạo diễn giải tự động thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Thêm phản hồi cho phiên đọc bài
 * @route   PUT /api/readings/:id/feedback
 * @access  Private
 */
exports.addFeedbackToReading = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return next(new ApiError('Vui lòng cung cấp đánh giá từ 1 đến 5 sao', 400));
    }
    
    const reading = await Reading.findById(req.params.id);
    
    if (!reading) {
      return next(new ApiError('Không tìm thấy phiên đọc bài', 404));
    }
    
    // Chỉ cho phép chủ sở hữu thêm phản hồi
    if (reading.userId.toString() !== req.user._id.toString()) {
      return next(new ApiError('Bạn không có quyền thêm phản hồi cho phiên đọc bài này', 403));
    }
    
    reading.feedback = { rating, comment };
    await reading.save();
    
    res.status(200).json(ApiResponse.success(reading, 'Thêm phản hồi thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách các phiên đọc bài đang chờ diễn giải
 * @route   GET /api/readings/reader/pending
 * @access  Reader, Admin
 */
exports.getPendingReadings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Sử dụng service để lấy danh sách phiên đọc bài chờ diễn giải
    const result = await readingService.getPendingReadings(page, limit);
    
    res.status(200).json(ApiResponse.pagination(
      result.readings,
      parseInt(page),
      parseInt(limit),
      result.pagination.total,
      'Lấy danh sách phiên đọc bài chờ diễn giải thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Thêm diễn giải cho phiên đọc bài
 * @route   PUT /api/readings/reader/:id/interpret
 * @access  Reader, Admin
 */
exports.addInterpretation = async (req, res, next) => {
  try {
    const { interpretation } = req.body;
    
    if (!interpretation) {
      return next(new ApiError('Vui lòng cung cấp nội dung diễn giải', 400));
    }
    
    const reading = await Reading.findById(req.params.id);
    
    if (!reading) {
      return next(new ApiError('Không tìm thấy phiên đọc bài', 404));
    }
    
    reading.interpretation = interpretation;
    reading.readerId = req.user._id;
    await reading.save();
    
    res.status(200).json(ApiResponse.success(reading, 'Thêm diễn giải thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy tất cả phiên đọc bài (cho admin)
 * @route   GET /api/readings/admin/all
 * @access  Admin
 */
exports.getAllReadings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const totalReadings = await Reading.countDocuments();
    const readings = await Reading.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    res.status(200).json(ApiResponse.pagination(
      readings,
      parseInt(page),
      parseInt(limit),
      totalReadings,
      'Lấy danh sách phiên đọc bài thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa phiên đọc bài (cho admin)
 * @route   DELETE /api/readings/admin/:id
 * @access  Admin
 */
exports.deleteReading = async (req, res, next) => {
  try {
    const reading = await Reading.findByIdAndDelete(req.params.id);
    
    if (!reading) {
      return next(new ApiError('Không tìm thấy phiên đọc bài', 404));
    }
    
    res.status(200).json(ApiResponse.success(
      null, 
      'Phiên đọc bài đã được xóa'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách các cách trải bài
 * @route   GET /api/readings/spreads
 * @access  Public
 */
exports.getAllSpreads = async (req, res, next) => {
  try {
    // Trong một API thực tế, các cách trải bài sẽ được lưu trong database
    // Nhưng ở đây chúng ta sẽ trả về danh sách cứng
    const spreads = [
      {
        name: "Celtic Cross",
        description: "Một cách trải bài phổ biến cho các câu hỏi phức tạp, bao gồm 10 lá bài",
        positions: 10
      },
      {
        name: "Ba Lá Bài",
        description: "Cách trải bài đơn giản với 3 lá: quá khứ, hiện tại và tương lai",
        positions: 3
      },
      {
        name: "Năm Lá Bài",
        description: "Cách trải bài toàn diện cho tình hình hiện tại và các hướng phát triển",
        positions: 5
      }
    ];
    
    res.status(200).json(ApiResponse.success(
      spreads,
      'Lấy danh sách cách trải bài thành công'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo cách trải bài mới
 * @route   POST /api/readings/spreads
 * @access  Admin
 */
exports.createSpread = async (req, res, next) => {
  try {
    // Giả định: trong triển khai thực tế sẽ có model Spread riêng
    return next(new ApiError('Chức năng này chưa được triển khai', 501));
  } catch (error) {
    next(error);
  }
};
