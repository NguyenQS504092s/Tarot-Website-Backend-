const express = require('express');
const readingController = require('../controllers/readingController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả routes yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes cho người dùng
router.post('/', readingController.createReading);
router.get('/history', readingController.getUserReadingHistory);
router.get('/:id', readingController.getReadingById);
router.put('/:id/feedback', readingController.addFeedbackToReading);

// Routes cho người đọc bài
router.use('/reader', authMiddleware.restrictTo('reader', 'admin'));
router.get('/reader/pending', readingController.getPendingReadings);
router.put('/reader/:id/interpret', readingController.addInterpretation);

// Routes cho admin
router.use('/admin', authMiddleware.restrictTo('admin'));
router.get('/admin/all', readingController.getAllReadings);
router.delete('/admin/:id', readingController.deleteReading);

// Routes cho spread (cách trải bài)
router.get('/spreads', readingController.getAllSpreads);
router.post('/spreads', authMiddleware.restrictTo('admin'), readingController.createSpread);

module.exports = router;