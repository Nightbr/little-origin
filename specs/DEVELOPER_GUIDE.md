# Developer Guide

Complete setup instructions and development workflows for Little Origin.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Code Quality](#code-quality)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

**mise** - Runtime version manager
```bash
# Install mise
curl https://mise.run | sh

# Add to shell profile (~/.bashrc or ~/.zshrc)
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
# or for zsh:
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

**That's it!** mise will automatically install:
- Node.js 24
- pnpm (latest)

### Optional Tools

- **Git** - Version control
- **Docker** - For containerized deployment
- **VS Code** - Recommended IDE

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/Nightbr/little-origin.git
cd little-origin
```

### 2. Install Dependencies

```bash
# mise automatically installs Node 24 + pnpm when entering directory
cd little-origin

# Verify installation
node --version  # v24.x.x
pnpm --version  # 9.x.x

# Install dependencies
pnpm install
```

### 3. Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables:**
```bash
# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-me

# Database
DATABASE_URL=file:./data/database.db

# Node environment
NODE_ENV=development

# Optional: AI features (leave empty to disable)
OPENROUTER_API_KEY=
```

### 4. Database Setup

```bash
# Generate database schema
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Open Drizzle Studio to view database
pnpm db:studio
```

### 5. Start Development Server

```bash
# Start all apps (frontend + backend)
pnpm dev
```

**Services will be available at:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- GraphQL Playground: http://localhost:3000/graphql

---

## Development Workflow

### Project Structure

```
little-origin/
├── apps/
│   ├── web/          # Frontend (React + Vite)
│   └── api/          # Backend (Node.js + GraphQL)
├── packages/
│   ├── core/         # Shared types & schemas
│   ├── mastra-ai/    # AI integration
│   └── name-data/    # Static name files
```

### Common Commands

#### Development

```bash
# Start all apps
pnpm dev

# Start specific app
pnpm --filter @little-origin/web dev
pnpm --filter @little-origin/api dev

# Build all
pnpm build

# Build specific app
pnpm --filter @little-origin/web build
```

#### Code Quality

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check
pnpm typecheck

# Run all quality checks
pnpm lint && pnpm format:check && pnpm typecheck
```

#### Dependencies

```bash
# Check for version mismatches
pnpm deps:check

# Fix version mismatches
pnpm deps:fix

# Find unused dependencies
pnpm deps:unused

# Add dependency to specific package
pnpm --filter @little-origin/web add react-query
pnpm --filter @little-origin/api add express
pnpm --filter @little-origin/core add zod
```

#### Database

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Reset database (WARNING: deletes all data)
rm -rf data/database.db*
pnpm db:migrate
```

#### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm --filter @little-origin/api test -- services/name.service.test.ts

# Generate coverage report
pnpm test --coverage
```

---

## Code Quality

### Biome.js

**Replaces ESLint + Prettier** with a single, fast tool.

#### Configuration

```json
// biome.json
{
  "formatter": {
    "indentWidth": 2,
    "lineWidth": 100,
    "quoteStyle": "single"
  },
  "linter": {
    "rules": {
      "recommended": true
    }
  }
}
```

#### Commands

```bash
# Check formatting + linting
pnpm lint

# Fix issues automatically
pnpm lint:fix

# Format code
pnpm format

# Format and write changes
pnpm format:fix
```

#### VS Code Integration

```bash
# Install Biome extension
code --install-extension biomejs.biome

# Add to .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

### Pre-commit Hooks

```bash
# Install husky
pnpm exec husky install

# Add pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint
pnpm format:check
pnpm typecheck
EOF

chmod +x .husky/pre-commit
```

---

## Testing

### Test Structure

```
apps/api/src/
├── services/
│   ├── name.service.ts
│   └── __tests__/
│       └── name.service.test.ts
└── graphql/
    ├── resolvers/
    │   ├── auth.ts
    │   └── __tests__/
    │       └── auth.test.ts
```

### Unit Tests

```typescript
// apps/api/src/services/__tests__/name.service.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/client.test';
import { NameService } from '../name.service';

describe('NameService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let service: NameService;

  beforeEach(() => {
    ({ db } = createTestDb());
    service = new NameService(db);
  });

  it('should seed names from static files', async () => {
    const result = await service.seedNames(250);
    
    expect(result.count).toBe(250);
    expect(result.source).toBe('static');
  });

  it('should get next unreviewd name', async () => {
    // Seed some names
    await service.seedNames(10);
    
    // Get next name for user 1
    const name = await service.getNextName(1);
    
    expect(name).toBeDefined();
    expect(name?.name).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
// apps/api/src/graphql/__tests__/integration.test.ts

import { describe, it, expect } from 'vitest';
import { createTestServer } from '../testServer';

describe('GraphQL Integration', () => {
  it('should complete onboarding flow', async () => {
    const server = await createTestServer();

    // 1. Create users
    const users = await server.executeOperation({
      query: `
        mutation CreateUsers($users: [UserInput!]!) {
          createUsers(users: $users) {
            id
            username
          }
        }
      `,
      variables: {
        users: [
          { username: 'alice', password: 'pass123' },
          { username: 'bob', password: 'pass456' },
        ],
      },
    });

    expect(users.body.singleResult.data?.createUsers).toHaveLength(2);

    // 2. Set preferences
    const prefs = await server.executeOperation({
      query: `
        mutation SetPreferences($input: PreferencesInput!) {
          setPreferences(input: $input) {
            countryOrigins
            genderPreference
          }
        }
      `,
      variables: {
        input: {
          countryOrigins: ['US', 'IT'],
          genderPreference: 'BOTH',
          maxCharacters: 12,
        },
      },
    });

    expect(prefs.body.singleResult.data?.setPreferences.countryOrigins).toContain('US');

    // 3. Seed names
    const seed = await server.executeOperation({
      query: `
        mutation SeedNames {
          seedNames {
            count
            source
          }
        }
      `,
    });

    expect(seed.body.singleResult.data?.seedNames.count).toBeGreaterThan(0);
  });
});
```

### E2E Tests (Playwright)

```typescript
// apps/web/e2e/onboarding.spec.ts

import { test, expect } from '@playwright/test';

test('complete onboarding flow', async ({ page }) => {
  await page.goto('/');

  // Step 1: Create users
  await page.fill('[name="users[0].username"]', 'alice');
  await page.fill('[name="users[0].password"]', 'pass123');
  await page.click('text=Add User');
  await page.fill('[name="users[1].username"]', 'bob');
  await page.fill('[name="users[1].password"]', 'pass456');
  await page.click('text=Continue');

  // Step 2: Set preferences
  await page.check('text=United States');
  await page.check('text=Italy');
  await page.check('text=Both');
  await page.click('text=Continue');

  // Step 3: Seed names
  await expect(page.locator('text=Loading names')).toBeVisible();
  await expect(page.locator('text=Successfully loaded')).toBeVisible({ timeout: 10000 });
  await page.click('text=Start Swiping');

  // Should land on swipe view
  await expect(page.locator('[data-testid="swipe-card"]')).toBeVisible();
});
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

#### 2. Database Locked

```bash
# SQLite database is locked
# Close all connections and restart
rm -rf data/database.db-shm data/database.db-wal
pnpm dev
```

#### 3. Dependency Version Mismatch

```bash
# Check for mismatches
pnpm deps:check

# Fix automatically
pnpm deps:fix

# Clean install
rm -rf node_modules
pnpm install
```

#### 4. TypeScript Errors

```bash
# Clear cache and rebuild
pnpm clean
pnpm build

# Check for type errors
pnpm typecheck
```

#### 5. Biome Errors

```bash
# Auto-fix linting issues
pnpm lint:fix

# Auto-format code
pnpm format:fix

# Check configuration
cat biome.json
```

### Debug Mode

#### Backend

```bash
# Start with inspector
NODE_OPTIONS='--inspect' pnpm --filter @little-origin/api dev

# In Chrome: chrome://inspect
```

#### Frontend

```bash
# React DevTools
# Install browser extension: https://react.dev/learn/react-developer-tools

# Vite has built-in HMR debugging
# Check browser console for Vite logs
```

### Performance Profiling

```bash
# Turbo telemetry
turbo run build --summarize

# Bundle analysis (frontend)
pnpm --filter @little-origin/web build --analyze

# SQLite query profiling
# Add to code:
db.run('EXPLAIN QUERY PLAN SELECT ...')
```

---

## IDE Setup

### VS Code Extensions

```bash
# Install recommended extensions
code --install-extension biomejs.biome
code --install-extension bradlc.vscode-tailwindcss
code --install-extension GraphQL.vscode-graphql
code --install-extension drizzle.drizzle-vscode
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### VS Code Tasks

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
      "type": "shell",
      "command": "pnpm dev",
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "test",
      "type": "shell",
      "command": "pnpm test",
      "group": {
        "kind": "test",
        "isDefault": true
      }
    }
  ]
}
```

---

## Git Workflow

### Branch Naming

```bash
# Features
git checkout -b feature/swipe-animation
git checkout -b feature/match-notification

