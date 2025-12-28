# User Service

User Service microservice for the Travel Management System. This service manages user profiles and related operations.

## Features

- User profile management
- Profile image upload/delete
- User information retrieval
- Email and username availability checking
- Integration with Auth Service via Feign Client
- PostgreSQL database for user data persistence
- Eureka service discovery integration
- Swagger/OpenAPI documentation

## Technology Stack

- Java 17
- Spring Boot 3.2.0
- Spring Cloud (Eureka Client, OpenFeign)
- Spring Data JPA
- PostgreSQL
- Lombok
- SpringDoc OpenAPI (Swagger)
- Maven

## API Endpoints

### User Management

- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email
- `GET /api/users` - Get all users
- `GET /api/users/role/{role}` - Get users by role
- `PUT /api/users/{id}` - Update user profile
- `POST /api/users/{id}/profile-image` - Upload profile image
- `DELETE /api/users/{id}/profile-image` - Delete profile image
- `GET /api/users/exists/email?email={email}` - Check if email exists
- `GET /api/users/exists/username?username={username}` - Check if username exists

## Configuration

### Environment Variables

- `SERVER_PORT` - Server port (default: 8082)
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: travelms_users)
- `DB_USER` - Database username (default: postgres)
- `DB_PASSWORD` - Database password (default: postgres)
- `EUREKA_SERVER` - Eureka server URL (default: http://localhost:8761/eureka/)
- `FILE_UPLOAD_DIR` - File upload directory (default: uploads/profile-images)
- `SPRING_PROFILES_ACTIVE` - Active profile (dev/prod)

## Running the Service

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL database
- Eureka service registry running

### Development Mode

```bash
# Create database
createdb travelms_users

# Run the application
mvn spring-boot:run
```

### Production Mode with Docker

```bash
# Build Docker image
docker build -t user-service:1.0.0 .

# Run container
docker run -d \
  -p 8082:8082 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=travelms_users \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e EUREKA_SERVER=http://registry-service:8761/eureka/ \
  --name user-service \
  user-service:1.0.0
```

## API Documentation

Once the service is running, access the Swagger UI at:
- http://localhost:8082/swagger-ui.html

API docs in JSON format:
- http://localhost:8082/api-docs

## Health Check

- http://localhost:8082/actuator/health

## Database Schema

The service uses the following main entity:

### User Table
- id (Primary Key)
- username
- email (Unique)
- firstName
- lastName
- phoneNumber
- profileImage
- bio
- address
- city
- country
- role (ADMIN, TRAVEL_MANAGER, TRAVELER)
- enabled
- createdAt
- updatedAt

## Inter-Service Communication

This service communicates with:
- **Auth Service** - For user authentication validation via Feign Client

## File Upload

Profile images are stored in the local filesystem:
- Maximum file size: 5MB
- Allowed formats: JPG, JPEG, PNG, GIF
- Storage path: configured via `FILE_UPLOAD_DIR` environment variable
