# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development

```bash
pnpm dev              # Start both frontend (:5173) and backend (:3000) in watch mode
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages (Biome)
pnpm format           # Format all code (Biome)
pnpm typecheck        # Type check all packages
```

### Database (API only)

```bash
cd apps/api
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Apply migrations to SQLite
```

### Single Test Runs

```bash
# In any package directory
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
```

### Dependency Management

```bash
pnpm deps:check       # Check for version mismatches across workspace
pnpm deps:fix         # Fix dependency version mismatches
pnpm deps:unused      # Find unused dependencies (Knip)
```

## Architecture Overview

**Little Origin** is a collaborative baby name recommendation app built as a Turborepo monorepo.

### Monorepo Structure

```
apps/
  web/          # React + Vite frontend (TanStack Router, Apollo Client, Framer Motion)
  api/          # Express + Apollo GraphQL backend (SQLite, Drizzle ORM, JWT auth)
packages/
  core/         # Shared database schemas (Drizzle), types, constants
  name-data/    # Static name data loader (JSON assets from 7 countries)
.data/          # SQLite database files (gitignored)
```

### Key Architectural Patterns

**Frontend (apps/web)**

- TanStack Router with file-based routing (routeTree.gen.ts auto-generated)
- Apollo Client for GraphQL queries/mutations + WebSocket subscriptions
- Framer Motion for swipe card physics and gestures
- Authentication flow with automatic JWT refresh token rotation

**Backend (apps/api)**

- Apollo Server with GraphQL schema stitching
- Drizzle ORM with type-safe queries and proper relations
- WebSocket subscriptions for real-time match notifications
- JWT + refresh token authentication with Argon2 password hashing
- Modular service layer for business logic

**Shared (packages/core)**

- Drizzle schemas exported for both backend and frontend type safety
- Common types, enums, and constants used across apps

### Real-time Features

GraphQL subscriptions deliver live match notifications when both users "like" the same name. The WebSocket connection includes auth tokens and automatically reconnects when tokens are refreshed.

### Swipe Interface

The core UX is a physics-based card swipe interface using Framer Motion:

- Touch/mouse gesture detection for left (dislike) and right (like) swipes
- Card stack with depth illusion (background cards visible)
- Match detection happens when both partners like the same name

### Authentication Flow

1. Login returns JWT access token + refresh token (stored in localStorage/cookie)
2. Access token is included in all GraphQL requests
3. Token refresh happens automatically before expiry with retry logic
4. WebSocket connection params include auth token
5. Failed refresh or 401 responses trigger logout

## Code Style

Biome handles all formatting and linting:

- **Indent**: Tabs, width 2
- **Quotes**: Single quotes
- **Semicolons**: Always
- **Trailing commas**: All
- **Line width**: 100
- Import organization is enabled (`pnpm format` will sort imports)

Never manually format - use `pnpm format` before committing.

## Database Schema

Core entities in SQLite:

- **users**: Authentication credentials and preferences
- **names**: Baby names with country/gender metadata
- **reviews**: User swipe decisions (like/dislike)
- **matches**: Names liked by both partners
- **preferences**: User settings for country/gender filtering

The database auto-migrates on API startup using Drizzle.

## Environment Setup

Required `.env` file at repository root:

```env
JWT_SECRET=your_very_secret_key_here
```

Node.js >= 24 and pnpm >= 10 are required. Use mise to manage Node versions.

## Testing

Vitest is used across all packages. Test files should be co-located with source files or in `__tests__` directories.

## Pre-Commit Quality Check

Before committing any code, always run the full quality check suite:

```bash
pnpm lint          # Check for linting errors
pnpm typecheck     # Verify TypeScript types
pnpm deps:check    # Verify dependency versions match
pnpm deps:unused   # Check for unused dependencies
```

For a complete validation (as run in CI):
```bash
pnpm lint && pnpm typecheck && pnpm deps:check && pnpm deps:unused
```