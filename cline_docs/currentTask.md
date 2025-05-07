# Current Task

## Current Objectives
- [ ] **Giai Đoạn 7: Chuẩn Bị Triển Khai - Bắt đầu lại (Lần 2)**
  - [x] **Review Docker Configuration:** Xem xét lại `Dockerfile` và `docker-compose.yml` để đảm bảo tối ưu hóa cho production (kích thước image, bảo mật, biến môi trường).
    - [x] Phân tích `Dockerfile`. (Đã hoàn thành, cấu hình tốt)
    - [x] Phân tích `docker-compose.yml`. (Đã hoàn thành, cấu hình cơ bản tốt, cần chú ý quản lý bí mật và bật auth DB cho production)
  - [ ] **Production Environment Variables:** Xác định và tài liệu hóa tất cả các biến môi trường cần thiết cho production.

## Context
- Dự án đã hoàn thành các giai đoạn phát triển, kiểm thử, Docker cơ bản, tài liệu hóa API.
- Người dùng yêu cầu thực hiện lại Giai Đoạn 7 để kiểm tra kỹ lưỡng hơn trước khi triển khai.
- Đã rà soát cấu hình Docker (`Dockerfile`, `docker-compose.yml`).

## Next Steps
- [x] Update `techStack.md` based on reviewed files. (Implicitly done during review)
- [x] Update `codebaseSummary.md` with initial findings and applied fixes.
- [x] Perform detailed review and apply fixes across core directories (config, middlewares, utils, models, routes, controllers, services).
- [x] Implement input validation using `express-validator` (initial setup and integration).
- [x] Implement remaining input validations marked with `TODO` (user, reading, astrology, card, chat routes).
- [x] Fix server startup errors related to validation implementation.
- [x] Resolve Mongoose duplicate index warnings.
- [x] Define initial goals, features, and criteria in `projectRoadmap.md`.
- [x] Review and refine Role-Based Access Control (RBAC) implementation.
- [x] Implement Admin CRUD service logic for Tarot Cards (Module 2).
- [x] Implement service logic for `getCardsByType` (Module 2).
- [x] Implement service logic for creating a new reading (`createReading` in `readingService.js`, Module 3).
- [x] Refactor and ensure service logic for adding interpretation (`addInterpretation` in `readingService.js`, Module 3).
- [x] Refactor and ensure service logic for adding feedback (`addFeedback` in `readingService.js`, Module 3).
- [x] Define and implement API for getting available spread types (`getAllSpreads`, Module 3).
- [x] Review and refine Role-Based Access Control (RBAC) implementation for 'admin' role.
- [x] Implement Admin CRUD service logic for Readings (Module 3 - `getAllReadings`, `deleteReading`, `updateReading`).
- [x] Implement `updateReadingValidator` in `src/validators/readingValidators.js` (Module 3).
- [x] Apply `updateReadingValidator` to the admin update route in `src/routes/readingRoutes.js`.
- [x] Review and confirm Role-Based Access Control (RBAC) implementation (`restrictTo`).
- [x] Add `refreshToken` field to `userModel.js` (Module 1).
- [x] Update `login` controller to generate, save, and return refresh token (Module 1).
- [x] Update `refreshToken` controller logic to verify against stored token (Module 1).
- [x] Update `resetPassword` and `updatePassword` controllers to handle refresh token generation (Module 1).
- [x] Add `logout` route to `userRoutes.js` (Module 1).
- [x] Implement `logout` controller logic to clear refresh token (Module 1).
- [x] Review and confirm Admin CRUD functionality for Cards (Module 2).
- [x] Review and confirm logic for getting daily horoscope (`/astrology/:sign`, Module 4).
- [x] Create `astrologyService.js` and implement `getZodiacCompatibility` (Module 4).
- [x] Update `astrologyController.js` to use `getZodiacCompatibility` service (Module 4).
- [x] Implement `getTarotZodiacRelation` in `astrologyService.js` (Module 4).
- [x] Update `astrologyController.js` to use `getTarotZodiacRelation` service (Module 4).
- [x] Add `DELETE /api/astrology/:id` route for Horoscopes (Module 4).
- [x] Add `deleteDailyHoroscope` controller function (Module 4).
- [x] Implement `createDailyHoroscope`, `updateDailyHoroscope`, `deleteDailyHoroscope` in `astrologyService.js` (Module 4).
- [x] Update `astrologyController.js` to use Horoscope CRUD service functions (Module 4).
- [x] Add `DELETE /api/astrology/signs/:id` route for Zodiacs (Module 4).
- [x] Add `deleteZodiacSign` controller function (Module 4).
- [x] Implement `createZodiacSign`, `updateZodiacSign`, `deleteZodiacSign` in `astrologyService.js` (Module 4).
- [x] Update `astrologyController.js` to use Zodiac CRUD service functions (Module 4).
- [x] Create `paymentService.js` and implement SubscriptionPlan CRUD functions (Module 5).
- [x] Update `paymentController.js` to use SubscriptionPlan CRUD service functions (Module 5).
- [x] Refactor Stripe webhook logic into `paymentService.js` with idempotency checks (Module 5).
- [x] Update `paymentController.js` webhook handler to call the service (Module 5).
- [x] Create `messageModel.js` (Module 6).
- [x] Create `chatService.js` and implement `createChat` function (Module 6).
- [x] Update `chatController.js` to use `createChat` service function (Module 6).
- [x] Implement `sendMessage` function in `chatService.js` (Module 6).
- [x] Update `chatController.js` to use `sendMessage` service function (Module 6).
- [x] Add route `GET /chats/:id/messages` (Module 6).
- [x] Add controller `getChatMessages` (Module 6).
- [x] Implement `getChatMessages` function in `chatService.js` (Module 6).
- [x] Update `chatController.js` to use `getChatMessages` service function (Module 6).
- [x] Implement `markChatAsRead` function in `chatService.js` (Module 6).
- [x] Update `chatController.js` to use `markChatAsRead` service function (Module 6).
- [x] Implement `scheduleChat` function in `chatService.js` (Module 6).
- [x] Update `chatController.js` to use `scheduleChat` service function (Module 6).
- [x] Implement `getUpcomingSchedules` function in `chatService.js` (Module 6).
- [x] Update `chatController.js` to use `getUpcomingSchedules` service function (Module 6).
- [x] **Start Phase 4: Testing & Optimization**
- [x] Check `package.json` for Jest/Supertest.
- [x] Create `jest.config.js`.
- [x] Update `projectRoadmap.md` to reflect start of Phase 4.
- [x] Create test file `src/tests/userAuth.test.js`.
- [x] Add initial test setup (DB connection, before/after hooks).
- [x] Write initial test cases for Register, Login, Get Me APIs.
- [x] Run initial tests (`npm test`).
- [x] Fix Jest parsing error in `astrologyController.js` (duplicate require).
- [x] Fix Jest parsing error in `paymentController.js` (duplicate require).
- [x] Fix Jest MONGODB_URI error by adding `dotenv.config()` to test file.
- [x] Fix Jest `disconnectDB is not a function` error by correcting import/call to `closeDB`.
- [x] Increase Jest timeout in `jest.config.js` to 60s.
- [x] **User Action Required:** Install and run MongoDB server. (User confirmed running)
- [x] **User Action Required:** Create `.env` file and configure `MONGODB_URI` & `MONGODB_TEST_URI`. (User confirmed done)
- [x] **User Action Required:** Generate and add `JWT_SECRET` to `.env` file. (User confirmed done)
- [x] Update `config.js` to use `MONGODB_TEST_URI` when `NODE_ENV=test`.
- [x] Update `package.json` test script to set `NODE_ENV=test` (using direct assignment).
- [x] Install `cross-env` dev dependency.
- [x] Update `package.json` test script to use `cross-env`.
- [x] Fix `ReferenceError: logger is not defined` in `userModel.js`.
- [x] Update `errorMiddleware.js` to return consistent error format (`success: false`).
- [x] Update `register` controller to generate and send refresh token.
- [x] Update test expectation for unauthorized message in `userAuth.test.js`.
- [x] Fix user registration validator (`userValidators.js`).
- [x] Update `handleValidationErrors` to send response directly.
- [x] Update test expectation for `GET /me` data structure.
- [x] **User Action Required:** Generate and add `JWT_SECRET` to `.env` file. (User confirmed done)
- [x] Add remaining test cases for Module 1 APIs (update, change pw, forgot pw, logout) to `userAuth.test.js`.
- [x] Fix `updateUserValidator` to check 'name' instead of 'username'.
- [x] Adjust `POST /logout` test case to remove check with expired token.
- [x] Run tests for Module 1 (`npm test`) - All passed.
- [x] **Start Testing Module 2: Tarot Cards**
- [x] Create test file `src/tests/card.test.js`.
- [x] Add initial test setup (DB connection, seed data, admin user/token).
- [x] Write initial test cases for public Card APIs (GET all, by ID, by deck, by type).
- [x] Fix `ValidationError` in card tests by updating `sampleCardData` to match `cardModel.js` schema.
- [x] Refactor `cardController.js` to use `cardService` for `getAllCards`, `getCard`, `getCardsByDeck`.
- [x] Add missing `getAllCards`, `getCardById` functions to `cardService.js`.
- [x] Fix test cases in `card.test.js` to check `card.type` instead of `card.arcana`.
- [x] Adjust `cardService.js` (`getCardsByDeck`, `getCardsByType`) to return `[]` instead of 404 when no cards found.
- [x] Adjust test case `GET /type/InvalidType` to expect 200 and empty array.
- [x] Adjust test case `GET /deck/InvalidDeck` to expect 200 and empty array.
- [x] Adjust test case `GET /:id` (non-existent) message expectation.
- [x] Fix `ApiResponse` structure in `cardController.js` to wrap data correctly (e.g., `{ cards: [...] }`).
- [x] Fix `errorMiddleware.js` to correctly handle status codes for processed errors (like CastError -> 400).
- [x] Remove `getCardByIdValidator` from `cardRoutes.js`.
- [x] Restore specific `CastError` handling in `cardService.getCardById`.
- [x] Run tests for Module 1 & 2 (Public APIs) (`npm test`) - All passed.
- [x] Add Admin CRUD test cases (POST, PUT, DELETE, Forbidden) to `card.test.js`.
- [x] Fix `createCardValidator` and `updateCardValidator` in `cardValidators.js` to match `cardModel.js` schema.
- [x] Simplify `suit` validation in `createCardValidator`.
- [x] Fix `handleValidationErrors` in `cardValidators.js` to send response directly.
- [x] Run tests for Module 1 & 2 (including Admin CRUD) (`npm test`) - All passed.
- [x] **Start Testing Module 3: Readings**
- [x] Create test file `src/tests/reading.test.js`.
- [x] Add initial test setup (DB connection, seed data, user/admin tokens).
- [x] Add test cases for `GET /spreads` and `POST /` (create reading).
- [x] Fix data isolation issues in `card.test.js` and `reading.test.js` (unique deck names, cleanup).
- [x] Fix test expectations in `card.test.js` based on isolated data.
- [x] Fix `GET /spreads` test in `reading.test.js` (add auth header).
- [x] Create `createReadingValidator` in `readingValidators.js`.
- [x] Apply `createReadingValidator` to `POST /api/readings` route.
- [x] Update `POST /` tests in `reading.test.js` to send `deckName`.
- [x] Fix duplicate variable error in `card.test.js`.
- [x] Add `--runInBand` flag to test script in `package.json`.
- [x] Fix test expectations in `reading.test.js` for `GET /spreads` and `POST /` based on `ApiResponse` structure.
- [x] Fix test expectation for populated `userId` in `reading.test.js`.
- [x] Fix `readingService.createReading` to use `spread` field name (matching model).
- [x] Add logging to `readingService.createReading` catch block for debugging 500 error.
- [x] Fix test expectation for `spread` field in `reading.test.js`.
- [x] Run tests for Modules 1, 2, and initial Module 3 (`npm test`) - All passed.
- [x] **Continue Testing Module 3: Readings**
- [x] Add test cases for `GET /history` and `GET /:id` to `reading.test.js`.
- [x] Fix access control logic in `readingController.getReadingById` (attempt 1).
- [x] Fix access control logic in `readingController.getReadingById` (attempt 2 - explicit check).
- [x] Add debug logging to `readingController.getReadingById` to diagnose access issue.
- [x] Fix `isOwner` check in `readingController.getReadingById` based on debug logs (comparing populated object ID).
- [x] Remove debug logging from `readingController.getReadingById`.
- [x] Run tests for Module 3 (`GET /history`, `GET /:id`) - All passed.
- [x] **Continue Testing Module 3: Readings**
- [x] Add test cases for `PUT /:id/feedback` to `reading.test.js`.
- [x] Fix access control logic in `readingService.addFeedback` (comparing populated object ID).
- [x] Run tests for Module 3 (`PUT /:id/feedback`) - All passed.
- [x] Add test cases for `PUT /reader/:id/interpret` to `reading.test.js`.
- [x] Fix controller bug in `readingController.addInterpretation` (wrong variable returned).
- [x] Fix DB assertion for `readerId` in `reading.test.js` (handle populated object).
- [x] Remove temporary 500 error check from `PUT /reader/:id/interpret` test.
- [x] Run tests for Module 3 (`PUT /reader/:id/interpret`) - All passed.
- [x] **Testing Module 3: Readings (Completed)**
- [x] Add test cases for Admin CRUD (`GET /admin/all`, `PUT /admin/:id`, `DELETE /admin/:id`) to `reading.test.js`.
- [x] Update `updateReadingValidator` to include `isPublic` and other relevant fields.
- [x] Run tests for Module 3 Admin CRUD - All passed.
- [x] **Start Testing Module 4: Astrology**
- [x] Create test file `src/tests/astrology.test.js`.
- [x] Add initial test setup (DB connection, hooks, user/admin tokens, seed data).
- [x] Fix `sampleZodiacData` in `astrology.test.js` to match `zodiacModel` schema.
- [x] Fix `horoscopesToSeed` data in `astrology.test.js` to match `horoscopeModel` schema.
- [x] Fix duplicate variable declaration in `astrology.test.js`.
- [x] Fix route definitions in `astrologyRoutes.js` (path and middleware for `/horoscope/:sign`, prefixes for admin routes).
- [x] Fix router prefix in `app.js` for astrology routes (`/api/astrology`).
- [x] Encode URL parameters in `astrology.test.js` for `GET /horoscope/:sign`.
- [x] Fix test logic in `astrology.test.js` for `GET /horoscope/:sign` (add ISO date query).
- [x] Fix test assertions in `astrology.test.js` for 404 and 400 errors on `GET /horoscope/:sign`.
- [x] Update `Horoscope.findDailyHoroscope` in `horoscopeModel.js` to use date range query.
- [x] Add initial test cases for public APIs (`GET /signs`, `GET /horoscope/:sign`).
- [x] Run tests for Module 4 public APIs - All passed.
- [x] **Testing Module 4 (Public APIs) Completed.**
- [x] Add test cases for authenticated APIs (`GET /compatibility/:sign1/:sign2`, `GET /tarot-relation/:sign`) in `astrology.test.js`.
- [x] Fix `getZodiacCompatibilityValidator` in `astrologyValidators.js` to handle URL parameters correctly.
- [x] Fix `getTarotZodiacRelationValidator` in `astrologyValidators.js` to handle URL parameters correctly.
- [x] Fix `astrologyController.getZodiacCompatibility` to handle invalid signs.
- [x] Fix `astrologyController.getTarotZodiacRelation` to handle invalid signs.
- [x] Run tests for Module 4 authenticated APIs - All passed.
- [x] **Testing Module 4 (Authenticated APIs) Completed.**
- [x] Add test cases for Admin Horoscope CRUD (`POST`, `PUT`, `DELETE`) in `astrology.test.js`.
- [x] Fix `createHoroscopeValidator` and `updateHoroscopeValidator` in `astrologyValidators.js` to match `horoscopeModel`.
- [x] Fix `handleValidationErrors` in `astrologyValidators.js` to return correct error structure.
- [x] Run tests for Module 4 Admin Horoscope CRUD - All passed.
- [x] **Testing Module 4 (Admin Horoscope CRUD) Completed.**
- [x] Add test cases for Admin Zodiac CRUD (`POST`, `PUT`, `DELETE`) in `astrology.test.js`.
- [x] Fix `createZodiacSignValidator` and `updateZodiacSignValidator` in `astrologyValidators.js` to match `zodiacModel`.
- [x] Run tests for Module 4 Admin Zodiac CRUD - All passed.
- [x] **Testing Module 4 (Admin Zodiac CRUD) Completed.**
- [x] **Phase 4: Testing & Optimization - All tests passed.**
- [x] **Start Phase 5: Deployment (Using Docker)**
  - [x] Create `.dockerignore` file.
  - [x] Create `Dockerfile` for the backend application.
  - [x] Create `docker-compose.yml` for managing services (backend, DB).
  - [x] Temporarily disable Stripe integration (due to missing secrets):
    - [x] Comment out Stripe env var checks in `src/server.js`.
    - [x] Comment out payment routes and webhook middleware in `src/app.js`.
  - [x] Update `projectRoadmap.md` to reflect postponed payment module.
  - [x] Build and run the application using Docker Compose (attempt 2).
  - [x] Verify application is running correctly in Docker container (MongoDB running, backend connected and API responding).
  - [x] Optimize `Dockerfile` using multi-stage builds and selective copying.
  - [x] Rebuild Docker image and verify application runs correctly after optimization.
  - [x] Document required environment variables in `README.md`.
  - [x] Configure logging for Docker compatibility (log to console).
  - [x] Verify graceful shutdown mechanism in `src/server.js`.
  - [x] Add health check configuration to `docker-compose.yml`.
  - [x] Restart containers and verify health check status using `docker-compose ps`.
  - [x] Add "Deployment Considerations" section to `README.md`.
  - [x] Create basic deployment guide (`userInstructions/deployment_guide.md`).
