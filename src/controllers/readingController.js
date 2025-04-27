const Reading = require('../models/readingModel');
const Card = require('../models/cardModel');
const mongoose = require('mongoose');

/**
 * @desc    Tạo phiên đọc bài mới
 * @route   POST /api/readings
 * @access  Private
 */
exports.createReading = async (req, res, next) => {
  try {
    const { spread, question, cards } = req.body;
    
    if (!spread || !cards || !Array.isArray(cards)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin cần thiết'
      });
    }

    // Kiểm tra xem tất cả các lá bài có tồn tại không
    for (const card of cards) {
      const cardExists = await Card.findById(card.cardId);
      if (!cardExists) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy lá bài với ID ${card.cardId}`
        });
      }
    }

    // Tạo phiên đọc bài mới
    const newReading = await Reading.create({
      userId: req.user._id,
      spread,
      question,
      cards,
    });

    // Populate thông tin chi tiết của lá bài
    const populatedReading = await Reading.findById(newReading._id);

    res.status(201).json({
      success: true,
      data: populatedReading
    });
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
    const readings = await Reading.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên đọc bài'
      });
    }
    
    // Kiểm tra quyền truy cập (chỉ cho phép chủ sở hữu, reader đã được gán hoặc admin)
    const isOwner = reading.userId.toString() === req.user._id.toString();
    const isReader = reading.readerId && reading.readerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isReader && !isAdmin && !reading.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem phiên đọc bài này'
      });
    }
    
    res.status(200).json({
      success: true,
      data: reading
    });
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
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đánh giá từ 1 đến 5 sao'
      });
    }
    
    const reading = await Reading.findById(req.params.id);
    
    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên đọc bài'
      });
    }
    
    // Chỉ cho phép chủ sở hữu thêm phản hồi
    if (reading.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thêm phản hồi cho phiên đọc bài này'
      });
    }
    
    reading.feedback = { rating, comment };
    await reading.save();
    
    res.status(200).json({
      success: true,
      data: reading
    });
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
    const pendingReadings = await Reading.find({
      interpretation: { $exists: false }
    }).sort({ createdAt: 1 });
    
    res.status(200).json({
      success: true,
      count: pendingReadings.length,
      data: pendingReadings
    });
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
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung diễn giải'
      });
    }
    
    const reading = await Reading.findById(req.params.id);
    
    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên đọc bài'
      });
    }
    
    reading.interpretation = interpretation;
    reading.readerId = req.user._id;
    await reading.save();
    
    res.status(200).json({
      success: true,
      data: reading
    });
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
    
    res.status(200).json({
      success: true,
      total: totalReadings,
      count: readings.length,
      pages: Math.ceil(totalReadings / limit),
      data: readings
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên đọc bài'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Phiên đọc bài đã được xóa'
    });
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
    
    res.status(200).json({
      success: true,
      count: spreads.length,
      data: spreads
    });
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
    res.status(501).json({
      success: false,
      message: 'Chức năng này chưa được triển khai'
    });
  } catch (error) {
    next(error);
  }
};