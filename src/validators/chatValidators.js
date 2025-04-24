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

// Validation rules for sending a message
const sendMessageValidator = [
    body('message')
        .trim()
        .notEmpty().withMessage('Message content cannot be empty.')
        .isString().withMessage('Message must be a string.'),
    // Assuming chatId might be in the body if starting a new chat or passed via param for existing
    body('recipientId') // If starting a new chat with a specific user
        .optional()
        .isMongoId().withMessage('Invalid recipient ID format.'),
    param('chatId') // If sending to an existing chat
        .optional()
        .isMongoId().withMessage('Invalid chat ID format.'),
    // Ensure either recipientId or chatId is present, depending on the route structure
    // Ensure either recipientId or chatId is present, depending on the route structure
    handleValidationErrors
];

// Validation rules for creating a new chat
const createChatValidator = [
    body('recipientId')
        .notEmpty().withMessage('Recipient ID is required.')
        .isMongoId().withMessage('Invalid recipient ID format.'),
    // Optional: Validate initial message if allowed
    // body('initialMessage').optional().trim().isString(),
    handleValidationErrors
];

// Validation rules for scheduling a chat
const scheduleChatValidator = [
    body('readerId')
        .notEmpty().withMessage('Reader ID is required.')
        .isMongoId().withMessage('Invalid reader ID format.'),
    body('scheduledTime')
        .notEmpty().withMessage('Scheduled time is required.')
        .isISO8601().withMessage('Invalid scheduled time format (ISO 8601).')
        .toDate() // Convert to Date object for potential comparison
        .custom(value => { // Check if the date is in the future
            if (value <= new Date()) {
                throw new Error('Scheduled time must be in the future.');
            }
            return true;
        }),
    handleValidationErrors
];

// Validation rules for updating chat status
const updateChatStatusValidator = [
    // ID validation is handled by getChatByIdValidator applied in the route
    body('status')
        .trim()
        .notEmpty().withMessage('Chat status is required.')
        .isIn(['pending', 'active', 'completed', 'cancelled']).withMessage('Invalid chat status.'), // Adjust allowed statuses as needed
    handleValidationErrors
];


// Validation rules for getting chat messages by chat ID
const getChatMessagesValidator = [
    param('chatId')
        .notEmpty().withMessage('Chat ID is required.')
        .isMongoId().withMessage('Invalid Chat ID format.'),
    handleValidationErrors
];

// Validation rules for getting chat by ID (if applicable)
const getChatByIdValidator = [
    param('chatId') // Or 'id' depending on route definition
        .notEmpty().withMessage('Chat ID is required.')
        .isMongoId().withMessage('Invalid Chat ID format.'),
    handleValidationErrors
];


module.exports = {
    sendMessageValidator,
    getChatMessagesValidator,
    getChatByIdValidator,
    createChatValidator,
    scheduleChatValidator,
    updateChatStatusValidator,
};
