# Codebase Summary

## Key Components and Their Interactions
- **`src/server.js`:** Main entry point. Handles server startup, environment variable checks, database connection initiation (via `src/config/database.js`), uncaught exception/rejection handling, and graceful shutdown.
- **`src/app.js`:** Configures the Express application. Sets up middleware (security, CORS, rate limiting, body parsing), defines routes by mounting routers from `src/routes/`, includes a 404 handler, and integrates the main error handling middleware (`src/middlewares/errorMiddleware.js`).
- **`src/config/`:** Contains configuration files (e.g., `config.js`, `database.js`, `swagger.js`).
- **`src/controllers/`:** Handles incoming requests, interacts with services, and sends responses (e.g., `userController`, `cardController`, `readingController`, `spreadController`).
- **`src/middlewares/`:** Contains custom middleware functions (e.g., `authMiddleware`, `errorMiddleware`, `performanceMiddleware`).
- **`src/models/`:** Defines Mongoose schemas for database collections (e.g., `User`, `Card`, `Reading`, `Spread`).
- **`src/routes/`:** Defines API endpoints and maps them to controller functions (e.g., `userRoutes`, `cardRoutes`, `readingRoutes`, `spreadRoutes`).
- **`src/services/`:** Contains the core business logic (e.g., `cardService`, `readingService`, `spreadService`, `astrologyService`, `chatService`, `paymentService`).
- **`src/utils/`:** Holds utility functions (e.g., `logger`, `apiError`, `apiResponse`, `stringUtils`).
- **`src/validators/`:** Contains input validation logic using `express-validator`.
- **`src/tests/`:** Contains integration tests using Jest and Supertest.
- **`scripts/`:** Contains utility scripts (e.g., `seedSpreads.js`).

- **Docker Configuration:**
    - **`Dockerfile`:** Defines the build process for the backend Docker image. Uses a multi-stage build, copies necessary files, exposes port 5005, sets `NODE_ENV=production`, includes a `HEALTHCHECK`, and runs as a non-root user (`node`). (Đã xác nhận cấu hình tốt).
    - **`docker-compose.yml`:** Defines `tarot-backend` và `mongo` services. `tarot-backend` builds from `Dockerfile`, maps port 5005, depends on `mongo`. `mongo` service uses the `mongo` (latest) image to resolve compatibility issues, persists data via `mongo-data` volume. Healthcheck for `mongo` was removed to simplify startup; `depends_on` for `tarot-backend` reverted to simple dependency. Network `tarot-network` is defined. Environment variables should be managed via `env_file` or secrets in production.

## Data Flow
- Incoming requests hit `src/app.js`.
- Requests pass through configured middleware (security, CORS, rate limiting, parsers).
- Matching routes in `src/routes/` direct the request to the appropriate controller in `src/controllers/`.
- Input validation middleware (from `src/validators/`) runs before the controller logic.
- Controllers may call services in `src/services/` for business logic and data operations.
- Services interact with models in `src/models/` to access the database (MongoDB).
- Responses flow back through controllers and middleware (including error handling) to the client, formatted using `ApiResponse`.

## External Dependencies
- **Core:** Express.js, Mongoose, dotenv
- **Middleware & Utilities:** helmet, cors, express-rate-limit, winston, winston-daily-rotate-file, express-validator, bcryptjs, jsonwebtoken, crypto, swagger-jsdoc, swagger-ui-express
- **Testing:** jest, supertest, cross-env
- **External APIs:** Stripe (for payments - currently disabled)
- **Dependency Management:** `package.json` (npm), `dotenv-cli` (for running scripts with .env)

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
- **Input Validation (Phase 4 - 2025-04-27):**
    - Integrated `express-validator` for comprehensive input validation across all relevant routes.
- **Testing & Optimization (Phase 4 - 2025-04-27/28):**
    - Implemented comprehensive integration tests using Jest and Supertest for all modules (User Auth, Cards, Readings, Astrology, Spreads).
    - Fixed numerous bugs identified during testing (validation errors, access control issues, data consistency, API response structure).
    - Configured separate test database and environment variables.
    - Addressed Jest configuration issues (timeouts, environment setup).
- **Deployment Setup (Phase 5 - 2025-04-27):**
    - Created `Dockerfile` and `docker-compose.yml` for containerized deployment.
    - Optimized `Dockerfile` using multi-stage builds.
    - Configured logging for Docker compatibility.
    - Added health checks to `docker-compose.yml`.
    - Documented required environment variables and deployment considerations in `README.md`.
    - Created a basic deployment guide (`userInstructions/deployment_guide.md`).
    - Temporarily disabled payment module (Stripe) due to missing secrets.
- **Codebase Cleanup & Refactoring (Phase 6 - 2025-04-27):**
    - Reviewed `config`, `utils`, `middlewares`, `models`, `services`, and `controllers`.
    - Removed redundant `messageModel.js` as message logic is embedded in `chatModel.js`.
    - Refactored `chatService.js` to correctly use the embedded message schema within `chatModel.js`.
    - Minor JSDoc updates in `utils`.
    - Confirmed other components (config, middlewares, models, other services, controllers) are generally well-structured and require no major changes.
- **API Documentation (Swagger - 2025-04-27):**
    - Confirmed Swagger setup is integrated and functional.
    - Verified JSDoc comments exist for main routes.
- **Spread Management Module (2025-04-27/28):**
    - Added `spreadModel.js` to manage Tarot spread definitions in the database.
    - Created `spreadService.js` with CRUD operations for spreads.
    - Implemented `spreadController.js` and `spreadRoutes.js` for managing spreads via API (Admin CRUD, Public GET).
    - Updated `readingService.js` and related components to use spread data from the database instead of hardcoded logic.
    - Deprecated the old `/api/readings/spreads` endpoint in favor of `/api/spreads`.
    - Added validation (`spreadValidators.js`) for Spread CRUD operations.
    - Implemented seeding script (`scripts/seedSpreads.js`) and added `seed:spreads` command to `package.json` for initial Spread data.
    - Implemented and passed all tests for the Spread module (`src/tests/spread.test.js`).
- **Deployment Preparation & Troubleshooting (Phase 7-9 - 2025-04-28 & 2025-05-07):**
    - Reviewed and prepared Docker configuration for production deployment.
    - Troubleshooted and resolved Docker Compose startup issues:
        - Fixed MongoDB connection errors (`getaddrinfo ENOTFOUND mongo`, `ECONNREFUSED`) by adjusting `depends_on` and `healthcheck` (eventually removing mongo healthcheck).
        - Resolved MongoDB version incompatibility (`featureCompatibilityVersion`) by updating the `mongo` image to latest in `docker-compose.yml`.
        - Fixed `ReferenceError` in graceful shutdown logic in `src/server.js`.
    - Confirmed successful local startup using `docker compose up`.
    - Reverted Vercel-specific configurations (`vercel.json`, CI/CD workflow) to focus on Docker Compose deployment.
    - Updated deployment guide (`userInstructions/deployment_guide.md`) with detailed steps for Docker Compose on a Linux server, emphasizing security best practices.
    - Updated project documentation (`projectRoadmap.md`, `currentTask.md`) to reflect completion of deployment preparation.

## User Feedback Integration
- Not applicable yet.

## Additional Documentation References
- `cline_docs/projectRoadmap.md`
- `cline_docs/currentTask.md`
- `cline_docs/techStack.md`
- `plan.md` (Initial project plan)
