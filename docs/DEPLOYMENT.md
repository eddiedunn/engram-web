# Engram Web Deployment Guide

This document provides comprehensive instructions for deploying Engram Web to production using Podman containers and systemd (Quadlet).

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Production Build Process](#production-build-process)
- [Container Configuration](#container-configuration)
- [Deployment with Quadlet](#deployment-with-quadlet)
- [Caddy Integration](#caddy-integration)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)
- [Security Considerations](#security-considerations)

## Overview

Engram Web is deployed as a containerized application using:

- **Build Tool**: Bun (for dependencies and build)
- **Container Engine**: Podman (rootless containers)
- **Service Manager**: systemd with Quadlet
- **Web Server**: Nginx (inside container)
- **Reverse Proxy**: Caddy (host-level)

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           │
                  ┌────────▼─────────┐
                  │   Caddy Proxy    │
                  │  (Host System)   │
                  │   Port 80/443    │
                  └────────┬─────────┘
                           │ HTTP (localhost:3000)
                           │
              ┌────────────▼────────────────┐
              │  engram-web Container       │
              │  ┌─────────────────────┐    │
              │  │  Nginx (Port 80)    │    │
              │  └──────────┬──────────┘    │
              │             │                │
              │  ┌──────────▼──────────┐    │
              │  │  Static Files       │    │
              │  │  /usr/share/nginx/  │    │
              │  │  html/              │    │
              │  └─────────────────────┘    │
              └─────────────────────────────┘
                           │
                           │ API Requests
                           │
              ┌────────────▼────────────────┐
              │   Engram API Container      │
              │   (via engram-net network)  │
              └─────────────────────────────┘
```

## Prerequisites

### System Requirements

- **OS**: Linux with systemd support (Fedora, RHEL, Ubuntu 20.04+, etc.)
- **RAM**: Minimum 512MB for the container
- **Disk**: ~100MB for image, ~50MB for running container
- **CPU**: 1 core minimum (2+ recommended)

### Software Requirements

1. **Podman** (v4.0 or later)
   ```bash
   # Fedora/RHEL
   sudo dnf install podman

   # Ubuntu/Debian
   sudo apt install podman

   # Verify installation
   podman --version
   ```

2. **Bun** (v1.0 or later) - for building
   ```bash
   curl -fsSL https://bun.sh/install | bash

   # Verify installation
   bun --version
   ```

3. **systemd** (should be pre-installed)
   ```bash
   systemctl --version
   ```

4. **Caddy** (for reverse proxy)
   ```bash
   # Fedora/RHEL
   sudo dnf install caddy

   # Ubuntu/Debian
   sudo apt install caddy

   # Or install from official source
   # https://caddyserver.com/docs/install
   ```

### Network Requirements

- Port 3000 available on host (for container port mapping)
- Port 80/443 available for Caddy (if using SSL)
- Network connectivity to Engram API (port 8800 by default)

## Production Build Process

### 1. Clone Repository

```bash
cd /opt/services  # or your preferred location
git clone <repository-url> engram-web
cd engram-web
```

### 2. Configure Environment

Create `.env.production` in the project root:

```bash
cat > .env.production << EOF
VITE_ENGRAM_API_URL=http://localhost:8800/api/v1
VITE_APP_NAME=Engram Web
EOF
```

**Important**: Update `VITE_ENGRAM_API_URL` to match your Engram API deployment.

### 3. Build Container Image

The build uses a multi-stage Dockerfile:

```bash
podman build -t localhost/engram-web:latest -f deploy/Dockerfile .
```

**Build stages**:

1. **Builder Stage** (oven/bun:1):
   - Copies package.json and bun.lock
   - Installs dependencies with `--frozen-lockfile`
   - Copies source code
   - Runs `bun run build` (produces `/app/dist/`)

2. **Production Stage** (nginx:alpine):
   - Copies built assets from builder to `/usr/share/nginx/html/`
   - Copies nginx configuration
   - Exposes port 80
   - Starts nginx

**Build output**:
```
REPOSITORY              TAG      IMAGE ID      CREATED         SIZE
localhost/engram-web    latest   abc123def456  5 seconds ago   ~45MB
```

### 4. Verify Build

Test the image locally:

```bash
# Run container
podman run --rm -p 8080:80 localhost/engram-web:latest

# Test in browser
curl http://localhost:8080

# Should return index.html
```

Stop the test container with Ctrl+C.

## Container Configuration

### Dockerfile Analysis

**Location**: `deploy/Dockerfile`

```dockerfile
# Stage 1: Builder
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Key features**:
- Multi-stage build (smaller final image)
- Alpine Linux (minimal footprint)
- Non-root nginx process
- Immutable infrastructure (rebuild to update)

### Nginx Configuration

**Location**: `deploy/nginx.conf` (if exists, otherwise uses defaults)

Basic configuration:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;
    gzip on;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # SPA routing - redirect all to index.html
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

### Quadlet Container File

**Location**: `deploy/engram-web.container`

```ini
[Unit]
Description=Engram Web Frontend
After=engram.service          # Start after Engram API

[Container]
Image=localhost/engram-web:latest
ContainerName=engram-web
Network=engram-net            # Shared network with Engram API
PublishPort=3000:80           # Map host 3000 to container 80
HealthCmd=curl -f http://localhost/
HealthInterval=30s

[Service]
Restart=always                # Auto-restart on failure
TimeoutStartSec=120          # Allow 2 minutes to start

[Install]
WantedBy=default.target      # Start on boot
```

**Configuration explained**:

- `After=engram.service`: Ensures Engram API starts first
- `Network=engram-net`: Joins the same network as Engram API for internal communication
- `PublishPort=3000:80`: Maps host port 3000 to container's nginx (port 80)
- `HealthCmd`: Runs health check every 30 seconds
- `Restart=always`: Automatically restarts on failure or host reboot

## Deployment with Quadlet

Quadlet converts Podman container specifications to systemd units.

### 1. Create Podman Network

If not already created for Engram API:

```bash
podman network create engram-net
```

Verify:

```bash
podman network ls | grep engram-net
```

### 2. Install Quadlet File

Copy the Quadlet container file to systemd:

```bash
# User-level service (rootless)
mkdir -p ~/.config/containers/systemd
cp deploy/engram-web.container ~/.config/containers/systemd/

# System-level service (requires root) - alternative
# sudo mkdir -p /etc/containers/systemd
# sudo cp deploy/engram-web.container /etc/containers/systemd/
```

**Note**: User-level services are recommended for security (rootless containers).

### 3. Reload systemd

Quadlet generates systemd units from `.container` files:

```bash
systemctl --user daemon-reload
```

This creates `engram-web.service` from `engram-web.container`.

Verify:

```bash
systemctl --user list-unit-files | grep engram-web
# Should show: engram-web.service
```

### 4. Start Service

```bash
systemctl --user start engram-web.service
```

### 5. Enable on Boot

```bash
systemctl --user enable engram-web.service
```

**Enable user services on boot** (required for user-level services):

```bash
sudo loginctl enable-linger $USER
```

### 6. Check Status

```bash
# Service status
systemctl --user status engram-web.service

# Container status
podman ps | grep engram-web

# Logs
journalctl --user -u engram-web.service -f
```

Expected output:

```
● engram-web.service - Engram Web Frontend
     Loaded: loaded (/home/user/.config/containers/systemd/engram-web.container)
     Active: active (running) since ...
```

## Caddy Integration

Caddy provides HTTPS termination and reverse proxy to the Engram Web container.

### Basic Configuration

**Location**: `/etc/caddy/Caddyfile`

```caddyfile
# Basic HTTP reverse proxy
engram.yourdomain.com {
    reverse_proxy localhost:3000
}
```

### Advanced Configuration

```caddyfile
engram.yourdomain.com {
    # Enable HTTPS with automatic certificates
    # (Caddy handles Let's Encrypt automatically)

    # Reverse proxy to Engram Web
    reverse_proxy localhost:3000 {
        # Health check
        health_uri /
        health_interval 30s
        health_timeout 5s

        # Headers
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Logging
    log {
        output file /var/log/caddy/engram-web.log
        format json
    }

    # Security headers (additional to nginx)
    header {
        # Enable HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

        # Disable embedding
        X-Frame-Options "DENY"

        # Prevent MIME sniffing
        X-Content-Type-Options "nosniff"

        # XSS protection
        X-XSS-Protection "1; mode=block"

        # Referrer policy
        Referrer-Policy "strict-origin-when-cross-origin"

        # Permissions policy
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
    }

    # Rate limiting (optional)
    rate_limit {
        zone engram {
            key {remote_host}
            events 100
            window 1m
        }
    }
}
```

### Apply Configuration

```bash
# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy

# Check status
sudo systemctl status caddy
```

### DNS Configuration

Point your domain to the server:

```
A     engram.yourdomain.com     192.0.2.1
AAAA  engram.yourdomain.com     2001:db8::1
```

Caddy will automatically obtain and renew SSL certificates from Let's Encrypt.

## Monitoring and Logs

### Service Logs

View systemd service logs:

```bash
# Follow logs in real-time
journalctl --user -u engram-web.service -f

# View recent logs
journalctl --user -u engram-web.service -n 100

# View logs since a specific time
journalctl --user -u engram-web.service --since "1 hour ago"

# View logs with priority (errors only)
journalctl --user -u engram-web.service -p err
```

### Container Logs

View nginx logs from within the container:

```bash
# Access logs
podman logs engram-web

# Follow logs
podman logs -f engram-web

# Last 100 lines
podman logs --tail 100 engram-web
```

### Nginx Logs

If nginx logs are mounted or accessible:

```bash
# Access log
podman exec engram-web cat /var/log/nginx/access.log

# Error log
podman exec engram-web cat /var/log/nginx/error.log

# Tail logs
podman exec engram-web tail -f /var/log/nginx/access.log
```

### Health Monitoring

**Manual health check**:

```bash
# Check from host
curl -f http://localhost:3000/

# Check from container
podman exec engram-web curl -f http://localhost/

# Check via Caddy (public endpoint)
curl -f https://engram.yourdomain.com/
```

**Automated monitoring** (optional):

Create a simple monitoring script:

```bash
#!/bin/bash
# /usr/local/bin/engram-web-healthcheck.sh

URL="http://localhost:3000/"
TIMEOUT=5

if ! curl -f --max-time $TIMEOUT "$URL" > /dev/null 2>&1; then
    echo "Engram Web health check failed!"
    systemctl --user restart engram-web.service
    # Send alert (email, webhook, etc.)
fi
```

Add to crontab:

```bash
crontab -e

# Run every 5 minutes
*/5 * * * * /usr/local/bin/engram-web-healthcheck.sh
```

### Resource Monitoring

Monitor container resource usage:

```bash
# Current stats
podman stats engram-web

# One-time stats
podman stats --no-stream engram-web
```

Example output:

```
ID            NAME         CPU %  MEM USAGE / LIMIT  MEM %  NET IO       BLOCK IO   PIDS
abc123def456  engram-web   0.5%   45MB / 8GB         0.56%  10MB / 5MB   0B / 0B    3
```

## Troubleshooting

### Container Won't Start

**Check systemd status**:

```bash
systemctl --user status engram-web.service
```

**Check container logs**:

```bash
podman logs engram-web
```

**Common issues**:

1. **Port already in use**:
   ```bash
   # Check what's using port 3000
   sudo lsof -i :3000

   # Change port in .container file
   PublishPort=3001:80
   ```

2. **Image not found**:
   ```bash
   # Verify image exists
   podman images | grep engram-web

   # Rebuild if needed
   podman build -t localhost/engram-web:latest -f deploy/Dockerfile .
   ```

3. **Network not found**:
   ```bash
   # Create network
   podman network create engram-net
   ```

### Health Check Fails

**Check nginx is running**:

```bash
podman exec engram-web ps aux | grep nginx
```

**Test nginx configuration**:

```bash
podman exec engram-web nginx -t
```

**Check nginx logs**:

```bash
podman exec engram-web cat /var/log/nginx/error.log
```

### Application Loads but API Calls Fail

**Check environment variables**:

The API URL is baked into the build. Verify `.env.production` was correct:

```bash
# Extract index.js from container
podman cp engram-web:/usr/share/nginx/html/assets/index.js ./

# Search for API URL
grep -o 'VITE_ENGRAM_API_URL[^"]*' index.js
```

**Check network connectivity**:

```bash
# From host to API
curl http://localhost:8800/api/v1/health

# From container to API (via engram-net)
podman exec engram-web curl http://engram:8800/api/v1/health
```

**Verify DNS/network**:

```bash
# Check containers on same network
podman network inspect engram-net
```

### Caddy Issues

**Test Caddy config**:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

**Check Caddy logs**:

```bash
sudo journalctl -u caddy -f
```

**Test reverse proxy manually**:

```bash
# Direct to container
curl http://localhost:3000/

# Through Caddy
curl http://engram.yourdomain.com/
```

### SSL Certificate Issues

**Check certificate status**:

```bash
# Caddy manages certs in /var/lib/caddy
sudo ls -la /var/lib/caddy/certificates/acme-v02.api.letsencrypt.org-directory/
```

**Force certificate renewal**:

```bash
sudo caddy reload --force
```

**Common SSL issues**:

1. **DNS not propagated**: Wait for DNS to propagate
2. **Port 80/443 blocked**: Ensure firewall allows traffic
3. **Rate limit**: Let's Encrypt has rate limits; use staging for testing

## Maintenance

### Updating the Application

**1. Pull latest code**:

```bash
cd /opt/services/engram-web
git pull origin main
```

**2. Rebuild container**:

```bash
podman build -t localhost/engram-web:latest -f deploy/Dockerfile .
```

**3. Restart service**:

```bash
systemctl --user restart engram-web.service
```

**4. Verify**:

```bash
systemctl --user status engram-web.service
podman ps | grep engram-web
```

**Zero-downtime updates** (advanced):

```bash
# Build new image with version tag
podman build -t localhost/engram-web:v2 -f deploy/Dockerfile .

# Update .container file to use new tag
sed -i 's/engram-web:latest/engram-web:v2/' ~/.config/containers/systemd/engram-web.container

# Reload systemd
systemctl --user daemon-reload

# Restart (Caddy health checks will route around downtime)
systemctl --user restart engram-web.service
```

### Backup and Restore

**No data to backup** - the container is stateless (static files).

Backup sources:
- Git repository (source code)
- Container image (optional):
  ```bash
  podman save localhost/engram-web:latest -o engram-web-backup.tar
  ```

Restore:
```bash
podman load -i engram-web-backup.tar
```

### Log Rotation

systemd automatically rotates journald logs. Configure limits:

```bash
# Edit journald config
sudo vi /etc/systemd/journald.conf

# Set limits
SystemMaxUse=1G
SystemKeepFree=2G
SystemMaxFileSize=100M
```

Restart journald:

```bash
sudo systemctl restart systemd-journald
```

### Container Cleanup

Remove old images:

```bash
# List images
podman images

# Remove old/dangling images
podman image prune -a
```

## Security Considerations

### Container Security

1. **Rootless containers**: Always use user-level Podman (no root privileges)
2. **Read-only filesystem** (optional):
   ```ini
   [Container]
   ReadOnly=true
   Tmpfs=/tmp
   Tmpfs=/var/cache/nginx
   ```
3. **Drop capabilities**:
   ```ini
   [Container]
   DropCapability=ALL
   AddCapability=NET_BIND_SERVICE
   ```

### Network Security

1. **Isolate networks**: Use separate networks for frontend/backend
2. **Firewall**: Only expose port 80/443 to internet
   ```bash
   sudo firewall-cmd --add-service=http --permanent
   sudo firewall-cmd --add-service=https --permanent
   sudo firewall-cmd --reload
   ```

### Application Security

1. **HTTPS only**: Use Caddy to enforce HTTPS
2. **Security headers**: Configure in nginx and Caddy
3. **CSP** (Content Security Policy):
   ```nginx
   add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
   ```

### Updates

Keep software updated:

```bash
# Update Podman
sudo dnf update podman

# Update Caddy
sudo dnf update caddy

# Update container base images (rebuild)
podman build --pull -t localhost/engram-web:latest -f deploy/Dockerfile .
```

---

## Deployment Checklist

Before going to production:

- [ ] Build container image successfully
- [ ] Test container locally
- [ ] Create Podman network (`engram-net`)
- [ ] Configure `.env.production` with correct API URL
- [ ] Install Quadlet file to systemd
- [ ] Start and enable service
- [ ] Verify service is running
- [ ] Configure Caddy reverse proxy
- [ ] Set up DNS records
- [ ] Test HTTPS connection
- [ ] Verify API connectivity from browser
- [ ] Set up monitoring/health checks
- [ ] Configure log rotation
- [ ] Document custom configuration
- [ ] Test backup/restore procedure
- [ ] Create runbook for common issues

---

For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).
