# Feedback Service

Feedback Service for Travel Management System - Handles ratings, reviews, and reports.

## Features

### Feedback Management
- Submit feedback on travels
- Update/delete own feedback
- Rate travels (1-5 stars)
- Add comments/reviews
- Get travel average ratings
- View feedback history

### Report Management
- Report users (travelers/managers)
- Report travels
- Admin review of reports
- Report status tracking (PENDING, UNDER_REVIEW, RESOLVED, DISMISSED)
- Report analytics

### Dashboard & Analytics
- Traveler statistics
- Manager performance metrics
- Admin platform analytics
- Feedback trends
- Report summaries

## Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Service Discovery**: Netflix Eureka
- **Monitoring**: Spring Boot Actuator
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Build Tool**: Maven

## Getting Started

### Prerequisites

- Java 17 or higher
- PostgreSQL 12 or higher
- Maven 3.9 or higher

### Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE feedback_db;
```

### Configuration

Update `src/main/resources/application.yml` with your database credentials:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/feedback_db
    username: your_username
    password: your_password
```

### Running the Application

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The service will start on port **8085**.

### Docker

Build and run using Docker:

```bash
# Build Docker image
docker build -t feedback-service:latest .

# Run container
docker run -p 8085:8085 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/feedback_db \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=postgres \
  feedback-service:latest
```

## API Documentation

Once the application is running, access the Swagger UI at:

```
http://localhost:8085/swagger-ui.html
```

API documentation in JSON format:

```
http://localhost:8085/api-docs
```

## API Endpoints

### Feedback Endpoints

- `POST /api/feedbacks` - Submit feedback
- `PUT /api/feedbacks/{id}` - Update feedback
- `DELETE /api/feedbacks/{id}` - Delete feedback
- `GET /api/feedbacks/{id}` - Get feedback by ID
- `GET /api/feedbacks/travel/{travelId}` - Get travel feedbacks
- `GET /api/feedbacks/user/{userId}` - Get user feedbacks
- `GET /api/feedbacks` - Get all feedbacks (Admin)
- `GET /api/feedbacks/travel/{travelId}/average-rating` - Get average rating
- `GET /api/feedbacks/travel/{travelId}/count` - Get feedback count

### Report Endpoints

- `POST /api/reports` - Create report
- `PUT /api/reports/{id}/review` - Review report (Admin)
- `GET /api/reports/{id}` - Get report by ID
- `GET /api/reports` - Get all reports (Admin)
- `GET /api/reports/pending` - Get pending reports (Admin)
- `GET /api/reports/user/{userId}` - Get user reports
- `GET /api/reports/against-user/{userId}` - Get reports against user (Admin)

### Dashboard Endpoints

- `GET /api/dashboard/traveler/{travelerId}` - Get traveler statistics
- `GET /api/dashboard/manager/{managerId}` - Get manager statistics
- `GET /api/dashboard/admin` - Get admin statistics

## Health Check

```
http://localhost:8085/actuator/health
```

## Database Schema

### Feedbacks Table
- `id` - Primary key
- `traveler_id` - Foreign key to user
- `travel_id` - Foreign key to travel
- `rating` - Integer (1-5)
- `comment` - Text (max 1000 chars)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Reports Table
- `id` - Primary key
- `reporter_id` - Foreign key to user
- `report_type` - Enum (TRAVEL_MANAGER, TRAVELER, TRAVEL)
- `reported_user_id` - Foreign key to user (optional)
- `reported_travel_id` - Foreign key to travel (optional)
- `reason` - Text (10-1000 chars)
- `status` - Enum (PENDING, UNDER_REVIEW, RESOLVED, DISMISSED)
- `admin_notes` - Text
- `reviewed_by` - Foreign key to admin user
- `reviewed_at` - Timestamp
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Integration Notes

This service uses header-based user identification:
- `X-User-Id` header for authenticated requests

For full microservice integration, consider implementing:
- Service-to-service communication with Feign Client
- API Gateway for authentication
- Message queue for asynchronous operations

## Development

### Running Tests

```bash
mvn test
```

### Code Quality

The project uses:
- Lombok for reducing boilerplate code
- JPA Auditing for automatic timestamp management
- Bean Validation for request validation

## License

Copyright (c) 2024 Travel Management System
