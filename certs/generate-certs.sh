#!/bin/bash

# SSL Certificate Generation Script for Travel Management System
# Generates self-signed certificates for development and testing
# For production, replace with certificates from a trusted CA

set -e

CERTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDITY_DAYS=365

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Generating SSL Certificates for Travel Management System ===${NC}"
echo ""

# Services that need certificates
SERVICES=(
    "gateway"
    "user-service"
    "travel-service"
    "payment-service"
    "feedback-service"
    "eureka-registry"
)

# Generate CA certificate (Certificate Authority)
echo -e "${GREEN}[1/7] Generating Certificate Authority (CA)...${NC}"
openssl req -new -x509 -days $VALIDITY_DAYS -keyout "$CERTS_DIR/ca-key.pem" \
    -out "$CERTS_DIR/ca-cert.pem" \
    -subj "/C=US/ST=California/L=San Francisco/O=TravelMS/OU=DevOps/CN=TravelMS-CA" \
    -nodes 2>/dev/null

echo -e "${GREEN}✓ CA certificate generated${NC}"
echo ""

# Generate certificates for each service
counter=2
for service in "${SERVICES[@]}"; do
    echo -e "${GREEN}[$counter/7] Generating certificate for $service...${NC}"

    # Generate private key
    openssl genrsa -out "$CERTS_DIR/$service-key.pem" 2048 2>/dev/null

    # Generate certificate signing request (CSR)
    openssl req -new -key "$CERTS_DIR/$service-key.pem" \
        -out "$CERTS_DIR/$service.csr" \
        -subj "/C=US/ST=California/L=San Francisco/O=TravelMS/OU=$service/CN=$service.travelms.local" \
        2>/dev/null

    # Sign the certificate with CA
    openssl x509 -req -days $VALIDITY_DAYS \
        -in "$CERTS_DIR/$service.csr" \
        -CA "$CERTS_DIR/ca-cert.pem" \
        -CAkey "$CERTS_DIR/ca-key.pem" \
        -CAcreateserial \
        -out "$CERTS_DIR/$service-cert.pem" \
        2>/dev/null

    # Create PKCS12 keystore (Java/Spring Boot format)
    openssl pkcs12 -export \
        -in "$CERTS_DIR/$service-cert.pem" \
        -inkey "$CERTS_DIR/$service-key.pem" \
        -out "$CERTS_DIR/$service.p12" \
        -name "$service" \
        -passout pass:changeit

    # Clean up CSR file
    rm -f "$CERTS_DIR/$service.csr"

    echo -e "${GREEN}✓ Certificate for $service generated${NC}"
    ((counter++))
done

echo ""
echo -e "${BLUE}=== Certificate Generation Complete ===${NC}"
echo ""
echo "Generated files:"
echo "  - ca-cert.pem (Certificate Authority)"
echo "  - ca-key.pem (CA Private Key)"
for service in "${SERVICES[@]}"; do
    echo "  - $service.p12 (Keystore for $service)"
done
echo ""
echo -e "${GREEN}Note: Default keystore password is 'changeit'${NC}"
echo -e "${GREEN}For production, use certificates from a trusted CA and strong passwords${NC}"
