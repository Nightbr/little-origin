# Project Structure

Complete file structure for the Little Origin monorepo.

---

## Root Directory

```
little-origin/
├── apps/                       # Application packages
├── packages/                   # Shared packages
├── data/                       # SQLite database (gitignored)
├── .github/                    # GitHub configuration
├── .mise.toml                  # Runtime version management
├── biome.json                  # Biome configuration
├── turbo.json                  # Turborepo configuration
├── .syncpackrc.json            # Dependency sync config
├── knip.json                   # Unused deps detection
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── pnpm-workspace.yaml
├── package.json
├── README.md
├── LICENSE
└── docs/                       # Documentation
    ├── STRUCTURE.md           # This file
    ├── DATABASE.md
    ├── GRAPHQL.md
    ├── FEATURES.md
    ├── NAME_SOURCING.md
    ├── DEVELOPER_GUIDE.md
    ├── DEPLOYMENT.md
    └── CONTRIBUTING.md
```

---

## Apps Directory

### apps/web/ - React Frontend

```
apps/web/
├── src/
│   ├── components/
│   │   ├── onboarding/
│   │   │   ├── OnboardingFlow.tsx          # Main onboarding container
│   │   │   ├── UserCreation.tsx            # Step 1: Create users
│   │   │   ├── PreferencesSetup.tsx        # Step 2: Set preferences
│   │   │   └── NameSeeding.tsx             # Step 3: Load initial names
│   │   │
│   │   ├── swipe/
│   │   │   ├── SwipeView.tsx               # Main swipe container
│   │   │   ├── SwipeCard.tsx               # Name card component
│   │   │   ├── SwipeControls.tsx           # Like/Dislike buttons
│   │   │   └── UndoButton.tsx              # Undo last action
│   │   │
│   │   ├── views/
│   │   │   ├── MatchesView.tsx             # List of matches
│   │   │   ├── LikesView.tsx               # User's liked names
│   │   │   ├── DislikesView.tsx            # User's disliked names
│   │   │   └── AllUsersView.tsx            # All users' preferences
│   │   │
│   │   ├── match/
│   │   │   ├── MatchCelebration.tsx        # Match notification modal
│   │   │   └── MatchBadge.tsx              # Match indicator
│   │   │
│   │   ├── auth/
│   │   │   ├── Login.tsx                   # Login form
│   │   │   ├── AuthGuard.tsx               # Route protection
│   │   │   └── UserSwitcher.tsx            # Switch between users
│   │   │
│   │   ├── layout/
│   │   │   ├── Navigation.tsx              # Main navigation
│   │   │   ├── MobileMenu.tsx              # Mobile hamburger menu
│   │   │   └── Header.tsx                  # App header
│   │   │
│   │   └── ui/                             # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       ├── Spinner.tsx
│   │       └── ProgressBar.tsx
│   │
│   ├── hooks/
│   │   ├── useSwipe.ts                     # Swipe logic hook
│   │   ├── useSwipeGesture.ts              # Gesture detection
│   │   ├── useAuth.ts                      # Authentication state
│   │   ├── useMatches.ts                   # Match subscription
│   │   ├── useNamePool.ts                  # Name pool status
│   │   └── useLocalStorage.ts              # Local storage wrapper
│   │
│   ├── lib/
│   │   ├── apollo-client.ts                # Apollo Client setup
│   │   ├── utils.ts                        # Utility functions
│   │   └── constants.ts                    # Frontend constants
│   │
│   ├── graphql/
│   │   ├── queries.ts                      # GraphQL queries
│   │   ├── mutations.ts                    # GraphQL mutations
│   │   ├── subscriptions.ts                # GraphQL subscriptions
│   │   └── fragments.ts                    # GraphQL fragments
│   │
│   ├── types/
│   │   ├── graphql.ts                      # Generated GraphQL types
│   │   └── index.ts                        # Custom types
│   │
│   ├── App.tsx                             # Root component
│   ├── main.tsx                            # Entry point
│   └── index.css                           # Global styles
│
├── public/
│   ├── favicon.ico
│   └── manifest.json
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── index.html
```

### apps/api/ - Node.js Backend

