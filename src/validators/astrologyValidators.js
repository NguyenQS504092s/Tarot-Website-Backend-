const { param, query, body, validationResult } = require('express-validator'); // Added body here
const ApiError = require('../utils/apiError');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            field: err.param,
            message: err.msg,
        }));
        // Trả về lỗi với cấu trúc chứa 'errors' property
        return res.status(400).json({
            success: false,
            status: 'fail',
            message: 'Validation failed',
            errors: formattedErrors // Trả về mảng lỗi chi tiết
        });
    }
    next();
};

// Validation rules for getting horoscope by sign
const getHoroscopeBySignValidator = [
    param('sign')
        .trim()
        .notEmpty().withMessage('Zodiac sign is required.')
        .isString().withMessage('Zodiac sign must be a string.')
        // Optional: Add specific check for valid zodiac signs if needed
        // .isIn(['aries', 'taurus', ...]).withMessage('Invalid zodiac sign.')
        ,
    query('timeframe') // Validate query parameter 'timeframe'
        .optional()
        .trim()
        .isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid timeframe. Must be daily, weekly, or monthly.'),
    handleValidationErrors
];

// Validation rules for getting zodiac compatibility
const getZodiacCompatibilityValidator = [
    param('sign1').trim().notEmpty().withMessage('First zodiac sign is required.').isString(),
    param('sign2').trim().notEmpty().withMessage('Second zodiac sign is required.').isString(),
    // Optional: Add specific sign checks
    handleValidationErrors
];

// Validation rules for getting tarot-zodiac relation
const getTarotZodiacRelationValidator = [
    param('sign').trim().notEmpty().withMessage('Zodiac sign is required.').isString(),
    // Optional: Add specific sign checks
    handleValidationErrors
];


// Validation rules for getting zodiac info by sign
const getZodiacInfoBySignValidator = [
    param('sign')
        .trim()
        .notEmpty().withMessage('Zodiac sign is required.')
        .isString().withMessage('Zodiac sign must be a string.')
        // Optional: Add specific check for valid zodiac signs
        ,
    handleValidationErrors
];

// Validation rules for creating horoscope (Admin) - Sửa cho khớp model
const createHoroscopeValidator = [
    body('sign').trim().notEmpty().withMessage('Cung hoàng đạo là bắt buộc').isString(),
    body('date').notEmpty().withMessage('Ngày là bắt buộc').isISO8601().withMessage('Định dạng ngày không hợp lệ (YYYY-MM-DD).'),
    body('general').trim().notEmpty().withMessage('Nội dung tử vi chung là bắt buộc'),
    body('love').trim().notEmpty().withMessage('Nội dung tử vi tình yêu là bắt buộc'),
    body('career').trim().notEmpty().withMessage('Nội dung tử vi sự nghiệp là bắt buộc'),
    body('health').trim().notEmpty().withMessage('Nội dung tử vi sức khỏe là bắt buộc'),
    // Các trường optional khác có thể thêm validation nếu cần (lucky_number, lucky_color, etc.)
    handleValidationErrors
];

// Validation rules for updating horoscope (Admin) - Sửa cho khớp model
const updateHoroscopeValidator = [
    param('id').notEmpty().withMessage('Horoscope ID is required.').isMongoId().withMessage('Invalid Horoscope ID format.'),
    body('sign').optional().trim().isString(),
    body('date').optional().isISO8601().withMessage('Invalid date format (YYYY-MM-DD).'),
    body('general').optional().trim().notEmpty().withMessage('Nội dung tử vi chung không được rỗng'),
    body('love').optional().trim().notEmpty().withMessage('Nội dung tử vi tình yêu không được rỗng'),
    body('career').optional().trim().notEmpty().withMessage('Nội dung tử vi sự nghiệp không được rỗng'),
    body('health').optional().trim().notEmpty().withMessage('Nội dung tử vi sức khỏe không được rỗng'),
    // Các trường optional khác
    handleValidationErrors
];

// Validation rules for creating zodiac sign (Admin) - Sửa cho khớp model
const createZodiacSignValidator = [
    body('name').trim().notEmpty().withMessage('Tên cung hoàng đạo là bắt buộc').isString(),
    body('nameEn').trim().notEmpty().withMessage('Tên tiếng Anh là bắt buộc').isString(),
    body('symbol').trim().notEmpty().withMessage('Ký hiệu là bắt buộc').isString(),
    body('element').trim().notEmpty().withMessage('Nguyên tố là bắt buộc').isIn(['Lửa', 'Đất', 'Khí', 'Nước']),
    body('period').trim().notEmpty().withMessage('Thời gian là bắt buộc').isString(), // Có thể thêm regex nếu cần format cụ thể
    body('ruling_planet').trim().notEmpty().withMessage('Hành tinh chủ quản là bắt buộc').isString(),
    body('description').trim().notEmpty().withMessage('Mô tả là bắt buộc').isString(),
    // Các trường optional như strengths, weaknesses, compatibility, tarotRelations không cần validate ở đây
    handleValidationErrors
];

// Validation rules for updating zodiac sign (Admin) - Sửa cho khớp model
const updateZodiacSignValidator = [
    param('id').notEmpty().withMessage('Zodiac Sign ID is required.').isMongoId().withMessage('Invalid Zodiac Sign ID format.'),
    body('name').optional().trim().notEmpty().withMessage('Tên cung hoàng đạo không được rỗng').isString(),
    body('nameEn').optional().trim().notEmpty().withMessage('Tên tiếng Anh không được rỗng').isString(),
    body('symbol').optional().trim().notEmpty().withMessage('Ký hiệu không được rỗng').isString(),
    body('element').optional().trim().notEmpty().withMessage('Nguyên tố không được rỗng').isIn(['Lửa', 'Đất', 'Khí', 'Nước']),
    body('period').optional().trim().notEmpty().withMessage('Thời gian không được rỗng').isString(),
    body('ruling_planet').optional().trim().notEmpty().withMessage('Hành tinh chủ quản không được rỗng').isString(),
    body('description').optional().trim().notEmpty().withMessage('Mô tả không được rỗng').isString(),
    // Các trường optional khác
    handleValidationErrors
];

// Validation rules for adding tarot relation (Admin)
const addTarotRelationValidator = [
    param('id').notEmpty().withMessage('Zodiac Sign ID is required.').isMongoId().withMessage('Invalid Zodiac Sign ID format.'),
    body('cardId').notEmpty().withMessage('Tarot Card ID is required.').isMongoId().withMessage('Invalid Tarot Card ID format.'),
    body('relationType').optional().trim().isString(), // e.g., 'Ruling Card', 'Challenge Card'
    handleValidationErrors
];

// Validation rules for removing tarot relation (Admin)
const removeTarotRelationValidator = [
    param('id').notEmpty().withMessage('Zodiac Sign ID is required.').isMongoId().withMessage('Invalid Zodiac Sign ID format.'),
    param('relationId').notEmpty().withMessage('Relation ID is required.').isMongoId().withMessage('Invalid Relation ID format.'), // Assuming relation is stored with its own ID
    handleValidationErrors
];


module.exports = {
    getHoroscopeBySignValidator,
    getZodiacInfoBySignValidator,
    getZodiacCompatibilityValidator,
    getTarotZodiacRelationValidator,
    createHoroscopeValidator,
    updateHoroscopeValidator,
    createZodiacSignValidator,
    updateZodiacSignValidator,
    addTarotRelationValidator,
    removeTarotRelationValidator,
};
