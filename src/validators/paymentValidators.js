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

// Validation rules for creating a payment intent
const createPaymentIntentValidator = [
    body('amount')
        .notEmpty().withMessage('Amount is required.')
        .isInt({ gt: 0 }).withMessage('Amount must be a positive integer.'), // Stripe expects amount in cents/smallest currency unit
    body('currency')
        .trim()
        .notEmpty().withMessage('Currency is required.')
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code (e.g., usd, vnd).')
        .toLowerCase(),
    body('paymentMethodType') // Optional, Stripe can often infer this
        .optional()
        .trim()
        .isString().withMessage('Payment method type must be a string.'),
    body('description') // Optional description for the payment
        .optional()
        .trim()
        .isString().withMessage('Description must be a string.'),
    // userId is usually derived from authMiddleware
    handleValidationErrors
];

// Validation rules for creating a checkout session
const createCheckoutSessionValidator = [
    body('planId')
        .notEmpty().withMessage('Plan ID is required.')
        .isMongoId().withMessage('Invalid Plan ID format.'),
    // Add other potential fields like quantity if applicable
    handleValidationErrors
];


// Validation rules for getting payment by ID
const getPaymentByIdValidator = [
    param('id')
        .notEmpty().withMessage('Payment ID is required.')
        // Stripe IDs are strings, not MongoIDs, so we just check if it's a non-empty string
        .isString().withMessage('Invalid Payment ID format.'),
    handleValidationErrors
];

// Validation for creating a subscription plan (Admin)
const createSubscriptionPlanValidator = [
    body('name').trim().notEmpty().withMessage('Plan name is required.'),
    body('price')
        .notEmpty().withMessage('Price is required.')
        .isFloat({ gt: 0 }).withMessage('Price must be a positive number.'),
    body('currency')
        .trim()
        .notEmpty().withMessage('Currency is required.')
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code.')
        .toLowerCase(),
    body('interval').trim().notEmpty().withMessage('Interval is required.').isIn(['day', 'week', 'month', 'year']).withMessage('Invalid interval.'),
    body('interval_count').optional().isInt({ gt: 0 }).withMessage('Interval count must be a positive integer.'),
    body('description').optional().trim().isString(),
    handleValidationErrors
];

// Validation for updating a subscription plan (Admin)
const updateSubscriptionPlanValidator = [
    param('id').notEmpty().withMessage('Plan ID is required.').isMongoId().withMessage('Invalid Plan ID format.'), // Assuming plan ID is MongoID
    body('name').optional().trim().notEmpty().withMessage('Plan name cannot be empty.'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number.'),
    // Currency and interval usually shouldn't be updated directly on Stripe plans, often requires new plan creation.
    // body('currency').optional().trim().isLength({ min: 3, max: 3 }).toLowerCase(),
    // body('interval').optional().trim().isIn(['day', 'week', 'month', 'year']),
    // body('interval_count').optional().isInt({ gt: 0 }),
    body('description').optional().trim().isString(),
    handleValidationErrors
];

// Validation for deleting a subscription plan (Admin)
const deleteSubscriptionPlanValidator = [
    param('id').notEmpty().withMessage('Plan ID is required.').isMongoId().withMessage('Invalid Plan ID format.'),
    handleValidationErrors
];


module.exports = {
    createPaymentIntentValidator,
    getPaymentByIdValidator,
    createSubscriptionPlanValidator,
    updateSubscriptionPlanValidator,
    deleteSubscriptionPlanValidator,
    createCheckoutSessionValidator,
    // Stripe webhook validation is handled differently (signature verification)
};
