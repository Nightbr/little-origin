# syntax=docker/dockerfile:1

# ============================================
# Base stage - common dependencies
# ============================================
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

# ============================================
# Dependencies stage - install all dependencies
# ============================================
FROM base AS deps
# Install build dependencies for native modules (better-sqlite3, argon2)
RUN apk add --no-cache python3 make g++
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/name-data/package.json ./packages/name-data/
RUN pnpm install --frozen-lockfile

# ============================================
# Builder stage - build all packages
# ============================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/name-data/node_modules ./packages/name-data/node_modules
COPY . .
RUN pnpm turbo run build

# ============================================
# Production stage - API + static web files
# ============================================
FROM node:24-alpine AS production
WORKDIR /app

# Copy package files for workspace structure
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

# Create production package.json files for workspace packages (pointing to dist)
RUN mkdir -p packages/core packages/name-data
RUN echo '{"name":"@little-origin/core","version":"1.0.0","private":true,"type":"module","exports":{".":{"types":"./dist/index.d.ts","default":"./dist/index.js"}},"dependencies":{"drizzle-orm":"^0.38.3","drizzle-zod":"^0.7.0","zod":"^3.24.1"}}' > packages/core/package.json
RUN echo '{"name":"@little-origin/name-data","version":"1.0.0","private":true,"type":"module","exports":{".":{"types":"./dist/index.d.ts","default":"./dist/index.js"}}}' > packages/name-data/package.json

# Copy pre-built node_modules from deps stage (includes compiled native modules)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/name-data/node_modules ./packages/name-data/node_modules

# Copy built API files
COPY --from=builder /app/apps/api/dist ./apps/api/dist
# Copy database migrations
COPY --from=builder /app/apps/api/src/db/migrations ./apps/api/dist/migrations
# Copy compiled workspace packages
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/name-data/dist ./packages/name-data/dist
# Copy JSON data files for name-data package
COPY --from=builder /app/packages/name-data/data ./packages/name-data/data

# Copy built web static files
COPY --from=builder /app/apps/web/dist ./apps/api/public

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:/app/data/little-origin.db
ENV SERVE_STATIC=true

EXPOSE 4000

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]

