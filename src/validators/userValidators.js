const { body, param, validationResult } = require('express-validator'); // Added param here
const ApiError = require('../utils/apiError');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for consistent response
    const formattedErrors = errors.array().map(err => ({
      field: err.param, // Use 'param' instead of potentially undefined 'path'
      message: err.msg,
      value: err.value, // Include the invalid value for context
    }));
    // Throw an ApiError that will be caught by the global error handler
    return next(new ApiError(400, 'Validation failed', formattedErrors));
  }
  next();
};

// Validation rules for user registration
const registerUserValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  // Add more validations as needed (e.g., password confirmation)
  handleValidationErrors // Apply the error handler middleware after rules
];

// Validation rules for user login
const loginUserValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
  handleValidationErrors // Apply the error handler middleware after rules
];

// Validation rules for updating user profile
const updateUserValidator = [
    body('username')
        .optional() // Allow username to be optional
        .trim()
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
    body('email')
        .optional() // Allow email to be optional
        .trim()
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(),
    // Add other fields that can be updated, e.g., fullName, dateOfBirth
    // Ensure sensitive fields like password changes have separate validation/routes
  handleValidationErrors
];

// Validation rules for changing password
const changePasswordValidator = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required.'),
    body('newPassword')
        .notEmpty().withMessage('New password is required.')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.'),
    // Optional: Add password confirmation field
    // body('newPasswordConfirm').custom((value, { req }) => {
    //     if (value !== req.body.newPassword) {
    //         throw new Error('Password confirmation does not match password');
    //     }
    //     return true;
    // }),
    handleValidationErrors
];

// Validation rules for forgot password request
const forgotPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(),
    handleValidationErrors
];

// Validation rules for resetting password
const resetPasswordValidator = [
    param('resetToken') // Validate the token from the URL parameter
        .notEmpty().withMessage('Reset token is required.')
        .isString().withMessage('Invalid reset token format.'), // Basic check, actual token validation happens in controller/service
    body('newPassword')
        .notEmpty().withMessage('New password is required.')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.'),
    // Optional: Add password confirmation field
    handleValidationErrors
];


module.exports = {
  registerUserValidator,
  loginUserValidator,
  updateUserValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
