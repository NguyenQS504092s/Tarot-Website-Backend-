const express = require('express');
const readingController = require('../controllers/readingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');

const router = express.Router();

// Tất cả routes yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes cụ thể phải đặt trước route có pattern chung
// Routes cho người dùng
router.post('/', trackPerformance('createReading'), readingController.createReading);
router.post('/random', trackPerformance('createRandomReading'), readingController.createRandomReading);
router.get('/history', trackPerformance('getUserReadingHistory'), readingController.getUserReadingHistory);
router.get('/spreads', trackPerformance('getAllSpreads'), readingController.getAllSpreads); // Added trackPerformance

// Routes cho reader
router.use('/reader', authMiddleware.restrictTo('reader', 'admin'));
router.get('/reader/pending', trackPerformance('getPendingReadings'), readingController.getPendingReadings);
router.put('/reader/:id/interpret', trackPerformance('addInterpretation'), readingController.addInterpretation);

// Routes cho admin
router.use('/admin', authMiddleware.restrictTo('admin'));
router.get('/admin/all', trackPerformance('getAllReadings'), readingController.getAllReadings);
router.delete('/admin/:id', trackPerformance('deleteReading'), readingController.deleteReading); // Added trackPerformance
router.post('/admin/spreads', trackPerformance('createSpread'), readingController.createSpread); // Moved under /admin, added trackPerformance, removed inline restrictTo

// Route với ID phải đặt sau các route cụ thể
router.get('/:id', trackPerformance('getReadingById'), readingController.getReadingById);
router.get('/:id/auto-interpretation', trackPerformance('getAutoInterpretation'), readingController.getAutoInterpretation);
router.put('/:id/feedback', trackPerformance('addFeedbackToReading'), readingController.addFeedbackToReading);

module.exports = router;
