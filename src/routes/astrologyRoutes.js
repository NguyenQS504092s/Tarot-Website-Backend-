const express = require('express');
const router = express.Router();
const astrologyController = require('../controllers/astrologyController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');
const { body, param } = require('express-validator'); // Import body/param if needed for inline validation
const {
    getHoroscopeBySignValidator,
    getZodiacInfoBySignValidator,
    getZodiacCompatibilityValidator,
    getTarotZodiacRelationValidator,
    createHoroscopeValidator,
    updateHoroscopeValidator,
    createZodiacSignValidator,
    updateZodiacSignValidator,
    addTarotRelationValidator,
    removeTarotRelationValidator,
} = require('../validators/astrologyValidators');

// Routes công khai

/**
 * @swagger
 * /astrology/signs:
 *   get:
 *     summary: Get a list of all Zodiac signs
 *     tags: [Astrology]
 *     responses:
 *       200:
 *         description: A list of Zodiac signs
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
 *                         $ref: '#/components/schemas/ZodiacSign' # Define ZodiacSign schema later
 *       500:
 *         description: Server error
 */
router.get('/signs', trackPerformance('getAllZodiacSigns'), astrologyController.getAllZodiacSigns);

/**
 * @swagger
 * /astrology/signs/{sign}:
 *   get:
 *     summary: Get information about a specific Zodiac sign
 *     tags: [Astrology]
 *     parameters:
 *       - in: path
 *         name: sign
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the Zodiac sign (e.g., aries, taurus)
 *         example: aries
 *     responses:
 *       200:
 *         description: Details of the requested Zodiac sign
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ZodiacSign'
 *       400:
 *         description: Invalid sign name format
 *       404:
 *         description: Zodiac sign not found
 *       500:
 *         description: Server error
 */
router.get('/signs/:sign', getZodiacInfoBySignValidator, trackPerformance('getZodiacSignInfo'), astrologyController.getZodiacSignInfo);

// Routes yêu cầu đăng nhập - các route cụ thể phải đặt trước route có pattern chung
/**
 * @swagger
 * /astrology/compatibility/{sign1}/{sign2}:
 *   get:
 *     summary: Get compatibility information between two Zodiac signs
 *     tags: [Astrology]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sign1
 *         required: true
 *         schema: { type: string }
 *         description: The first Zodiac sign name
 *         example: aries
 *       - in: path
 *         name: sign2
 *         required: true
 *         schema: { type: string }
 *         description: The second Zodiac sign name
 *         example: leo
 *     responses:
 *       200:
 *         description: Compatibility details
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
 *                         compatibilityScore: { type: number, example: 85 }
 *                         description: { type: string, example: 'A fiery and passionate match...' }
 *       400:
 *         description: Invalid sign names
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Compatibility info not found (or signs invalid)
 *       500:
 *         description: Server error
 */
router.get('/compatibility/:sign1/:sign2', authMiddleware.protect, getZodiacCompatibilityValidator, trackPerformance('getZodiacCompatibility'), astrologyController.getZodiacCompatibility);

/**
 * @swagger
 * /astrology/tarot-relation/{sign}:
 *   get:
 *     summary: Get Tarot cards associated with a Zodiac sign
 *     tags: [Astrology]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sign
 *         required: true
 *         schema: { type: string }
 *         description: The Zodiac sign name
 *         example: cancer
 *     responses:
 *       200:
 *         description: Associated Tarot cards
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
 *                         $ref: '#/components/schemas/Card' # Return Card objects
 *       400:
 *         description: Invalid sign name
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sign not found or no relations defined
 *       500:
 *         description: Server error
 */
router.get('/tarot-relation/:sign', authMiddleware.protect, getTarotZodiacRelationValidator, trackPerformance('getTarotZodiacRelation'), astrologyController.getTarotZodiacRelation);

/**
 * @swagger
 * /astrology/horoscope/{sign}:
 *   get:
 *     summary: Get the daily horoscope for a specific Zodiac sign
 *     tags: [Astrology]
 *     parameters:
 *       - in: path
 *         name: sign
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the Zodiac sign
 *         example: taurus
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: The date for the horoscope (YYYY-MM-DD). Defaults to today.
 *         example: '2025-04-27'
 *     responses:
 *       200:
 *         description: Daily horoscope for the specified sign
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Horoscope' # Define Horoscope schema later
 *       400:
 *         description: Invalid sign name or date format
 *       404:
 *         description: Horoscope not found for this sign/date
 *       500:
 *         description: Server error
 */
// Sửa: Route lấy horoscope theo sign (public)
router.get('/horoscope/:sign', getHoroscopeBySignValidator, trackPerformance('getDailyHoroscope'), astrologyController.getDailyHoroscope);

// Routes dành cho admin - đảm bảo phải có cả middleware protect và restrictTo

/**
 * @swagger
 * /astrology/admin/horoscopes:
 *   post:
 *     summary: Create a new daily horoscope (Admin only)
 *     tags: [Astrology, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HoroscopeInput' # Define HoroscopeInput schema later
 *     responses:
 *       201:
 *         description: Horoscope created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Horoscope' }
 *       400: { description: 'Invalid input data' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       500: { description: 'Server error' }
 */
