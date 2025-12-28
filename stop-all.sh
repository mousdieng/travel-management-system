#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Travel Management System - Stop All Services  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

if [ ! -d "logs" ]; then
    echo -e "${YELLOW}No services are currently running${NC}"
    exit 0
fi

echo -e "${YELLOW}Stopping all services...${NC}"
echo ""

# Stop all services by reading PID files
for pid_file in logs/*.pid; do
    if [ -f "$pid_file" ]; then
        service_name=$(basename $pid_file .pid)
        pid=$(cat $pid_file)

        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping ${service_name} (PID: ${pid})...${NC}"
            kill $pid
            # Wait for graceful shutdown
            sleep 2
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid
            fi
            echo -e "${GREEN}✓ ${service_name} stopped${NC}"
        else
            echo -e "${BLUE}${service_name} is not running${NC}"
        fi

        rm $pid_file
    fi
done

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
