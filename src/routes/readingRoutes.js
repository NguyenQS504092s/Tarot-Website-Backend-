const express = require('express');
const readingController = require('../controllers/readingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');
const {
    createReadingValidator,
    getReadingByIdValidator,
    addInterpretationValidator,
    addFeedbackValidator,
    updateReadingValidator, // Import the new validator
    // Import validator for creating spreads if added
} = require('../validators/readingValidators');

const router = express.Router();

// Tất cả routes yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes cụ thể phải đặt trước route có pattern chung
// Routes cho người dùng

/**
 * @swagger
 * /readings:
 *   post:
 *     summary: Create a new Tarot reading
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - spreadType
 *               - question
 *               - deckName # Added deckName requirement
 *             properties:
 *               spreadType:
 *                 type: string
 *                 description: The type of spread (e.g., 'celtic-cross', 'three-card')
 *                 example: 'three-card'
 *               question:
 *                 type: string
 *                 description: The user's question for the reading
 *                 example: 'What should I focus on this week?'
 *               deckName:
 *                 type: string
 *                 description: The name of the deck to use (slug format)
 *                 example: 'rider-waite'
 *     responses:
 *       201:
 *         description: Reading created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Reading' # Define Reading schema later
 *       400:
 *         description: Invalid input data (e.g., invalid spreadType, missing fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error (e.g., error drawing cards)
 */
// Apply the validator to the create reading route
router.post('/', createReadingValidator, trackPerformance('createReading'), readingController.createReading);

/**
 * @swagger
 * /readings/random:
 *   post:
 *     summary: Create a random Tarot reading (e.g., Card of the Day)
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               spreadType:
 *                 type: string
 *                 description: Optional spread type (defaults to a single card if not provided)
 *                 example: 'card-of-the-day'
 *               deckName:
 *                 type: string
 *                 description: Optional deck name (defaults to a default deck if not provided)
 *                 example: 'rider-waite'
 *     responses:
 *       201:
 *         description: Random reading created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Reading'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// TODO: Add validation for random reading if needed (e.g., spreadType if provided)
router.post('/random', trackPerformance('createRandomReading'), readingController.createRandomReading);

/**
 * @swagger
 * /readings/history:
 *   get:
 *     summary: Get the current user's reading history
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of readings to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *           example: -createdAt,question
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of the user's past readings
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
 *                         readings:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Reading'
 *                         pagination: # Add pagination info if implemented
 *                           type: object
 *                           properties:
 *                              page: { type: integer, example: 1 }
 *                              limit: { type: integer, example: 10 }
 *                              totalPages: { type: integer, example: 3 }
 *                              totalResults: { type: integer, example: 25 }
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/history', trackPerformance('getUserReadingHistory'), readingController.getUserReadingHistory);

/**
 * @swagger
 * /readings/spreads:
 *   get:
 *     summary: Get a list of available Tarot spread types
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: [] # Or make public if spreads are not user-specific
 *     responses:
 *       200:
 *         description: A list of available spread types
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object # Define Spread schema later if needed
 *                         properties:
 *                           key: { type: string, example: 'three-card' }
 *                           name: { type: string, example: 'Three Card Spread' }
 *                           description: { type: string, example: 'Past, Present, Future overview.' }
 *                           cardCount: { type: integer, example: 3 }
 *       401:
 *         description: Unauthorized (if security is applied)
 *       500:
 *         description: Server error
 */
router.get('/spreads', trackPerformance('getAllSpreads'), readingController.getAllSpreads); // Added trackPerformance

// Routes cho reader
router.use('/reader', authMiddleware.restrictTo('reader', 'admin')); // Middleware áp dụng cho các route reader bên dưới

/**
 * @swagger
 * /readings/reader/pending:
 *   get:
 *     summary: Get readings pending interpretation (for Readers/Admins)
 *     tags: [Readings, Reader]
 *     security:
 *       - bearerAuth: []
 *     parameters: # Add pagination/sorting if needed
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: A list of readings awaiting interpretation
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: # Similar structure to /history but filtered
 *                       type: object
 *                       properties:
 *                         readings:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Reading' }
 *                         pagination: { type: object } # Add pagination details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not a Reader or Admin)
 *       500:
 *         description: Server error
 */
router.get('/reader/pending', trackPerformance('getPendingReadings'), readingController.getPendingReadings);

/**
 * @swagger
 * /readings/reader/{id}/interpret:
 *   put:
 *     summary: Add interpretation to a reading (for Readers/Admins)
 *     tags: [Readings, Reader]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the reading to interpret
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [interpretation]
 *             properties:
 *               interpretation:
 *                 type: string
 *                 description: The reader's interpretation of the cards
 *                 example: 'The cards indicate a time of transition...'
 *     responses:
 *       200:
 *         description: Interpretation added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Reading' } # Return updated reading
 *       400:
 *         description: Invalid input data or ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Reading not found
 *       500:
 *         description: Server error
 */
