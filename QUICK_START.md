# Quick Start Guide - Travel Management System

This guide will help you quickly get the Travel Management System up and running with full SSL/TLS and Vault security.

## Prerequisites

- Docker and Docker Compose
- Java 17 or higher
- Maven 3.8+
- 8GB RAM minimum (16GB recommended)

## 1. Start Infrastructure (2 minutes)

```bash
# Navigate to project directory
cd /home/moussa/dev/travel-management-system

# Start all infrastructure services
docker-compose up -d postgres redis elasticsearch neo4j kafka zookeeper vault

# Wait for services to be healthy (30-60 seconds)
docker-compose ps

# Check Vault is running
docker-compose logs vault | grep "Vault server started"
```

## 2. Initialize Vault (30 seconds)

```bash
# Initialize Vault with all secrets
docker exec -it vault sh -c '/vault/scripts/init-vault.sh'

# Verify secrets were created
docker exec -it vault vault kv list secret/services/

# Expected output:
# Keys
# ----
# feedback-service
# payment-service
# travel-service
# user-service
```

## 3. Start Microservices (3 minutes)

### Option A: Using Docker Compose (Recommended)

```bash
# Uncomment services in docker-compose.yml first, then:
docker-compose up -d registry-service gateway-service user-service travel-service payment-service feedback-service

# Monitor startup
docker-compose logs -f
```

### Option B: Manual Startup (Development)

Start services in order (wait 30s between each):

```bash
# Terminal 1 - Eureka Registry
cd services/registry-service
mvn spring-boot:run

# Terminal 2 - User Service
cd services/user-service
mvn spring-boot:run

# Terminal 3 - Travel Service
cd services/travel-service
mvn spring-boot:run

# Terminal 4 - Payment Service
cd services/payment-service
mvn spring-boot:run

# Terminal 5 - Feedback Service
cd services/feedback-service
mvn spring-boot:run

# Terminal 6 - API Gateway (start last)
cd services/gateway-service
mvn spring-boot:run
```

## 4. Verify Services (1 minute)

```bash
# Check Eureka Dashboard
curl -k https://localhost:8761/

# Check API Gateway health
curl -k https://localhost:9443/actuator/health

# Expected response:
# {"status":"UP"}

# Check all registered services
curl -k https://localhost:8761/eureka/apps | grep '<app>'
```

## 5. Test the System (2 minutes)

### Register a User

```bash
curl -k -X POST https://localhost:9443/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'
```

### Login

```bash
curl -k -X POST https://localhost:9443/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "johndoe",
    "password": "SecurePass123!"
  }'

# Save the returned token
export TOKEN="<your-jwt-token>"
```

### Get User Profile

```bash
curl -k -X GET https://localhost:9443/api/v1/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Browse Travels

```bash
# Get all travels (public endpoint)
curl -k https://localhost:9443/api/v1/travels

# Search travels
curl -k "https://localhost:9443/api/v1/travels/search/advanced?destination=Paris&minPrice=500&maxPrice=2000"
```

## Service URLs

| Service          | URL                          | Credentials          |
|------------------|------------------------------|----------------------|
| Eureka Dashboard | https://localhost:8761       | -                    |
| API Gateway      | https://localhost:9443       | -                    |
| Swagger UI       | https://localhost:9443/swagger-ui.html | -     |
| Vault UI         | http://localhost:8200        | Token: `root-token`  |
| Prometheus       | http://localhost:9090        | -                    |
| Grafana          | http://localhost:3000        | admin/admin          |
| Neo4j Browser    | http://localhost:7475        | neo4j/neo4j123       |
| Elasticsearch    | http://localhost:9200        | -                    |
| MinIO Console    | http://localhost:9002        | minioadmin/minioadmin123 |

## Environment Variables

Create a `.env` file in the project root for easy configuration:

```bash
# Database
POSTGRES_PASSWORD=postgres
REDIS_PASSWORD=redis

# JWT
JWT_SECRET=mySecretKeyForJWTTokenGeneration2024