- [x] **Start Phase 6: Codebase Cleanup & Refactoring**
  - [x] Review and refactor configuration files (`src/config/`). (No changes needed)
  - [x] Review and refactor utility functions (`src/utils/`). (Minor JSDoc update)
  - [x] Review and refactor middleware (`src/middlewares/`). (No changes needed)
  - [x] Review and refactor models (`src/models/`). (Removed redundant messageModel.js)
  - [x] Review and refactor services (`src/services/`). (Refactored chatService for embedded messages)
  - [x] Review and refactor controllers (`src/controllers/`). (No major changes needed)
- [x] **Implement API Documentation (Swagger)**
  - [x] Install `swagger-jsdoc` and `swagger-ui-express`. (Done previously)
  - [x] Configure Swagger options in `src/config/swagger.js`. (Done previously)
  - [x] Integrate Swagger UI middleware into `src/app.js`. (Done previously)
  - [x] Add JSDoc comments to all main routes (User, Card, Reading, Astrology, Chat). (Confirmed done)
  - [x] Verify Swagger UI is accessible and functional. (Confirmed working at localhost:5005)
- [x] **Implement Spread Management Module (Module 3)**
  - [x] Add `spreadModel.js`.
  - [x] Create `spreadService.js` with CRUD operations.
  - [x] Implement `spreadController.js` and `spreadRoutes.js`.
  - [x] Update `readingService.js` to use `spreadModel`.
  - [x] Deprecate old `/api/readings/spreads` route.
  - [x] Add `spreadValidators.js` for input validation.
  - [x] Apply validators to `spreadRoutes.js`.
  - [x] Create `scripts/seedSpreads.js` for initial data.
  - [x] Add `seed:spreads` script to `package.json`.
  - [x] Run seeding script successfully.
