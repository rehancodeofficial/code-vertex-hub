#!/bin/sh
set -e

echo "==================================="
echo "Starting Backend Initialization..."
echo "==================================="

echo "[1/3] Deploying database schema..."
# 'db push' synchronizes the schema directly with the database
npx prisma db push --accept-data-loss

echo "[2/3] Seeding the database..."
node dist/prisma/seed.js

echo "[3/3] Starting the backend server..."
echo "==================================="
exec node dist/src/index.js
