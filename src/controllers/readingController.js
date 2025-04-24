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
    // Lấy thông tin từ body và user đã xác thực
    const { spreadType, question, deckName, allowReversed } = req.body;
    const userId = req.user._id;

    // Gọi service để tạo reading ngẫu nhiên
    // spreadType được validate bởi createReadingValidator
    const newReading = await readingService.createReading(
      userId,
      spreadType,
      question, // question là optional trong validator và service
      deckName, // service có giá trị mặc định
      allowReversed // service có giá trị mặc định
    );

    // Service đã populate thông tin cần thiết

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
    const readingId = req.params.id;
    const userId = req.user._id; // Lấy ID của user từ user đã xác thực

    // Gọi service để thêm feedback
    // Validation cho rating và comment đã được thực hiện bởi addFeedbackValidator
    const updatedReading = await readingService.addFeedback(
      readingId,
      userId,
      rating,
      comment
    );

    // Service đã xử lý lỗi không tìm thấy hoặc không có quyền

    res.status(200).json(ApiResponse.success(updatedReading, 'Thêm phản hồi thành công'));
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
    const readingId = req.params.id;
    const readerId = req.user._id; // Lấy ID của reader từ user đã xác thực

    // Gọi service để thêm diễn giải
    const updatedReading = await readingService.addInterpretation(
      readingId,
      readerId,
      interpretation
    );

    // Service đã xử lý lỗi không tìm thấy hoặc đã có diễn giải

    res.status(200).json(ApiResponse.success(updatedCard, 'Thêm diễn giải thành công')); // Sửa biến trả về
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
    
    // Gọi service để lấy tất cả readings
    const result = await readingService.getAllReadings(page, limit);
    
    res.status(200).json(ApiResponse.pagination(
      result.readings,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      'Lấy danh sách tất cả phiên đọc bài thành công'
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
    const readingId = req.params.id; // ID đã được validate bởi getReadingByIdValidator
    
    // Gọi service để xóa reading
    const result = await readingService.deleteReading(readingId);
    
    // Service đã xử lý lỗi không tìm thấy
    
    res.status(200).json(ApiResponse.success(
      result, // Trả về thông báo từ service
      'Phiên đọc bài đã được xóa thành công'
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
    // Lấy danh sách các kiểu trải bài được hỗ trợ từ một nguồn đáng tin cậy
    // (Hiện tại là từ logic trong readingService, sau này có thể từ DB)
    const supportedSpreads = [
      {
        name: "Celtic Cross",
        description: "Một cách trải bài phổ biến cho các câu hỏi phức tạp.",
        cardCount: 10 // Số lượng lá bài
      },
      {
        name: "Ba Lá Bài",
        description: "Cách trải bài đơn giản: quá khứ, hiện tại, tương lai.",
        cardCount: 3
      },
      {
        name: "Năm Lá Bài",
        description: "Cách trải bài cho tình hình hiện tại và các hướng phát triển.",
        cardCount: 5
      }
      // Thêm các kiểu trải bài khác nếu có
    ];
    
    res.status(200).json(ApiResponse.success(
      supportedSpreads,
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

/**
 * @desc    Cập nhật phiên đọc bài (cho admin)
 * @route   PUT /api/readings/admin/:id
 * @access  Admin
 */
exports.updateReading = async (req, res, next) => {
  try {
    const readingId = req.params.id; // ID đã được validate bởi getReadingByIdValidator
    const updateData = req.body; // Dữ liệu cần cập nhật

    // TODO: Thêm validation cho updateData (updateReadingValidator)

    // Gọi service để cập nhật reading
    const updatedReading = await readingService.updateReading(readingId, updateData);

    // Service sẽ xử lý lỗi không tìm thấy

    res.status(200).json(ApiResponse.success(
      updatedReading,
      'Phiên đọc bài đã được cập nhật thành công'
    ));
  } catch (error) {
    next(error);
  }
};
