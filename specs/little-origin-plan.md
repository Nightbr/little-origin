# Little Origin - Technical Specification

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [GraphQL API](#graphql-api)
6. [Authentication & Security](#authentication--security)
7. [Name Sourcing Strategy](#name-sourcing-strategy)
8. [Key Features](#key-features)
9. [Developer Experience](#developer-experience)
10. [CI/CD & Deployment](#cicd--deployment)

---

## Overview

Little Origin: A collaborative open-source app for families to find the perfect baby name together.

**Core Features:**

- Swipe interface (Tinder-style) for name selection
- Real-time match notifications when 2+ users like the same name
- Support for up to 10 users per instance
- Undo functionality for last swipe
- Multiple name sources (static files, AI generation)
- Self-hosted with Docker

---

## Tech Stack

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **GraphQL Client**: Apollo Client
- **Animations**: Framer Motion
- **Gestures**: react-swipeable

### Backend

- **Runtime**: Node.js 24
- **Framework**: Express
- **GraphQL**: Apollo Server + Subscriptions (WebSocket)
- **Database**: SQLite + Drizzle ORM
- **Validation**: Zod (derived from Drizzle schemas)
- **Auth**: JWT + Argon2

### AI & Data

- **AI Framework**: Mastra
- **LLM Provider**: OpenRouter (Gemini Flash 1.5-8B)
- **Static Data**: JSON files (7 countries)

### Developer Experience

- **Monorepo**: Turborepo + pnpm workspaces
- **Code Quality**: Biome.js (linter + formatter)
- **Dependency Management**: syncpack + knip
- **Runtime Management**: mise (Node 24 + pnpm)
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry (ghcr.io)

---

## Project Structure

```
little-origin/
├── apps/
│   ├── web/                    # React frontend
│   └── api/                    # Node.js backend
├── packages/
│   ├── core/                   # Shared types & schemas
│   ├── mastra-ai/              # AI integration
│   └── name-data/              # Static name files
├── data/                       # SQLite database (Docker volume)
├── .github/workflows/          # CI/CD pipelines
├── .mise.toml                  # Runtime versions
├── biome.json                  # Code quality config
├── turbo.json                  # Monorepo config
├── .syncpackrc.json            # Dependency sync
├── knip.json                   # Unused deps detection
├── docker-compose.yml
├── Dockerfile
└── pnpm-workspace.yaml
```

**See [STRUCTURE.md](./STRUCTURE.md) for detailed file tree.**

---

## Database Schema

All schemas are defined once in Drizzle and automatically generate Zod validation schemas and TypeScript types.

### Tables

**users**

- `id` (PK, auto-increment)
- `username` (unique, 3-30 chars, alphanumeric)
- `passwordHash` (Argon2)
- `createdAt` (timestamp)

**preferences** (singleton)

- `id` (PK)
- `countryOrigins` (JSON array, ISO codes)
- `genderPreference` ('male' | 'female' | 'both')
- `maxCharacters` (3-20)
- `updatedAt` (timestamp)

**names**

- `id` (PK)
- `name` (2-50 chars)
- `gender` ('male' | 'female')
- `originCountry` (ISO code)
- `source` ('api' | 'llm' | 'seed' | 'static')
- `createdAt` (timestamp)
- **UNIQUE**: (name, gender)

**reviews**

- `id` (PK)
- `userId` (FK → users)
- `nameId` (FK → names)
- `isLiked` (boolean)
- `reviewedAt` (timestamp)
- **UNIQUE**: (userId, nameId)

**matches**

- `id` (PK)
- `nameId` (FK → names, unique)
- `userCount` (≥2)
- `matchedAt` (timestamp)

### Schema Definition Pattern

```typescript
// packages/core/src/db/schema.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// 1. Define Drizzle schema
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 2. Auto-generate Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  passwordHash: z.string(),
}).omit({ id: true });

export const selectUserSchema = createSelectSchema(users);

// 3. Infer TypeScript types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

**Benefits:**

- ✅ Single source of truth (Drizzle schema)
- ✅ Automatic runtime validation (Zod)
- ✅ Compile-time type safety (TypeScript)
- ✅ No type/validation drift

**See [DATABASE.md](./DATABASE.md) for complete schema definition.**

---

## GraphQL API

### Key Operations

**Queries**

- `me` - Current user info
- `nextName` - Get next unreviewd name for current user
- `myLikes` / `myDislikes` - User's reviewed names
- `matches` - All matched names (2+ likes)
- `allUsersReviews` - All users' likes/dislikes
- `preferences` - Global app preferences
- `userCount` - Total users in instance

**Mutations**

- `register` / `login` / `logout` - Authentication
- `createUsers` - Onboarding (batch create)
- `setPreferences` - Set global preferences
- `seedNames` - Initial name population
- `reviewName` - Swipe left/right
- `undoLastReview` - Revert last action
- `fetchMoreNames` - Refill name pool

**Subscriptions**

- `matchCreated` - Real-time match notifications
- `namePoolStatusChanged` - Low pool alerts

**See [GRAPHQL.md](./GRAPHQL.md) for complete schema and examples.**

---

## Authentication & Security

### Password Hashing (Argon2)

```typescript
import * as argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id, // Hybrid mode (recommended)
  memoryCost: 65536, // 64 MB
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 threads
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
```

**Why Argon2 over bcrypt?**

- More resistant to GPU/ASIC attacks
- Configurable memory hardness
- Winner of Password Hashing Competition (2015)

### JWT Tokens

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}
```

**Security Features:**

- httpOnly cookies (prevent XSS)
- 7-day expiration
- Secure flag in production
- GraphQL context authentication

---

## Name Sourcing Strategy

### Priority Order

1. **Static JSON Files** (instant, no API calls)
   - 7 countries with 100-150 names each
   - Pre-loaded at build time
   - Filtered by preferences

2. **Free APIs** (if available)
   - Baby Names API
   - Behind the Name API
   - Custom scrapers

3. **LLM Generation** (Mastra + OpenRouter)
   - Bulk generation (500-1000 names)
   - Gemini Flash 1.5-8B (~$0.075/1M tokens)
   - Only when pool is low

### Name Pool Management

```typescript
class NameService {
  private readonly LOW_THRESHOLD = 10;
  private readonly REFILL_COUNT = 250;

  async getNextName(userId: number): Promise<Name | null> {
    // Get unreviewd names
    const unreviewed = await this.getUnreviewedNames(userId);

    // Check pool status
    const remaining = await this.getRemainingCount(userId);

    // Trigger background refill if low
    if (remaining < this.LOW_THRESHOLD) {
      this.refillNamesBackground();
    }

    return unreviewed[0] || null;
  }

  private async refillNamesBackground(): Promise<void> {
    // Non-blocking refill
    setTimeout(async () => {
      const prefs = await this.getPreferences();
      await this.seedNames(prefs, this.REFILL_COUNT);
    }, 0);
  }
}
```

### Static Name Data Structure

```json
// packages/name-data/data/names-us.json
{
  "country": "US",
  "countryName": "United States",
  "male": ["Liam", "Noah", "Oliver", ...],
  "female": ["Olivia", "Emma", "Charlotte", ...]
}
```

**Countries:** US, GB, FR, IT, DE, ES, IE

**See [NAME_SOURCING.md](./NAME_SOURCING.md) for AI integration details.**

---

## Key Features

### 1. Swipe Interface with Undo

**Gesture Recognition:**

- Mouse drag (desktop)
- Touch swipe (mobile)
- Arrow keys (keyboard)
- Button clicks (fallback)

**Undo Mechanism:**

```typescript
async function undoLastReview(userId: number): Promise<Review | null> {
  // Get most recent review
  const lastReview = await db.query.reviews.findFirst({
    where: eq(reviews.userId, userId),
    orderBy: desc(reviews.reviewedAt),
  });

  if (!lastReview) return null;

  // Delete review
  await db.delete(reviews).where(eq(reviews.id, lastReview.id));

  // Recalculate matches (may delete match if <2 likes)
  await matchService.recalculateMatch(lastReview.nameId);

  return lastReview;
}
```

### 2. Real-time Match Detection

**Match Creation:**

- Triggered when 2+ users like the same name
- Updates existing match if more users like it
- Deletes match if likes drop below 2 (undo)

**Real-time Updates:**

```typescript
const pubsub = new PubSub();

// In reviewName mutation
if (likesCount >= 2) {
  const match = await createMatch(nameId, likesCount);

  // Broadcast to all subscribed clients
  pubsub.publish('MATCH_CREATED', { matchCreated: match });
}

// Subscription resolver
Subscription: {
  matchCreated: {
    subscribe: () => pubsub.asyncIterator(['MATCH_CREATED']),
  },
}
```

### 3. Multi-user Support

- Maximum 10 users per instance
- Validated during onboarding
- Each user has independent review history
- Shared match view shows all users' names

**See [FEATURES.md](./FEATURES.md) for complete feature documentation.**

---

## Developer Experience

### Runtime Management (mise)

```toml
# .mise.toml
[tools]
node = "24"
pnpm = "latest"

[tasks.dev]
run = "turbo dev"

[tasks.build]
run = "turbo build"
```

**Setup:**

```bash
# Install mise
curl https://mise.run | sh

# Auto-install Node 24 + pnpm when entering directory
cd little-origin
mise install
```

### Monorepo (Turborepo)

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

**Commands:**

```bash
pnpm dev          # Start all apps
pnpm build        # Build everything
pnpm lint         # Lint all code
pnpm test         # Run all tests
```

### Code Quality (Biome.js)

```json
// biome.json
{
  "formatter": {
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "rules": {
      "recommended": true
    }
  }
}
```

**Replaces ESLint + Prettier:**

- 100x faster than ESLint
- Single tool for linting + formatting
- Zero config for most projects

### Dependency Management

**syncpack** - Version consistency

```bash
pnpm deps:check   # Find mismatches
pnpm deps:fix     # Fix versions
```

**knip** - Unused dependencies

```bash
pnpm deps:unused  # Find unused deps/exports
```

**See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for complete DX setup.**

---

## CI/CD & Deployment

### GitHub Actions Workflows

**1. CI Pipeline** (`.github/workflows/ci.yml`)

- Lint & format check
- Type checking
- Unit tests
- Build verification
- Dependency audit

**2. Release Pipeline** (`.github/workflows/release.yml`)

- Build Docker image
- Push to GitHub Container Registry
- Create GitHub release
- Semantic versioning

**3. PR Checks** (`.github/workflows/pr.yml`)

- All CI checks
- Dependency mismatches
- Unused dependencies
- Size impact report

### Docker Deployment

```yaml
# docker-compose.yml
services:
  app:
    image: ghcr.io/nightbr/little-origin:latest
    ports:
      - '3000:3000'
    volumes:
      - ./data:/app/data
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
```

**Multi-stage Dockerfile:**

1. Builder stage (pnpm install + build)
2. Production stage (minimal runtime)

**GitHub Container Registry:**

```bash
# Tag and push
docker build -t ghcr.io/nightbr/little-origin:v1.0.0 .
docker push ghcr.io/nightbr/little-origin:v1.0.0
```

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.**

---

## Summary

**Production-ready features:**

- ✅ Monorepo with Turborepo
- ✅ Type-safe schema (Drizzle → Zod → TypeScript)
- ✅ Secure auth (Argon2 + JWT)
- ✅ Real-time updates (GraphQL subscriptions)
- ✅ AI-powered (Mastra + Gemini Flash)
- ✅ Developer-friendly (mise + Biome + syncpack + knip)
- ✅ CI/CD ready (GitHub Actions)
- ✅ Self-hosted (Docker + ghcr.io)

**Design principles:**

- Single source of truth (database schema)
- Type safety everywhere
- Graceful degradation (works without AI)
- Developer experience first
- Production-ready from day one

---

## Additional Documentation

- [STRUCTURE.md](./STRUCTURE.md) - Detailed file structure
- [DATABASE.md](./DATABASE.md) - Complete schema definitions
- [GRAPHQL.md](./GRAPHQL.md) - API schema and examples
- [FEATURES.md](./FEATURES.md) - Feature implementation details
- [NAME_SOURCING.md](./NAME_SOURCING.md) - AI integration guide
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Setup and workflows
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

---

**Ready to start implementation? Let's build this! 🚀**
