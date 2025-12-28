# Runtime image for Travel Management Gateway Service
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

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
EXPOSE 9080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]