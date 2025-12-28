#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Travel Management System - Build All Services ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}Error: Maven is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}Building all services from root POM...${NC}"
echo ""

# Build all modules from root
mvn clean install -DskipTests

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All services built successfully!${NC}"
    echo ""
    echo -e "${BLUE}Built services:${NC}"
    echo "  • registry-service"
    echo "  • gateway-service"
    echo "  • user-service"
    echo "  • travel-service"
    echo "  • payment-service"
    echo "  • feedback-service"
else
    echo ""
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
