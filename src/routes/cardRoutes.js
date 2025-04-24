const express = require('express');
const cardController = require('../controllers/cardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');
const {
    getCardByIdValidator,
    createCardValidator,
    updateCardValidator,
    getCardsByDeckValidator,
    getCardsByTypeValidator,
    // Import getCardBySlugValidator if a slug route is added
} = require('../validators/cardValidators');

const router = express.Router();

// Routes công khai - không yêu cầu đăng nhập
router.get('/', trackPerformance('getAllCards'), cardController.getAllCards);
// Đặt các route cụ thể trước route với params
router.get('/deck/:deckName', getCardsByDeckValidator, trackPerformance('getCardsByDeck'), cardController.getCardsByDeck);
router.get('/type/:cardType', getCardsByTypeValidator, trackPerformance('getCardsByType'), cardController.getCardsByType);
// Route có param id phải đặt sau các route cụ thể khác
router.get('/:id', getCardByIdValidator, trackPerformance('getCard'), cardController.getCard); // Already validated

// Routes cho admin - yêu cầu quyền admin
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.post('/', createCardValidator, trackPerformance('createCard'), cardController.createCard);
router.put('/:id', updateCardValidator, trackPerformance('updateCard'), cardController.updateCard); // updateCardValidator includes ID check
router.delete('/:id', getCardByIdValidator, trackPerformance('deleteCard'), cardController.deleteCard);

module.exports = router;