```
apps/api/
├── src/
│   ├── graphql/
│   │   ├── schema.ts                       # GraphQL schema builder
│   │   ├── typeDefs.ts                     # Type definitions
│   │   │
│   │   └── resolvers/
│   │       ├── index.ts                    # Resolver combiner
│   │       ├── auth.ts                     # Auth mutations
│   │       ├── name.ts                     # Name queries/mutations
│   │       ├── review.ts                   # Review mutations
│   │       ├── match.ts                    # Match queries/subscriptions
│   │       ├── preferences.ts              # Preferences queries/mutations
│   │       └── user.ts                     # User queries
│   │
│   ├── services/
│   │   ├── auth.service.ts                 # Authentication logic
│   │   ├── name.service.ts                 # Name sourcing & management
│   │   ├── review.service.ts               # Review CRUD operations
│   │   ├── match.service.ts                # Match detection logic
│   │   ├── preferences.service.ts          # Preferences management
│   │   └── ai.service.ts                   # AI name generation
│   │
│   ├── db/
│   │   ├── client.ts                       # Drizzle database client
│   │   └── migrations/                     # SQL migrations
│   │       ├── 0000_init.sql
│   │       └── meta/
│   │
│   ├── middleware/
│   │   ├── auth.ts                         # JWT authentication
│   │   ├── errorHandler.ts                 # Error handling
│   │   ├── rateLimiter.ts                  # Rate limiting
│   │   └── logger.ts                       # Request logging
│   │
│   ├── utils/
│   │   ├── jwt.ts                          # JWT utilities
│   │   ├── password.ts                     # Argon2 helpers
│   │   ├── validators.ts                   # Input validation
│   │   └── logger.ts                       # Winston logger
│   │
│   ├── config/
│   │   ├── env.ts                          # Environment variables
│   │   └── apollo.ts                       # Apollo Server config
│   │
│   ├── pubsub.ts                           # GraphQL subscriptions
│   ├── context.ts                          # GraphQL context
│   └── index.ts                            # Server entry point
│
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── .env.example
```

---

## Packages Directory

### packages/core/ - Shared Types & Schemas

```
packages/core/
├── src/
│   ├── db/
│   │   └── schema.ts                       # Drizzle schema + Zod + Types
│   │                                       # SINGLE SOURCE OF TRUTH
│   ├── constants.ts                        # Shared constants
│   └── index.ts                            # Package exports
│
├── package.json
└── tsconfig.json
```

**What's exported:**
- Database tables (Drizzle)
- Zod validation schemas (auto-generated)
- TypeScript types (auto-inferred)
- Drizzle relations
- Constants (MAX_USERS, supported countries, etc.)

### packages/mastra-ai/ - AI Integration

```
packages/mastra-ai/
├── src/
│   ├── mastra.config.ts                    # Mastra initialization
│   │
│   ├── agents/
│   │   └── nameGenerator.ts                # Name generation agent
│   │
│   ├── tools/
│   │   ├── nameValidation.ts               # Validate generated names
│   │   └── deduplication.ts                # Remove duplicates
│   │
│   ├── prompts/
│   │   └── nameGeneration.ts               # LLM prompts
│   │
│   └── index.ts                            # Package exports
│
├── package.json
└── tsconfig.json
```

**Responsibilities:**
- OpenRouter integration
- Gemini Flash configuration
- Bulk name generation
- Name validation
- Deduplication

### packages/name-data/ - Static Name Files

```
packages/name-data/
├── data/
│   ├── names-us.json                       # United States
│   ├── names-gb.json                       # United Kingdom
│   ├── names-fr.json                       # France
│   ├── names-it.json                       # Italy
│   ├── names-de.json                       # Germany
│   ├── names-es.json                       # Spain
│   └── names-ie.json                       # Ireland
│
├── src/
│   ├── index.ts                            # Data loader
│   ├── types.ts                            # Name data types
│   └── utils.ts                            # Filtering utilities
│
├── scripts/
│   └── generate-names.ts                   # Name data generator
│
├── package.json
└── tsconfig.json
```

**Each JSON file structure:**
```json
{
  "country": "US",
  "countryName": "United States",
  "male": ["Liam", "Noah", ...],
  "female": ["Olivia", "Emma", ...]
}
```

---

## Configuration Files

### .mise.toml

```toml
[tools]
node = "24"
pnpm = "latest"

[env]
NODE_ENV = "development"

[tasks.dev]
description = "Start development servers"
run = "turbo dev"

[tasks.build]
description = "Build all packages and apps"
run = "turbo build"

[tasks.lint]
run = "turbo lint"

[tasks.format]
run = "turbo format"

[tasks.typecheck]
run = "turbo typecheck"

[tasks.test]
run = "turbo test"
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "format": {},
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "semicolons": "always",
      "quoteStyle": "single"
    }
  }
}
```

### .syncpackrc.json

```json
{
  "$schema": "https://unpkg.com/syncpack@13.0.0/dist/schema.json",
  "versionGroups": [
    {
      "label": "Use workspace protocol",
      "dependencies": ["@little-origin/**"],
      "dependencyTypes": ["dev", "prod"],
      "pinVersion": "workspace:*"
    }
  ],
  "semverGroups": [
    {
      "range": "",
      "dependencies": ["**"],
      "packages": ["**"]
    }
  ]
}
```

