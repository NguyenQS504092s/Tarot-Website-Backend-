const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');

// Middleware to handle validation errors (can be reused or defined centrally)
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

// Validation rules for creating a new reading
const createReadingValidator = [
    body('spreadType')
        .trim()
        .notEmpty().withMessage('Spread type is required.')
        .isString().withMessage('Spread type must be a string.'), // Add more specific checks if needed (e.g., enum)
    body('question')
        .optional() // Question might be optional
        .trim()
        .isString().withMessage('Question must be a string.'),
    // userId is usually derived from the authenticated user (authMiddleware),
    // so direct validation might not be needed here unless it can be overridden.
    handleValidationErrors
];

// Validation rules for updating a reading (Admin)
const updateReadingValidator = [
    // ID validation is handled by getReadingByIdValidator applied in the route
    body('question')
        .optional()
        .trim()
        .isString().withMessage('Question must be a string.'),
    body('interpretation')
        .optional()
        .trim()
        .isString().withMessage('Interpretation must be a string.'),
    body('readerId')
        .optional()
        .isMongoId().withMessage('Invalid Reader ID format.'),
    body('isPublic')
        .optional()
        .isBoolean().withMessage('isPublic must be a boolean value (true or false).'),
    // Add validation for other updatable fields if needed (e.g., status if added to model)
    handleValidationErrors
];

// Validation rules for getting a specific reading by ID
const getReadingByIdValidator = [
    param('id')
        .notEmpty().withMessage('Reading ID is required.')
        .isMongoId().withMessage('Invalid Reading ID format.'),
    handleValidationErrors
];

// Validation rules for adding interpretation (Reader)
const addInterpretationValidator = [
    // ID validation is handled by getReadingByIdValidator applied in the route
    body('interpretation')
        .trim()
        .notEmpty().withMessage('Interpretation content cannot be empty.')
        .isString().withMessage('Interpretation must be a string.'),
    handleValidationErrors
];

// Validation rules for adding feedback (User)
const addFeedbackValidator = [
    // ID validation is handled by getReadingByIdValidator applied in the route
    body('rating')
        .notEmpty().withMessage('Rating is required.')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
    body('comment')
        .optional()
        .trim()
        .isString().withMessage('Comment must be a string.'),
    handleValidationErrors
];


// Validation rules for getting readings by user ID (if applicable as a separate route)
const getReadingsByUserValidator = [
    param('userId') // Assuming userId is passed as a URL parameter
        .notEmpty().withMessage('User ID is required.')
        .isMongoId().withMessage('Invalid User ID format.'),
    handleValidationErrors
];


module.exports = {
    createReadingValidator,
    getReadingByIdValidator,
    getReadingsByUserValidator,
    addInterpretationValidator,
    addFeedbackValidator,
    updateReadingValidator, // Export the new validator
    // Add validator for creating spreads if needed
};