# Fixes
git checkout -b fix/database-connection
git checkout -b fix/login-validation

# Chores
git checkout -b chore/update-dependencies
git checkout -b chore/improve-docs
```

### Commit Convention

```bash
# Format: <type>(<scope>): <subject>

# Examples:
git commit -m "feat(swipe): add gesture recognition"
git commit -m "fix(auth): resolve JWT expiration issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "chore(deps): upgrade drizzle to v0.37"
git commit -m "refactor(name-service): simplify seeding logic"
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `chore` - Maintenance
- `refactor` - Code restructuring
- `test` - Tests
- `perf` - Performance improvement

---

## Useful Scripts

### Database Reset

```bash
#!/bin/bash
# scripts/reset-db.sh

echo "Resetting database..."
rm -rf data/database.db*
pnpm db:migrate
echo "Database reset complete!"
```

### Seed Development Data

```bash
#!/bin/bash
# scripts/seed-dev.sh

echo "Seeding development data..."

# Run GraphQL mutations
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createUsers(users: [{username: \"alice\", password: \"pass123\"}, {username: \"bob\", password: \"pass456\"}]) { id } }"
  }'

curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { setPreferences(input: {countryOrigins: [\"US\", \"IT\"], genderPreference: BOTH, maxCharacters: 12}) { id } }"
  }'

curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { seedNames { count } }"
  }'

echo "Development data seeded!"
```

---

## Summary

**Quick Start:**
```bash
# 1. Install mise
curl https://mise.run | sh

# 2. Clone and setup
git clone <repo>
cd little-origin
pnpm install

# 3. Configure
cp .env.example .env

# 4. Database
pnpm db:migrate

# 5. Start
pnpm dev
```

**Daily Workflow:**
```bash
git pull
pnpm install      # If dependencies changed
pnpm dev          # Start development
pnpm lint         # Before committing
git commit
git push
```

**Next Steps:**
- See [FEATURES.md](./FEATURES.md) for feature implementation
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines