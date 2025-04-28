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

The application uses the following environment variables (refer to `src/config/config.js` for defaults and usage):

*   **`NODE_ENV`**: Application environment (`development`, `production`, `test`). Default: `development`.
*   **`PORT`**: Port the server listens on. Default: `5005`.
*   **`JWT_SECRET`**: **(Required)** Secret key for signing JSON Web Tokens.
*   **`JWT_EXPIRES_IN`**: JWT expiration time. Default: `7d`.
*   **`JWT_REFRESH_EXPIRES_IN`**: Refresh token expiration time. Default: `30d`.
*   **`MONGODB_URI`**: **(Required)** Connection string for the main MongoDB database.
*   **`MONGODB_TEST_URI`**: **(Required for testing)** Connection string for the test MongoDB database.
*   **`CORS_ORIGIN`**: Allowed origins for CORS requests. Default: `*`.
*   **`API_PREFIX`**: Prefix for all API routes. Default: `/api`.
*   **`FREE_READINGS_PER_DAY`**: Limit for free readings. Default: `3`.
*   **`STRIPE_SECRET_KEY`**: **(Required if payments enabled)** Stripe API secret key.
*   **`STRIPE_WEBHOOK_SECRET`**: **(Required if payments enabled)** Stripe webhook signing secret.
*   **`FRONTEND_URL`**: Base URL of the frontend application (used for CORS, redirects, etc.). Default: `http://localhost:3000`.
*   **`PERFORMANCE_THRESHOLD_MS`**: Threshold (ms) for logging slow operations. Default: `1000`.
*   **`RATE_LIMIT_WINDOW_MS`**: Time window (ms) for rate limiting. Default: `900000` (15 minutes).
*   **`RATE_LIMIT_MAX`**: Max requests per window per IP for rate limiting. Default: `100`.
*   *(Email variables like `EMAIL_HOST`, `EMAIL_PORT`, etc., might be needed if email functionality (e.g., password reset) is fully implemented).*

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
