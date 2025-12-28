#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Travel Management System - Run All Services  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}Error: Maven is not installed or not in PATH${NC}"
    exit 1
fi

# Array of services in startup order
SERVICES=(
    "services/registry-service:8761"
    "services/gateway-service:8080"
    "services/user-service:8081"
    "services/travel-service:8082"
    "services/payment-service:8083"
    "services/feedback-service:8084"
)

# Create logs directory if it doesn't exist
mkdir -p logs

echo -e "${YELLOW}Starting all services...${NC}"
echo ""

# Function to run a service
run_service() {
    local service_path=$1
    local service_name=$(basename $service_path)
    local log_file="logs/${service_name}.log"

    echo -e "${BLUE}Starting ${service_name}...${NC}"
    cd $service_path
    mvn spring-boot:run > ../../$log_file 2>&1 &
    local pid=$!
    echo $pid > ../../logs/${service_name}.pid
    cd - > /dev/null
    echo -e "${GREEN}✓ ${service_name} started (PID: ${pid})${NC}"
}

# Start each service
for service_info in "${SERVICES[@]}"; do
    service_path=$(echo $service_info | cut -d: -f1)
    run_service $service_path
    # Wait a bit between services (especially for registry)
    if [[ $service_path == *"registry-service"* ]]; then
        echo -e "${YELLOW}Waiting 15 seconds for registry to start...${NC}"
        sleep 15
    else
        sleep 3
    fi
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          All services started successfully!     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo "  • Eureka Registry:   http://localhost:8761"
echo "  • Gateway:           http://localhost:8080"
echo "  • User Service:      http://localhost:8081"
echo "  • Travel Service:    http://localhost:8082"
echo "  • Payment Service:   http://localhost:8083"
echo "  • Feedback Service:  http://localhost:8084"
echo ""
echo -e "${BLUE}Logs are available in the 'logs/' directory${NC}"
echo -e "${YELLOW}To stop all services, run: ./stop-all.sh${NC}"
echo -e "${YELLOW}To view logs in real-time, run: tail -f logs/<service-name>.log${NC}"
