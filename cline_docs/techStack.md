# Tech Stack

## Frontend
- [ ] Define frontend technologies (e.g., Framework/Library, CSS approach) - *Not reviewed in this task.*

## Backend
- **Language:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (based on `MONGODB_URI` env var and `connectDB` call)
- **Authentication:** JWT (based on `JWT_SECRET` env var)
- **Security Middleware:**
    - Helmet.js (General security headers)
    - express-rate-limit (API rate limiting)
    - CORS (Cross-Origin Resource Sharing handling)
- **Environment Variables:** dotenv

## APIs/External Services
- **Stripe:** For payments (based on `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` env vars and webhook route)

## Architecture Decisions
- Standard Express.js middleware pattern.
- Centralized error handling.
- Environment variable configuration.
- Graceful shutdown implementation.
