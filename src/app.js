const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const config = require('./config/config'); // Import config
const ApiError = require('./utils/apiError'); // Import ApiError

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const cardRoutes = require('./routes/cardRoutes');
const readingRoutes = require('./routes/readingRoutes');
const astrologyRoutes = require('./routes/astrologyRoutes');
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Import middleware
const errorMiddleware = require('./middlewares/errorMiddleware');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: config.corsOrigin, // Use config value
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // Use config value
  max: config.rateLimitMax, // Use config value
  message: 'Quá nhiều yêu cầu từ IP của bạn, vui lòng thử lại sau 15 phút',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Special handling for Stripe webhooks (raw body needed)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/astrology', astrologyRoutes); // Sửa prefix
app.use('/api/chats', chatRoutes);
app.use('/api/payments', paymentRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to Tarot Website API');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 - Route not found
app.use((req, res, next) => {
  // Pass error to the centralized error handler
  next(new ApiError(`Không tìm thấy đường dẫn: ${req.originalUrl}`, 404));
});

// Error handler middleware should be last
app.use(errorMiddleware);

// Export app for testing
module.exports = app;