# SSL
SSL_ENABLED=true
SSL_KEY_STORE_PASSWORD=changeit

# Vault
VAULT_ROOT_TOKEN=root-token
VAULT_ADDR=http://localhost:8200

# Payment Providers (for testing)
STRIPE_API_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Neo4j
NEO4J_AUTH=neo4j/neo4j123
```

## Common Issues

### "Connection refused" on service ports

```bash
# Check if service is running
docker-compose ps
# or
jps | grep <ServiceName>

# Check service logs
docker-compose logs <service-name>
# or
tail -f services/<service-name>/logs/application.log
```

### "SSL handshake failed"

```bash
# Use -k flag with curl for self-signed certificates
curl -k https://localhost:9443/actuator/health

# Or add CA certificate to trust store (not recommended for dev)
```

### "Vault connection failed"

```bash
# Restart Vault
docker-compose restart vault

# Re-initialize
docker exec -it vault /vault/scripts/init-vault.sh
```

### Services not registering with Eureka

```bash
# Check Eureka is accessible
curl -k https://localhost:8761/actuator/health

# Check service configuration
# Ensure eureka.client.service-url.defaultZone is correct

# Wait longer - services take 30-90s to register
```

## Running Tests

```bash
# Run all tests
mvn clean test

# Run tests for specific service
cd services/user-service
mvn test

# Run with coverage
mvn clean test jacoco:report

# Expected: 234 tests passing
```

## Stopping the System

```bash
# Stop all Docker services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Stop individual service (if running manually)
# Press Ctrl+C in the terminal running mvn spring-boot:run
```

## Development Workflow

### Making Changes

1. Edit code in your IDE
2. Restart the affected service:
   ```bash
   # For Docker
   docker-compose restart <service-name>

   # For manual startup
   # Stop with Ctrl+C and restart
   mvn spring-boot:run
   ```

### Adding New Secrets to Vault

```bash
# Add new secret
docker exec -it vault vault kv put secret/services/my-service \
  new_secret=value

# Update existing secret
docker exec -it vault vault kv patch secret/services/user-service \
  additional_config=value

# Read secret to verify
docker exec -it vault vault kv get secret/services/my-service
```

### Regenerating SSL Certificates

```bash
# Backup old certificates
cp -r certs certs-backup-$(date +%Y%m%d)

# Regenerate
cd certs
./generate-certs.sh

# Copy to services
cp gateway.p12 ../services/gateway-service/src/main/resources/keystore/
cp user-service.p12 ../services/user-service/src/main/resources/keystore/
# ... repeat for other services

# Restart services
docker-compose restart
```

## Next Steps

After getting the system running:

1. 📖 Read [SECURITY_SETUP.md](./SECURITY_SETUP.md) for detailed security configuration
2. 📖 Review [README.md](./README.md) for architecture overview
3. 🔧 Configure your IDE for development
4. 🧪 Run the test suite: `mvn clean test`
5. 📊 Set up monitoring (Prometheus + Grafana)
6. 🚀 Start building features!

## Getting Help

- **Documentation**: Check `docs/` directory
- **Vault Guide**: See `vault-scripts/README.md`
- **SSL Guide**: See `certs/README.md`
- **Security**: See `SECURITY_SETUP.md`

## Useful Commands

```bash
# View all running containers
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f user-service

# Execute command in container
docker exec -it <container-name> sh

# Check database
docker exec -it postgres psql -U postgres -d user_db

# Check Redis
docker exec -it redis redis-cli -a redis

# Backup database
docker exec postgres pg_dump -U postgres user_db > backup.sql

# Restore database
docker exec -i postgres psql -U postgres user_db < backup.sql
```

---

**You're all set!** 🎉

Your Travel Management System is now running with enterprise-grade security:
- ✅ SSL/TLS encryption on all services
- ✅ Secrets managed by HashiCorp Vault
- ✅ Service discovery with Eureka
- ✅ Centralized API Gateway
- ✅ Comprehensive testing (234 tests)

Happy coding! 🚀
