---
sidebar_position: 3
---

# Configuration

Customize your Little Origin instance to match your preferences and needs.

## Environment Variables

Configuration is done through environment variables. Create a `.env` file in the project root:

```bash
# Required
JWT_SECRET=your_very_secret_key_here

# Optional
PORT=3000
NODE_ENV=production
```

### JWT_SECRET

**Required.** Secret key used for signing JWT tokens.

- **Purpose:** Authentication and session security
- **Recommendation:** Use a cryptographically secure random string (32+ characters)
- **How to generate:**

```bash
openssl rand -base64 32
```

:::warning Security

Never commit your `.env` file to version control. Keep your JWT secret secure and rotate it periodically.

:::

### PORT

**Optional.** Port for the API server.

- **Default:** `3000`
- **Note:** The web frontend is served from the same container on the port specified in your Docker configuration

### NODE_ENV

**Optional.** Runtime environment.

- **Values:** `production` | `development`
- **Default:** `production`
- **Effects:** Enables detailed logging in development mode

## Database Configuration

Little Origin uses SQLite by default, which requires no additional configuration. The database is stored in the `.data/` directory.

### SQLite File Location

```
.data/little-origin.db
```

### Switching to PostgreSQL

For production deployments with multiple users, consider PostgreSQL:

1. **Install PostgreSQL** on your server or use a managed service
2. **Update database configuration** in the API code (requires code changes)
3. **Run migrations** against PostgreSQL instead of SQLite

:::info

PostgreSQL support is planned for a future release. Currently, SQLite is the recommended and supported database.

:::

## Name Data Configuration

Little Origin includes name data from 7 countries. The data is loaded from JSON files in the `packages/name-data/` directory.

### Supported Countries

- 🇺🇸 United States
- 🇬🇧 United Kingdom
- 🇫🇷 France
- 🇪🇸 Spain
- 🇩🇪 Germany
- 🇮🇹 Italy
- 🇧🇷 Brazil

### Adding Custom Name Data

To add custom name data:

1. **Create a JSON file** with the following structure:

```json
[
  {
    "id": "unique-id",
    "name": "Example",
    "gender": "male",
    "country": "US",
    "year": 2023,
    "rank": 1,
    "count": 1000
  }
]
```

2. **Place the file** in `packages/name-data/src/data/`
3. **Rebuild the application:**

```bash
docker compose build --no-cache
docker compose up -d
```

## Authentication Settings

### Password Hashing

Passwords are hashed using **Argon2**, a modern, secure password-hashing algorithm.

- **Algorithm:** Argon2id
- **Memory cost:** 65536 KB (64 MB)
- **Time cost:** 3 iterations
- **Parallelism:** 4 threads

### Token Expiration

- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

Refresh tokens are automatically rotated, providing enhanced security.

## Rate Limiting

Rate limiting helps protect your instance from abuse:

- **Default:** 100 requests per 15 minutes per IP
- **Authentication:** Bypasses rate limits for authenticated users

## Logging

### Production Logs

Logs are written to stdout and can be viewed with:

```bash
docker compose logs -f api
```

### Development Logs

In development mode, detailed request and error logging is enabled.

## CORS Configuration

If you're running the frontend separately from the API, configure CORS in the API:

:::note

This requires code changes to the API configuration.

:::

## Backup Settings

### Automated Backups

Set up automated backups with cron:

```bash
# Add to crontab: crontab -e
# Backup database daily at 2 AM
0 2 * * * cd /path/to/little-origin && tar -czf backup-$(date +\%Y\%m\%d).tar.gz .data/
```

### Retention Policy

Keep backups for 30 days and remove older ones:

```bash
# Add to crontab
0 3 * * * find /path/to/backups -name "backup-*.tar.gz" -mtime +30 -delete
```

## Performance Tuning

### Database Optimization

SQLite is automatically optimized with:

- WAL mode (Write-Ahead Logging) for better concurrency
- Regular VACUUM to reclaim space
- Index optimization

### Memory Limits

Configure Docker memory limits based on your expected load:

```yaml
# In docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
```

## Troubleshooting

### Invalid JWT Secret

If you change the JWT secret, all users will be logged out and must sign in again.

### Database Locked

If you see database lock errors:

```bash
# Restart the container
docker compose restart api
```

### Import Failed

If name data import fails:

```bash
# Rebuild with clean cache
docker compose build --no-cache
docker compose up -d
```

## Next Steps

- **[Explore features](/docs/features/swiping)** - Learn about swiping, matching, and collaboration
- **[Development setup](/docs/development/setup)** - Set up a local development environment
- **[Contributing](/docs/development/contributing)** - Contribute to Little Origin
