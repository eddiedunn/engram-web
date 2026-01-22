#!/usr/bin/env bash
# Automated validation script for Engram Web deployment

set -euo pipefail

echo "🔍 Validating Engram Web deployment..."

# Check container is running
if podman ps | grep -q "engram-web"; then
  echo "✅ Container running"
else
  echo "❌ Container not running"
  exit 1
fi

# Check health endpoint
if curl -sf http://localhost:3000/ > /dev/null; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi

# Check no errors in logs
if podman logs engram-web --tail 50 | grep -qi error; then
  echo "⚠️  Errors found in logs"
  podman logs engram-web --tail 50 | grep -i error
else
  echo "✅ No errors in logs"
fi

echo "✅ Deployment validation complete"
