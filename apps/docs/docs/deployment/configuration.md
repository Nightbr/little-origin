---
sidebar_position: 2
---

# Configuration

Little Origin is configured entirely through environment variables.

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `JWT_SECRET` | **Yes** | Secret for signing auth tokens — use `openssl rand -base64 32` | *(none)* |
| `PORT` | No | API port | `3000` |
| `DATABASE_URL` | No | SQLite database path | `file:/.data/little-origin.db` |
| `SERVE_STATIC` | No | Serve the frontend from the API container | `true` |
| `NODE_ENV` | No | `production` or `development` | `production` |
| `TZ` | No | Container timezone | `UTC` |

:::warning

Never commit secrets to version control. A leaked `JWT_SECRET` lets anyone forge sessions.

:::

## Database

Everything is stored in a single SQLite file (users, preferences, names, reviews, matches). Migrations run automatically on startup.

Back it up by copying the file — see [Backups](/docs/deployment/#backups).

## Authentication

- Passwords hashed with **Argon2**
- Access tokens expire after **15 minutes**; refresh tokens after **7 days** (rotated on use)

## Logs

```bash
docker compose logs -f little-origin
```

## Next Steps

- **[Deploy](/docs/deployment/)** - The full Docker Compose guide
- **[Updating](/docs/deployment/updating)** - Upgrades and rollbacks
