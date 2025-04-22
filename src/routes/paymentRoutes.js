const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');

// Routes công khai
router.get('/plans', trackPerformance('getAllPlans'), paymentController.getAllPlans);
router.get('/plans/:id', trackPerformance('getPlanById'), paymentController.getPlanById);

// Stripe webhook - lưu ý cần middleware đặc biệt raw body từ app.js
router.post('/webhook', paymentController.handleStripeWebhook);

// Routes bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

router.post('/create-checkout-session', trackPerformance('createCheckoutSession'), paymentController.createCheckoutSession);
router.get('/subscription', trackPerformance('getUserSubscription'), paymentController.getUserSubscription);
router.post('/cancel-subscription', trackPerformance('cancelUserSubscription'), paymentController.cancelUserSubscription);
router.get('/payment-history', trackPerformance('getPaymentHistory'), paymentController.getPaymentHistory);

// Routes cho admin
router.use('/admin', authMiddleware.protect, authMiddleware.restrictTo('admin'));
router.post('/admin/plans', trackPerformance('createSubscriptionPlan'), paymentController.createSubscriptionPlan);
router.put('/admin/plans/:id', trackPerformance('updateSubscriptionPlan'), paymentController.updateSubscriptionPlan);
router.delete('/admin/plans/:id', trackPerformance('deleteSubscriptionPlan'), paymentController.deleteSubscriptionPlan);
router.get('/admin/payments', trackPerformance('getAllPayments'), paymentController.getAllPayments);

module.exports = router;