### knip.json

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    ".": {
      "entry": ["package.json"],
      "project": ["**/*.ts", "**/*.tsx"]
    },
    "apps/*": {
      "entry": ["src/index.ts", "src/main.tsx"],
      "project": ["src/**/*.ts", "src/**/*.tsx"]
    },
    "packages/*": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    }
  },
  "ignore": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.config.js",
    "**/*.config.ts"
  ]
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## GitHub Directory

```
.github/
├── workflows/
│   ├── ci.yml                              # Continuous Integration
│   ├── release.yml                         # Release & Docker publish
│   ├── pr.yml                              # Pull Request checks
│   └── dependency-review.yml               # Dependency security scan
│
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── config.yml
│
├── PULL_REQUEST_TEMPLATE.md
├── CODEOWNERS
└── dependabot.yml
```

---

## Data Directory (Gitignored)

```
data/
├── database.db                             # SQLite database
├── database.db-shm                         # Shared memory file
└── database.db-wal                         # Write-ahead log
```

**Mounted as Docker volume:**
```yaml
volumes:
  - ./data:/app/data
```

---

## Build Artifacts (Gitignored)

```
# Per package/app
dist/                   # Compiled TypeScript
build/                  # Production builds
.turbo/                 # Turborepo cache
node_modules/           # Dependencies
coverage/               # Test coverage
*.log                   # Log files

# Root
.env                    # Environment variables (local)
.env.local
.env.*.local
```

---

## Package Dependencies

### Root package.json

```json
{
  "name": "little-origin",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "format": "turbo format",
    "test": "turbo test",
    "deps:check": "syncpack list-mismatches",
    "deps:fix": "syncpack fix-mismatches",
    "deps:unused": "knip"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "husky": "^9.1.7",
    "knip": "^5.38.2",
    "syncpack": "^13.0.0",
    "turbo": "^2.3.3"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=24.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### apps/web/package.json

```json
{
  "name": "@little-origin/web",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "biome check .",
    "format": "biome format .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@apollo/client": "^3.11.8",
    "@little-origin/core": "workspace:*",
    "framer-motion": "^11.15.0",
    "graphql": "^16.9.0",
    "lucide-react": "^0.460.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.3",
    "react-swipeable": "^7.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
}
```

### apps/api/package.json

```json
{
  "name": "@little-origin/api",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "biome check .",
    "format": "biome format .",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@apollo/server": "^4.11.3",
    "@little-origin/core": "workspace:*",
    "@little-origin/mastra-ai": "workspace:*",
    "@little-origin/name-data": "workspace:*",
    "argon2": "^0.41.1",
    "better-sqlite3": "^11.8.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "drizzle-orm": "^0.37.0",
    "express": "^4.21.2",
    "graphql": "^16.9.0",
    "graphql-subscriptions": "^2.0.0",
    "graphql-ws": "^5.16.0",
    "jsonwebtoken": "^9.0.2",
    "ws": "^8.18.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.10.2",
    "@types/ws": "^8.5.13",
    "drizzle-kit": "^0.30.1",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
```

### packages/core/package.json

```json
{
  "name": "@little-origin/core",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "biome check .",
    "format": "biome format .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.37.0",
    "drizzle-zod": "^0.7.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "typescript": "^5.7.2"
  }
}
```

---

## Import Aliases

### Frontend (apps/web)

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@lib': '/src/lib',
      '@graphql': '/src/graphql',
    },
  },
});

// Usage
import { Button } from '@components/ui/Button';
import { useAuth } from '@hooks/useAuth';
```

### Backend (apps/api)

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@services/*": ["./src/services/*"],
      "@graphql/*": ["./src/graphql/*"]
    }
  }
}

// Usage
import { NameService } from '@services/name.service';
import { authResolvers } from '@graphql/resolvers/auth';
```

---

## Summary

**Key Principles:**
- **Clear separation**: Apps vs Packages
- **Shared code**: @little-origin/core for types/schemas
- **Single responsibility**: Each package has one job
- **Type safety**: TypeScript everywhere
- **Consistency**: Same structure across apps/packages

**Navigation Tips:**
- Core types/schemas: `packages/core/src/db/schema.ts`
- GraphQL schema: `apps/api/src/graphql/`
- React components: `apps/web/src/components/`
- Business logic: `apps/api/src/services/`
- Static data: `packages/name-data/data/`

**Next Steps:**
- See [DATABASE.md](./DATABASE.md) for schema details
- See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for setup
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines