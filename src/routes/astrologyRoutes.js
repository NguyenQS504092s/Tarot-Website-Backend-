const express = require('express');
const astrologyController = require('../controllers/astrologyController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes công khai
router.get('/signs', astrologyController.getAllZodiacSigns);
router.get('/signs/:sign', astrologyController.getZodiacSignInfo);

// Routes có xác thực
router.use(authMiddleware.protect);

// Lấy tử vi hàng ngày theo cung hoàng đạo
router.get('/horoscope/:sign', astrologyController.getDailyHoroscope);

// Tương hợp giữa các cung hoàng đạo
router.get('/compatibility/:sign1/:sign2', astrologyController.getZodiacCompatibility);

// Liên kết giữa Tarot và cung hoàng đạo
router.get('/tarot-relation/:sign', astrologyController.getTarotZodiacRelation);

// Routes chỉ dành cho admin
router.use(authMiddleware.restrictTo('admin'));
router.post('/horoscope', astrologyController.createDailyHoroscope);
router.put('/horoscope/:id', astrologyController.updateDailyHoroscope);

module.exports = router;