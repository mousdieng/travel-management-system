# Travel Management System

A comprehensive microservices-based travel management platform built with **Spring Boot**, **Angular**, and **Tailwind CSS**, featuring advanced search with Elasticsearch, personalized recommendations using Neo4j, and secure payment processing with Stripe and PayPal.

## 🎯 Project Overview

This project merges the best features from **Travel-Plan** and **Let's Travel** into a single, production-ready microservices architecture that implements both projects' requirements:

- ✅ **Travel-Plan**: Admin Dashboard, microservices infrastructure, CI/CD, monitoring
- ✅ **Let's Travel**: User features, Elasticsearch search, Neo4j recommendations, role-based access

## 🏗️ Architecture

### Microservices (Spring Boot 3.2.5)
- **Registry Service** (Port 8761) - Eureka service discovery
- **Auth Service** (Port 8081) - JWT authentication & authorization
- **User Service** (Port 8082) - User profile management & file uploads
- **Travel Service** (Port 8083) - Travel packages, Elasticsearch search, Neo4j recommendations
- **Payment Service** (Port 8084) - Stripe & PayPal integration
- **Feedback Service** (Port 8085) - Ratings, reviews, reports & analytics
- **API Gateway** (Port 8080) - Spring Cloud Gateway with rate limiting & circuit breakers

### Databases
- **PostgreSQL 15** - Primary relational database (separate DBs per service)
- **Elasticsearch 8.11** - Full-text search with autocomplete
- **Neo4j 5.13** - Graph database for personalized recommendations
- **Redis 7** - Caching & rate limiting

### Message Broker
- **Apache Kafka 7.5** - Event-driven architecture for inter-service communication
- **Zookeeper** - Kafka cluster coordination
- Topics: payment-completed, payment-refunded, feedback-changed, user-deleted
- See [KAFKA_SETUP.md](./KAFKA_SETUP.md) for detailed setup and usage

### Infrastructure
- **Jenkins** - CI/CD automation & testing
- **SonarQube** - Code quality analysis
- **Prometheus & Grafana** - Monitoring & metrics
- **Docker & Docker Compose** - Containerization
- **Ansible** - Infrastructure as Code

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.9+
- Docker & Docker Compose
- Node.js 18+ (for frontend)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd travel-management-system

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials (JWT secret, Stripe/PayPal keys, etc.)
nano .env
```

### 2. Start All Services
```bash
# Build and start all services
make setup
make build
make up

# Or use Docker Compose directly
docker-compose up -d
```

### 3. Access Services
- **API Gateway**: http://localhost:9080
- **Eureka Dashboard**: http://localhost:8761
- **Auth Service**: http://localhost:9081/swagger-ui.html
- **User Service**: http://localhost:9082/swagger-ui.html
- **Travel Service**: http://localhost:9083/swagger-ui.html
- **Payment Service**: http://localhost:9084/swagger-ui.html
- **Feedback Service**: http://localhost:9085/swagger-ui.html
- **Neo4j Browser**: http://localhost:7474 (neo4j/neo4j123)
- **Elasticsearch**: http://localhost:9200

### 4. With Monitoring & CI/CD
```bash
# Start with monitoring (Prometheus + Grafana)
make up-with-monitoring

# Start with CI/CD tools (Jenkins + SonarQube)
make up-with-cicd

# Start everything
make up-all
```

## 📊 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8080 | Main entry point for all API requests |
| Registry (Eureka) | 8761 | Service discovery |
| Auth Service | 8081 | Authentication & JWT |
| User Service | 8082 | User management |
| Travel Service | 8083 | Travel packages & search |
| Payment Service | 8084 | Payment processing |
| Feedback Service | 8085 | Ratings & analytics |
| PostgreSQL | 5432 | Relational database |
| Redis | 6379 | Cache |
| Elasticsearch | 9200 | Search engine |
| Neo4j HTTP | 7475 | Graph database browser |
| Neo4j Bolt | 7688 | Graph database connector |
| Kafka | 9092 | Message broker (host access) |
| Zookeeper | 2181 | Kafka coordination |
| MinIO API | 9001 | Object storage |
| MinIO Console | 9002 | Object storage UI |
| Jenkins | 8090 | CI/CD |
| SonarQube | 9000 | Code quality |
| Prometheus | 9090 | Metrics |
| Grafana | 3000 | Dashboards |

## 👥 User Roles & Features

### ADMIN
- View top-ranking managers and travels
- Access income reports and analytics
- Review all feedbacks and manage reports
- Full system oversight
- All Travel Manager & Traveler permissions

### TRAVEL_MANAGER
- Create and manage travel offerings
- View feedback specific to their travels
- Dashboard with income, trips, and traveler statistics
- Manage subscriber lists
- All Traveler permissions

### TRAVELER
- Elasticsearch-powered travel search with autocomplete
- Browse available travels
- Personalized recommendations (Neo4j-based)
- Subscribe/unsubscribe from travels (3-day cutoff)
- Process payments via Stripe/PayPal
- Provide feedback on travels
- Report managers or other travelers
- View personal statistics

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- BCrypt password encryption
- CORS configuration
- SSL/TLS support
- Rate limiting via Redis
- Circuit breakers for resilience
- Secret management with HashiCorp Vault support

## 🛠️ Development

### Run Services Locally (Without Docker)

```bash
# 1. Start databases only
make dev