- [x] **Write Tests for Spread Module (Module 3)**
  - [x] Create `src/tests/spread.test.js`.
  - [x] Add test setup (DB, tokens, seed data).
  - [x] Write tests for public API (`GET /api/spreads`).
  - [x] Write tests for admin APIs (CRUD, validation, RBAC).
- [x] Run all tests (`npm test`) - All passed.

## Giai Đoạn 7: Chuẩn Bị Triển Khai

### Current Objectives
- [ ] Xác định các bước cụ thể cần thiết cho việc chuẩn bị triển khai cuối cùng.

### Context
- Dự án đã hoàn thành các giai đoạn phát triển, kiểm thử, Docker cơ bản và tài liệu hóa API.
- Người dùng yêu cầu bắt đầu giai đoạn chuẩn bị cho việc triển khai cuối cùng.

### Next Steps
- [x] **Review Docker Configuration:** Xem xét lại `Dockerfile` và `docker-compose.yml` để đảm bảo tối ưu hóa cho production (kích thước image, bảo mật, biến môi trường). (Dockerfile ổn, docker-compose.yml cần chú ý bảo mật MongoDB và biến môi trường).
- [x] **Production Environment Variables:** Xác định và tài liệu hóa tất cả các biến môi trường cần thiết cho môi trường production (ví dụ: `NODE_ENV=production`, `MONGODB_URI` cho production DB, `JWT_SECRET` mạnh hơn, `CORS_ORIGIN` cụ thể, etc.). (Đã xác định và cập nhật README.md).
- [x] **Production Logging:** Cấu hình logging phù hợp cho production (ví dụ: mức log `info`, định dạng JSON, tích hợp với dịch vụ logging bên ngoài nếu cần). (Đã cấu hình logger để chỉ log ra console trong production).
- [x] **Database Strategy:** Xem xét chiến lược seeding hoặc migration dữ liệu cho môi trường production. (Đã xem xét: Sử dụng seed script hiện có cho Spreads, ghi nhận cần hệ thống migration cho tương lai).
- [x] **Security Hardening:** Rà soát và cấu hình các biện pháp bảo mật chặt chẽ hơn cho production (CORS, rate limiting, Helmet, etc.). (Đã phân tích cấu hình hiện tại và cập nhật hướng dẫn triển khai).
- [x] **CI/CD Pipeline:** Nghiên cứu và đề xuất phương án thiết lập CI/CD (ví dụ: GitHub Actions) để tự động hóa quá trình build, test và deploy. (Đã phác thảo kế hoạch sử dụng GitHub Actions và tạo file cấu hình cơ bản).
- [x] **Update Deployment Guide:** Cập nhật `userInstructions/deployment_guide.md` với các hướng dẫn chi tiết và cuối cùng cho việc triển khai. (Đã cập nhật thông tin CI/CD và kiểm tra cuối cùng).
- [x] **Final Checks:** Thực hiện kiểm tra cuối cùng về hiệu suất, bảo mật và chức năng trước khi triển khai. (Đã hoàn thành các bước chuẩn bị và tài liệu hóa các kiểm tra cần thiết).

