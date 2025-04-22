const express = require('express');
const router = express.Router();
const astrologyController = require('../controllers/astrologyController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Routes công khai
router.get('/signs', astrologyController.getAllZodiacSigns);
router.get('/signs/:sign', astrologyController.getZodiacSignInfo);

// Routes yêu cầu đăng nhập
router.get('/:sign', protect, astrologyController.getDailyHoroscope);
router.get('/compatibility/:sign1/:sign2', protect, astrologyController.getZodiacCompatibility);
router.get('/tarot-relation/:sign', protect, astrologyController.getTarotZodiacRelation);

// Routes dành cho admin
router.post('/', protect, authorize('admin'), astrologyController.createDailyHoroscope);
router.put('/:id', protect, authorize('admin'), astrologyController.updateDailyHoroscope);
router.post('/signs', protect, authorize('admin'), astrologyController.createZodiacSign);
router.put('/signs/:id', protect, authorize('admin'), astrologyController.updateZodiacSign);
router.post('/signs/:id/tarot-relations', protect, authorize('admin'), astrologyController.addTarotRelation);
router.delete('/signs/:id/tarot-relations/:relationId', protect, authorize('admin'), astrologyController.removeTarotRelation);

module.exports = router;