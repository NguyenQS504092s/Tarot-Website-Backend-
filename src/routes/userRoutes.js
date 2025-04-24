const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');
const {
  registerUserValidator,
  loginUserValidator,
  updateUserValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/userValidators');

const router = express.Router();

// Routes xác thực (công khai)
router.post('/register', registerUserValidator, trackPerformance('userRegister'), userController.register);
router.post('/login', loginUserValidator, trackPerformance('userLogin'), userController.login);
// TODO: Add validation for refresh-token if needed
router.post('/refresh-token', trackPerformance('refreshToken'), userController.refreshToken);
router.post('/forgot-password', forgotPasswordValidator, trackPerformance('forgotPassword'), userController.forgotPassword);
router.put('/reset-password/:resetToken', resetPasswordValidator, trackPerformance('resetPassword'), userController.resetPassword);

// Routes có bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes thông tin người dùng
router.get('/me', trackPerformance('getMe'), userController.getMe);
router.put('/update-profile', updateUserValidator, trackPerformance('updateProfile'), userController.updateProfile);
router.put('/change-password', changePasswordValidator, trackPerformance('updatePassword'), userController.updatePassword);
router.post('/logout', trackPerformance('userLogout'), userController.logout); // Added logout route

// Routes cho admin - yêu cầu quyền admin
router.use(authMiddleware.restrictTo('admin'));
router.get('/', trackPerformance('getAllUsers'), userController.getAllUsers);
router.get('/:id', trackPerformance('getUser'), userController.getUser);
router.delete('/:id', trackPerformance('deleteUser'), userController.deleteUser);

module.exports = router;