## Next Steps (Giai Đoạn 7 - Lần 2) - Đã hoàn thành
- [x] **Review Docker Configuration:** Đã xem xét `Dockerfile` và `docker-compose.yml`. Cấu hình hiện tại (`Dockerfile` tối ưu, `docker-compose.yml` cơ bản tốt) phù hợp cho triển khai, nhưng cần quản lý bí mật an toàn và bật xác thực DB cho production.
- [x] **Production Environment Variables:** Đã xác định và tài liệu hóa trong `README.md`. Cần quản lý an toàn trong môi trường production.
- [x] **Production Logging:** Cấu hình hiện tại (`src/utils/logger.js`) đã phù hợp (log JSON ra console).
- [x] **Database Strategy:** Đã xem xét. Hiện có script seeding cho Spreads (`scripts/seedSpreads.js`). Cần chiến lược migration chính thức cho các thay đổi schema trong tương lai.
- [x] **Security Hardening:** Đã rà soát. Các biện pháp cơ bản (Helmet, CORS, Rate Limit, JWT Secret handling, Docker user, Input Validation) đã được cấu hình và tài liệu hóa. Cần bật xác thực DB production.
- [x] **CI/CD Pipeline:** Đã xem xét file `.github/workflows/ci-cd.yml`. Cấu hình CI cơ bản đã có, cần tùy chỉnh bước Deploy cho môi trường cụ thể.
- [x] **Update Deployment Guide:** Đã xem xét `userInstructions/deployment_guide.md`. Hướng dẫn hiện tại khá đầy đủ và phù hợp với các phân tích.
- [x] **Final Checks:** Các điểm cần kiểm tra cuối cùng đã được ghi nhận trong `userInstructions/deployment_guide.md`.

