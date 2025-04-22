const express = require('express');
const router = express.Router();
const astrologyController = require('../controllers/astrologyController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');

// Routes công khai
router.get('/signs', trackPerformance('getAllZodiacSigns'), astrologyController.getAllZodiacSigns);
router.get('/signs/:sign', trackPerformance('getZodiacSignInfo'), astrologyController.getZodiacSignInfo);

// Routes yêu cầu đăng nhập - các route cụ thể phải đặt trước route có pattern chung
router.get('/compatibility/:sign1/:sign2', authMiddleware.protect, trackPerformance('getZodiacCompatibility'), astrologyController.getZodiacCompatibility);
router.get('/tarot-relation/:sign', authMiddleware.protect, trackPerformance('getTarotZodiacRelation'), astrologyController.getTarotZodiacRelation);
// Route /:sign phải đặt sau các route cụ thể
router.get('/:sign', authMiddleware.protect, trackPerformance('getDailyHoroscope'), astrologyController.getDailyHoroscope);

// Routes dành cho admin - đảm bảo phải có cả middleware protect và restrictTo
router.post('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), trackPerformance('createDailyHoroscope'), astrologyController.createDailyHoroscope);
router.put('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), trackPerformance('updateDailyHoroscope'), astrologyController.updateDailyHoroscope);
router.post('/signs', authMiddleware.protect, authMiddleware.restrictTo('admin'), trackPerformance('createZodiacSign'), astrologyController.createZodiacSign);
router.put('/signs/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), trackPerformance('updateZodiacSign'), astrologyController.updateZodiacSign);
router.post('/signs/:id/tarot-relations', authMiddleware.protect, authMiddleware.restrictTo('admin'), trackPerformance('addTarotRelation'), astrologyController.addTarotRelation);
router.delete('/signs/:id/tarot-relations/:relationId', authMiddleware.protect, authMiddleware.restrictTo('admin'), trackPerformance('removeTarotRelation'), astrologyController.removeTarotRelation);

module.exports = router;