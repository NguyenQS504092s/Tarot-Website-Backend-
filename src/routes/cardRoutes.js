const express = require('express');
const cardController = require('../controllers/cardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');

const router = express.Router();

// Routes công khai - không yêu cầu đăng nhập
router.get('/', trackPerformance('getAllCards'), cardController.getAllCards);
// Đặt các route cụ thể trước route với params
router.get('/deck/:deckName', trackPerformance('getCardsByDeck'), cardController.getCardsByDeck);
router.get('/type/:cardType', trackPerformance('getCardsByType'), cardController.getCardsByType);
// Route có param id phải đặt sau các route cụ thể khác
router.get('/:id', trackPerformance('getCard'), cardController.getCard);

// Routes cho admin - yêu cầu quyền admin
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.post('/', trackPerformance('createCard'), cardController.createCard);
router.put('/:id', trackPerformance('updateCard'), cardController.updateCard);
router.delete('/:id', trackPerformance('deleteCard'), cardController.deleteCard);

module.exports = router;