**Kết luận Giai đoạn 7 (Lần 2):** Các cấu hình và tài liệu cần thiết cho việc chuẩn bị triển khai đã được rà soát và cập nhật. Dự án sẵn sàng cho các bước triển khai thực tế, với lưu ý về quản lý bí mật và bật xác thực DB production.

## Giai Đoạn 8: Triển Khai (Local Docker Compose) - Hoàn thành

### Objectives
- [x] Khởi chạy ứng dụng và database bằng Docker Compose.
- [x] Xác nhận các container đang chạy và hoạt động bình thường (bao gồm khắc phục lỗi kết nối DB, lỗi phiên bản DB, lỗi graceful shutdown).

### Completed Steps
- Chạy `docker compose up --build -d`.
- Debug và sửa lỗi kết nối MongoDB (`getaddrinfo ENOTFOUND mongo`, `ECONNREFUSED`) bằng cách điều chỉnh `depends_on` và `healthcheck`.
- Debug và sửa lỗi phiên bản MongoDB không tương thích (`featureCompatibilityVersion`) bằng cách cập nhật image `mongo` trong `docker-compose.yml`.
- Debug và sửa lỗi `ReferenceError` trong logic graceful shutdown (`src/server.js`).
- Xác nhận cả hai container (`tarot-backend`, `mongo`) đang chạy (`Up`) thông qua `docker ps`.
- Xác nhận `tarot-backend` kết nối thành công với MongoDB và server khởi động qua logs.

