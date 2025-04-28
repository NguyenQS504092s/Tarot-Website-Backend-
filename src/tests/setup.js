// src/tests/setup.js
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const logger = require('../utils/logger'); // Import logger for consistency

// Load environment variables from .env file specifically for tests
// Ensure this runs before any other code that relies on process.env
dotenv.config({ path: './.env' });

// Ensure NODE_ENV is set to 'test' before any tests run
process.env.NODE_ENV = 'test';
console.log(`[Jest Setup] Set NODE_ENV to: ${process.env.NODE_ENV}`);
console.log(`[Jest Setup] MONGODB_TEST_URI loaded: ${process.env.MONGODB_TEST_URI ? 'Yes' : 'No'}`);

/**
 * Clears all collections in the test database.
 * Should be called in beforeEach or afterEach hook.
 */
const clearTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    logger.warn('[clearTestDB] No database connection. Skipping clear.');
    return;
  }
  const collections = mongoose.connection.collections;
  const promises = [];
  for (const key in collections) {
    const collection = collections[key];
    promises.push(collection.deleteMany({}));
  }
  try {
    await Promise.all(promises);
    // logger.info('[clearTestDB] All test collections cleared.'); // Optional: reduce noise
  } catch (error) {
    logger.error(`[clearTestDB] Error clearing test database: ${error.message}`);
    // Decide if you want to throw or just log
    // throw error;
  }
};

// Optional: Add any other global setup needed for tests
// For example, increasing the default timeout for async operations if needed globally
// jest.setTimeout(30000); // Example: 30 seconds timeout

// Export the clear function so it can be used in test files
module.exports = {
  clearTestDB,
};
