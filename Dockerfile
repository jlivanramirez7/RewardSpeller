# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-slim
WORKDIR /app

# Optimization: Copy only what is needed
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/vite.config.js ./

# Cloud Run injects the PORT environment variable
ENV PORT 8080

# Security: Run as non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Expose the port (informative)
EXPOSE 8080

# Correctness: Use exec for proper signal handling
CMD ["sh", "-c", "exec npx vite preview --host 0.0.0.0 --port $PORT"]