## Giai Đoạn 9: Chuẩn Bị Triển Khai Production (Docker Compose) - Hoàn thành

### Objectives
- [x] Hoàn tác các thay đổi cấu hình cho Vercel (`vercel.json`, `.github/workflows/ci-cd.yml`).
- [x] Xem xét và cập nhật chi tiết hướng dẫn triển khai (`userInstructions/deployment_guide.md`) cho phương án Docker Compose, nhấn mạnh quản lý bí mật, xác thực DB, và reverse proxy/HTTPS.

### Completed Steps
- Khôi phục `.github/workflows/ci-cd.yml` về cấu hình build/push Docker image và deploy SSH (commented).
- Khôi phục `vercel.json` về trạng thái cơ bản.
- Cập nhật `userInstructions/deployment_guide.md` với hướng dẫn chi tiết cho Docker Compose deployment, bao gồm cách quản lý biến môi trường an toàn, khuyến nghị bật xác thực DB, và cấu hình Nginx/HTTPS.

**Kết luận Giai đoạn 9:** Dự án đã được chuẩn bị sẵn sàng cho việc triển khai lên máy chủ Linux bằng Docker Compose. Các cấu hình cần thiết (Dockerfile, docker-compose.yml, CI workflow cơ bản) đã có. Hướng dẫn triển khai chi tiết (`userInstructions/deployment_guide.md`) đã được cập nhật.

