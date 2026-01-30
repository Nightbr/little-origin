---
sidebar_position: 1
---

# Development Setup

Set up a local development environment to contribute to Little Origin or customize it for your needs.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 24.0.0 (Use [mise](https://mise.jdx.dev/) or [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** >= 10.0.0 (Install with `npm install -g pnpm`)
- **Git** for version control
- A code editor (VS Code recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Nightbr/little-origin.git
cd little-origin
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs dependencies for all packages and apps.

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
JWT_SECRET=development-secret-for-local-testing
```

### 4. Start Development Servers

```bash
pnpm dev
```

This starts both the frontend and backend in watch mode:

- **Frontend (Web):** http://localhost:5173
- **Backend (API):** http://localhost:3000
- **GraphQL Playground:** http://localhost:3000/graphql

## Project Structure

```
little-origin/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # Express + Apollo GraphQL backend
├── packages/
│   ├── core/         # Shared schemas, types, constants
│   └── name-data/    # Name data loader
└── .data/            # SQLite database (local)
```

## Development Workflow

### Running Individual Apps

Start specific apps:

```bash
# Frontend only
pnpm --filter @little-origin/web dev

# Backend only
pnpm --filter @little-origin/api dev
```

### Running Tests

Run tests for all packages:

```bash
pnpm test
```

Run tests for a specific package:

```bash
# In package directory
pnpm test:watch
```

### Type Checking

Type check all packages:

```bash
pnpm typecheck
```

### Linting

Check code with Biome:

```bash
pnpm lint
```

Auto-fix issues:

```bash
pnpm format
```

### Dependency Management

Check for version mismatches:

```bash
pnpm deps:check
```

Fix version mismatches:

```bash
pnpm deps:fix
```

Find unused dependencies:

```bash
pnpm deps:unused
```

## Database Setup

### Local SQLite Database

The database is automatically created on API startup:

```
.data/little-origin.db
```

### Running Migrations

Apply database migrations:

```bash
cd apps/api
pnpm db:migrate
```

Generate new migrations:

```bash
cd apps/api
pnpm db:generate
```

### Database Schema

The schema is defined in `packages/core/src/db/schema.ts`. See [Architecture](/docs/development/architecture) for details.

## Development Tools

### GraphQL Playground

Explore the GraphQL API at http://localhost:3000/graphql:

- **Query** - Fetch data
- **Mutate** - Modify data
- **Subscribe** - Real-time updates
- **Docs** - API documentation

### Database Inspector

View SQLite database contents:

```bash
sqlite3 .data/little-origin.db
```

Useful commands:

```sql
.tables
.schema users
SELECT * FROM reviews LIMIT 10;
```

### VS Code Extensions

Recommended extensions for development:

- **Biome** - Linting and formatting
- **GraphQL** - Syntax highlighting
- **TypeScript** - Type checking
- **Vitest** - Test runner
- **GitLens** - Git superpowers

## Common Tasks

### Adding a New GraphQL Query

1. **Define the schema** in `apps/api/src/graphql/schema.ts`
2. **Implement the resolver** in `apps/api/src/graphql/resolvers/`
3. **Add authentication** if needed (see existing resolvers)
4. **Test in GraphQL Playground**

### Adding a New Database Table

1. **Update the schema** in `packages/core/src/db/schema.ts`
2. **Generate migration** `pnpm db:generate`
3. **Apply migration** `pnpm db:migrate`
4. **Update TypeScript types** if needed

### Modifying the Frontend

The web app uses:

- **TanStack Router** - File-based routing (`apps/web/src/routes`)
- **Apollo Client** - GraphQL client
- **Framer Motion** - Animations
- **React** - UI framework

Routes are auto-generated from files in `apps/web/src/routes`.

### Adding Name Data

To add new name data sources:

1. **Create JSON file** in `packages/name-data/src/data/`
2. **Update loader** in `packages/name-data/src/index.ts`
3. **Rebuild** `pnpm --filter @little-origin/name-data build`

## Troubleshooting

### Port Already in Use

If ports are already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change ports in package.json scripts
```

### Native Module Build Errors

If `better-sqlite3` or `argon2` fail to build:

```bash
# Rebuild native modules
pnpm rebuild

# Ensure build tools are installed
# macOS: xcode-select --install
# Ubuntu: sudo apt-get install build-essential
```

### Dependency Conflicts

If you have dependency issues:

```bash
# Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Fix version mismatches
pnpm deps:fix
```

### Database Errors

If database operations fail:

```bash
# Reset database
rm .data/little-origin.db
pnpm --filter @little-origin/api dev
```

## Pre-commit Quality Check

Before committing, always run:

```bash
pnpm lint && pnpm typecheck && pnpm deps:check && pnpm deps:unused
```

This is the same check that runs in CI.

## Contributing

See [Contributing Guide](/docs/development/contributing) for:

- Code style guidelines
- Commit message conventions
- Pull request process
- Community guidelines

## Architecture

For deep dive into the codebase, see [Architecture](/docs/development/architecture).

## Next Steps

- **[Architecture overview](/docs/development/architecture)** - Understand the codebase structure
- **[Contributing](/docs/development/contributing)** - Learn how to contribute
- **[Deployment guide](/docs/deployment)** - Deploy your changes
