#!/bin/bash

set -e

echo "[DEPLOY] Starting Green Deployment..."

# Step 0: Ensure green container is running
echo "[DEPLOY] Ensuring Green container is up..."
docker-compose up -d green

# Step 1: Expand DB (idempotent)
echo "[DEPLOY] Running Expand Migration..."
docker exec -i db psql -U user -d appdb < scripts/migrations/01_expand.sql

# Step 2: Wait for Green readiness
echo "[DEPLOY] Waiting for Green readiness..."
READY=false

for i in {1..20}; do
  STATUS=$(docker exec green curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health/ready || true)

  if [ "$STATUS" = "200" ]; then
    echo "✅ Green is ready"
    READY=true
    break
  fi

  echo "[DEPLOY] Waiting... ($i)"
  sleep 2
done

if [ "$READY" = false ]; then
  echo "❌ Green failed to become ready"
  exit 1
fi

# Step 3: Smoke test inside container
echo "[DEPLOY] Running smoke test on Green..."

docker cp scripts/smoke-test.sh green:/app/smoke-test.sh

if ! docker exec green sh -c "chmod +x /app/smoke-test.sh && /app/smoke-test.sh http://localhost:8080"; then
  echo "❌ Smoke test failed — aborting deployment"
  exit 1
fi

echo "✅ Smoke test passed"

# Step 4: Switch traffic safely
echo "[DEPLOY] Switching traffic to Green..."

TMP_FILE=$(mktemp)

# Handle both cases (idempotent switch)
sed -e 's/server blue:8080;/server green:8080;/' \
    -e 's/server green:8080;/server green:8080;/' \
    config/nginx.conf > "$TMP_FILE"

mv "$TMP_FILE" config/nginx.conf

docker exec nginx nginx -s reload

echo "✅ Traffic switched to Green"

# Step 5: Graceful shutdown Blue
echo "[DEPLOY] Stopping Blue..."
docker stop -t 35 blue || true

# Step 6: Backfill (safe)
echo "[DEPLOY] Running Backfill Migration..."
docker exec -i db psql -U user -d appdb < scripts/migrations/02_backfill.sql

echo "🎉 Deployment SUCCESS"