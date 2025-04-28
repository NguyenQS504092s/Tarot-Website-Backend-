# Stage 1: Build dependencies
# Use a specific Node.js LTS version (Debian-based for better compatibility)
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Stage 2: Create the final image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy package files (needed for metadata, even if modules are copied)
COPY package*.json ./

# Copy only the application source code needed for runtime
COPY src ./src

# Create log directory explicitly and set permissions
# Ensure the node user can write logs
RUN mkdir logs && chown -R node:node /app

# Expose the port the app runs on (default 5000 from config.js)
EXPOSE 5005

# Set environment variable for production
ENV NODE_ENV=production
# Optional: Set default PORT if not provided externally
# ENV PORT=5000

# Switch to the non-root user before running the app
USER node

# Command to run the application
CMD ["node", "src/server.js"]
