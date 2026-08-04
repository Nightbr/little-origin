---
sidebar_position: 3
sidebar_label: Updating
---

# Updating Little Origin

:::tip Backup First

```bash
tar -czf backup-$(date +%Y%m%d).tar.gz .data/
```

:::

## Update

```bash
docker compose down
docker compose pull
docker compose up -d
```

Database migrations run automatically on startup.

To pin a specific version instead of `latest`, set it in `docker-compose.yml`:

```yaml
services:
  little-origin:
    image: ghcr.io/nightbr/little-origin:v1.2.3
```

Available versions are listed on the [GitHub Packages page](https://github.com/Nightbr/little-origin/pkgs/container/little-origin).

If you build from source: `git pull`, then `docker compose up -d --build`.

## Verify

```bash
docker compose ps                      # container healthy?
curl http://localhost:3000/health      # API responding?
docker compose logs -f little-origin   # migrations ok, no errors?
```

## Rollback

Something broke? Pin the previous version in `docker-compose.yml` and restart:

```bash
docker compose down
docker compose pull
docker compose up -d
```

To also restore the database from a backup:

```bash
docker compose down
tar -xzf backup-20250101.tar.gz
docker compose up -d
```

## Automatic Updates

[Watchtower](https://containrrr.dev/watchtower/) can pull new images automatically:

```yaml
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=86400 # daily

  little-origin:
    # ... your existing configuration
    labels:
      - com.centurylinklabs.watchtower.enable=true
```

Convenient for a family instance; pin versions and update manually if you prefer full control.

## Releases

Changes are documented on [GitHub Releases](https://github.com/Nightbr/little-origin/releases). Hit a problem? [Open an issue](https://github.com/Nightbr/little-origin/issues).
