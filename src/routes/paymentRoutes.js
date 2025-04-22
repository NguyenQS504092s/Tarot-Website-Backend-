const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Special route for Stripe webhook - doesn't use auth middleware
router.post('/webhook', paymentController.stripeWebhook);

// Public routes
router.get('/plans', paymentController.getAllPlans);
router.get('/plans/:id', paymentController.getPlanById);

// Routes that require authentication
router.use(authMiddleware.protect);

// Payment routes for authenticated users
router.post('/create-checkout-session', paymentController.createCheckoutSession);
router.get('/subscription', paymentController.getCurrentSubscription);
router.delete('/subscription', paymentController.cancelSubscription);
router.get('/history', paymentController.getPaymentHistory);

// Admin routes
router.use(authMiddleware.restrictTo('admin'));

// Create and update subscription plans
router.post('/plans', paymentController.createPlan);
router.put('/plans/:id', paymentController.updatePlan);

module.exports = router;