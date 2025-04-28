# Tarot Website Backend API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) <!-- Optional: Add a license badge if applicable -->

Backend API service for the Tarot Website application, providing functionalities for user management, Tarot card information, readings, astrology insights, chat, and payment processing (currently postponed). Built with Node.js, Express, and MongoDB.

## ✨ Key Features

*   **User Management:** Registration, Login (JWT), Profile Management, Password Reset, Role-Based Access Control (User, Admin).
*   **Tarot Cards:** Retrieve card details, list all cards, filter by deck/type, Admin CRUD operations.
*   **Readings:** Create new readings, retrieve history, get specific readings, add interpretations (Reader role), add feedback (User role), Admin CRUD operations.
*   **Astrology:** Get zodiac sign info, daily horoscopes, compatibility checks, Tarot-zodiac relations, Admin CRUD for signs and horoscopes.
*   **Chat:** Create chats, send/retrieve messages, mark as read, schedule chats (basic implementation).
*   **Payment (Postponed):** Stripe integration for subscription management (currently disabled).
*   **API Documentation:** Available via Swagger UI.
*   **Testing:** Unit and integration tests using Jest and Supertest.
*   **Docker Support:** Ready for containerized deployment.

*(Refer to `cline_docs/projectRoadmap.md` for more details)*

## 🛠️ Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (with Mongoose ODM)
*   **Authentication:** JSON Web Tokens (JWT)
*   **Validation:** express-validator
*   **Testing:** Jest, Supertest
*   **API Documentation:** Swagger (via swagger-jsdoc, swagger-ui-express)
*   **Containerization:** Docker, Docker Compose
*   **Logging:** Winston (with daily rotation)
*   **Security:** Helmet, CORS, express-rate-limit

*(Refer to `cline_docs/techStack.md` for more details)*

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   MongoDB instance (local or remote)
*   Git

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/NguyenQS504092s/Tarot-Website-Backend-.git
    cd Tarot-Website-Backend-
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    *   Create a `.env` file in the project root.
    *   Copy the contents of `.env.example` (if available) or add the following required variables:
        ```env
        NODE_ENV=development # or production
        PORT=5000 # Or any port you prefer
        MONGODB_URI=mongodb://localhost:27017/tarot_dev # Your development DB connection string
        MONGODB_TEST_URI=mongodb://localhost:27017/tarot_test # Your test DB connection string
        JWT_SECRET=your_very_strong_jwt_secret # Generate a strong secret key
        JWT_EXPIRES_IN=90d
        JWT_REFRESH_EXPIRES_IN=180d

        # Optional for Email (Password Reset) - Configure your email service
        # EMAIL_HOST=
        # EMAIL_PORT=
        # EMAIL_USERNAME=
        # EMAIL_PASSWORD=
        # EMAIL_FROM=

        # Optional for Stripe (Currently Disabled)
        # STRIPE_SECRET_KEY=sk_test_...
        # STRIPE_WEBHOOK_SECRET=whsec_...

        # Optional - Other settings
        # CORS_ORIGIN=http://your-frontend-domain.com
        # API_PREFIX=/api
        # FREE_READINGS_PER_DAY=3
        # FRONTEND_URL=http://your-frontend-domain.com
        # PERFORMANCE_THRESHOLD_MS=1000
        # RATE_LIMIT_WINDOW_MS=900000 # 15 minutes in ms
        # RATE_LIMIT_MAX=100
        ```
    *   **Important:** Replace placeholder values with your actual configuration, especially `MONGODB_URI`, `MONGODB_TEST_URI`, and `JWT_SECRET`. Generate a strong `JWT_SECRET`.

### Environment Variables Overview

The application relies on environment variables for configuration. Refer to `src/config/config.js` for defaults and how variables are used. **It is crucial to manage sensitive variables securely in production.**

**Required for Production:**

*   `NODE_ENV`: Set to `production`. Enables optimizations and security features.
*   `PORT`: The internal port the Node.js application listens on within the container (e.g., `5005`). This port is mapped externally by Docker or a reverse proxy. Default: `5005`.
*   `MONGODB_URI`: **(Sensitive)** The full connection string for your **production** MongoDB database. If your database requires authentication (highly recommended for production), include credentials: `mongodb://<username>:<password>@your_mongo_host:27017/tarot_prod?authSource=admin`. **Never hardcode credentials.** Use secure injection methods (Docker secrets, platform environment variables).
*   `JWT_SECRET`: **(Highly Sensitive)** A long, strong, random secret used to sign JWTs. Generate a unique secret for production using a secure method (see `userInstructions/generate_jwt_secret.txt` for generation, but use a **different** secret for production). **Never use default or weak secrets.** Manage securely.
*   `CORS_ORIGIN`: The specific URL(s) of your production frontend application that are allowed to make requests to this API. Example: `https://yourdomain.com` or comma-separated `https://www.yourdomain.com,https://app.yourdomain.com`. Using `*` is insecure for production.