# 2. Run individual services
cd services/auth-service && mvn spring-boot:run
cd services/user-service && mvn spring-boot:run
cd services/travel-service && mvn spring-boot:run
cd services/payment-service && mvn spring-boot:run
cd services/feedback-service && mvn spring-boot:run
```

### Testing

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Test specific service
cd services/auth-service && mvn test
```

### Code Quality

```bash
# Build all services
make build-services

# Run SonarQube analysis
mvn sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin
```

## 📦 Project Structure

```
travel-management-system/
├── services/
│   ├── registry-service/      # Eureka server
│   ├── auth-service/           # Authentication
│   ├── user-service/           # User management
│   ├── travel-service/         # Travel + Search + Recommendations
│   ├── payment-service/        # Stripe + PayPal
│   ├── feedback-service/       # Ratings + Analytics
│   └── api-gateway/            # API Gateway
├── frontend/                   # Angular + TailwindCSS (you'll merge this)
├── infrastructure/
│   ├── ansible/                # Deployment playbooks
│   ├── jenkins/                # CI/CD pipelines
│   └── monitoring/             # Prometheus + Grafana configs
├── scripts/
│   └── init-databases.sh       # Database initialization
├── docker-compose.yml          # All services orchestration
├── pom.xml                     # Parent POM
├── Makefile                    # Development commands
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## 🗄️ Database Schema

Each microservice has its own database:

- `auth_db` - Users, roles, JWT tokens
- `user_db` - User profiles, preferences
- `travel_db` - Travels, destinations, subscriptions
- `payment_db` - Payments, transactions
- `feedback_db` - Feedback, reports, analytics
- `sonarqube` - SonarQube data

## 🔧 Environment Variables

Key variables in `.env`:

```bash
# PostgreSQL
POSTGRES_PASSWORD=postgres

# JWT (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secret-key-minimum-32-characters

# Payment Gateways
STRIPE_API_KEY=sk_test_your_key
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret

# Neo4j
NEO4J_PASSWORD=neo4j123

# Redis
REDIS_PASSWORD=redis
```

## 🚀 Deployment

### Docker Deployment

```bash
# Production build
make build-prod

# Deploy
make up

# With monitoring
make up-with-monitoring
```

### Ansible Deployment

```bash
cd infrastructure/ansible
ansible-playbook -i inventory/production deploy.yml
```

## 📊 Monitoring & Logging

### Prometheus Metrics
- All services expose `/actuator/prometheus`
- Access Prometheus: http://localhost:9090

### Grafana Dashboards
- Pre-configured dashboards for all services
- Access Grafana: http://localhost:3000 (admin/admin)

### Distributed Tracing
- Zipkin integration for request tracing
- Correlation IDs across services

## 🧪 CI/CD Pipeline

### Jenkins
1. Checkout code
2. Build with Maven
3. Run unit tests
4. SonarQube analysis
5. Build Docker images
6. Push to registry
7. Deploy to staging/production

### SonarQube
- Code coverage > 80%
- No critical/blocker issues
- Security hotspots reviewed

## 📚 API Documentation

Each service provides Swagger UI:
- Auth: http://localhost:9081/swagger-ui.html
- User: http://localhost:9082/swagger-ui.html
- Travel: http://localhost:9083/swagger-ui.html
- Payment: http://localhost:9084/swagger-ui.html
- Feedback: http://localhost:9085/swagger-ui.html

Or access all APIs via Gateway:
- http://localhost:9080/swagger-ui.html

## 🎓 Key Technologies

**Backend:**
- Spring Boot 3.2.5
- Spring Cloud (Gateway, Eureka, Config)
- Spring Security + JWT
- Spring Data JPA, Elasticsearch, Neo4j
- PostgreSQL, Redis
- Resilience4j (Circuit Breaker)
- Stripe & PayPal SDKs

**Frontend:**
- Angular 17
- TailwindCSS 3.3
- TypeScript 5.2

**DevOps:**
- Docker & Docker Compose
- Jenkins
- Ansible
- Prometheus & Grafana
- SonarQube

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Services Not Starting

```bash
# Check logs
make logs

# Check service health
make health

# Restart services
make restart
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker exec -it postgres psql -U postgres -l

# Reset database
make db-reset
```

### Port Conflicts

Edit `docker-compose.yml` to change port mappings if conflicts occur.

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check service logs: `make logs`
- Review Swagger documentation

---

**Built with ❤️ using Spring Boot, Angular, and modern microservices architecture**
