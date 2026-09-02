#!/bin/bash

# Campus News App - Deployment Script
# This script handles building and deploying the application

set -e

echo "🚀 Campus News App - Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Load environment variables
source .env

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}🔍 Running linter...${NC}"
npm run lint || echo -e "${YELLOW}⚠️  Linter warnings found (non-blocking)${NC}"

echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build

echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -t campus-news:latest .

echo -e "${YELLOW}📝 Tagging image...${NC}"
docker tag campus-news:latest campus-news:$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Run locally: docker-compose up"
echo "2. Deploy: docker push campus-news:latest"
echo ""
echo "Docker image: campus-news:latest"
