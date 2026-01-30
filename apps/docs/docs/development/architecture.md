---
sidebar_position: 2
---

# Architecture

Little Origin is built as a modern monorepo using Turborepo, with clear separation between frontend, backend, and shared packages.

## High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Web Frontend  │         │  Mobile Future  │
│  (React + Vite) │         │  (React Native) │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │ GraphQL + WebSocket
         ┌───────────▼───────────────┐
         │      API Gateway          │
         │  (Express + Apollo)        │
         └───────────┬───────────────┘
                     │
         ┌───────────▼───────────────┐
         │     Business Logic        │
         │    (Service Layer)        │
         └───────────┬───────────────┘
                     │
         ┌───────────▼───────────────┐
         │    Data Access Layer     │
         │   (Drizzle ORM)          │
         └───────────┬───────────────┘
                     │
         ┌───────────▼───────────────┐
         │    SQLite Database       │
         │  (upgradeable to Postgres)│
         └───────────────────────────┘
```

## Monorepo Structure

### Apps

**Frontend Application** (`apps/web/`)
- React 18 with TypeScript
- Vite for fast development
- TanStack Router for file-based routing
- Apollo Client for GraphQL
- Framer Motion for animations

**Backend Application** (`apps/api/`)
- Express server
- Apollo GraphQL with subscriptions
- JWT + refresh token authentication
- Drizzle ORM for database access

### Packages

**Core Package** (`packages/core/`)
- Shared database schemas
- TypeScript types
- Business logic
- Constants and enums

**Name Data** (`packages/name-data/`)
- Name data loader
- JSON assets from 7 countries
- Data transformation utilities

## Frontend Architecture

### Component Structure

```
src/
├── components/       # Reusable components
│   ├── ui/          # Base UI components
│   ├── forms/       # Form components
│   └── layout/      # Layout components
├── routes/          # File-based routing
│   ├── __root.tsx   # Root layout
│   ├── index.tsx    # Home page
│   └── auth/        # Auth routes
├── lib/             # Utilities and clients
│   ├── graphql/     # GraphQL client
│   └── router.ts    # Router instance
└── styles/          # Global styles
```

### State Management

- **Apollo Client** - Server state (GraphQL)
- **React Router** - URL state
- **React State** - Local component state
- **LocalStorage** - Auth tokens and user preferences

### Routing

TanStack Router provides:
- File-based routing
- Type-safe navigation
- Code-splitting by default
- Nested layouts and routes

## Backend Architecture

### Layered Design

```
├── src/
│   ├── graphql/          # GraphQL layer
│   │   ├── schema.ts     # Type definitions
│   │   ├── resolvers/    # Query/Mutation resolvers
│   │   └── subscriptions.ts
│   ├── services/         # Business logic
│   │   ├── auth.ts       # Authentication
│   │   ├── users.ts      # User management
│   │   ├── names.ts      # Name data
│   │   └── matches.ts    # Match detection
│   ├── db/              # Database layer
│   │   ├── index.ts     # Database instance
│   │   └── queries.ts   # Pre-built queries
│   └── middleware/      # Express middleware
│       ├── auth.ts      # JWT verification
│       └── error.ts     # Error handling
```

### GraphQL Schema

The API is organized by domain:

- **Auth** - Login, register, token refresh
- **Users** - User management, preferences
- **Names** - Name data, filtering, pagination
- **Reviews** - Swipe decisions (like/pass)
- **Matches** - Mutual likes detection
- **Subscriptions** - Real-time updates

### Authentication Flow

1. **Login** - Email + password → JWT access token + refresh token
2. **Request** - Access token in Authorization header
3. **Verify** - Middleware validates JWT signature and expiry
4. **Refresh** - Near expiry, use refresh token for new access token
5. **Rotate** - Refresh token is rotated for security

### Real-time Updates

WebSocket subscriptions deliver:

- **Match Notifications** - When both partners like a name
- **Presence** - Partner online status
- **Activity** - Real-time swipe updates (future)

## Database Schema

### Core Entities

**Users** - Authentication and preferences
```typescript
{
  id: string
  email: string
  passwordHash: string
  circleId: string
  preferences: { country, gender, ... }
}
```

**Names** - Baby name catalog
```typescript
{
  id: string
  name: string
  gender: 'male' | 'female' | 'neutral'
  country: string
  year: number
  rank: number
}
```

**Reviews** - Swipe decisions
```typescript
{
  id: string
  userId: string
  nameId: string
  liked: boolean
  createdAt: timestamp
}
```

**Matches** - Mutual likes
```typescript
{
  id: string
  nameId: string
  circleId: string
  matchedAt: timestamp
}
```

### Relationships

- Users → Circle (many-to-one)
- Users → Reviews (one-to-many)
- Names → Reviews (one-to-many)
- Circle → Matches (one-to-many)
- Names → Matches (one-to-many)

## Technology Choices

### Why React?

- Component-based architecture
- Large ecosystem and community
- TypeScript support
- Works for web and future mobile app

### Why GraphQL?

- Type-safe API contracts
- Flexible queries (no over/under-fetching)
- Built-in subscriptions for real-time
- Single endpoint simplicity

### Why SQLite?

- Zero configuration
- Single file deployment
- Sufficient performance for most use cases
- Easy upgrade path to PostgreSQL

### Why Drizzle ORM?

- Type-safe queries
- No runtime overhead
- Schema as code
- Easy migrations

## Security Architecture

### Authentication

- **Argon2** - Password hashing (memory-hard, GPU-resistant)
- **JWT** - Stateless token-based auth
- **Refresh Tokens** - Secure long-lived sessions
- **Token Rotation** - Prevents token replay attacks

### Data Protection

- **Input Validation** - All user input validated
- **SQL Injection Prevention** - Parameterized queries
- **XSS Prevention** - React auto-escapes content
- **CSRF Protection** - SameSite cookies, token verification

### Privacy

- **No Third-party Tracking** - No analytics or ads
- **Self-hosted** - Data stays on your server
- **Encrypted at Rest** - Optional database encryption
- **Encrypted in Transit** - TLS/HTTPS required

## Performance Optimization

### Frontend

- **Code Splitting** - Routes split automatically
- **Lazy Loading** - Components loaded on demand
- **Image Optimization** - Responsive images
- **Caching** - Apollo client cache

### Backend

- **Database Indexing** - Optimized query performance
- **Connection Pooling** - Efficient database access
- **Query Optimization** - Efficient GraphQL resolvers
- **CDN Ready** - Static assets can be cached

## Deployment Architecture

### Docker Multi-stage Build

```
Stage 1: Dependencies
  └─ Install npm modules

