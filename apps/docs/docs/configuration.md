---
sidebar_position: 3
---

# Configuration

Configure your Little Origin instance.

## Environment Variables

Configuration is done through environment variables. Create a `.env` file in the project root:

```bash
JWT_SECRET=your_very_secret_key_here
```

### JWT_SECRET

**Required.** Secret key used for signing JWT tokens.

- **Purpose:** Authentication and session security
- **Recommendation:** Use a cryptographically secure random string (32+ characters)

:::warning Security

Never commit your `.env` file to version control. Keep your JWT secret secure.

:::

## Database Configuration

Little Origin uses SQLite. The database is stored in the `.data/` directory.

### SQLite File Location

```
.data/little-origin.db
```

### Database Schema

The database contains:

- **users** - User accounts (username, password hash)
- **preferences** - User preferences (country, gender, max characters)
- **names** - Baby name catalog
- **reviews** - User swipe decisions
- **matches** - Mutual likes between users

## Authentication

### Password Hashing

Passwords are hashed using **Argon2**, a secure password-hashing algorithm.

### Token Expiration

- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

## Logging

View logs:

```bash
# Docker deployment
docker compose logs -f little-origin

# Development
pnpm --filter @little-origin/api dev
```

## Backup

### Manual Backup

Back up the SQLite database file:

```bash
# Copy the database file
cp .data/little-origin.db backup-$(date +%Y%m%d).db
```

### Automated Backup

Set up automated backups with cron:

```bash
# Add to crontab: crontab -e
# Backup database daily at 2 AM
0 2 * * * cd /path/to/little-origin && cp .data/little-origin.db backup-$(date +\%Y\%m\%d).db
```

## Troubleshooting

### Database Errors

If you see database errors:

```bash
# Docker: Restart the container
docker compose restart little-origin

# Development: Delete and recreate database
rm .data/little-origin.db
pnpm --filter @little-origin/api dev
```

:::danger Data Loss

Deleting the database file will remove all users, reviews, and matches.

:::

## Next Steps

- **[Explore features](/docs/features/swiping)** - Learn about swiping and matching
- **[Development setup](/docs/development/setup)** - Set up a local development environment
