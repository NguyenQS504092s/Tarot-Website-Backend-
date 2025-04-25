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
      field: err.param, 
      message: err.msg,
      value: err.value, 
    }));
    // Directly send the 400 response instead of calling next(error)
    // This prevents potential issues with subsequent middleware handling the error incorrectly
    return res.status(400).json({
        success: false,
        status: 'fail', // Consistent status for client-side errors
        message: 'Dữ liệu không hợp lệ.', // General validation failure message
        errors: formattedErrors // Provide specific field errors
    });
  }
  next(); // Proceed if no validation errors
};

// Validation rules for user registration
const registerUserValidator = [
  body('name') // Changed from 'username' to 'name'
    .trim()
    .notEmpty().withMessage('Tên là bắt buộc.')
    .isLength({ min: 3 }).withMessage('Tên phải có ít nhất 3 ký tự.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email là bắt buộc.')
    .isEmail().withMessage('Vui lòng cung cấp địa chỉ email hợp lệ.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc.')
    .isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự.'), // Changed min length to 8
  body('passwordConfirm') // Added password confirmation validation
    .notEmpty().withMessage('Xác nhận mật khẩu là bắt buộc.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Xác nhận mật khẩu không khớp với mật khẩu.');
      }
      return true;
    }),
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
    body('name') // Changed from 'username' to 'name'
        .optional() // Allow name to be optional
        .trim()
        .isLength({ min: 3 }).withMessage('Tên phải có ít nhất 3 ký tự.'), // Updated message
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
        .notEmpty().withMessage('Mật khẩu mới là bắt buộc.')
        .isLength({ min: 8 }).withMessage('Mật khẩu mới phải có ít nhất 8 ký tự.'), // Changed min length to 8
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
        .notEmpty().withMessage('Mật khẩu mới là bắt buộc.')
        .isLength({ min: 8 }).withMessage('Mật khẩu mới phải có ít nhất 8 ký tự.'), // Changed min length to 8
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
