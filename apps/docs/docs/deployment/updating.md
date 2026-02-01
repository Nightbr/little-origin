---
sidebar_position: 3
---

# Updating Little Origin

Keep your Little Origin deployment up to date with the latest features and bug fixes.

## Before You Update

:::tip Backup First

Always create a backup before updating:

```bash
# Navigate to your project directory
cd little-origin

# Create a backup
tar -czf backup-$(date +%Y%m%d).tar.gz ./data/
```

:::

## Check Current Version

Check your currently running version:

```bash
docker compose ps
```

The image tag shows which version you're running.

## Update Methods

### Method 1: Pull Latest Image (Recommended)

This is the simplest and recommended way to update.

```bash
# 1. Stop the current container
docker compose down

# 2. Pull the latest image
docker compose pull

# 3. Start with the new image
docker compose up -d

# 4. Verify the update
docker compose ps
```

### Method 2: Pull Specific Version

To update to a specific version instead of latest:

```yaml
# In your docker-compose.yml
services:
  little-origin:
    image: ghcr.io/nightbr/little-origin:v1.2.3  # Use specific version
```

Then run:

```bash
docker compose down
docker compose pull
docker compose up -d
```

### Method 3: Build from Source

If you're building from source:

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild the image
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Post-Update Steps

### 1. Verify the Application

Check that the application is running correctly:

```bash
# Check container status
docker compose ps

# Check health endpoint
curl http://localhost:4000/health

# View logs
docker compose logs -f little-origin
```

### 2. Test Core Functionality

- **Login** - Verify authentication works
- **Swiping** - Test name swiping interface
- **Real-time Updates** - Check WebSocket connections
- **Matches** - Verify match detection works

### 3. Monitor Logs

Watch for any errors or warnings:

```bash
docker compose logs -f little-origin
```

Look for:
- Database migration messages
- WebSocket connection errors
- Authentication issues

## Rollback

If something goes wrong after an update, you can easily rollback.

### Rollback to Previous Image

```bash
# 1. Stop the current container
docker compose down

# 2. Edit docker-compose.yml to use previous version
# image: ghcr.io/nightbr/little-origin:v1.2.3  # Previous version

# 3. Pull and restart
docker compose pull
docker compose up -d
```

### Rollback Using Backup

If you need to restore your database from a backup:

```bash
# 1. Stop the container
docker compose down

# 2. Restore from backup
tar -xzf backup-20250101.tar.gz

# 3. Restart
docker compose up -d
```

## Automatic Updates

### Using Watchtower

Watchtower automatically updates your containers when new images are available:

```yaml
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=86400  # Check daily

  little-origin:
    image: ghcr.io/nightbr/little-origin:latest
    # ... your existing configuration
    labels:
      - com.centurylinklabs.watchtower.enable=true
```

### Manual Update Schedule

Set up a cron job to check for updates weekly:

```bash
# Add to crontab: crontab -e
0 2 * * 0 cd /path/to/little-origin && docker compose pull && docker compose up -d
```

## Update Strategy Recommendations

### Production Environments

- **Test first** - Test updates in a staging environment
- **Backup regularly** - Automate daily backups
- **Use specific versions** - Pin to specific versions instead of `latest`
- **Monitor closely** - Watch logs and metrics after updates
- **Update during low-traffic periods** - Schedule updates for off-peak hours

### Development Environments

- **Use `latest` tag** - Always get the newest features
- **Update frequently** - Stay current with development
- **Test new features** - Help validate updates

## Version Pinning

### Using Specific Versions

Pin to a specific version for stability:

```yaml
services:
  little-origin:
    image: ghcr.io/nightbr/little-origin:v1.2.3
    # ... other configuration
```

### Checking Available Versions

See available versions on GitHub:

```bash
# Using GitHub CLI
gh release list --repo Nightbr/little-origin

# Or check the GitHub Packages page
# https://github.com/Nightbr/little-origin/pkgs/container/little-origin
```

## Troubleshooting Updates

### Container Won't Start After Update

```bash
# Check logs
docker compose logs little-origin

# Try removing old volumes
docker compose down -v

# Start fresh
docker compose up -d
```

### Database Migration Errors

```bash
# Backup current data
tar -czf emergency-backup.tar.gz ./data/

# Reset database
rm -rf ./data
docker compose down
docker compose up -d
```

### Performance Issues After Update

```bash
# Clear Docker cache
docker system prune -a

# Restart with clean build
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Changelog

Stay informed about changes:

- **GitHub Releases** - https://github.com/Nightbr/little-origin/releases
- **Commit History** - https://github.com/Nightbr/little-origin/commits/main
- **Documentation** - Check for new features in the docs

## Support

If you encounter issues during updates:

1. **Check the logs** - `docker compose logs -f little-origin`
2. **Search issues** - https://github.com/Nightbr/little-origin/issues
3. **Rollback** - Use a previous stable version
4. **Report bugs** - Create a GitHub issue with details

## Best Practices Summary

✅ **Always backup before updating**
✅ **Test updates in staging first**
✅ **Use specific version tags in production**
✅ **Monitor logs after updates**
✅ **Keep a rollback plan ready**
✅ **Subscribe to release notifications**

❌ **Don't update without backups**
❌ **Don't use `latest` in production**
❌ **Don't skip testing after updates**
❌ **Don't ignore warning signs in logs**
