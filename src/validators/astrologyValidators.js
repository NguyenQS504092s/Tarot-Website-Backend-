const { param, query, body, validationResult } = require('express-validator'); // Added body here
const ApiError = require('../utils/apiError');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value,
        }));
        return next(new ApiError(400, 'Validation failed', formattedErrors));
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

// Validation rules for creating horoscope (Admin)
const createHoroscopeValidator = [
    body('sign').trim().notEmpty().withMessage('Zodiac sign is required.').isString(),
    body('date').notEmpty().withMessage('Date is required.').isISO8601().withMessage('Invalid date format (YYYY-MM-DD).'),
    body('content').trim().notEmpty().withMessage('Horoscope content is required.'),
    body('timeframe').trim().notEmpty().withMessage('Timeframe is required.').isIn(['daily', 'weekly', 'monthly']),
    handleValidationErrors
];

// Validation rules for updating horoscope (Admin)
const updateHoroscopeValidator = [
    param('id').notEmpty().withMessage('Horoscope ID is required.').isMongoId().withMessage('Invalid Horoscope ID format.'),
    body('sign').optional().trim().isString(),
    body('date').optional().isISO8601().withMessage('Invalid date format (YYYY-MM-DD).'),
    body('content').optional().trim().notEmpty().withMessage('Horoscope content cannot be empty.'),
    body('timeframe').optional().trim().isIn(['daily', 'weekly', 'monthly']),
    handleValidationErrors
];

// Validation rules for creating zodiac sign (Admin)
const createZodiacSignValidator = [
    body('name').trim().notEmpty().withMessage('Zodiac sign name is required.'),
    body('slug').trim().notEmpty().withMessage('Slug is required.'), // Consider adding isSlug() if available or regex
    body('startDate').notEmpty().withMessage('Start date is required.').matches(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).withMessage('Invalid start date format (MM-DD).'),
    body('endDate').notEmpty().withMessage('End date is required.').matches(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).withMessage('Invalid end date format (MM-DD).'),
    body('element').optional().trim().isString(),
    body('modality').optional().trim().isString(),
    body('rulingPlanet').optional().trim().isString(),
    body('symbol').optional().trim().isString(),
    body('description').optional().trim().isString(),
    handleValidationErrors
];

// Validation rules for updating zodiac sign (Admin)
const updateZodiacSignValidator = [
    param('id').notEmpty().withMessage('Zodiac Sign ID is required.').isMongoId().withMessage('Invalid Zodiac Sign ID format.'),
    body('name').optional().trim().notEmpty().withMessage('Zodiac sign name cannot be empty.'),
    body('slug').optional().trim().notEmpty().withMessage('Slug cannot be empty.'),
    body('startDate').optional().matches(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).withMessage('Invalid start date format (MM-DD).'),
    body('endDate').optional().matches(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).withMessage('Invalid end date format (MM-DD).'),
    body('element').optional().trim().isString(),
    body('modality').optional().trim().isString(),
    body('rulingPlanet').optional().trim().isString(),
    body('symbol').optional().trim().isString(),
    body('description').optional().trim().isString(),
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
