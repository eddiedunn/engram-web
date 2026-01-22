#!/bin/bash

set -e

echo "Starting Engram Web deployment..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

echo "Project root: $PROJECT_ROOT"

# Step 1: Build container image
echo "Step 1: Building container image..."
cd "$PROJECT_ROOT"
podman build -t localhost/engram-web:latest -f deploy/Dockerfile .

# Step 2: Copy quadlet file to systemd directory
echo "Step 2: Copying quadlet file to systemd directory..."
mkdir -p ~/.config/containers/systemd/
cp "$SCRIPT_DIR/engram-web.container" ~/.config/containers/systemd/

# Step 3: Reload systemd daemon
echo "Step 3: Reloading systemd daemon..."
systemctl --user daemon-reload

# Step 4: Restart service
echo "Step 4: Restarting service..."
systemctl --user restart engram-web.service

# Step 5: Show logs and status
echo "Step 5: Showing logs and status..."
echo ""
echo "=== Service Status ==="
systemctl --user status engram-web.service

echo ""
echo "=== Recent Logs ==="
journalctl --user -u engram-web.service -n 20 --no-pager

echo ""
echo "Deployment completed successfully!"
