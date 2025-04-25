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
// Apply the validator to the create reading route
router.post('/', createReadingValidator, trackPerformance('createReading'), readingController.createReading); 
// TODO: Add validation for random reading if needed (e.g., spreadType if provided)
router.post('/random', trackPerformance('createRandomReading'), readingController.createRandomReading);
router.get('/history', trackPerformance('getUserReadingHistory'), readingController.getUserReadingHistory);
router.get('/spreads', trackPerformance('getAllSpreads'), readingController.getAllSpreads); // Added trackPerformance

// Routes cho reader
router.use('/reader', authMiddleware.restrictTo('reader', 'admin'));
router.get('/reader/pending', trackPerformance('getPendingReadings'), readingController.getPendingReadings);
router.put('/reader/:id/interpret', getReadingByIdValidator, addInterpretationValidator, trackPerformance('addInterpretation'), readingController.addInterpretation);

// Routes cho admin
router.use('/admin', authMiddleware.restrictTo('admin'));
router.get('/admin/all', trackPerformance('getAllReadings'), readingController.getAllReadings);
router.put('/admin/:id', getReadingByIdValidator, updateReadingValidator, trackPerformance('updateReading'), readingController.updateReading); // Added route for admin update with validator
router.delete('/admin/:id', getReadingByIdValidator, trackPerformance('deleteReading'), readingController.deleteReading); // Added trackPerformance
// TODO: Add validation for creating spreads
router.post('/admin/spreads', trackPerformance('createSpread'), readingController.createSpread); // Moved under /admin, added trackPerformance, removed inline restrictTo

// Route với ID phải đặt sau các route cụ thể
router.get('/:id', getReadingByIdValidator, trackPerformance('getReadingById'), readingController.getReadingById);
router.get('/:id/auto-interpretation', getReadingByIdValidator, trackPerformance('getAutoInterpretation'), readingController.getAutoInterpretation);
router.put('/:id/feedback', getReadingByIdValidator, addFeedbackValidator, trackPerformance('addFeedbackToReading'), readingController.addFeedbackToReading);

module.exports = router;
