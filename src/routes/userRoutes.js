const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes xác thực (công khai)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/forgot-password', userController.forgotPassword);
router.put('/reset-password/:resetToken', userController.resetPassword);

// Routes có bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes thông tin người dùng
router.get('/me', userController.getMe);
router.put('/update-profile', userController.updateProfile);
router.put('/change-password', userController.updatePassword);

// Routes cho admin - yêu cầu quyền admin
router.use(authMiddleware.restrictTo('admin'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;