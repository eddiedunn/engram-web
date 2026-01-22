# Engram Web Deployment Checklist

## Pre-Deployment

- [ ] All tests pass (`bun run test`)
- [ ] TypeScript compiles (`bun run tsc --noEmit`)
- [ ] Production build succeeds (`bun run build`)
- [ ] Docker image builds (`podman build -f deploy/Dockerfile .`)
- [ ] Environment variables documented in `.env.example`

## Deployment Steps

- [ ] Build container image
  ```bash
  podman build -t engram-web:latest -f deploy/Dockerfile .
  ```
- [ ] Copy Quadlet config to systemd directory
  ```bash
  sudo cp deploy/engram-web.container /etc/containers/systemd/
  ```
- [ ] Reload systemd daemon
  ```bash
  sudo systemctl daemon-reload
  ```
- [ ] Start service
  ```bash
  sudo systemctl start engram-web
  ```
- [ ] Verify container running
  ```bash
  podman ps | grep engram-web
  ```
- [ ] Check health endpoint
  ```bash
  curl http://localhost:3000/
  ```
- [ ] Update Caddy configuration
  ```bash
  sudo nano /etc/caddy/Caddyfile
  ```
- [ ] Reload Caddy
  ```bash
  sudo systemctl reload caddy
  ```
- [ ] Test via Tailscale DNS
  ```bash
  curl https://engram.tail-scale-domain.ts.net/
  ```

## Post-Deployment Validation

- [ ] UI loads without errors
- [ ] API connectivity works
- [ ] Dark mode toggle functions
- [ ] Search/filtering works
- [ ] No console errors in browser DevTools
- [ ] Cross-linking to Curator UI works

## Rollback Plan

- [ ] Document previous container image tag
  ```bash
  podman images | grep engram-web
  ```
- [ ] Keep previous Quadlet config backup
  ```bash
  sudo cp /etc/containers/systemd/engram-web.container /etc/containers/systemd/engram-web.container.backup
  ```
- [ ] Test rollback procedure
  ```bash
  # Stop current service
  sudo systemctl stop engram-web

  # Restore backup config or use previous image
  podman run -d --name engram-web -p 3000:80 engram-web:previous-tag

  # Restart service
  sudo systemctl start engram-web
  ```

## Troubleshooting

- Check logs: `podman logs engram-web`
- Check service status: `sudo systemctl status engram-web`
- Check container status: `podman ps -a`
- Verify port binding: `ss -tulpn | grep 3000`
