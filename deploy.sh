#!/bin/bash
# Deploy script for Library App Backend
# Usage: ./deploy.sh

set -e

echo "=== Library App Deploy ==="

# 1. Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# 2. Generate Prisma client
echo "Generating Prisma client..."
pnpm prisma generate

# 3. Run migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# 4. Build
echo "Building..."
pnpm build
pnpm build:bot

# 5. Seed (only first time — safe to re-run due to upserts)
echo "Seeding database..."
pnpm prisma:seed || true

# 6. Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 reload ecosystem.config.js

echo "=== Deploy complete ==="
echo "API: http://localhost:3000/api/docs"
echo "Health: http://localhost:3000/api/v1/auth/health"