**Optional / Recommended for Production:**

*   `JWT_EXPIRES_IN`: Access token expiration time (e.g., `1h`, `15m`). Shorter times increase security. Default: `7d`.
*   `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration time (e.g., `30d`, `60d`). Default: `30d`.
*   `FRONTEND_URL`: The base URL of your production frontend (e.g., `https://yourdomain.com`). Used for redirects (like Stripe checkout). Default: `http://localhost:3000`.
*   `RATE_LIMIT_WINDOW_MS`: Time window (in milliseconds) for rate limiting. Default: `900000` (15 minutes).
*   `RATE_LIMIT_MAX`: Max requests allowed per window per IP. Default: `100`.
*   `PERFORMANCE_THRESHOLD_MS`: Threshold (in milliseconds) for logging slow API requests. Default: `1000`.
*   `API_PREFIX`: URL prefix for all API routes. Default: `/api`.
*   `FREE_READINGS_PER_DAY`: Business logic setting for free reading limits. Default: `3`.

**Required for Stripe (If Payments Enabled):**

*   `STRIPE_SECRET_KEY`: **(Highly Sensitive)** Your live Stripe secret key (`sk_live_...`). Manage securely.
*   `STRIPE_WEBHOOK_SECRET`: **(Highly Sensitive)** Your live Stripe webhook signing secret (`whsec_...`). Manage securely.

**Required for MongoDB Service (in `docker-compose.yml` for Production DB Setup):**

*   `MONGO_INITDB_ROOT_USERNAME`: **(Sensitive)** Username for the MongoDB root user. Manage securely.
*   `MONGO_INITDB_ROOT_PASSWORD`: **(Highly Sensitive)** Password for the MongoDB root user. Manage securely.

**Important Security Note:** Never commit files containing production secrets (like `.env` with production values) to version control (Git). Use secure methods provided by your deployment platform or tools like Docker Secrets to manage sensitive environment variables.

4.  **Ensure MongoDB is running.**

### Running the Application

*   **Development Mode (with nodemon for auto-restarts):**
    ```bash
    npm run dev
    ```
*   **Production Mode:**
    ```bash
    npm start
    ```
    The server will start, typically on the `PORT` specified in your `.env` file (default: 5000).

### Running Tests

```bash
npm test
```
*(Ensure your test database (`MONGODB_TEST_URI`) is accessible)*

## 🐳 Running with Docker

1.  **Ensure Docker and Docker Compose are installed.**
2.  **Build and run the services:**
    ```bash
    docker-compose up --build -d
    ```
    This will build the backend image and start the backend service along with a MongoDB service defined in `docker-compose.yml`. The backend will typically be accessible on the port mapped in `docker-compose.yml` (e.g., 5000).
3.  **To stop the services:**
    ```bash
    docker-compose down
    ```

## 📖 API Documentation

Once the server is running, API documentation generated by Swagger is available at:
`http://localhost:<PORT>/api-docs` (Replace `<PORT>` with the actual port number, e.g., 5000)

## ☁️ Deployment Considerations

While this setup works locally with Docker Compose, deploying to a production environment requires additional considerations:

*   **Environment Variables:**
    *   **DO NOT** commit your `.env` file to version control.
    *   Use your hosting provider's mechanism for setting environment variables (e.g., platform environment settings, Docker secrets, configuration management tools). Ensure all **Required** variables listed in the "Environment Variables Overview" section are set.
*   **Reverse Proxy (Recommended):**
    *   Set up a reverse proxy like Nginx or Traefik in front of the Node.js application container.
    *   Benefits: SSL termination (HTTPS), load balancing (if scaling), caching static assets, improved security.
    *   Configure the reverse proxy to forward requests to the backend container (e.g., `http://tarot_backend_app:5005`).
*   **Database:**
    *   Use a managed database service (like MongoDB Atlas) for production environments for better reliability, backups, and scalability.
    *   Update the `MONGODB_URI` environment variable accordingly.
*   **Logging:**
    *   The application logs to `stdout`/`stderr` (console), which is suitable for Docker.
    *   Configure your Docker host or orchestration platform to collect logs from containers (e.g., using Docker logging drivers like `json-file`, `journald`, or forwarding to a centralized logging system like ELK, Graylog, Datadog).
*   **Security:**
    *   Ensure `NODE_ENV` is set to `production`.
    *   Keep dependencies updated (`npm audit`).
    *   Configure appropriate firewall rules on your server.
*   **Build Process:**
    *   Ideally, build the Docker image in a CI/CD pipeline rather than directly on the production server. Push the built image to a container registry (like Docker Hub, AWS ECR, Google GCR) and pull it on the server for deployment.

## 🤝 Contributing

Contributions are welcome! Please follow standard Git workflow (fork, branch, pull request). Ensure tests pass and adhere to existing code style.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (if applicable).
