# Deployment Guide

Complete deployment instructions for Little Origin.

---

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Environment Configuration](#environment-configuration)
3. [GitHub Container Registry](#github-container-registry)
4. [Production Checklist](#production-checklist)

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 1GB RAM available

### Quick Start

```bash
# Clone repository
git clone https://github.com/Nightbr/little-origin.git
cd little-origin

# Create environment file
cp .env.example .env
nano .env  # Edit with your values

# Start with Docker Compose
docker-compose up -d
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: ghcr.io/nightbr/little-origin:latest
    container_name: little-origin
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - DATABASE_URL=file:./data/database.db
```

---

## Environment Configuration

### Required Variables

```bash
# .env

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-me

# Database
DATABASE_URL=file:./data/database.db

# Node environment
NODE_ENV=production

# Optional: AI features (leave empty to disable)
OPENROUTER_API_KEY=
```

### Security Considerations

- **Never commit** `.env` to version control
- Use **strong JWT_SECRET** (minimum 32 characters)
- Keep **OPENROUTER_API_KEY** private if using AI features
- Run database migrations before first use

---

## GitHub Container Registry

### Building and Publishing

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build image
docker build -t ghcr.io/nightbr/little-origin:latest .
docker build -t ghcr.io/nightbr/little-origin:v1.0.0 .

# Push to registry
docker push ghcr.io/nightbr/little-origin:latest
docker push ghcr.io/nightbr/little-origin:v1.0.0
```

### Pull and Run

```bash
# Pull latest image
docker pull ghcr.io/nightbr/little-origin:latest

# Run container
docker run -d \
  --name little-origin \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e JWT_SECRET=your-secret \
  ghcr.io/nightbr/little-origin:latest
```

---

## Production Checklist

### Before Deployment

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production database path
- [ ] Review and set environment variables
- [ ] Ensure data directory is persistent
- [ ] Test database migrations
- [ ] Configure backup strategy

### Security

- [ ] Use HTTPS in production (reverse proxy)
- [ ] Enable firewall rules
- [ ] Restrict database access
- [ ] Keep dependencies updated
- [ ] Monitor logs for errors

### Monitoring

- [ ] Set up health checks
- [ ] Configure log aggregation
- [ ] Monitor disk space (database growth)
- [ ] Track API response times
- [ ] Set up alerts for errors

---

## Reverse Proxy (Nginx)

### Example Configuration

```nginx
server {
    listen 80;
    server_name little-origin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /graphql {
        proxy_pass http://localhost:3000/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Backup Strategy

### Database Backup

```bash
# Backup database
cp data/database.db data/database-backup-$(date +%Y%m%d).db

# Automated daily backup script
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d)
cp data/database.db "$BACKUP_DIR/database-$DATE.db"

# Keep only last 7 days
find "$BACKUP_DIR" -name "database-*.db" -mtime +7 -delete
```

---

## Updating

### Pull Latest Changes

```bash
# Stop container
docker-compose down

# Pull latest image
docker pull ghcr.io/nightbr/little-origin:latest

# Start with new image
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Rolling Back

```bash
# Stop current version
docker-compose down

# Run specific version
docker run -d \
  --name little-origin \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e JWT_SECRET=your-secret \
  ghcr.io/nightbr/little-origin:v1.0.0
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs little-origin

# Common issues:
# - Missing environment variables
# - Port 3000 already in use
# - Database file permissions
```

### Database Issues

```bash
# Enter container
docker exec -it little-origin sh

# Check database
ls -la /app/data/

# Run migrations manually
pnpm db:migrate
```

### Performance Issues

```bash
# Check container resources
docker stats little-origin

# Increase memory limit
docker run -d \
  --memory="2g" \
  --name little-origin \
  ...
```

---

## Summary

**Deployment Steps:**
1. Clone repository
2. Configure environment variables
3. Run with Docker Compose
4. Set up reverse proxy (optional)
5. Configure backups
6. Monitor logs and health

**Next Steps:**
- See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for development setup
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
