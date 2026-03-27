#!/bin/bash

set -e

echo "[ROLLBACK] Checking if rollback is safe..."

# Check if contract applied
IS_NOT_NULL=$(docker exec db psql -U user -d appdb -t -c "
SELECT is_nullable 
FROM information_schema.columns 
WHERE table_name='users' AND column_name='phone_number';
" | xargs)

if [ "$IS_NOT_NULL" = "NO" ]; then
  echo "❌ Rollback blocked: contract phase already applied (phone_number NOT NULL)"
  exit 1
fi

echo "✅ Rollback is safe"

echo "[ROLLBACK] Switching back to Blue..."

# Ensure blue is running
docker-compose up -d blue

# Switch traffic
TMP_FILE=$(mktemp)
sed 's/server green:8080;/server blue:8080;/' config/nginx.conf > "$TMP_FILE"
mv "$TMP_FILE" config/nginx.conf

docker exec nginx nginx -s reload

echo "✅ Traffic switched to Blue"

# Stop green safely
docker stop green || true

echo "🎉 Rollback completed"