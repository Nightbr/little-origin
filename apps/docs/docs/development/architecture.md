---
sidebar_position: 2
---

# Architecture

Little Origin is a Turborepo monorepo: a React frontend, a GraphQL backend, and shared packages.

```
┌─────────────────────┐
│    Web Frontend     │  React + Vite + TanStack Router
└──────────┬──────────┘
           │ GraphQL over HTTP + WebSocket
┌──────────▼──────────┐
│     API Server      │  Express + Apollo Server
│    Service Layer    │  Business logic
│     Drizzle ORM     │  Type-safe data access
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│       SQLite        │  Single-file database
└─────────────────────┘
```

## Monorepo Structure

```
apps/
  web/                  # React frontend
  api/                  # Express + Apollo GraphQL backend
  docs/                 # This documentation site (Docusaurus)
packages/
  core/                 # Drizzle schemas, shared types, constants
  name-data/            # Base name datasets + loader
  name-data-generator/  # Python tool producing the extended datasets
```

## Frontend (`apps/web`)

- **TanStack Router** — file-based routes in `src/routes/` (swipe deck, likes, dislikes, matches, preferences, members, onboarding, advanced)
- **Apollo Client** — queries, mutations, and WebSocket subscriptions
- **Framer Motion** — swipe card physics and gestures
- Components are grouped by domain in `src/components/` (`swipe`, `match`, `lists`, `onboarding`, `advanced`, `auth`, `layout`, `ui`)

State lives in Apollo's cache (server data), the URL (navigation), and local component state. Auth tokens are kept in localStorage.

## Backend (`apps/api`)

```
src/
  graphql/       # typeDefs, resolvers
  services/      # auth, review, match, name, member, preferences, onboarding, ingestion
  db/            # Drizzle client, migrations run on startup
  middleware/    # JWT verification
  pubsub.ts      # Subscription events
```

Resolvers stay thin; business logic lives in the service layer.

### Authentication

1. Login with username + password (hashed with **Argon2**)
2. API returns a short-lived JWT access token + a refresh token
3. The client refreshes automatically before expiry; refresh tokens are rotated
4. WebSocket connections authenticate with the same token

### Real-time

Two GraphQL subscriptions over WebSocket:

- `matchCreated` — fired when both partners like the same name
- `nameIngestionProgress` — live progress while loading extended datasets

## Database Schema

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `users` | Member accounts | `username`, `password_hash` |
| `names` | Name catalog | `name`, `gender`, `origin_country`, `source` (`static` or `extended`) |
| `reviews` | Swipe decisions | `user_id`, `name_id`, `is_liked` |
| `matches` | Names liked by all partners | `name_id`, `user_count`, `matched_at` |
| `preferences` | Shared filter settings (single row) | `country_origins`, `gender_preference`, `max_characters`, `family_name` |
| `app_settings` | Onboarding completion flag | |

Schemas are defined with Drizzle in `packages/core` and shared by both apps. Migrations apply automatically when the API starts.

## Deployment

A multi-stage Dockerfile produces a single container: the API serves the built frontend (`SERVE_STATIC=true`), SQLite lives on a mounted volume, and `/health` backs the Docker health check.

## Next Steps

- **[Development Setup](/docs/development/setup)** - Run it locally
- **[Name Data & Generator](/docs/development/name-data)** - Where the names come from
