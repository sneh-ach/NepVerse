#!/bin/bash

# Deployment script for NepVerse
# Usage: ./scripts/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file with required variables."
    exit 1
fi

# Validate environment variables
echo -e "${YELLOW}📋 Validating environment variables...${NC}"
node -e "require('./lib/env').validateEnv()" || exit 1

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Generate Prisma client
echo -e "${YELLOW}🗄️  Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
npx prisma migrate deploy

# Build the application
echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build

# Run tests (if available)
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    npm test || echo -e "${YELLOW}⚠️  Tests failed, but continuing deployment...${NC}"
fi

# Start the application
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🚀 Starting application...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    # Production: Use PM2 or similar
    if command -v pm2 &> /dev/null; then
        pm2 restart nepverse || pm2 start npm --name nepverse -- start
    else
        npm start
    fi
else
    # Development/Staging
    npm run dev
fi