router.put('/reader/:id/interpret', getReadingByIdValidator, addInterpretationValidator, trackPerformance('addInterpretation'), readingController.addInterpretation);

// Routes cho admin
router.use('/admin', authMiddleware.restrictTo('admin')); // Middleware áp dụng cho các route admin bên dưới

/**
 * @swagger
 * /readings/admin/all:
 *   get:
 *     summary: Get all readings (Admin only)
 *     tags: [Readings, Admin]
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
 *         schema: { type: string, default: -createdAt }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: objectId }
 *         description: Filter by user ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, interpreted, completed] }
 *         description: Filter by reading status
 *     responses:
 *       200:
 *         description: A list of all readings
 *         content:
 *           application/json:
 *             schema: # Similar to /history but potentially with more data
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         readings:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Reading' }
 *                         pagination: { type: object }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/admin/all', trackPerformance('getAllReadings'), readingController.getAllReadings);

/**
 * @swagger
 * /readings/admin/{id}:
 *   put:
 *     summary: Update a reading (Admin only)
 *     tags: [Readings, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the reading to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: # Define specific fields admin can update
 *             type: object
 *             properties:
 *               question: { type: string }
 *               status: { type: string, enum: [pending, interpreted, completed] }
 *               isPublic: { type: boolean }
 *               # Add other updatable fields
 *     responses:
 *       200:
 *         description: Reading updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Reading' }
 *       400:
 *         description: Invalid input data or ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Reading not found
 *       500:
 *         description: Server error
 */
router.put('/admin/:id', getReadingByIdValidator, updateReadingValidator, trackPerformance('updateReading'), readingController.updateReading); // Added route for admin update with validator

/**
 * @swagger
 * /readings/admin/{id}:
 *   delete:
 *     summary: Delete a reading (Admin only)
 *     tags: [Readings, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the reading to delete
 *     responses:
 *       200:
 *         description: Reading deleted successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiResponse' } # With null data
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Reading not found
 *       500:
 *         description: Server error
 */
router.delete('/admin/:id', getReadingByIdValidator, trackPerformance('deleteReading'), readingController.deleteReading); // Added trackPerformance

/**
 * @swagger
 * /readings/admin/spreads:
 *   post:
 *     summary: Create a new spread type (Admin only)
 *     tags: [Readings, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: # Define SpreadInput schema later
 *             type: object
 *             required: [key, name, description, cardCount]
 *             properties:
 *               key: { type: string, example: 'relationship-cross' }
 *               name: { type: string, example: 'Relationship Cross' }
 *               description: { type: string, example: 'Explores dynamics between two people.' }
 *               cardCount: { type: integer, example: 6 }
 *               positions: { type: array, items: { type: string }, example: ['You', 'Partner', 'Foundation', 'Challenge', 'Near Future', 'Outcome'] }
 *     responses:
 *       201:
 *         description: Spread type created successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiResponse' } # Return the created spread?
 *       400:
 *         description: Invalid input data or key already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
// TODO: Add validation for creating spreads
router.post('/admin/spreads', trackPerformance('createSpread'), readingController.createSpread); // Moved under /admin, added trackPerformance, removed inline restrictTo

// Route với ID phải đặt sau các route cụ thể
/**
 * @swagger
 * /readings/{id}:
 *   get:
 *     summary: Get details of a specific reading
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the reading to retrieve
 *     responses:
 *       200:
 *         description: Reading details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Reading'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User does not own this reading and is not admin)
 *       404:
 *         description: Reading not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getReadingByIdValidator, trackPerformance('getReadingById'), readingController.getReadingById);

/**
 * @swagger
 * /readings/{id}/auto-interpretation:
 *   get:
 *     summary: Get an automated interpretation for a specific reading
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the reading to interpret
 *     responses:
 *       200:
 *         description: Automated interpretation generated successfully
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
 *                         interpretation: { type: string, example: 'The cards suggest...' }
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Reading not found
 *       500:
 *         description: Server error or interpretation generation failed
 */
router.get('/:id/auto-interpretation', getReadingByIdValidator, trackPerformance('getAutoInterpretation'), readingController.getAutoInterpretation);

/**
 * @swagger
 * /readings/{id}/feedback:
 *   put:
 *     summary: Add feedback to a specific reading
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the reading to add feedback to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: User's rating for the reading (1-5 stars)
 *                 example: 4
 *               comment:
 *                 type: string
 *                 description: User's comment about the reading (optional)
 *                 example: 'Very insightful, thank you!'
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Reading' # Return updated reading
 *       400:
 *         description: Invalid input data or ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User does not own this reading)
 *       404:
 *         description: Reading not found
 *       500:
 *         description: Server error
 */
router.put('/:id/feedback', getReadingByIdValidator, addFeedbackValidator, trackPerformance('addFeedbackToReading'), readingController.addFeedbackToReading);

module.exports = router;
