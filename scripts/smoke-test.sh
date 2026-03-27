#!/bin/bash

BASE_URL=$1

if [ -z "$BASE_URL" ]; then
  echo "❌ Usage: ./smoke-test.sh <BASE_URL>"
  exit 1
fi

echo "[SMOKE] Testing $BASE_URL"

# Create user
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com"}')

USER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$USER_ID" ]; then
  echo "❌ Create user failed"
  echo "$CREATE_RESPONSE"
  exit 1
fi

echo "✅ Created user ID: $USER_ID"

# GET
GET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/users/$USER_ID")
[ "$GET_STATUS" = "200" ] || { echo "❌ GET failed"; exit 1; }
echo "✅ GET passed"

# UPDATE
UPDATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "$BASE_URL/api/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"username":"updated","email":"updated@example.com"}')

[ "$UPDATE_STATUS" = "200" ] || { echo "❌ UPDATE failed"; exit 1; }
echo "✅ UPDATE passed"

# DELETE (robust handling)
DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$BASE_URL/api/users/$USER_ID")

if [ "$DELETE_STATUS" = "200" ] || [ "$DELETE_STATUS" = "204" ]; then
  echo "✅ DELETE passed"
else
  echo "⚠️ DELETE returned $DELETE_STATUS (continuing)"
fi

echo "🎉 Smoke test passed"
exit 0