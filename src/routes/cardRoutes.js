const express = require('express');
const cardController = require('../controllers/cardController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes công khai - không yêu cầu đăng nhập
router.get('/', cardController.getAllCards);
router.get('/:id', cardController.getCard);
router.get('/deck/:deckName', cardController.getCardsByDeck);
router.get('/type/:cardType', cardController.getCardsByType);

// Routes cho admin - yêu cầu quyền admin
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.post('/', cardController.createCard);
router.put('/:id', cardController.updateCard);
router.delete('/:id', cardController.deleteCard);

module.exports = router;