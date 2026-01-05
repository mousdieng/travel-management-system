#!/bin/bash
# Travel Management System - Database Initialization Script
# This script initializes all databases for the microservices architecture

set -e

echo "========================================="
echo "Travel Management System - Database Init"
echo "========================================="
echo ""

# Configuration
POSTGRES_HOST=${DB_HOST:-localhost}
POSTGRES_PORT=${DB_PORT:-5432}
POSTGRES_USER=${DB_USER:-postgres}
POSTGRES_PASSWORD=${DB_PASSWORD:-postgres}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run SQL script
run_sql_script() {
    local script_name=$1
    local script_path="${SCRIPT_DIR}/${script_name}"

    echo -e "${YELLOW}Running: ${script_name}${NC}"

    if [ ! -f "$script_path" ]; then
        echo -e "${RED}Error: Script not found: ${script_path}${NC}"
        return 1
    fi

    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -f "$script_path"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${script_name} completed successfully${NC}"
    else
        echo -e "${RED}✗ ${script_name} failed${NC}"
        return 1
    fi
    echo ""
}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -c '\q' 2>/dev/null; do
    echo -n "."
    sleep 1
done
echo -e "${GREEN}PostgreSQL is ready!${NC}"
echo ""

# Step 1: Create databases
echo "Step 1: Creating databases..."
run_sql_script "create-databases.sql"

# Step 2: Seed admin user
echo "Step 2: Creating admin user..."
run_sql_script "seed-admin-user.sql"

# Step 3: Seed test data (only if --with-test-data flag is provided)
if [ "$1" == "--with-test-data" ]; then
    echo "Step 3: Seeding test data..."
    run_sql_script "seed-test-data.sql"
else
    echo "Step 3: Skipping test data (use --with-test-data flag to include)"
fi

echo ""
echo "========================================="
echo -e "${GREEN}✓ Database initialization complete!${NC}"
echo "========================================="
echo ""
echo "Default Admin Credentials:"
echo "  Username: admin"
echo "  Email: admin@travelms.com"
echo "  Password: admin123"
echo ""
echo "To seed test data, run:"
echo "  ./init-all-databases.sh --with-test-data"
echo ""
