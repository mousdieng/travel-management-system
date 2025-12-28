# Kafka Setup for Travel Management System

## Overview

The Travel Management System uses Apache Kafka for event-driven communication between microservices. This document explains the Kafka setup and usage.

## Architecture

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Payment Service │─────▶│      Kafka       │─────▶│  Travel Service  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │ Feedback Service  │
                          └───────────────────┘
```

## Kafka Topics

The system uses the following Kafka topics:

1. **`payment-completed-events`**
   - Producer: Payment Service
   - Consumer: Travel Service
   - Purpose: Notify when a payment is completed
   - Event: `PaymentCompletedEvent`

2. **`payment-refunded-events`**
   - Producer: Payment Service
   - Consumer: Travel Service
   - Purpose: Notify when a payment is refunded
   - Event: `PaymentRefundedEvent`

3. **`feedback-changed-events`**
   - Producer: Feedback Service
   - Consumer: Travel Service
   - Purpose: Notify when feedback is created, updated, or deleted
   - Event: `FeedbackChangedEvent`

4. **`user-deleted-events`**
   - Producer: User Service
   - Consumer: Payment Service, Travel Service
   - Purpose: Cleanup data when a user is deleted
   - Event: `UserDeletedEvent`

## Docker Compose Configuration

### Services

The docker-compose.yml includes:

1. **Zookeeper** (Port 2181)
   - Manages Kafka cluster coordination
   - Required for Kafka to function

2. **Kafka** (Ports 9092, 9093)
   - Message broker for event streaming
   - Advertised listeners:
     - Internal: `kafka:29092` (container-to-container)
     - External: `localhost:9092` (host access)

### Starting Kafka

```bash
# Start only infrastructure services
docker-compose up -d postgres redis elasticsearch neo4j zookeeper kafka minio

# Verify Kafka is running
docker ps | grep kafka
docker logs kafka

# Check Kafka health
docker exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### Topic Auto-Creation

Topics are automatically created when first used. Configuration:
- `KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"`
- Replication factor: 1 (single broker)
- Retention: 168 hours (7 days)

### Manual Topic Management

```bash
# List all topics
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Create a topic manually
docker exec kafka kafka-topics --bootstrap-server localhost:9092 \
  --create \
  --topic payment-completed-events \
  --partitions 3 \
  --replication-factor 1

# Describe a topic
docker exec kafka kafka-topics --bootstrap-server localhost:9092 \
  --describe \
  --topic payment-completed-events

# Delete a topic
docker exec kafka kafka-topics --bootstrap-server localhost:9092 \
  --delete \
  --topic payment-completed-events
```

## Microservice Configuration

### Environment Variables

When running microservices in Docker:
```yaml
environment:
  - KAFKA_BOOTSTRAP_SERVERS=kafka:29092
```

When running microservices locally:
```yaml
kafka:
  bootstrap-servers: localhost:9092
```

### Application Properties

Each service has Kafka configured in `application.yml`:

```yaml
kafka:
  bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
  producer:
    key-serializer: org.apache.kafka.common.serialization.StringSerializer
    value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    acks: all
    retries: 3
  consumer:
    group-id: {service-name}-group
    key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
    value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
    properties:
      spring.json.trusted.packages: "*"
    auto-offset-reset: earliest
```

## Event Flow Examples

### 1. Payment Completion Flow

```
1. User completes payment
2. Payment Service → Publishes PaymentCompletedEvent to Kafka
3. Travel Service → Consumes event
4. Travel Service → Creates subscription
5. Travel Service → Updates Neo4j graph
6. User receives booking confirmation
```

### 2. Feedback Creation Flow

```
1. User submits feedback
2. Feedback Service → Saves feedback to database
3. Feedback Service → Publishes FeedbackChangedEvent to Kafka
4. Travel Service → Consumes event
5. Travel Service → Updates Neo4j graph (GAVE_FEEDBACK relationship)
6. Travel Service → Recalculates travel average rating
7. Updated rating visible to all users
```

### 3. User Deletion Flow

```
1. Admin deletes user
2. User Service → Publishes UserDeletedEvent to Kafka
3. Payment Service → Deletes user's payment methods
4. Travel Service → Deletes user's subscriptions
5. All user data cleaned up across services
```

## Monitoring

### Kafka Console Consumer

Monitor events in real-time:

```bash
# Monitor payment completed events
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic payment-completed-events \
  --from-beginning

# Monitor feedback events
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic feedback-changed-events \
  --from-beginning
```

### Consumer Group Management

```bash
# List consumer groups
docker exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list

# Describe a consumer group
docker exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe \
  --group payment-service-group

# Reset consumer offsets (replay events)
docker exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group travel-service-group \
  --topic feedback-changed-events \
  --reset-offsets \
  --to-earliest \
  --execute
```

## Troubleshooting

### Kafka Not Starting

```bash
# Check Zookeeper is healthy
docker ps | grep zookeeper
docker logs zookeeper

# Check Kafka logs
docker logs kafka

# Restart Kafka
docker-compose restart kafka
```

### Connection Issues

```bash
# Test connection from host
docker run --rm -it --network travel-management-system_travelms-network \
  confluentinc/cp-kafka:7.5.0 \
  kafka-broker-api-versions --bootstrap-server kafka:29092

# Check if microservice can connect
docker exec travel-service curl http://kafka:29092
```

### Events Not Being Consumed

```bash
# Check consumer lag
docker exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe \
  --group travel-service-group

# Verify topic has messages
docker exec kafka kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic payment-completed-events
```

### Recreate Kafka

If Kafka is in a bad state:

```bash
# Stop and remove Kafka containers
docker-compose down kafka zookeeper

# Remove Kafka data (WARNING: This deletes all messages)
docker volume rm travel-management-system_kafka_data
docker volume rm travel-management-system_zookeeper_data

# Restart Kafka
docker-compose up -d zookeeper kafka
```

## Production Considerations

For production deployments, consider:

1. **Replication**: Use multiple Kafka brokers with replication factor ≥ 3
2. **Partitions**: Increase partitions for high-throughput topics
3. **Retention**: Adjust retention based on compliance requirements
4. **Security**: Enable SASL/SSL authentication and encryption
5. **Monitoring**: Set up Prometheus + Grafana for Kafka metrics
6. **Backup**: Regular backups of Zookeeper and Kafka data

## References

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Spring Kafka Documentation](https://spring.io/projects/spring-kafka)
- [Confluent Platform](https://docs.confluent.io/)
