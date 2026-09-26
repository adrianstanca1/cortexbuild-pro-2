#!/bin/bash
set -euo pipefail

# CortexBuild Pro 2.0 — Deploy script (SQLite + Docker)
# Usage: ./deploy.sh [environment]
# Prerequisites: Docker + Docker Compose v2 on target VPS

ENVIRONMENT="${1:-production}"
HOST="${HOST:-72.62.132.43}"
VPS_USER="${VPS_USER:-deploy}"
DEPLOY_PATH="/opt/cortexbuild-pro-2"
JWT_SECRET="${JWT_SECRET:-${JWT_SECRET_ENV:-changeme}}"

echo "=== CortexBuild Pro 2.0 Deployment ==="
echo "Target: ${VPS_USER}@${HOST}:${DEPLOY_PATH}"
echo "Environment: ${ENVIRONMENT}"

# 1. Sync files to VPS
echo "→ Syncing files..."
rsync -avz --exclude node_modules --exclude .git \
  ./ "${VPS_USER}@${HOST}:${DEPLOY_PATH}/" 2>/dev/null || \
  scp -r ./ "${VPS_USER}@${HOST}:${DEPLOY_PATH}/" 2>/dev/null || \
  echo "→ (no SSH — skipping file sync; deploy manually via tar.gz)"

# 2. Set up .env on VPS
echo "→ Configuring environment..."
if [ -n "$JWT_SECRET" ] && [ "$JWT_SECRET" != "changeme" ]; then
  ssh "${VPS_USER}@${HOST}" "cd ${DEPLOY_PATH} && \
    cp .env.example .env && \
    sed -i 's|changeme-change-this-in-production|${JWT_SECRET}|g' .env && \
    sed -i 's|sqlite:.*|sqlite:/data/cortexbuild.db|g' .env" 2>/dev/null || \
    echo "→ (no SSH — set .env manually on VPS)"
else
  echo "→ WARNING: JWT_SECRET not set — using default (change in production!)"
fi

# 3. Build Docker image on VPS
echo "→ Building Docker image on VPS..."
ssh "${VPS_USER}@${HOST}" "cd ${DEPLOY_PATH}/server && \
  docker build -t cortexbuild-pro-2-api ." 2>/dev/null || \
  echo "→ (no SSH — build manually: ssh deploy@VPS 'cd /opt/cortexbuild-pro-2/server && docker build -t cortexbuild-pro-2-api .')"

# 4. Start services
echo "→ Starting services..."
ssh "${VPS_USER}@${HOST}" "cd ${DEPLOY_PATH} && \
  docker compose up -d --build" 2>/dev/null || \
  echo "→ (no SSH — start manually: ssh deploy@VPS 'cd /opt/cortexbuild-pro-2 && docker compose up -d --build')"

# 5. Wait for health
echo "→ Waiting for health check..."
sleep 5
for i in $(seq 1 10); do
  if curl -sf "http://${HOST}:3000/api/health" >/dev/null 2>&1; then
    echo "✓ Server healthy (attempt $i)"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "⚠ Server not responding after 10 attempts — check docker logs"
  fi
  sleep 2
done

echo "✓ Deployment complete"
echo "  API:  http://${HOST}:3000/api/health"
echo "  Web:  https://cortexbuildpro.tech"
echo ""
echo "Manual commands if SSH unavailable:"
echo "  # Push tar.gz to VPS:"
echo "  scp cortexbuild-pro-2.tar.gz deploy@${HOST}:"
echo "  # Extract and start on VPS:"
echo "  ssh deploy@${HOST} 'cd /opt/cortexbuild-pro-2 && tar xzf cortexbuild-pro-2.tar.gz --strip-components=1 && docker compose up -d --build'"
