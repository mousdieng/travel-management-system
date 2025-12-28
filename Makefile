.PHONY: help build up down restart logs clean test backend-test frontend-test mvn-build mvn-run mvn-stop mvn-test mvn-clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "${BLUE}Let's Travel - Makefile Commands${NC}"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "${GREEN}%-20s${NC} %s\n", $$1, $$2}'

# Docker Operations
build: ## Build all Docker images
	@echo "${YELLOW}Building Docker images...${NC}"
	docker-compose build

up: ## Start all services (detached)
	@echo "${YELLOW}Starting all services...${NC}"
	docker-compose up -d
	@echo "${GREEN}✓ Services started. Access the app at http://localhost${NC}"
	@echo "${BLUE}Frontend: http://localhost${NC}"
	@echo "${BLUE}Backend API: http://localhost:8080${NC}"
	@echo "${BLUE}Neo4j Browser: http://localhost:7474${NC}"

down: ## Stop all services
	@echo "${YELLOW}Stopping all services...${NC}"
	docker-compose down
	@echo "${GREEN}✓ Services stopped${NC}"

restart: down up ## Restart all services

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

ps: ## Show running containers
	docker-compose ps

clean: ## Remove all containers, volumes, and images
	@echo "${YELLOW}Cleaning up...${NC}"
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "${GREEN}✓ Cleanup complete${NC}"

# Database Operations
db-reset: ## Reset database (WARNING: Deletes all data)
	@echo "${YELLOW}Resetting database...${NC}"
	docker-compose down postgres
	docker volume rm letstravel_postgres_data || true
	docker-compose up -d postgres
	@echo "${GREEN}✓ Database reset complete${NC}"

db-backup: ## Backup PostgreSQL database
	@echo "${YELLOW}Backing up database...${NC}"
	docker exec letstravel-postgres pg_dump -U letstravel letstravel > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}✓ Database backup complete${NC}"

# Development Operations
dev: ## Start development environment (databases only)
	@echo "${YELLOW}Starting development environment...${NC}"
	docker-compose up -d postgres elasticsearch neo4j
	@echo "${GREEN}✓ Development environment ready${NC}"
	@echo "${BLUE}PostgreSQL: localhost:5432${NC}"
	@echo "${BLUE}Elasticsearch: localhost:9200${NC}"
	@echo "${BLUE}Neo4j: localhost:7474${NC}"

dev-backend: ## Run backend in development mode (requires 'make dev' first)
	@echo "${YELLOW}Starting backend...${NC}"
	cd backend && mvn spring-boot:run

dev-frontend: ## Run frontend in development mode
	@echo "${YELLOW}Starting frontend...${NC}"
	cd frontend && npm start

# Testing Operations
test: backend-test frontend-test ## Run all tests

backend-test: ## Run backend tests
	@echo "${YELLOW}Running backend tests...${NC}"
	cd backend && mvn test

frontend-test: ## Run frontend tests
	@echo "${YELLOW}Running frontend tests...${NC}"
	cd frontend && npm test

# Production Build
build-prod: ## Build production-ready Docker images
	@echo "${YELLOW}Building production images...${NC}"
	docker-compose build --no-cache
	@echo "${GREEN}✓ Production images built${NC}"

deploy: build-prod up ## Build and deploy production version

# Health Checks
health: ## Check health of all services
	@echo "${BLUE}Checking service health...${NC}"
	@echo "PostgreSQL:"
	@docker exec letstravel-postgres pg_isready -U letstravel || echo "Not ready"
	@echo "Elasticsearch:"
	@curl -s http://localhost:9200/_cluster/health | grep -q "green\|yellow" && echo "Healthy" || echo "Not healthy"
	@echo "Neo4j:"
	@curl -s http://localhost:7474 > /dev/null && echo "Healthy" || echo "Not healthy"
	@echo "Backend:"
	@curl -s http://localhost:8080/actuator/health | grep -q "UP" && echo "Healthy" || echo "Not healthy"
	@echo "Frontend:"
	@curl -s http://localhost/health > /dev/null && echo "Healthy" || echo "Not healthy"

# Installation
install: ## Install all dependencies
	@echo "${YELLOW}Installing dependencies...${NC}"
	cd backend && mvn dependency:resolve
	cd frontend && npm install
	@echo "${GREEN}✓ Dependencies installed${NC}"

# Quick Start
quickstart: install dev ## Install dependencies and start development environment
	@echo "${GREEN}✓ Quick start complete!${NC}"
	@echo "${BLUE}Next steps:${NC}"
	@echo "  1. Run 'make dev-backend' in one terminal"
	@echo "  2. Run 'make dev-frontend' in another terminal"
	@echo "  3. Access the app at https://localhost:4200"

# Maven Operations (All Microservices)
mvn-build: ## Build all Maven services
	@echo "${YELLOW}Building all Maven services...${NC}"
	./build-all.sh

mvn-test: ## Test all Maven services
	@echo "${YELLOW}Testing all Maven services...${NC}"
	./test-all.sh

mvn-run: ## Run all Maven services (starts all microservices)
	@echo "${YELLOW}Starting all Maven services...${NC}"
	./run-all.sh

mvn-stop: ## Stop all running Maven services
	@echo "${YELLOW}Stopping all Maven services...${NC}"
	./stop-all.sh

mvn-clean: ## Clean all Maven projects
	@echo "${YELLOW}Cleaning all Maven projects...${NC}"
	mvn clean
	@echo "${GREEN}✓ Maven clean complete${NC}"

mvn-package: ## Package all Maven services (with tests)
	@echo "${YELLOW}Packaging all Maven services...${NC}"
	mvn clean package
	@echo "${GREEN}✓ Maven package complete${NC}"

mvn-install: ## Install all Maven services to local repository
	@echo "${YELLOW}Installing all Maven services...${NC}"
	mvn clean install
	@echo "${GREEN}✓ Maven install complete${NC}"
