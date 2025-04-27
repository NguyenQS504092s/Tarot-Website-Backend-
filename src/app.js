const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes (sẽ tạo sau)
const userRoutes = require('./routes/userRoutes');
const cardRoutes = require('./routes/cardRoutes');
const readingRoutes = require('./routes/readingRoutes');
const astrologyRoutes = require('./routes/astrologyRoutes');

// Import middleware
const errorMiddleware = require('./middlewares/errorMiddleware');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all requests
app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/horoscope', astrologyRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to Tarot Website API');
});

// Error handler middleware
app.use(errorMiddleware);

// Export app for testing
module.exports = app;