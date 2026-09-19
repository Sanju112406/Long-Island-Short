# ==========================================
# Stage 1: Build Frontend and Backend Bundle
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (leverage layer cache)
COPY package*.json ./
RUN npm ci

# Copy full application source
COPY . .

# Build both Vite frontend static assets and esbuild server bundle into dist/
RUN npm run build

# ==========================================
# Stage 2: Production Runner Image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets and backend server from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
USER node

# Cloud Run injects PORT environment variable and maps it to container
EXPOSE 8080

# Run the single Express server that serves API and static frontend
CMD ["node", "dist/server.cjs"]
