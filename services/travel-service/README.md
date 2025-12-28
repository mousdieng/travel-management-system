# Travel Service

Core Travel Management Service with Elasticsearch and Neo4j integration.

## Features

### Travel Management
- **CRUD Operations**: Create, read, update, and delete travel packages
- **Search & Discovery**:
  - Elasticsearch-powered full-text search
  - Autocomplete functionality
  - Filter by category, destination, date range
- **Travel Listings**:
  - Available travels (not full, upcoming)
  - Top-rated travels
  - Manager-specific travel listings

### Subscription Management
- **Subscribe to Travels**: Users can subscribe to travel packages
- **Cancellation Policy**: 3-day cancellation window before travel start date
- **Status Tracking**: ACTIVE, CANCELLED, COMPLETED
- **Manager Controls**: Travel managers can manage subscriptions for their travels

### Recommendations (Neo4j-powered)
- **Personalized Recommendations**: Based on user preferences and history
- **Category-based**: Recommend similar travels in preferred categories
- **Destination-based**: Suggest travels to destinations user has enjoyed
- **Rating-based**: Recommend highly-rated travels

### Database Integration
- **PostgreSQL**: Primary relational data storage
- **Elasticsearch**: Fast, full-text search and autocomplete
- **Neo4j**: Graph-based recommendation engine

## Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Databases**:
  - PostgreSQL (Primary)
  - Elasticsearch (Search)
  - Neo4j (Recommendations)
- **Service Discovery**: Netflix Eureka Client
- **API Documentation**: SpringDoc OpenAPI 3
- **Build Tool**: Maven

## API Endpoints

### Travel Management
- `GET /api/travels` - Get all travels
- `GET /api/travels/available` - Get available travels
- `GET /api/travels/upcoming` - Get upcoming travels
- `GET /api/travels/top-rated?limit=10` - Get top-rated travels
- `GET /api/travels/{id}` - Get travel by ID
- `GET /api/travels/search?keyword={keyword}` - Search travels
- `GET /api/travels/autocomplete?query={query}` - Autocomplete search
- `GET /api/travels/manager/{managerId}` - Get manager's travels
- `POST /api/travels` - Create new travel (requires manager role)
- `PUT /api/travels/{id}` - Update travel (requires manager role)
- `DELETE /api/travels/{id}` - Delete travel (requires manager role)
- `PUT /api/travels/{id}/rating` - Update travel rating

### Subscription Management
- `POST /api/subscriptions/subscribe/{travelId}` - Subscribe to travel
- `DELETE /api/subscriptions/{subscriptionId}/cancel` - Cancel subscription
- `GET /api/subscriptions/{id}` - Get subscription by ID
- `GET /api/subscriptions/my-subscriptions` - Get user's subscriptions
- `GET /api/subscriptions/my-subscriptions/active` - Get active subscriptions
- `GET /api/subscriptions/travel/{travelId}` - Get travel subscriptions
- `DELETE /api/subscriptions/{subscriptionId}/manager-cancel/{travelId}` - Manager cancel

### Recommendations
- `GET /api/recommendations/personalized` - Get personalized recommendations

## Configuration

### Environment Variables

```bash
# Server
PORT=8083

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=travel_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Elasticsearch
ELASTICSEARCH_URIS=http://localhost:9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j

# Eureka
EUREKA_SERVER_URL=http://localhost:8761/eureka/

# Logging
LOG_LEVEL=INFO
SQL_LOG_LEVEL=WARN
SHOW_SQL=false
```

## Running the Service

### Using Docker

```bash
docker build -t travel-service .
docker run -p 8083:8083 \
  -e POSTGRES_HOST=postgres \
  -e ELASTICSEARCH_URIS=http://elasticsearch:9200 \
  -e NEO4J_URI=bolt://neo4j:7687 \
  -e EUREKA_SERVER_URL=http://eureka:8761/eureka/ \
  travel-service
```

### Using Maven

```bash
mvn spring-boot:run
```

## API Documentation

Once running, access the API documentation at:
- Swagger UI: http://localhost:8083/swagger-ui.html
- OpenAPI JSON: http://localhost:8083/api-docs

## Health Check

- Health endpoint: http://localhost:8083/actuator/health

## Business Logic

### 3-Day Cancellation Policy
- Subscriptions can be cancelled up to 3 days before travel start date
- Travel managers can cancel any subscription regardless of the cutoff date
- Cancelled subscriptions free up a participant slot

### Participant Management
- Each travel has a maximum participant limit
- Current participant count is automatically managed
- Travels become "full" when current participants reach the maximum

### Travel Status
- **Upcoming**: Start date is in the future
- **Ongoing**: Current date is between start and end dates
- **Completed**: End date is in the past
- **Active**: Travel is available for subscriptions

## Data Synchronization

The service maintains data consistency across three databases:
1. **PostgreSQL**: Source of truth for relational data
2. **Elasticsearch**: Synchronized on create/update for search
3. **Neo4j**: Synchronized for graph-based relationships and recommendations

## Architecture

```
Controller Layer
    ├── TravelController
    ├── SubscriptionController
    └── RecommendationController
         ↓
Service Layer
    ├── TravelService
    ├── SubscriptionService
    ├── RecommendationService
    └── Neo4jSyncService
         ↓
Repository Layer
    ├── JPA (PostgreSQL)
    │   ├── TravelRepository
    │   └── SubscriptionRepository
    ├── Elasticsearch
    │   └── TravelSearchRepository
    └── Neo4j
        ├── TravelNodeRepository
        └── TravelerNodeRepository
```

## Author

Travel Management System Team
