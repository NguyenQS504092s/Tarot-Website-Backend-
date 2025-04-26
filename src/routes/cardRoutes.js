const express = require('express');
const cardController = require('../controllers/cardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');
const {
    getCardByIdValidator,
    createCardValidator,
    updateCardValidator,
    getCardsByDeckValidator,
    getCardsByTypeValidator,
    // Import getCardBySlugValidator if a slug route is added
} = require('../validators/cardValidators');

const router = express.Router();

// Routes công khai - không yêu cầu đăng nhập

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: Get a list of all Tarot cards
 *     tags: [Cards]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of cards to return
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
 *           example: name,-number
 *         description: Sort order (e.g., 'name', '-number')
 *       # Add other query parameters for filtering if needed (e.g., suit, type)
 *     responses:
 *       200:
 *         description: A list of Tarot cards
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
 *                         cards:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Card' # Define Card schema later
 *                         pagination: # Add pagination info if implemented
 *                           type: object
 *                           properties:
 *                              page: { type: integer, example: 1 }
 *                              limit: { type: integer, example: 10 }
 *                              totalPages: { type: integer, example: 8 }
 *                              totalResults: { type: integer, example: 78 }
 *       500:
 *         description: Server error
 */
router.get('/', trackPerformance('getAllCards'), cardController.getAllCards);

// Đặt các route cụ thể trước route với params
/**
 * @swagger
 * /cards/deck/{deckName}:
 *   get:
 *     summary: Get cards by deck name (e.g., rider-waite)
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: deckName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the deck (slug format)
 *         example: rider-waite
 *     responses:
 *       200:
 *         description: A list of cards belonging to the specified deck
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
 *                         $ref: '#/components/schemas/Card'
 *       400:
 *         description: Invalid deck name format
 *       404:
 *         description: Deck not found or no cards in the deck
 *       500:
 *         description: Server error
 */
router.get('/deck/:deckName', getCardsByDeckValidator, trackPerformance('getCardsByDeck'), cardController.getCardsByDeck);

/**
 * @swagger
 * /cards/type/{cardType}:
 *   get:
 *     summary: Get cards by type (Major Arcana or Minor Arcana)
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: cardType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [major, minor] # Assuming these are the valid types
 *         description: The type of the card (major or minor)
 *         example: major
 *     responses:
 *       200:
 *         description: A list of cards of the specified type
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
 *                         $ref: '#/components/schemas/Card'
 *       400:
 *         description: Invalid card type
 *       404:
 *         description: No cards found for this type
 *       500:
 *         description: Server error
 */
router.get('/type/:cardType', getCardsByTypeValidator, trackPerformance('getCardsByType'), cardController.getCardsByType);

// Route có param id phải đặt sau các route cụ thể khác
// Remove validator - let service/error middleware handle CastError for invalid ID format
/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     summary: Get a single card by its ID
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId # Indicate it's a MongoDB ObjectId
 *         description: The ID of the card to retrieve
 *         example: 6056504bf8a1e2b8a8a589c3
 *     responses:
 *       200:
 *         description: Details of the requested card
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Card'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
router.get('/:id', trackPerformance('getCard'), cardController.getCard);

// Routes cho admin - yêu cầu quyền admin
router.use(authMiddleware.protect); // Apply protect middleware first
router.use(authMiddleware.restrictTo('admin')); // Then restrict to admin for routes below

/**
 * @swagger
 * /cards:
 *   post:
 *     summary: Create a new Tarot card (Admin only)
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: [] # Requires admin JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CardInput' # Define CardInput schema later
 *     responses:
 *       201:
 *         description: Card created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Card'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       500:
 *         description: Server error
 */
router.post('/', createCardValidator, trackPerformance('createCard'), cardController.createCard);

/**
 * @swagger
 * /cards/{id}:
 *   put:
 *     summary: Update an existing Tarot card (Admin only)
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the card to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CardInput' # Can reuse CardInput or create a specific Update schema
 *     responses:
 *       200:
 *         description: Card updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Card'
 *       400:
 *         description: Invalid input data or ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
router.put('/:id', updateCardValidator, trackPerformance('updateCard'), cardController.updateCard); // updateCardValidator includes ID check

/**
 * @swagger
 * /cards/{id}:
 *   delete:
 *     summary: Delete a Tarot card (Admin only)
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the card to delete
 *     responses:
 *       200: # Or 204 No Content if nothing is returned
 *         description: Card deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse' # With null data or specific message
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', getCardByIdValidator, trackPerformance('deleteCard'), cardController.deleteCard);

module.exports = router;
