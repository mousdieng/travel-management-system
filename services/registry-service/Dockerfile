# Runtime image for Travel Management Registry Service (Eureka)
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

# Create user for security
RUN addgroup -g 1001 -S travelms && \
    adduser -u 1001 -S travelms -G travelms

# Copy pre-built JAR from local target folder
COPY target/*.jar app.jar

# Change ownership
RUN chown -R travelms:travelms /app

# Switch to non-root user
USER travelms

# Expose port
EXPOSE 8761

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8761/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
