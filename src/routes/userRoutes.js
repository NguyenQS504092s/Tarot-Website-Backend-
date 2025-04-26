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

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 6 characters)
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse' # Assuming you define this schema later
 *       400:
 *         description: Invalid input data or email already exists
 *       500:
 *         description: Server error
 */
router.post('/register', registerUserValidator, trackPerformance('userRegister'), userController.register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: password123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse' # Assuming you define this schema later
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Incorrect email or password
 *       500:
 *         description: Server error
 */
router.post('/login', loginUserValidator, trackPerformance('userLogin'), userController.login);
// TODO: Add validation for refresh-token if needed
router.post('/refresh-token', trackPerformance('refreshToken'), userController.refreshToken);
router.post('/forgot-password', forgotPasswordValidator, trackPerformance('forgotPassword'), userController.forgotPassword);
router.put('/reset-password/:resetToken', resetPasswordValidator, trackPerformance('resetPassword'), userController.resetPassword);

// Routes có bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect); // Middleware này áp dụng cho tất cả các route bên dưới

// Routes thông tin người dùng

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: [] # Yêu cầu JWT Bearer token
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       500:
 *         description: Server error
 */
router.get('/me', trackPerformance('getMe'), userController.getMe);

/**
 * @swagger
 * /users/update-profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the user
 *                 example: Johnny Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: New email for the user (optional, if allowed)
 *                 example: johnny.doe@example.com
 *             # Thêm các trường khác có thể cập nhật
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/update-profile', updateUserValidator, trackPerformance('updateProfile'), userController.updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: User's current password
 *                 example: password123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 6 characters)
 *                 example: newPassword456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse' # Trả về user và token mới
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized or incorrect current password
 *       500:
 *         description: Server error
 */
router.put('/change-password', changePasswordValidator, trackPerformance('updatePassword'), userController.updatePassword);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Log out current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/logout', trackPerformance('userLogout'), userController.logout); // Added logout route

// Routes cho admin - yêu cầu quyền admin
router.use(authMiddleware.restrictTo('admin')); // Middleware này áp dụng cho các route admin bên dưới
router.get('/', trackPerformance('getAllUsers'), userController.getAllUsers);
router.get('/:id', trackPerformance('getUser'), userController.getUser);
router.delete('/:id', trackPerformance('deleteUser'), userController.deleteUser);

module.exports = router;
