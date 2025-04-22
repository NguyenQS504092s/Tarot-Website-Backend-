# Codebase Summary

## Key Components and Their Interactions
- **`src/server.js`:** Main entry point. Handles server startup, environment variable checks, database connection initiation (via `src/config/database.js`), uncaught exception/rejection handling, and graceful shutdown.
- **`src/app.js`:** Configures the Express application. Sets up middleware (security, CORS, rate limiting, body parsing), defines routes by mounting routers from `src/routes/`, includes a 404 handler, and integrates the main error handling middleware (`src/middlewares/errorMiddleware.js`).
- **`src/config/`:** Likely contains configuration files (e.g., `config.js`, `database.js`).
- **`src/controllers/`:** Handles incoming requests, interacts with services, and sends responses.
- **`src/middlewares/`:** Contains custom middleware functions (e.g., authentication, error handling).
- **`src/models/`:** Defines Mongoose schemas for database collections.
- **`src/routes/`:** Defines API endpoints and maps them to controller functions.
- **`src/services/`:** Contains the core business logic (e.g., `cardService`, `readingService`).
- **`src/utils/`:** Holds utility functions (e.g., `logger`, `apiError`, `apiResponse`, `stringUtils`).

## Data Flow
- Incoming requests hit `src/app.js`.
- Requests pass through configured middleware (security, CORS, rate limiting, parsers).
- Matching routes in `src/routes/` direct the request to the appropriate controller in `src/controllers/`.
- Controllers may call services in `src/services/` for business logic and data operations.
- Services interact with models in `src/models/` to access the database (MongoDB).
- Responses flow back through controllers and middleware (including error handling) to the client.

## External Dependencies
- **Core:** Express.js, Mongoose, dotenv
- **Middleware:** helmet, cors, express-rate-limit, winston, winston-daily-rotate-file
- **External APIs:** Stripe (for payments)
- **Dependency Management:** `package.json` (npm or yarn assumed) - *Specific versions not reviewed yet.*

## Recent Significant Changes
- **Detailed Review & Fixes (2025-04-22):**
    - Reviewed and applied fixes across `config`, `middlewares`, `utils`, `models`, `routes`, `controllers`, and `services`.
    - Standardized response formatting using `ApiResponse`.
    - Ensured consistent error handling with `ApiError`.
    - Removed redundant code, fallback data, and unused functions.
    - Corrected Mongoose schema options (deprecated options, enums, indexes).
    - Refactored model methods to remove `save()` side effects.
    - Centralized configuration usage (rate limits, performance thresholds).
    - Added log rotation using `winston-daily-rotate-file`.
    - Improved efficiency in some service/controller logic (e.g., population).
    - Corrected route definitions (prefixing, middleware application).
    - Added missing controller functions (`deleteSubscriptionPlan`, `getAllPayments`).
    - Created `stringUtils` for reusable normalization.
    - **Key Remaining Recommendation:** Implement comprehensive input validation (e.g., using `express-validator`).

## User Feedback Integration
- Not applicable yet.

## Additional Documentation References
- `cline_docs/projectRoadmap.md`
- `cline_docs/currentTask.md`
- `cline_docs/techStack.md`
- `cline_docs/stringUtils.js` (Utility functions)
- `plan.md` (Initial project plan)
