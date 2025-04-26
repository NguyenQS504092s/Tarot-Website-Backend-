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

/**
 * @swagger
 * /payments/plans:
 *   get:
 *     summary: Get a list of available subscription plans
 *     tags: [Payments, Plans]
 *     responses:
 *       200:
 *         description: A list of subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubscriptionPlan' # Define SubscriptionPlan schema later
 *       500: { description: 'Server error' }
 */
router.get('/plans', trackPerformance('getAllPlans'), paymentController.getAllPlans);

/**
 * @swagger
 * /payments/plans/{id}:
 *   get:
 *     summary: Get details of a specific subscription plan
 *     tags: [Payments, Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the subscription plan
 *     responses:
 *       200:
 *         description: Subscription plan details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/SubscriptionPlan' }
 *       400: { description: 'Invalid ID format' }
 *       404: { description: 'Plan not found' }
 *       500: { description: 'Server error' }
 */
router.get('/plans/:id', mongoIdParamValidator('id'), trackPerformance('getPlanById'), paymentController.getPlanById);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint to handle payment events
 *     tags: [Payments, Webhooks]
 *     description: >
 *       This endpoint receives events from Stripe (e.g., payment success, subscription updates).
 *       It requires a special middleware in app.js to handle the raw request body from Stripe.
 *       **Do not call this endpoint directly.**
 *     requestBody:
 *       description: Stripe event object (raw JSON)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object # Stripe event structure
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received: { type: boolean, example: true }
 *       400:
 *         description: Invalid webhook signature or payload
 *       500:
 *         description: Error processing webhook event
 */
// Stripe webhook - lưu ý cần middleware đặc biệt raw body từ app.js
router.post('/webhook', paymentController.stripeWebhook); // Fixed function name

// Routes bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

/**
 * @swagger
 * /payments/create-checkout-session:
 *   post:
 *     summary: Create a Stripe Checkout session for a subscription plan
 *     tags: [Payments, Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId:
 *                 type: string
 *                 format: objectId
 *                 description: The ID of the subscription plan to purchase
 *               successUrl: # Optional, can be configured globally
 *                 type: string
 *                 format: url
 *                 description: URL to redirect to on successful payment
 *               cancelUrl: # Optional, can be configured globally
 *                 type: string
 *                 format: url
 *                 description: URL to redirect to on cancelled payment
 *     responses:
 *       200:
 *         description: Stripe Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         sessionId: { type: string, example: 'cs_test_a1...' }
 *                         url: { type: string, format: url, example: 'https://checkout.stripe.com/...' }
 *       400: { description: 'Invalid input data (e.g., invalid planId)' }
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'Plan not found' }
 *       500: { description: 'Error creating Stripe session' }
 */
router.post('/create-checkout-session', createCheckoutSessionValidator, trackPerformance('createCheckoutSession'), paymentController.createCheckoutSession);

/**
 * @swagger
 * /payments/subscription:
 *   get:
 *     summary: Get the current user's active subscription details
 *     tags: [Payments, Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's current subscription details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Subscription' } # Define Subscription schema later (might include plan details, status, dates)
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'User has no active subscription' }
 *       500: { description: 'Server error' }
 */
router.get('/subscription', trackPerformance('getCurrentSubscription'), paymentController.getCurrentSubscription); // Fixed function name

/**
 * @swagger
 * /payments/cancel-subscription:
 *   post:
 *     summary: Cancel the current user's active subscription
 *     tags: [Payments, Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully (or scheduled for cancellation at period end)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Subscription' } # Return updated subscription status
 *       401: { description: 'Unauthorized' }
 *       404: { description: 'No active subscription found to cancel' }
 *       500: { description: 'Error cancelling subscription with Stripe' }
 */
// TODO: Add validation if needed for cancel subscription (e.g., subscription ID if passed in body)
router.post('/cancel-subscription', trackPerformance('cancelUserSubscription'), paymentController.cancelSubscription); // Assuming this is the correct controller function name

/**
 * @swagger
 * /payments/payment-history:
 *   get:
 *     summary: Get the current user's payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters: # Add pagination/sorting if needed
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: -createdAt }
 *     responses:
 *       200:
 *         description: A list of the user's past payments
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         payments:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Payment' } # Define Payment schema later
 *                         pagination: { type: object }
 *       401: { description: 'Unauthorized' }
 *       500: { description: 'Server error' }
 */
router.get('/payment-history', trackPerformance('getPaymentHistory'), paymentController.getPaymentHistory);

// Routes cho admin - Middleware applied to /admin path
router.use('/admin', authMiddleware.restrictTo('admin')); // protect is already applied above

// Define routes relative to /admin (paths should not repeat /admin)

/**
 * @swagger
 * /payments/admin/plans:
 *   post:
 *     summary: Create a new subscription plan (Admin only)
 *     tags: [Payments, Plans, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionPlanInput' # Define SubscriptionPlanInput schema later
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/SubscriptionPlan' }
 *       400: { description: 'Invalid input data' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       500: { description: 'Server error' }
 */
router.post('/plans', createSubscriptionPlanValidator, trackPerformance('createSubscriptionPlan'), paymentController.createSubscriptionPlan); // Path: /api/payments/admin/plans

/**
 * @swagger
 * /payments/admin/plans/{id}:
 *   put:
 *     summary: Update an existing subscription plan (Admin only)
 *     tags: [Payments, Plans, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the plan to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionPlanInput' # Reuse or create specific update schema
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/SubscriptionPlan' }
 *       400: { description: 'Invalid input data or ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       404: { description: 'Plan not found' }
 *       500: { description: 'Server error' }
 */
router.put('/plans/:id', updateSubscriptionPlanValidator, trackPerformance('updateSubscriptionPlan'), paymentController.updateSubscriptionPlan); // Path: /api/payments/admin/plans/:id

/**
 * @swagger
 * /payments/admin/plans/{id}:
 *   delete:
 *     summary: Delete a subscription plan (Admin only)
 *     tags: [Payments, Plans, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: objectId }
 *         description: The ID of the plan to delete
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiResponse' }
 *       400: { description: 'Invalid ID format' }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       404: { description: 'Plan not found' }
 *       500: { description: 'Server error (e.g., plan still in use)' }
 */
router.delete('/plans/:id', deleteSubscriptionPlanValidator, trackPerformance('deleteSubscriptionPlan'), paymentController.deleteSubscriptionPlan); // Path: /api/payments/admin/plans/:id

/**
 * @swagger
 * /payments/admin/payments:
 *   get:
 *     summary: Get a list of all payments (Admin only)
 *     tags: [Payments, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters: # Add pagination/sorting/filtering if needed
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: -createdAt }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: objectId }
 *         description: Filter by user ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [succeeded, pending, failed] } # Example statuses
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: A list of all payments
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         payments:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Payment' }
 *                         pagination: { type: object }
 *       401: { description: 'Unauthorized' }
 *       403: { description: 'Forbidden' }
 *       500: { description: 'Server error' }
 */
router.get('/payments', trackPerformance('getAllPayments'), paymentController.getAllPayments); // Path: /api/payments/admin/payments
// TODO: Add route and validator for getting a specific payment by ID (admin) if needed

module.exports = router;
