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

 /**
  * @swagger
  * /users/refresh-token:
  *   post:
  *     summary: Refresh the authentication token
  *     tags: [Users]
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             required:
  *               - refreshToken
  *             properties:
  *               refreshToken:
  *                 type: string
  *                 description: The refresh token received during login
  *     responses:
  *       200:
  *         description: Tokens refreshed successfully
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schemas/UserResponse' # Returns new tokens
  *       400:
  *         description: Invalid refresh token provided
  *       401:
  *         description: Refresh token expired or invalid
  *       500:
  *         description: Server error
  */
 // TODO: Add validation for refresh-token if needed
 router.post('/refresh-token', trackPerformance('refreshToken'), userController.refreshToken);

 /**
  * @swagger
  * /users/forgot-password:
  *   post:
  *     summary: Initiate password reset process
  *     tags: [Users]
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             required:
  *               - email
  *             properties:
  *               email:
  *                 type: string
  *                 format: email
  *                 description: The email address of the user who forgot their password
  *                 example: john.doe@example.com
  *     responses:
  *       200:
  *         description: Password reset email sent (if user exists)
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schemas/ApiResponse'
  *       400:
  *         description: Invalid email format
  *       404:
  *         description: User with this email not found (optional, for security may return 200 anyway)
  *       500:
  *         description: Server error (e.g., email sending failed)
  */
 router.post('/forgot-password', forgotPasswordValidator, trackPerformance('forgotPassword'), userController.forgotPassword);

 /**
  * @swagger
  * /users/reset-password/{resetToken}:
  *   put:
  *     summary: Reset password using a token
  *     tags: [Users]
  *     parameters:
  *       - in: path
  *         name: resetToken
  *         required: true
  *         schema:
  *           type: string
  *         description: The password reset token received via email
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             required:
  *               - password
  *             properties:
  *               password:
  *                 type: string
  *                 format: password
  *                 description: The new password (min 6 characters)
  *                 example: newSecurePassword123
  *     responses:
  *       200:
  *         description: Password reset successfully
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schemas/UserResponse' # Return user and new tokens
  *       400:
  *         description: Invalid token or new password format
  *       401:
  *         description: Token expired or invalid
  *       500:
  *         description: Server error
  */
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

 /**
  * @swagger
  * /users:
  *   get:
  *     summary: Get all users (Admin only)
  *     tags: [Users, Admin]
  *     security:
  *       - bearerAuth: []
  *     parameters: # Add pagination/sorting/filtering if needed
  *       - in: query
  *         name: limit
  *         schema: { type: integer, default: 10 }
  *       - in: query
  *         name: page
  *         schema: { type: integer, default: 1 }
  *       - in: query
  *         name: sort
  *         schema: { type: string, default: name }
  *       - in: query
  *         name: role
  *         schema: { type: string, enum: [user, reader, admin] }
  *     responses:
  *       200:
  *         description: A list of users
  *         content:
  *           application/json:
  *             schema:
  *               allOf:
  *                 - $ref: '#/components/schemas/ApiResponse'
  *                 - type: object
  *                   properties:
  *                     data:
  *                       type: object
  *                       properties:
  *                         users:
  *                           type: array
  *                           items: { $ref: '#/components/schemas/User' }
  *                         pagination: { type: object }
  *       401: { description: 'Unauthorized' }
  *       403: { description: 'Forbidden' }
  *       500: { description: 'Server error' }
  */
 router.get('/', trackPerformance('getAllUsers'), userController.getAllUsers);

 /**
  * @swagger
  * /users/{id}:
  *   get:
  *     summary: Get a specific user by ID (Admin only)
  *     tags: [Users, Admin]
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema: { type: string, format: objectId }
  *         description: The ID of the user to retrieve
  *     responses:
  *       200:
  *         description: User details
  *         content:
  *           application/json:
  *             schema:
  *               allOf:
  *                 - $ref: '#/components/schemas/ApiResponse'
  *                 - type: object
  *                   properties:
  *                     data: { $ref: '#/components/schemas/User' }
  *       400: { description: 'Invalid ID format' }
  *       401: { description: 'Unauthorized' }
  *       403: { description: 'Forbidden' }
  *       404: { description: 'User not found' }
  *       500: { description: 'Server error' }
  */
 router.get('/:id', trackPerformance('getUser'), userController.getUser);

 /**
  * @swagger
  * /users/{id}:
  *   delete:
  *     summary: Delete a user (Admin only)
  *     tags: [Users, Admin]
  *     security:
  *       - bearerAuth: []
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema: { type: string, format: objectId }
  *         description: The ID of the user to delete
  *     responses:
  *       200:
  *         description: User deleted successfully
  *         content:
  *           application/json:
  *             schema: { $ref: '#/components/schemas/ApiResponse' }
  *       400: { description: 'Invalid ID format' }
  *       401: { description: 'Unauthorized' }
  *       403: { description: 'Forbidden' }
  *       404: { description: 'User not found' }
  *       500: { description: 'Server error' }
  */
 router.delete('/:id', trackPerformance('deleteUser'), userController.deleteUser);
 
 module.exports = router;