## Giai Đoạn 10: Triển Khai Thực Tế (User Action)

### Current Objectives
- [ ] Người dùng thực hiện các bước triển khai lên máy chủ production theo hướng dẫn trong `userInstructions/deployment_guide.md`.

### Next Steps (Dành cho người dùng)
1.  Chuẩn bị máy chủ Linux production.
2.  Cài đặt Docker và Docker Compose trên máy chủ.
3.  Clone repository dự án.
4.  Thiết lập cơ sở dữ liệu MongoDB production (khuyến nghị dùng MongoDB Atlas).
5.  Tạo file biến môi trường production an toàn trên máy chủ (ví dụ: `/etc/tarot-app/.env.prod`) với các giá trị chính xác (MONGODB_URI, JWT_SECRET, CORS_ORIGIN, etc.).
6.  Cập nhật `docker-compose.yml` để sử dụng `env_file` trỏ đến file ở bước 5 (nếu chọn phương pháp này).
7.  Build và khởi chạy container bằng `sudo docker compose up --build -d`.
8.  Kiểm tra trạng thái và logs của container.
9.  Cấu hình Reverse Proxy (Nginx) và HTTPS (Certbot).
10. (Tùy chọn) Cấu hình bước deploy tự động trong `.github/workflows/ci-cd.yml` bằng cách cung cấp SSH secrets cho GitHub Actions.

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

