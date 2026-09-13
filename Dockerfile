# ==============================================================================
# Multi-stage Dockerfile for Node.js Clean Architecture Backend
# Stage 1: Dependency Builder
# ==============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ==============================================================================
# Stage 2: Production Minimal Runtime
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Security: Run as non-root user (alpine includes 'node' user:group uid 1000)
USER node

# Copy production node_modules and application code
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node config/ ./config/
COPY --chown=node:node migrations/ ./migrations/

EXPOSE 5000

CMD ["npm", "start"]
