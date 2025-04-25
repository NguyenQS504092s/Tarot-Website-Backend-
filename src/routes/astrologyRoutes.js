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
router.get('/signs', trackPerformance('getAllZodiacSigns'), astrologyController.getAllZodiacSigns);
router.get('/signs/:sign', getZodiacInfoBySignValidator, trackPerformance('getZodiacSignInfo'), astrologyController.getZodiacSignInfo);

// Routes yêu cầu đăng nhập - các route cụ thể phải đặt trước route có pattern chung
router.get('/compatibility/:sign1/:sign2', authMiddleware.protect, getZodiacCompatibilityValidator, trackPerformance('getZodiacCompatibility'), astrologyController.getZodiacCompatibility);
router.get('/tarot-relation/:sign', authMiddleware.protect, getTarotZodiacRelationValidator, trackPerformance('getTarotZodiacRelation'), astrologyController.getTarotZodiacRelation);
// Sửa: Route lấy horoscope theo sign (public)
router.get('/horoscope/:sign', getHoroscopeBySignValidator, trackPerformance('getDailyHoroscope'), astrologyController.getDailyHoroscope); 

// Routes dành cho admin - đảm bảo phải có cả middleware protect và restrictTo
// Sửa: Các route admin cho horoscope cần có prefix /admin/horoscopes
router.post('/admin/horoscopes', authMiddleware.protect, authMiddleware.restrictTo('admin'), createHoroscopeValidator, trackPerformance('createDailyHoroscope'), astrologyController.createDailyHoroscope);
router.put('/admin/horoscopes/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), updateHoroscopeValidator, trackPerformance('updateDailyHoroscope'), astrologyController.updateDailyHoroscope);
// Sửa: Các route admin cho horoscope cần có prefix /admin/horoscopes
// TODO: Add validator for horoscope ID param
router.delete('/admin/horoscopes/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), /* horoscopeIdValidator, */ trackPerformance('deleteDailyHoroscope'), astrologyController.deleteDailyHoroscope); 
// Sửa: Các route admin cho signs cần có prefix /admin/signs
router.post('/admin/signs', authMiddleware.protect, authMiddleware.restrictTo('admin'), createZodiacSignValidator, trackPerformance('createZodiacSign'), astrologyController.createZodiacSign);
router.put('/admin/signs/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), updateZodiacSignValidator, trackPerformance('updateZodiacSign'), astrologyController.updateZodiacSign);
// TODO: Add validator for zodiac ID param
router.delete('/admin/signs/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), /* zodiacIdValidator, */ trackPerformance('deleteZodiacSign'), astrologyController.deleteZodiacSign); 
// Sửa: Các route admin cho signs cần có prefix /admin/signs
router.post('/admin/signs/:id/tarot-relations', authMiddleware.protect, authMiddleware.restrictTo('admin'), addTarotRelationValidator, trackPerformance('addTarotRelation'), astrologyController.addTarotRelation);
router.delete('/admin/signs/:id/tarot-relations/:relationId', authMiddleware.protect, authMiddleware.restrictTo('admin'), removeTarotRelationValidator, trackPerformance('removeTarotRelation'), astrologyController.removeTarotRelation);

module.exports = router;
