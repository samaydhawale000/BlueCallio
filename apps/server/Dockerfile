# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# System deps for native modules (bcrypt etc.)
RUN apk add --no-cache python3 make g++

# Copy workspace manifests for better layer caching
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
# Copy any local packages the server depends on
COPY packages/ ./packages/

# Install all workspace deps
RUN npm ci

# Copy server source
COPY apps/server/ ./apps/server/

# Generate Prisma client (linux-musl binary for Alpine)
RUN cd apps/server && npx prisma generate

# Build NestJS
RUN cd apps/server && npm run build

# ── Stage 2: Production ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/

# Install production deps only
RUN npm ci --omit=dev

# Copy Prisma schema + generated client
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy compiled output
COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 3005

# Run migrations then start
CMD ["sh", "-c", "cd apps/server && npx prisma migrate deploy && node dist/src/main.js"]
