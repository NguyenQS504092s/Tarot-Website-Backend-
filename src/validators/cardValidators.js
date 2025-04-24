const { body, param, validationResult } = require('express-validator');
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

// Validation rules for getting card by ID
const getCardByIdValidator = [
    param('id')
        .notEmpty().withMessage('Card ID is required.')
        .isMongoId().withMessage('Invalid Card ID format.'),
    handleValidationErrors
];

// Validation rules for getting cards by deck name
const getCardsByDeckValidator = [
    param('deckName')
        .trim()
        .notEmpty().withMessage('Deck name is required.')
        .isString().withMessage('Deck name must be a string.'),
    handleValidationErrors
];

// Validation rules for getting cards by type (e.g., Major, Minor, Suit)
const getCardsByTypeValidator = [
    param('cardType')
        .trim()
        .notEmpty().withMessage('Card type is required.')
        .isString().withMessage('Card type must be a string.'),
        // Consider adding .isIn(['Major', 'Minor', 'Wands', 'Cups', 'Swords', 'Pentacles']) if applicable
    handleValidationErrors
];


// Validation rules for getting card by slug
const getCardBySlugValidator = [
    param('slug')
        .trim()
        .notEmpty().withMessage('Card slug is required.')
        .isString().withMessage('Card slug must be a string.'),
    handleValidationErrors
];

// Validation rules for creating a card (Admin)
const createCardValidator = [
    body('name').trim().notEmpty().withMessage('Card name is required.'),
    body('suit').optional().trim().isString().withMessage('Suit must be a string.'),
    body('arcana').trim().notEmpty().withMessage('Arcana is required.').isIn(['Major', 'Minor']).withMessage('Invalid Arcana type.'),
    body('keywords').isArray({ min: 1 }).withMessage('Keywords must be an array with at least one keyword.'),
    body('keywords.*').trim().notEmpty().withMessage('Keywords cannot be empty strings.'),
    body('meanings').isObject().withMessage('Meanings must be an object.'),
    body('meanings.light').isArray({ min: 1 }).withMessage('Light meanings are required.'),
    body('meanings.light.*').trim().notEmpty().withMessage('Light meanings cannot be empty strings.'),
    body('meanings.shadow').isArray({ min: 1 }).withMessage('Shadow meanings are required.'),
    body('meanings.shadow.*').trim().notEmpty().withMessage('Shadow meanings cannot be empty strings.'),
    body('image_url').optional().trim().isURL().withMessage('Invalid image URL format.'),
    // Add more specific validations as needed
    handleValidationErrors
];

// Validation rules for updating a card (Admin)
const updateCardValidator = [
    param('id')
        .notEmpty().withMessage('Card ID is required.')
        .isMongoId().withMessage('Invalid Card ID format.'),
    body('name').optional().trim().notEmpty().withMessage('Card name cannot be empty.'),
    body('suit').optional().trim().isString().withMessage('Suit must be a string.'),
    body('arcana').optional().trim().isIn(['Major', 'Minor']).withMessage('Invalid Arcana type.'),
    body('keywords').optional().isArray().withMessage('Keywords must be an array.'),
    body('keywords.*').optional().trim().notEmpty().withMessage('Keywords cannot be empty strings.'),
    body('meanings').optional().isObject().withMessage('Meanings must be an object.'),
    body('meanings.light').optional().isArray().withMessage('Light meanings must be an array.'),
    body('meanings.light.*').optional().trim().notEmpty().withMessage('Light meanings cannot be empty strings.'),
    body('meanings.shadow').optional().isArray().withMessage('Shadow meanings must be an array.'),
    body('meanings.shadow.*').optional().trim().notEmpty().withMessage('Shadow meanings cannot be empty strings.'),
    body('image_url').optional().trim().isURL().withMessage('Invalid image URL format.'),
    handleValidationErrors
];


module.exports = {
    getCardByIdValidator,
    getCardBySlugValidator,
    createCardValidator,
    updateCardValidator,
    getCardsByDeckValidator,
    getCardsByTypeValidator,
    // deleteCardValidator is essentially getCardByIdValidator for the param check
};