<environment_details>
# VSCode Visible Files
cline_docs/currentTask.md

# VSCode Open Tabs
src/middlewares/authMiddleware.js
src/middlewares/performanceMiddleware.js
src/utils/apiResponse.js
src/models/readingModel.js
src/models/paymentModel.js
src/models/chatModel.js
plan.md
src/controllers/chatController.js
src/controllers/astrologyController.js
src/models/userModel.js
src/controllers/userController.js
src/validators/userValidators.js
src/controllers/cardController.js
src/services/cardService.js
src/validators/cardValidators.js
src/validators/readingValidators.js
src/models/horoscopeModel.js
src/services/astrologyService.js
src/middlewares/errorMiddleware.js
src/validators/astrologyValidators.js
.dockerignore
src/routes/astrologyRoutes.js
src/routes/chatRoutes.js
src/routes/paymentRoutes.js
userInstructions/resolve_port_conflict.txt
src/config/config.js
src/server.js
c:/Users/USER/AppData/Roaming/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
src/services/chatService.js
src/models/spreadModel.js
src/services/spreadService.js
src/controllers/readingController.js
src/routes/readingRoutes.js
src/validators/spreadValidators.js
src/utils/stringUtils.js
src/config/swagger.js
src/routes/cardRoutes.js
.env
src/config/database.js
jest.config.js
package.json
src/services/readingService.js
src/app.js
src/tests/reading.test.js
src/routes/spreadRoutes.js
src/controllers/spreadController.js
src/tests/setup.js
src/utils/jwtUtils.js
src/tests/spread.test.js
cline_docs/codebaseSummary.md
src/tests/userAuth.test.js
src/tests/card.test.js
src/tests/astrology.test.js
scripts/seedSpreads.js
cline_docs/projectRoadmap.md
Dockerfile
docker-compose.yml
README.md
src/utils/logger.js
.github/workflows/ci-cd.yml
userInstructions/deployment_guide.md
vercel.json
cline_docs/currentTask.md
src/routes/userRoutes.js
userInstructions/generate_jwt_secret.txt
src/validators/paymentValidators.js
src/validators/chatValidators.js
src/models/cardModel.js
src/models/zodiacModel.js
src/services/paymentService.js
src/models/messageModel.js

# Recently Modified Files
These files have been modified since you last accessed them (file was just edited so you may need to re-read it before editing):
cline_docs/currentTask.md

# Current Time
4/28/2025, 9:53:43 PM (Asia/Saigon, UTC+7:00)

# Context Window Usage
331,373 / 1,048.576K tokens used (32%)

# Current Mode
ACT MODE
</environment_details>
