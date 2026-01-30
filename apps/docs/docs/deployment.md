---
sidebar_position: 2
---

# Deploy with Docker Compose

Deploy Little Origin to your own server using Docker Compose. This is the recommended way to run Little Origin in production.

## Prerequisites

Before you begin, ensure you have:

- **Docker** installed (version 20.10 or later)
- **Docker Compose** installed (version 2.0 or later)
- A server with at least **1GB RAM** and **10GB disk space**
- Basic familiarity with command line operations

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Nightbr/little-origin.git
cd little-origin
```

### 2. Create Environment File

Create a `.env` file in the project root:

```bash
# Generate a secure JWT secret
JWT_SECRET=your_very_secret_key_here_make_it_long_and_random
```

:::tip Generate a Secure Secret

Use `openssl` to generate a secure random key:

```bash
openssl rand -base64 32
```

:::

### 3. Start the Application

```bash
docker compose up -d
```

This will:
- Build the Docker images (first run takes a few minutes)
- Start both the API and web frontend
- Initialize the SQLite database
- Run database migrations automatically

### 4. Access Your Instance

- **Web App:** http://localhost:4000
- **GraphQL Playground:** http://localhost:3000/graphql
- **Health Check:** http://localhost:3000/health

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `JWT_SECRET` | Yes | Secret key for JWT token signing | *(none)* |
| `PORT` | No | API port | `3000` |
| `NODE_ENV` | No | Environment (`production` or `development`) | `production` |

### Ports

- **3000** - API server (GraphQL + REST)
- **4000** - Web frontend (served by API)

### Volumes

- **`.data`** - SQLite database directory (persisted across restarts)
- **`/api/node_modules/.cache/better-sqlite3`** - Native module cache

## Production Considerations

### Domain Configuration

To use Little Origin with your own domain:

1. **Set up DNS** to point your domain to your server IP
2. **Configure reverse proxy** (nginx recommended):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable HTTPS** with Let's Encrypt:

```bash
sudo certbot --nginx -d your-domain.com
```

### Security Best Practices

1. **Use a strong JWT secret** - At least 32 characters, randomly generated
2. **Run behind a reverse proxy** - Don't expose ports directly
3. **Enable HTTPS** - Protect data in transit
4. **Backup your database** - Regularly backup the `.data` directory
5. **Update regularly** - Pull latest changes and rebuild images

```bash
# Update and rebuild
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database Backups

Backup your SQLite database regularly:

```bash
# Backup
cp .data/little-origin.db .data/little-origin.db.backup.$(date +%Y%m%d)

# Or create a compressed backup
tar -czf backup-$(date +%Y%m%d).tar.gz .data/
```

### Resource Limits

Configure resource limits in `docker-compose.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Troubleshooting

### Container won't start

Check logs:

```bash
docker compose logs api
```

Common issues:
- **Port already in use** - Change ports in `docker-compose.yml`
- **Insufficient memory** - Ensure server has at least 1GB RAM available
- **Permission denied** - Check file permissions on `.data` directory

### Database errors

The database initializes automatically on first run. If you see database errors:

```bash
# Remove old database and restart
rm -rf .data
docker compose down
docker compose up -d
```

### Build fails

Ensure Docker has sufficient resources and try a clean build:

```bash
docker compose build --no-cache
```

## Upgrading

To upgrade to the latest version:

```bash
# 1. Backup your data
tar -czf backup-$(date +%Y%m%d).tar.gz .data/

# 2. Pull latest changes
git pull

# 3. Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# 4. Verify
docker compose ps
```

## Uninstalling

To completely remove Little Origin:

```bash
# Stop containers
docker compose down

# Remove volumes (deletes database!)
docker compose down -v

# Remove images
docker rmi little-origin-api little-origin-web

# Remove project directory
cd ..
rm -rf little-origin
```

:::danger Data Loss

Running `docker compose down -v` will delete all data including user accounts, reviews, and matches. Backup before running this command!

:::

## Next Steps

- **[Configure your instance](/docs/configuration)** - Customize name sources and preferences
- **[Explore features](/docs/features/swiping)** - Learn about swiping, matching, and collaboration
- **[Self-hosting guide](/docs/development/setup)** - Advanced configuration and development setup
