# Running Services Locally

This guide explains how to run the microservices locally without Docker.

## Prerequisites

1. PostgreSQL running on localhost:5432
2. Redis running on localhost:6379
3. Elasticsearch running on localhost:9200
4. Neo4j running on localhost:7688
5. Kafka running on localhost:9092

## Maven Configuration Note

The Nexus mirror in `~/.m2/settings.xml` has been temporarily disabled to allow Maven Central access. This was necessary because the local Nexus server (localhost:8081) is not running. If you want to re-enable the Nexus mirror, restore the backup:

```bash
cp ~/.m2/settings.xml.backup ~/.m2/settings.xml
```

Then ensure your Nexus server is running before building the services.

## Automatic Environment Variable Loading

All microservices are configured to automatically load environment variables from the `.env` file in the project root using Spring Boot's `spring.config.import` feature. **No manual environment variable export is required!**

Simply run any service directly:

```bash
cd services/payment-service
mvn spring-boot:run
```

The `.env` file will be automatically loaded, and all environment variables (STRIPE_API_KEY, JWT_SECRET, etc.) will be available to the service.

## IntelliJ IDEA

Running services from IntelliJ IDEA works out of the box:
1. Open the service's main application class
2. Click the green run button
3. The `.env` file will be automatically loaded

## Running All Services

Start infrastructure first (PostgreSQL, Redis, etc.), then start services in separate terminals:

```bash
# Terminal 1 - Registry Service
cd services/registry-service && mvn spring-boot:run

# Terminal 2 - User Service
cd services/user-service && mvn spring-boot:run

# Terminal 3 - Travel Service
cd services/travel-service && mvn spring-boot:run

# Terminal 4 - Payment Service
cd services/payment-service && mvn spring-boot:run

# Terminal 5 - Feedback Service
cd services/feedback-service && mvn spring-boot:run

# Terminal 6 - Gateway Service
cd services/gateway-service && mvn spring-boot:run
```

## Troubleshooting

### "Could not resolve placeholder 'STRIPE_API_KEY'"

If you see this error, it means the `.env` file is not being loaded properly. Check:

1. **Verify .env file exists** in the project root:
```bash
ls -la /home/moussa/dev/travel-management-system/.env
```

2. **Check application.yml** contains the import configuration:
```yaml
spring:
  config:
    import: optional:file:../../.env[.properties]
```

3. **Verify the .env file format** (should be `KEY=value`, one per line):
```bash
cat .env | head -5
```

### Port Already in Use

```bash
# Kill process using a port (e.g., 9084)
lsof -ti:9084 | xargs kill -9
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Check if Redis is running
redis-cli ping
```
