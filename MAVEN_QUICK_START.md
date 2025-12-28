# Maven Quick Start Guide

This guide shows you how to build and run all microservices at once.

## 📋 Available Commands

### Using Shell Scripts (Recommended)

```bash
# Build all services
./build-all.sh

# Run all services (starts them in background)
./run-all.sh

# Stop all services
./stop-all.sh

# Test all services
./test-all.sh
```

### Using Makefile

```bash
# Build all Maven services
make mvn-build

# Run all Maven services
make mvn-run

# Stop all Maven services
make mvn-stop

# Test all Maven services
make mvn-test

# Clean all Maven projects
make mvn-clean

# Package all services (creates JARs)
make mvn-package

# Install to local Maven repository
make mvn-install

# See all available commands
make help
```

### Using Maven Directly

```bash
# Build all services (from root)
mvn clean install -DskipTests

# Build with tests
mvn clean install

# Test all services
mvn test

# Package all services
mvn clean package

# Run a single service
cd services/user-service
mvn spring-boot:run
```

## 🚀 Quick Start

1. **Build all services:**
   ```bash
   ./build-all.sh
   # or
   make mvn-build
   ```

2. **Run all services:**
   ```bash
   ./run-all.sh
   # or
   make mvn-run
   ```

3. **Access the services:**
   - Eureka Registry: http://localhost:8761
   - Gateway: http://localhost:8080
   - User Service: http://localhost:8081
   - Travel Service: http://localhost:8082
   - Payment Service: http://localhost:8083
   - Feedback Service: http://localhost:8084

4. **Stop all services:**
   ```bash
   ./stop-all.sh
   # or
   make mvn-stop
   ```

## 📝 Service Startup Order

The `run-all.sh` script starts services in the correct order:

1. **Registry Service** (Eureka) - Started first, 15s wait
2. **Gateway Service** - API Gateway
3. **User Service** - User management
4. **Travel Service** - Travel bookings
5. **Payment Service** - Payment processing
6. **Feedback Service** - Reviews and ratings

## 📊 Viewing Logs

Logs are stored in the `logs/` directory:

```bash
# View all logs
ls logs/

# View specific service log
tail -f logs/user-service.log

# View all logs in real-time (requires tmux or multiple terminals)
tail -f logs/*.log
```

## 🔧 Troubleshooting

### Port Already in Use
If a port is already in use, stop the service:
```bash
./stop-all.sh
# Check if ports are free
netstat -tulpn | grep -E '8761|8080|8081|8082|8083|8084'
```

### Service Won't Start
1. Check the logs: `cat logs/<service-name>.log`
2. Ensure databases are running: `make dev`
3. Build again: `./build-all.sh`

### Clean Build
If you need a fresh build:
```bash
make mvn-clean
./build-all.sh
```

## 🐳 Alternative: Using Docker

If you prefer Docker:
```bash
# Start all services with Docker
make up

# Stop Docker services
make down
```

## 📦 Project Structure

```
travel-management-system/
├── pom.xml                 # Parent POM (multi-module)
├── services/
│   ├── registry-service/   # Eureka Server
│   ├── gateway-service/    # API Gateway
│   ├── user-service/       # User Management
│   ├── travel-service/     # Travel Bookings
│   ├── payment-service/    # Payments
│   └── feedback-service/   # Reviews
├── build-all.sh           # Build script
├── run-all.sh             # Run script
├── stop-all.sh            # Stop script
├── test-all.sh            # Test script
└── logs/                  # Service logs (created when running)
```

## 💡 Tips

- Always start the registry service first (the scripts do this automatically)
- Use `make help` to see all available commands
- Check Eureka dashboard (http://localhost:8761) to see which services are registered
- Logs are your friend - check them when services fail to start
