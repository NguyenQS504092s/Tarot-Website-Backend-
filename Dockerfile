# Stage 1: Build dependencies
FROM node:18-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production image
FROM node:18-bullseye-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY scripts ./scripts
ENV NODE_ENV=production
EXPOSE 5005
# Add HEALTHCHECK instruction
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5005/health || exit 1
USER node
CMD ["node", "src/server.js"]
