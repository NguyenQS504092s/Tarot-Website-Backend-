const express = require('express');
const router = express.Router();
const astrologyController = require('../controllers/astrologyController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes công khai
router.get('/signs', astrologyController.getAllZodiacSigns);
router.get('/signs/:sign', astrologyController.getZodiacSignInfo);

// Routes yêu cầu đăng nhập
router.get('/:sign', authMiddleware.protect, astrologyController.getDailyHoroscope);
router.get('/compatibility/:sign1/:sign2', authMiddleware.protect, astrologyController.getZodiacCompatibility);
router.get('/tarot-relation/:sign', authMiddleware.protect, astrologyController.getTarotZodiacRelation);

// Routes dành cho admin
router.post('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), astrologyController.createDailyHoroscope);
router.put('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), astrologyController.updateDailyHoroscope);
router.post('/signs', authMiddleware.protect, authMiddleware.restrictTo('admin'), astrologyController.createZodiacSign);
router.put('/signs/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), astrologyController.updateZodiacSign);
router.post('/signs/:id/tarot-relations', authMiddleware.protect, authMiddleware.restrictTo('admin'), astrologyController.addTarotRelation);
router.delete('/signs/:id/tarot-relations/:relationId', authMiddleware.protect, authMiddleware.restrictTo('admin'), astrologyController.removeTarotRelation);

module.exports = router;