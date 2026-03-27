#!/bin/bash

set -e

echo "[CONTRACT] Applying breaking schema changes..."

docker exec -i db psql -U user -d appdb < scripts/migrations/03_contract.sql

echo "✅ Contract migration applied"