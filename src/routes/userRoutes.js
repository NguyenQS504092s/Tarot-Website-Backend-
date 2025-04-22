const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');

const router = express.Router();

// Routes xác thực (công khai)
router.post('/register', trackPerformance('userRegister'), userController.register);
router.post('/login', trackPerformance('userLogin'), userController.login);
router.post('/refresh-token', trackPerformance('refreshToken'), userController.refreshToken);
router.post('/forgot-password', trackPerformance('forgotPassword'), userController.forgotPassword);
router.put('/reset-password/:resetToken', trackPerformance('resetPassword'), userController.resetPassword);

// Routes có bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes thông tin người dùng
router.get('/me', trackPerformance('getMe'), userController.getMe);
router.put('/update-profile', trackPerformance('updateProfile'), userController.updateProfile);
router.put('/change-password', trackPerformance('updatePassword'), userController.updatePassword);

// Routes cho admin - yêu cầu quyền admin
router.use(authMiddleware.restrictTo('admin'));
router.get('/', trackPerformance('getAllUsers'), userController.getAllUsers);
router.get('/:id', trackPerformance('getUser'), userController.getUser);
router.delete('/:id', trackPerformance('deleteUser'), userController.deleteUser);

module.exports = router;