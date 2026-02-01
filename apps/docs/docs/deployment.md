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

### 1. Create docker-compose.yml

Create a `docker-compose.yml` file:

```yaml
services:
  little-origin:
    image: ghcr.io/nightbr/little-origin:latest
    container_name: little-origin
    restart: unless-stopped
    environment:
      # Timezone
      TZ: Europe/Paris

      # Application
      NODE_ENV: production
      PORT: 3000
      SERVE_STATIC: "true"

      # Database
      DATABASE_URL: file:/.data/little-origin.db

      # Authentication (REQUIRED - change this!)
      JWT_SECRET: change_me_to_secure_random_string
    volumes:
      - little-origin_data:/.data
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  little-origin_data:
    driver: local
```

:::tip Generate a Secure JWT Secret

Use `openssl` to generate a secure random key:

```bash
openssl rand -base64 32
```

:::

### 2. Start the Application

```bash
docker compose up -d
```

This will:
- Pull the latest image from GitHub Container Registry
- Start the application
- Initialize the SQLite database
- Run database migrations automatically

### 3. Access Your Instance

- **Web App:** http://localhost:3000
- **GraphQL Playground:** http://localhost:3000/graphql
- **Health Check:** http://localhost:3000/health

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `JWT_SECRET` | Yes | Secret key for JWT token signing | *(none)* |
| `PORT` | No | API port | `3000` |
| `NODE_ENV` | No | Environment (`production` or `development`) | `production` |
| `TZ` | No | Container timezone | `UTC` |
| `DATABASE_URL` | No | SQLite database path | `file:/.data/little-origin.db` |
| `SERVE_STATIC` | No | Serve frontend from API | `true` |

### Ports

- **3000** - API server and web frontend (when SERVE_STATIC=true)

### Volumes

- **`little-origin_data`** - Named volume for SQLite database (persisted across restarts)

## Production Considerations

### Domain Configuration with Traefik

For production use with automatic HTTPS, we recommend using Traefik as a reverse proxy.

#### Complete docker-compose.yml with Traefik

```yaml
services:
  little-origin:
    image: ghcr.io/nightbr/little-origin:latest
    container_name: little-origin
    restart: unless-stopped
    environment:
      TZ: Europe/Paris
      NODE_ENV: production
      PORT: 3000
      SERVE_STATIC: "true"
      DATABASE_URL: file:/.data/little-origin.db
      JWT_SECRET: change_me_to_secure_random_string
    volumes:
      - little-origin_data:/.data
    networks:
      - reverseproxy
    labels:
      # Traefik routing
      - "traefik.enable=true"
      - "traefik.http.routers.little-origin.rule=Host(`little-origin.example.com`)"
      - "traefik.http.routers.little-origin.entrypoints=websecure"
      - "traefik.http.routers.little-origin.tls.certresolver=letsencrypt"
      - "traefik.http.services.little-origin.loadbalancer.server.port=3000"
      # Watchtower for automatic updates (optional)
      - "com.centurylinklabs.watchtower.enable=true"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Watchtower for automatic updates (optional)
  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=86400  # Check daily
      - WATCHTOWER_LABEL_ENABLE=true

volumes:
  little-origin_data:
    driver: local

networks:
  reverseproxy:
    external: true
```

:::tip

Replace `little-origin.example.com` with your actual domain name and ensure the `reverseproxy` network exists in Traefik configuration.

:::

#### Without Traefik (nginx Alternative)

If you prefer nginx instead of Traefik:

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
2. **Run behind a reverse proxy** - Use Traefik or nginx with HTTPS enabled
3. **Enable HTTPS** - Protect data in transit with Let's Encrypt certificates
4. **Backup your database** - Regularly backup the named volume
5. **Update regularly** - Pull latest images or use Watchtower for automatic updates
6. **Monitor health checks** - Ensure the container health check passes

### Database Backups

Backup your SQLite database regularly:

```bash
# Backup from named volume
docker run --rm \
  -v little-origin_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/little-origin-backup-$(date +%Y%m%d).tar.gz /data

# Or backup entire volume
docker volume ls  # Find the volume name
docker run --rm -v little-origin_data:/data -v $(pwd):/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data
```

### Resource Limits

Configure resource limits in `docker-compose.yml`:

```yaml
services:
  little-origin:
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
docker compose logs little-origin
```

Common issues:
- **Port already in use** - Change the port mapping in `docker-compose.yml`
- **Insufficient memory** - Ensure server has at least 1GB RAM available
- **Permission denied** - Check volume permissions
- **Health check failing** - Verify the container can reach `http://localhost:3000/health`

### Database errors

The database initializes automatically on first run. If you see database errors:

```bash
# Remove old volume and restart
docker compose down -v
docker compose up -d
```

:::danger

This will delete all existing data!

:::

### Image pull fails

If you encounter issues pulling the image:

```bash
# Try pulling manually first
docker pull ghcr.io/nightbr/little-origin:latest

# If authentication issues, ensure you're logged in to GitHub Container Registry
docker login ghcr.io
```

## Upgrading

For detailed instructions on upgrading your Little Origin deployment, including automatic updates with Watchtower, see the **[Updating Little Origin](/docs/deployment/updating)** guide.

Quick update using docker-compose:

```bash
# 1. Pull the latest image
docker compose pull

# 2. Restart with the new image
docker compose up -d

# 3. Verify the update
docker compose ps
```

## Build from Source

If you prefer to build from source instead of using the pre-built image:

### 1. Clone the Repository

```bash
git clone https://github.com/Nightbr/little-origin.git
cd little-origin
```

### 2. Create docker-compose.yml

Use this docker-compose.yml for building from source:

```yaml
services:
  little-origin:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: little-origin
    restart: unless-stopped
    environment:
      TZ: Europe/Paris
      NODE_ENV: production
      PORT: 3000
      SERVE_STATIC: "true"
      DATABASE_URL: file:/.data/little-origin.db
      JWT_SECRET: change_me_to_secure_random_string
    volumes:
      - little-origin_data:/.data
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  little-origin_data:
    driver: local
```

### 3. Build and Start

```bash
docker compose up -d --build
```

:::note

Building from source takes longer on first run and requires more disk space, but allows you to customize the code if needed.

:::

## Uninstalling

To completely remove Little Origin:

```bash
# Stop containers and remove volumes (deletes database!)
docker compose down -v

# Remove the image
docker rmi ghcr.io/nightbr/little-origin:latest

# Remove the backup volume if desired
docker volume rm little-origin_data
```

:::danger Data Loss

Running `docker compose down -v` will delete all data including user accounts, reviews, and matches. Backup before running this command!

:::

## Next Steps

- **[Configure your instance](/docs/configuration)** - Customize name sources and preferences
- **[Updating Little Origin](/docs/deployment/updating)** - Keep your deployment up to date
- **[Explore features](/docs/features/swiping)** - Learn about swiping, matching, and collaboration
