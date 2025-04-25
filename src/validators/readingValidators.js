const { body, param, validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose'); // Needed for isMongoId

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value,
        }));
        return res.status(400).json({
            success: false,
            status: 'fail',
            message: 'Dữ liệu không hợp lệ.',
            errors: formattedErrors
        });
    }
    next();
};

// Validation rules for creating a reading
const createReadingValidator = [
    body('question').trim().notEmpty().withMessage('Câu hỏi là bắt buộc.'),
    body('spreadType').trim().notEmpty().withMessage('Kiểu trải bài là bắt buộc.'),
    // Optional: Validate deckName if provided
    body('deckName').optional().trim().isString().withMessage('Tên bộ bài phải là chuỗi.'),
    handleValidationErrors
];

// Validation rules for getting reading by ID
const getReadingByIdValidator = [
    param('id')
        .notEmpty().withMessage('Reading ID is required.')
        .isMongoId().withMessage('Invalid Reading ID format.'),
    handleValidationErrors
];

// Validation rules for adding interpretation (Admin/Reader)
const addInterpretationValidator = [
    body('interpretation').trim().notEmpty().withMessage('Diễn giải là bắt buộc.'),
    handleValidationErrors
];

// Validation rules for adding feedback (User)
const addFeedbackValidator = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Đánh giá phải là số từ 1 đến 5.'),
    body('comment').optional().trim().isString().withMessage('Bình luận phải là chuỗi.'),
    handleValidationErrors
];

// Validation rules for updating a reading (Admin)
const updateReadingValidator = [
    // ID is validated by getReadingByIdValidator applied in the route
    body('question').optional().trim().notEmpty().withMessage('Câu hỏi không được rỗng.'),
    body('spreadType').optional().trim().notEmpty().withMessage('Kiểu trải bài không được rỗng.'),
    // body('status').optional().trim().isIn(['pending', 'interpreted', 'completed']).withMessage('Trạng thái không hợp lệ.'), // Status removed from allowed updates in service
    body('interpretation').optional().trim().isString().withMessage('Diễn giải phải là chuỗi.'),
    body('readerId').optional().isMongoId().withMessage('Reader ID không hợp lệ.'),
    body('isPublic').optional().isBoolean().withMessage('isPublic phải là true hoặc false.'),
    handleValidationErrors
];


module.exports = {
    createReadingValidator,
    getReadingByIdValidator,
    addInterpretationValidator,
    addFeedbackValidator,
    updateReadingValidator,
};
