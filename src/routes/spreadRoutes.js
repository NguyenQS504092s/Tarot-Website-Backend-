const express = require('express');
const spreadController = require('../controllers/spreadController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createSpreadValidator,
  updateSpreadValidator,
  spreadIdValidator
} = require('../validators/spreadValidators'); // Import validators

const router = express.Router();

// Public routes
router.get('/', spreadController.getAllActiveSpreads);
router.get(
    '/:id',
    spreadIdValidator, // Apply ID validator for public access too
    spreadController.getSpreadById // Use the same controller, logic inside handles public/private
);

// --- Admin Routes ---
// Apply admin protection specifically to admin-only actions
const adminRouter = express.Router();
adminRouter.use(protect, restrictTo('admin'));

adminRouter.route('/')
  .post(
    createSpreadValidator, // Apply create validator
    spreadController.createSpread
  );

adminRouter.route('/:id')
  .get( // Add GET route for admin to fetch any spread by ID
    spreadIdValidator,
    spreadController.getSpreadById // Use the same controller, auth middleware ensures admin access
  )
  .put(
    updateSpreadValidator, // Apply update validator (includes ID check)
    spreadController.updateSpread
  )
  .delete(
    spreadIdValidator, // Apply ID validator
    spreadController.deleteSpread
  );

// Mount the admin router under /admin prefix
router.use('/admin', adminRouter);

module.exports = router;
