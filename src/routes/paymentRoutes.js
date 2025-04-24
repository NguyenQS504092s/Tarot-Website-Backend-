const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { trackPerformance } = require('../middlewares/performanceMiddleware');
const {
    // getPaymentByIdValidator, // Note: Plan ID is likely MongoID, Payment Intent ID is Stripe string
    createCheckoutSessionValidator,
    createSubscriptionPlanValidator,
    updateSubscriptionPlanValidator,
    deleteSubscriptionPlanValidator,
} = require('../validators/paymentValidators');
const { param } = require('express-validator'); // Need param for plan ID check

// Simple validator for MongoID param - can be moved to a shared validator file
const mongoIdParamValidator = (paramName = 'id') => [
    param(paramName)
        .notEmpty().withMessage(`${paramName} is required.`)
        .isMongoId().withMessage(`Invalid ${paramName} format.`),
    (req, res, next) => { // Reusable error handler part
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map(err => ({ field: err.param, message: err.msg, value: err.value }));
            return next(new (require('../utils/apiError'))(400, 'Validation failed', formattedErrors));
        }
        next();
    }
];

// Routes công khai
router.get('/plans', trackPerformance('getAllPlans'), paymentController.getAllPlans);
router.get('/plans/:id', mongoIdParamValidator('id'), trackPerformance('getPlanById'), paymentController.getPlanById);

// Stripe webhook - lưu ý cần middleware đặc biệt raw body từ app.js
router.post('/webhook', paymentController.stripeWebhook); // Fixed function name

// Routes bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

router.post('/create-checkout-session', createCheckoutSessionValidator, trackPerformance('createCheckoutSession'), paymentController.createCheckoutSession);
router.get('/subscription', trackPerformance('getCurrentSubscription'), paymentController.getCurrentSubscription); // Fixed function name
// TODO: Add validation if needed for cancel subscription (e.g., subscription ID if passed in body)
router.post('/cancel-subscription', trackPerformance('cancelUserSubscription'), paymentController.cancelSubscription); // Assuming this is the correct controller function name
router.get('/payment-history', trackPerformance('getPaymentHistory'), paymentController.getPaymentHistory);

// Routes cho admin - Middleware applied to /admin path
router.use('/admin', authMiddleware.restrictTo('admin')); // protect is already applied above

// Define routes relative to /admin (paths should not repeat /admin)
router.post('/plans', createSubscriptionPlanValidator, trackPerformance('createSubscriptionPlan'), paymentController.createSubscriptionPlan); // Path: /api/payments/admin/plans
router.put('/plans/:id', updateSubscriptionPlanValidator, trackPerformance('updateSubscriptionPlan'), paymentController.updateSubscriptionPlan); // Path: /api/payments/admin/plans/:id
router.delete('/plans/:id', deleteSubscriptionPlanValidator, trackPerformance('deleteSubscriptionPlan'), paymentController.deleteSubscriptionPlan); // Path: /api/payments/admin/plans/:id
router.get('/payments', trackPerformance('getAllPayments'), paymentController.getAllPayments); // Path: /api/payments/admin/payments
// TODO: Add route and validator for getting a specific payment by ID (admin) if needed

module.exports = router;