Stage 2: Build
  └─ Build frontend and backend

Stage 3: Production
  └─ Minimal runtime image
```

### Production Stack

- **Single Container** - API serves static frontend
- **SQLite Database** - Persistent volume
- **Health Checks** - Docker health check endpoint
- **Graceful Shutdown** - Proper signal handling

## Scalability Considerations

### Vertical Scaling

- Add more CPU and memory
- Scale up to ~1000 concurrent users on SQLite

### Horizontal Scaling (Future)

- **PostgreSQL** - Replace SQLite for concurrent access
- **Redis** - Pub/sub for WebSocket subscriptions
- **Load Balancer** - Multiple API instances
- **CDN** - Static asset delivery

## Development Workflow

### Code Organization

- **Feature-based** - Group related files
- **Co-location** - Tests near source
- **Barrels** - Clean imports
- **Monorepo** - Shared types and utilities

### Quality Assurance

- **Biome** - Linting and formatting
- **TypeScript** - Type checking
- **Vitest** - Unit and integration tests
- **GitHub Actions** - CI/CD pipeline

## Future Enhancements

Planned architectural improvements:

- [ ] PostgreSQL support for high concurrency
- [ ] Redis for subscription scaling
- [ ] Message queue for async tasks
- [ ] Elasticsearch for name search
- [ ] Microservices for features
- [ ] GraphQL federation for multi-tenancy

## Related Documentation

- **[Development Setup](/docs/development/setup)** - Set up local development
- **[Contributing](/docs/development/contributing)** - Contribute guidelines

## Next Steps

- **[Set up development environment](/docs/development/setup)** - Start coding
- **[Contributing](/docs/development/contributing)** - Make your first contribution
