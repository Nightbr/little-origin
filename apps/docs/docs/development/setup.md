---
sidebar_position: 1
---

# Development Setup

## Prerequisites

- **Node.js** >= 24 and **pnpm** >= 10 — or just install [mise](https://mise.jdx.dev/) and run `mise install` to get everything, including the Python toolchain for the name generator

## Quick Start

```bash
git clone https://github.com/Nightbr/little-origin.git
cd little-origin
pnpm install

# Create .env at the repository root
echo "JWT_SECRET=development-secret-for-local-testing" > .env

pnpm dev
```

- **Web:** http://localhost:3001
- **API / GraphQL Playground:** http://localhost:3000/graphql

The SQLite database is created automatically at `.data/database.db`, and the app walks you through onboarding on first visit.

## Everyday Commands

```bash
pnpm dev              # web + api in watch mode
pnpm test             # run all tests (Vitest)
pnpm lint             # lint (Biome)
pnpm format           # format + organize imports
pnpm typecheck        # TypeScript checks
pnpm deps:check       # workspace version mismatches
pnpm deps:unused      # unused dependencies (Knip)
```

Run a single app with `pnpm --filter @little-origin/api dev` (or `web`).

Before committing, run the same check as CI:

```bash
pnpm lint && pnpm typecheck && pnpm deps:check && pnpm deps:unused
```

## Database

Schemas live in `packages/core`; migrations apply automatically when the API starts. After changing a schema:

```bash
cd apps/api
pnpm db:generate   # create migration
pnpm db:migrate    # apply it
```

Inspect the data anytime with `sqlite3 .data/database.db`.

## Common Tasks

- **New query/mutation** — add it to `apps/api/src/graphql/typeDefs.ts`, implement the resolver and service, test in the Playground
- **New table** — edit the schema in `packages/core`, then `pnpm db:generate` + `pnpm db:migrate`
- **Frontend routes** — add a file under `apps/web/src/routes/`; TanStack Router regenerates the route tree
- **Name data** — see [Name Data & Generator](/docs/development/name-data)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port already in use | `lsof -ti:3000 \| xargs kill -9` |
| `better-sqlite3` / `argon2` build errors | `pnpm rebuild` (macOS: `xcode-select --install`) |
| Dependency conflicts | `rm -rf node_modules **/node_modules && pnpm install` |
| Database errors | `rm .data/database.db` and restart — it's recreated |

## Next Steps

- **[Architecture](/docs/development/architecture)** - How the codebase fits together
- **[Contributing](/docs/development/contributing)** - Branching, commits, PRs
