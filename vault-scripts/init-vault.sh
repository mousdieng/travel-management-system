#!/bin/bash

# Vault Initialization Script for Travel Management System
# This script initializes Vault with all required secrets for the microservices

set -e

# Vault connection parameters
export VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
export VAULT_TOKEN="${VAULT_ROOT_TOKEN:-root-token}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Initializing HashiCorp Vault for Travel Management System ===${NC}"
echo ""

# Wait for Vault to be ready
echo -e "${YELLOW}Waiting for Vault to be ready...${NC}"
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if vault status >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Vault is ready${NC}"
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ Vault failed to start after $max_attempts attempts${NC}"
    exit 1
fi

echo ""

# Enable KV secrets engine v2
echo -e "${GREEN}[1/8] Enabling KV Secrets Engine v2...${NC}"
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "KV engine already enabled"

# ============================================================================
# DATABASE SECRETS
# ============================================================================

echo -e "${GREEN}[2/8] Storing Database Secrets...${NC}"

# PostgreSQL credentials
vault kv put secret/database/postgres \
    host=postgres \
    port=5432 \
    username=postgres \
    password="${POSTGRES_PASSWORD:-postgres}" \
    auth_db=auth_db \
    user_db=user_db \
    travel_db=travel_db \
    payment_db=payment_db \
    feedback_db=feedback_db

# Redis credentials
vault kv put secret/database/redis \
    host=redis \
    port=6379 \
    password="${REDIS_PASSWORD:-redis}"

# Elasticsearch credentials
vault kv put secret/database/elasticsearch \
    host=elasticsearch \
    port=9200 \
    username=elastic \
    password="${ELASTICSEARCH_PASSWORD:-elastic}"

# Neo4j credentials
vault kv put secret/database/neo4j \
    host=neo4j \
    port=7687 \
    username=neo4j \
    password=neo4j123 \
    database=neo4j

echo -e "${GREEN}✓ Database secrets stored${NC}"

# ============================================================================
# APPLICATION SECRETS
# ============================================================================

echo -e "${GREEN}[3/8] Storing Application Secrets...${NC}"

# JWT Secret (generate a secure random secret)
JWT_SECRET=$(openssl rand -base64 48)
vault kv put secret/application/jwt \
    secret="$JWT_SECRET" \
    expiration=86400000 \
    refresh_expiration=604800000

# Encryption keys
vault kv put secret/application/encryption \
    aes_key=$(openssl rand -base64 32)

echo -e "${GREEN}✓ Application secrets stored${NC}"

# ============================================================================
# SERVICE-SPECIFIC SECRETS
# ============================================================================

echo -e "${GREEN}[4/8] Storing User Service Secrets...${NC}"
vault kv put secret/services/user-service \
    db_host=postgres \
    db_port=5432 \
    db_name=user_db \
    db_username=postgres \
    db_password="${POSTGRES_PASSWORD:-postgres}" \
    jwt_secret="$JWT_SECRET" \
    redis_host=redis \
    redis_port=6379 \
    redis_password="${REDIS_PASSWORD:-redis}"

echo -e "${GREEN}[5/8] Storing Travel Service Secrets...${NC}"
vault kv put secret/services/travel-service \
    db_host=postgres \
    db_port=5432 \
    db_name=travel_db \
    db_username=postgres \
    db_password="${POSTGRES_PASSWORD:-postgres}" \
    elasticsearch_host=elasticsearch \
    elasticsearch_port=9200 \
    elasticsearch_username=elastic \
    elasticsearch_password="${ELASTICSEARCH_PASSWORD:-elastic}" \
    neo4j_uri=bolt://neo4j:7687 \
    neo4j_username=neo4j \
    neo4j_password=neo4j123

echo -e "${GREEN}[6/8] Storing Payment Service Secrets...${NC}"
vault kv put secret/services/payment-service \
    db_host=postgres \
    db_port=5432 \
    db_name=payment_db \
    db_username=postgres \
    db_password="${POSTGRES_PASSWORD:-postgres}" \
    stripe_secret_key="${STRIPE_SECRET_KEY:-sk_test_placeholder}" \
    stripe_webhook_secret="${STRIPE_WEBHOOK_SECRET:-whsec_placeholder}" \
    paypal_client_id="${PAYPAL_CLIENT_ID:-placeholder}" \
    paypal_client_secret="${PAYPAL_CLIENT_SECRET:-placeholder}" \
    paypal_mode=sandbox

echo -e "${GREEN}[7/8] Storing Feedback Service Secrets...${NC}"
vault kv put secret/services/feedback-service \
    db_host=postgres \
    db_port=5432 \
    db_name=feedback_db \
    db_username=postgres \
    db_password="${POSTGRES_PASSWORD:-postgres}"

# ============================================================================
# EXTERNAL SERVICES
# ============================================================================

echo -e "${GREEN}[8/8] Storing External Service Credentials...${NC}"

# Email service (placeholder - configure with your SMTP credentials)
vault kv put secret/external/email \
    smtp_host=smtp.gmail.com \
    smtp_port=587 \
    smtp_username="${SMTP_USERNAME:-noreply@travelms.com}" \
    smtp_password="${SMTP_PASSWORD:-placeholder}" \
    from_email=noreply@travelms.com

# S3/MinIO credentials
vault kv put secret/external/storage \
    endpoint="${MINIO_ENDPOINT:-http://minio:9000}" \
    access_key="${MINIO_ACCESS_KEY:-minioadmin}" \
    secret_key="${MINIO_SECRET_KEY:-minioadmin}" \
    bucket=travel-media

echo -e "${GREEN}✓ External service credentials stored${NC}"

echo ""
echo -e "${BLUE}=== Vault Initialization Complete ===${NC}"
echo ""
echo "Secrets stored in Vault at:"
echo "  - secret/database/*"
echo "  - secret/application/*"
echo "  - secret/services/*"
echo "  - secret/external/*"
echo ""
echo -e "${YELLOW}Note: This is a development setup using Vault in dev mode.${NC}"
echo -e "${YELLOW}For production, use a production Vault deployment with:${NC}"
echo "  - TLS/SSL enabled"
echo "  - Auto-unsealing"
echo "  - High availability"
echo "  - Regular backups"
echo "  - AppRole authentication for services"