// Sửa: Các route admin cho horoscope cần có prefix /admin/horoscopes
router.post('/admin/horoscopes', authMiddleware.protect, authMiddleware.restrictTo('admin'), createHoroscopeValidator, trackPerformance('createDailyHoroscope'), astrologyController.createDailyHoroscope);

/**
 * @swagger
 * /astrology/admin/horoscopes/{id}:
 *   put:
 *     summary: Update an existing daily horoscope (Admin only)
 *     tags: [Astrology, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the horoscope to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HoroscopeInput' # Reuse or create specific update schema
 *     responses:
 *       200:
 *         description: Horoscope updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Horoscope' }
 *       400: { description: 'Invalid input data or ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       404: { description: 'Horoscope not found' }
 *       500: { description: 'Server error' }
 */
router.put('/admin/horoscopes/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), updateHoroscopeValidator, trackPerformance('updateDailyHoroscope'), astrologyController.updateDailyHoroscope);

/**
 * @swagger
 * /astrology/admin/horoscopes/{id}:
 *   delete:
 *     summary: Delete a daily horoscope (Admin only)
 *     tags: [Astrology, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the horoscope to delete
 *     responses:
 *       200:
 *         description: Horoscope deleted successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiResponse' }
 *       400: { description: 'Invalid ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       404: { description: 'Horoscope not found' }
 *       500: { description: 'Server error' }
 */
// Sửa: Các route admin cho horoscope cần có prefix /admin/horoscopes
// TODO: Add validator for horoscope ID param
router.delete('/admin/horoscopes/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), /* horoscopeIdValidator, */ trackPerformance('deleteDailyHoroscope'), astrologyController.deleteDailyHoroscope);

/**
 * @swagger
 * /astrology/admin/signs:
 *   post:
 *     summary: Create a new Zodiac sign (Admin only)
 *     tags: [Astrology, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ZodiacSignInput' # Define ZodiacSignInput schema later
 *     responses:
 *       201:
 *         description: Zodiac sign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ZodiacSign' }
 *       400: { description: 'Invalid input data or sign already exists' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       500: { description: 'Server error' }
 */
// Sửa: Các route admin cho signs cần có prefix /admin/signs
router.post('/admin/signs', authMiddleware.protect, authMiddleware.restrictTo('admin'), createZodiacSignValidator, trackPerformance('createZodiacSign'), astrologyController.createZodiacSign);

/**
 * @swagger
 * /astrology/admin/signs/{id}:
 *   put:
 *     summary: Update an existing Zodiac sign (Admin only)
 *     tags: [Astrology, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the Zodiac sign to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ZodiacSignInput' # Reuse or create specific update schema
 *     responses:
 *       200:
 *         description: Zodiac sign updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ZodiacSign' }
 *       400: { description: 'Invalid input data or ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       404: { description: 'Zodiac sign not found' }
 *       500: { description: 'Server error' }
 */
router.put('/admin/signs/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), updateZodiacSignValidator, trackPerformance('updateZodiacSign'), astrologyController.updateZodiacSign);

/**
 * @swagger
 * /astrology/admin/signs/{id}:
 *   delete:
 *     summary: Delete a Zodiac sign (Admin only)
 *     tags: [Astrology, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the Zodiac sign to delete
 *     responses:
 *       200:
 *         description: Zodiac sign deleted successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiResponse' }
 *       400: { description: 'Invalid ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       404: { description: 'Zodiac sign not found' }
 *       500: { description: 'Server error' }
 */
// TODO: Add validator for zodiac ID param
router.delete('/admin/signs/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), /* zodiacIdValidator, */ trackPerformance('deleteZodiacSign'), astrologyController.deleteZodiacSign);

/**
 * @swagger
 * /astrology/admin/signs/{id}/tarot-relations:
 *   post:
 *     summary: Add a Tarot card relation to a Zodiac sign (Admin only)
 *     tags: [Astrology, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the Zodiac sign
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cardId]
 *             properties:
 *               cardId:
 *                 type: string
 *                 format: objectId
 *                 description: The ID of the Tarot card to relate
 *     responses:
 *       200:
 *         description: Tarot relation added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ZodiacSign' } # Return updated sign
 *       400: { description: 'Invalid input data or ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       404: { description: 'Zodiac sign or Card not found' }
 *       500: { description: 'Server error' }
 */
// Sửa: Các route admin cho signs cần có prefix /admin/signs
router.post('/admin/signs/:id/tarot-relations', authMiddleware.protect, authMiddleware.restrictTo('admin'), addTarotRelationValidator, trackPerformance('addTarotRelation'), astrologyController.addTarotRelation);

/**
 * @swagger
 * /astrology/admin/signs/{id}/tarot-relations/{relationId}:
 *   delete:
 *     summary: Remove a Tarot card relation from a Zodiac sign (Admin only)
 *     tags: [Astrology, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the Zodiac sign
 *       - in: path
 *         name: relationId
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the Tarot card relation to remove (which is the card's ID)
 *     responses:
 *       200:
 *         description: Tarot relation removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ZodiacSign' } # Return updated sign
 *       400: { description: 'Invalid ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       404: { description: 'Zodiac sign or relation not found' }
 *       500: { description: 'Server error' }
 */
router.delete('/admin/signs/:id/tarot-relations/:relationId', authMiddleware.protect, authMiddleware.restrictTo('admin'), removeTarotRelationValidator, trackPerformance('removeTarotRelation'), astrologyController.removeTarotRelation);

module.exports = router;
