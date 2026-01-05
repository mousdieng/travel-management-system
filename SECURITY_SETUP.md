# Security Setup Guide

This guide covers the SSL/TLS and HashiCorp Vault security implementation for the Travel Management System.

## Table of Contents

1. [Overview](#overview)
2. [SSL/TLS Certificate Setup](#ssltls-certificate-setup)
3. [HashiCorp Vault Setup](#hashicorp-vault-setup)
4. [Service Configuration](#service-configuration)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

## Overview

The Travel Management System now includes:

- **SSL/TLS Encryption**: All services communicate over HTTPS using self-signed certificates
- **Secrets Management**: HashiCorp Vault stores and manages sensitive configuration data
- **Security Best Practices**: Certificate rotation, encrypted communication, externalized secrets

### Architecture

```
┌─────────────────┐
│  Client (HTTPS) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  API Gateway (9443)     │◄──── SSL Certificate
│  gateway.p12            │
└────────┬────────────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌──────────────────────┐          ┌──────────────────────┐
│  User Service (9082) │          │ Travel Service (9083)│
│  user-service.p12    │          │ travel-service.p12   │
└──────────────────────┘          └──────────────────────┘
         │                                      │
         └──────────────────┬───────────────────┘
                            ▼
                   ┌────────────────┐
                   │ Vault (8200)   │
                   │ Secrets Store  │
                   └────────────────┘
```

## SSL/TLS Certificate Setup

### 1. Generate Certificates

All certificates have been pre-generated and are located in the `certs/` directory:

```bash
# Certificates are already generated, but to regenerate:
cd certs
chmod +x generate-certs.sh
./generate-certs.sh
```

Generated certificates:
- `ca-cert.pem` - Certificate Authority (CA)
- `gateway.p12` - API Gateway certificate
- `user-service.p12` - User Service certificate
- `travel-service.p12` - Travel Service certificate
- `payment-service.p12` - Payment Service certificate
- `feedback-service.p12` - Feedback Service certificate
- `eureka-registry.p12` - Eureka Registry certificate

### 2. Certificate Deployment

Certificates are automatically copied to each service's resources:

```
services/
├── gateway-service/src/main/resources/keystore/gateway.p12
├── user-service/src/main/resources/keystore/user-service.p12
├── travel-service/src/main/resources/keystore/travel-service.p12
├── payment-service/src/main/resources/keystore/payment-service.p12
├── feedback-service/src/main/resources/keystore/feedback-service.p12
└── registry-service/src/main/resources/keystore/eureka-registry.p12
```

### 3. SSL Configuration

Each service is configured in `application.yml`:

```yaml
server:
  port: ${SERVER_PORT:9XXX}
  ssl:
    enabled: ${SSL_ENABLED:true}
    key-store: ${SSL_KEY_STORE:classpath:keystore/<service-name>.p12}
    key-store-password: ${SSL_KEY_STORE_PASSWORD:changeit}
    key-store-type: PKCS12
    key-alias: <service-name>
```

**Default Keystore Password**: `changeit`

⚠️ **Security Warning**: These are self-signed certificates for development. For production, use certificates from a trusted Certificate Authority (CA).

## HashiCorp Vault Setup

### 1. Start Vault Container

Vault is included in the docker-compose configuration:

```bash
# Start Vault
docker-compose up -d vault

# Check Vault status
docker-compose logs vault
```

**Default Configuration**:
- URL: `http://localhost:8200`
- Root Token: `root-token`
- Mode: Development (in-memory storage)

### 2. Initialize Vault with Secrets

Run the initialization script to populate Vault with all required secrets:

```bash
# Method 1: From inside the container (recommended)
docker exec -it vault sh -c '/vault/scripts/init-vault.sh'

# Method 2: From host (if vault CLI installed)
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=root-token
./vault-scripts/init-vault.sh
```

This script stores:
- **Database secrets**: PostgreSQL, Redis, Elasticsearch, Neo4j credentials
- **Application secrets**: JWT secret, encryption keys
- **Service secrets**: Per-service configurations
- **External service secrets**: SMTP, MinIO credentials

### 3. Vault Secret Structure

```
secret/
├── database/
│   ├── postgres       # PostgreSQL credentials
│   ├── redis         # Redis credentials
│   ├── elasticsearch # Elasticsearch credentials
│   └── neo4j         # Neo4j credentials
├── application/
│   ├── jwt           # JWT secret and expiration
│   └── encryption    # Encryption keys
├── services/
│   ├── user-service      # User service specific secrets
│   ├── travel-service    # Travel service specific secrets
│   ├── payment-service   # Payment service specific secrets
│   └── feedback-service  # Feedback service specific secrets
└── external/
    ├── email         # SMTP credentials
    └── storage       # MinIO/S3 credentials
```

### 4. Verify Secrets

```bash
# List all secrets
docker exec -it vault vault kv list secret/

# Read specific secret
docker exec -it vault vault kv get secret/application/jwt
docker exec -it vault vault kv get secret/database/postgres
```

## Service Configuration

### Environment Variables

Services can be configured via environment variables or Vault. Key variables:

**SSL Configuration**:
```bash
SSL_ENABLED=true                                    # Enable/disable SSL
SSL_KEY_STORE=classpath:keystore/service-name.p12  # Path to keystore
SSL_KEY_STORE_PASSWORD=changeit                    # Keystore password
```

**Vault Configuration** (for future integration):
```bash
VAULT_ADDR=http://localhost:8200                   # Vault address
VAULT_TOKEN=root-token                             # Vault token (dev only)
```

**Database Configuration**:
```bash
DB_HOST=localhost                                  # Database host
DB_PORT=5432                                       # Database port
DB_NAME=service_db                                 # Database name
DB_USER=postgres                                   # Database username
DB_PASSWORD=postgres                               # Database password
```

### Service Ports

| Service          | HTTP Port | HTTPS Port | Description          |
|------------------|-----------|------------|----------------------|
| Eureka Registry  | -         | 8761       | Service discovery    |
| API Gateway      | -         | 9443       | API gateway          |
| User Service     | -         | 9082       | User management      |
| Travel Service   | -         | 9083       | Travel management    |
| Payment Service  | -         | 9084       | Payment processing   |
| Feedback Service | -         | 9085       | Feedback management  |
| Vault            | 8200      | -          | Secrets management   |

## Testing

### 1. Test SSL Configuration

```bash
# Start a service (e.g., user-service)
cd services/user-service
mvn spring-boot:run

# Test HTTPS endpoint (accept self-signed cert)
curl -k https://localhost:9082/actuator/health

# Using wget
wget --no-check-certificate https://localhost:9082/actuator/health
```

### 2. Test Vault Connection

```bash
# Check Vault status
docker exec -it vault vault status

# Test secret retrieval
docker exec -it vault vault kv get secret/services/user-service

# Expected output should show all configured secrets
```

### 3. Test Service Communication

```bash
# Start all infrastructure
docker-compose up -d postgres redis elasticsearch kafka vault

# Initialize Vault
docker exec -it vault /vault/scripts/init-vault.sh

# Start services
cd services/registry-service && mvn spring-boot:run &
cd services/gateway-service && mvn spring-boot:run &
cd services/user-service && mvn spring-boot:run &

# Test registration endpoint through gateway
curl -k -X POST https://localhost:9443/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Production Deployment

### SSL/TLS for Production

⚠️ **Critical**: Do NOT use self-signed certificates in production!

1. **Obtain Valid Certificates**:
   - Use Let's Encrypt for free certificates
   - Purchase from a trusted CA (DigiCert, GlobalSign, etc.)
   - Use your organization's internal CA

2. **Certificate Rotation**:
   ```bash
   # Backup old certificates
   cp certs/*.p12 certs/backup/

   # Generate new certificates
   cd certs
   ./generate-certs.sh

   # Restart services
   docker-compose restart
   ```

3. **Update Configuration**:
   ```yaml
   server:
     ssl:
       enabled: true
       key-store: file:/etc/ssl/certs/service-name.p12
       key-store-password: ${SSL_KEY_STORE_PASSWORD}  # From Vault!
   ```

### Vault for Production

⚠️ **Critical**: Current setup is development mode only!

1. **Enable TLS**:
   ```hcl
   listener "tcp" {
     address     = "0.0.0.0:8200"
     tls_cert_file = "/vault/tls/cert.pem"
     tls_key_file  = "/vault/tls/key.pem"
   }
   ```

2. **Configure Storage Backend**:
   ```hcl
   storage "consul" {
     address = "consul:8500"
     path    = "vault/"
   }
   ```

3. **Enable Auto-Unsealing**:
   ```hcl
   seal "awskms" {
     kms_key_id = "your-kms-key-id"
   }
   ```

4. **Use AppRole Authentication**:
   ```bash
   # Enable AppRole
   vault auth enable approle

   # Create role for each service
   vault write auth/approle/role/user-service \
     secret_id_ttl=10m \
     token_num_uses=10 \
     token_ttl=20m \
     token_max_ttl=30m \
     secret_id_num_uses=40 \
     policies=user-service-policy
   ```

5. **Update Spring Boot Configuration**:
   ```yaml
   spring:
     cloud:
       vault:
         host: vault.production.com
         port: 8200
         scheme: https
         authentication: APPROLE
         app-role:
           role-id: ${VAULT_ROLE_ID}
           secret-id: ${VAULT_SECRET_ID}
   ```

## Troubleshooting

### SSL Issues

**Problem**: "SSL handshake failed"
```bash
# Solution: Check certificate validity
keytool -list -v -keystore certs/gateway.p12 -storepass changeit

# Regenerate if needed
cd certs
./generate-certs.sh
```

**Problem**: "Certificate not trusted"
```bash
# For development, use -k flag with curl
curl -k https://localhost:9443/actuator/health

# For production, import CA cert to trust store
keytool -import -alias travelms-ca -file certs/ca-cert.pem \
  -keystore $JAVA_HOME/lib/security/cacerts
```

### Vault Issues

**Problem**: "Vault is sealed"
```bash
# Check status
docker exec -it vault vault status

# Dev mode auto-unseals, but if using production mode:
vault operator unseal
```

**Problem**: "Permission denied"
```bash
# Ensure you have the correct token
export VAULT_TOKEN=root-token

# Check token capabilities
vault token capabilities secret/services/user-service
```

**Problem**: "Secret not found"
```bash
# Re-initialize Vault
docker exec -it vault /vault/scripts/init-vault.sh

# Verify secrets were created
docker exec -it vault vault kv list secret/services/
```

### Service Issues

**Problem**: "Connection refused" on HTTPS port
```bash
# Check if SSL is enabled in application.yml
# Check if keystore file exists
ls -la services/*/src/main/resources/keystore/

# Check service logs
docker-compose logs <service-name>
```

**Problem**: "Unable to connect to Vault"
```bash
# Verify Vault is running
docker-compose ps vault

# Check network connectivity
docker exec -it <service-container> ping vault

# Verify Vault address in configuration
```

## Security Best Practices

1. ✅ **Never commit private keys** - Already configured in `.gitignore`
2. ✅ **Use environment variables** - All sensitive configs use `${VAR}`
3. ✅ **Rotate secrets regularly** - Document rotation procedures
4. ⚠️ **Enable audit logging** - TODO: Configure Vault audit logs
5. ⚠️ **Use strong passwords** - Change default passwords before deployment
6. ⚠️ **Limit token TTL** - Configure appropriate lifetimes
7. ⚠️ **Enable TLS everywhere** - Current setup ready for TLS

## Next Steps

### Immediate (Development)
1. ✅ SSL certificates generated
2. ✅ Vault infrastructure deployed
3. ✅ Services configured for SSL
4. ⏳ Spring Cloud Vault integration
5. ⏳ Migrate hardcoded secrets to Vault

### Future (Production)
1. ⏳ Obtain valid SSL certificates
2. ⏳ Deploy production Vault cluster
3. ⏳ Configure Vault auto-unsealing
4. ⏳ Implement AppRole authentication
5. ⏳ Enable Vault audit logging
6. ⏳ Set up certificate rotation automation
7. ⏳ Configure monitoring and alerting

## Additional Resources

- [Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [Spring Cloud Vault](https://spring.io/projects/spring-cloud-vault)
- [SSL/TLS Best Practices](https://www.ssl.com/guide/ssl-best-practices/)
- [Let's Encrypt](https://letsencrypt.org/) - Free SSL certificates

## Support

For issues or questions:
1. Check logs: `docker-compose logs <service-name>`
2. Review configuration: `services/<service-name>/src/main/resources/application.yml`
3. Verify Vault secrets: `docker exec -it vault vault kv get secret/services/<service-name>`
4. Check this troubleshooting guide
