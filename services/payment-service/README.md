# Payment Service

Payment Service microservice with Stripe and PayPal integration for the Travel Management System.

## Features

- **Multiple Payment Methods**: Support for Stripe, PayPal, Credit/Debit Cards
- **Real-time Payment Processing**: Instant payment confirmation
- **Webhook Support**: Automated payment status updates via webhooks
- **Refund Processing**: Full and partial refund capabilities
- **Fee Calculation**: Automatic payment processing fee calculation
- **Transaction Tracking**: Comprehensive payment history and tracking
- **Security**: Secure payment processing with industry standards

## Tech Stack

- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- PostgreSQL
- Stripe SDK
- PayPal SDK
- Netflix Eureka Client
- SpringDoc OpenAPI

## Prerequisites

- JDK 17 or higher
- Maven 3.6+
- PostgreSQL 12+
- Stripe Account (for Stripe integration)
- PayPal Developer Account (for PayPal integration)

## Database Setup

```sql
CREATE DATABASE payment_db;
```

## Configuration

### Environment Variables

Set the following environment variables:

```bash
# Stripe Configuration
export STRIPE_API_KEY=sk_test_your_stripe_secret_key
export STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal Configuration
export PAYPAL_CLIENT_ID=your_paypal_client_id
export PAYPAL_CLIENT_SECRET=your_paypal_client_secret
export PAYPAL_MODE=sandbox  # or 'live' for production
export PAYPAL_RETURN_URL=http://localhost:4200/payment/success
export PAYPAL_CANCEL_URL=http://localhost:4200/payment/cancel

# Database Configuration (optional - defaults provided)
export DB_URL=jdbc:postgresql://localhost:5432/payment_db
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
```

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Set up webhook endpoints at https://dashboard.stripe.com/webhooks
4. Add webhook endpoint: `http://your-domain/api/webhooks/stripe`
5. Subscribe to events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`

### PayPal Setup

1. Create a PayPal Developer account at 
2. Create a REST API app to get Client ID and Secret
3. Configure return and cancel URLs in your application
4. Set up webhook events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

## Running the Service

### Local Development

```bash
mvn spring-boot:run
```

### Using Docker

```bash
# Build image
docker build -t payment-service:latest .

# Run container
docker run -p 8084:8084 \
  -e STRIPE_API_KEY=your_key \
  -e PAYPAL_CLIENT_ID=your_id \
  payment-service:latest
```

## API Endpoints

### Payment Operations

- `POST /api/payments` - Process a payment
- `GET /api/payments/{id}` - Get payment by ID
- `GET /api/payments/user/{userId}` - Get user's payments
- `GET /api/payments/user/{userId}/completed` - Get user's completed payments
- `GET /api/payments/booking/{bookingId}` - Get payment by booking ID
- `POST /api/payments/{id}/refund` - Refund a payment

### Payment Confirmation

- `POST /api/payments/stripe/confirm` - Confirm Stripe payment
- `POST /api/payments/paypal/confirm` - Confirm PayPal payment

### Webhooks

- `POST /api/webhooks/stripe` - Stripe webhook endpoint
- `POST /api/webhooks/paypal` - PayPal webhook endpoint

## API Documentation

Access Swagger UI at: `http://localhost:8084/swagger-ui.html`

Access OpenAPI docs at: `http://localhost:8084/api-docs`

## Payment Flow

### Stripe Payment Flow

1. Client creates payment request
2. Service creates Stripe Payment Intent
3. Client completes payment on frontend using Stripe.js
4. Stripe sends webhook confirmation
5. Service updates payment status

### PayPal Payment Flow

1. Client creates payment request
2. Service creates PayPal order
3. Client redirects to PayPal for approval
4. Client returns with payment confirmation
5. Service executes PayPal payment
6. PayPal sends webhook confirmation

## Payment Fees

### Stripe Fees
- 2.9% + $0.30 per transaction

### PayPal Fees
- 3.49% + $0.49 per transaction

Fees are automatically calculated and deducted from the gross amount.

## Testing

```bash
# Run tests
mvn test

# Run with coverage
mvn test jacoco:report
```

### Test Cards (Stripe)

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient Funds: `4000 0000 0000 9995`

## Health Check

Check service health at: `http://localhost:8084/actuator/health`

## Monitoring

Prometheus metrics available at: `http://localhost:8084/actuator/prometheus`

## Error Handling

The service returns appropriate HTTP status codes:

- `200 OK` - Successful operation
- `201 Created` - Payment created
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Payment not found
- `500 Internal Server Error` - Server error

## Security Considerations

- Always use HTTPS in production
- Validate webhook signatures
- Never expose API keys in client-side code
- Use environment variables for sensitive configuration
- Implement rate limiting
- Log all payment transactions
- Encrypt sensitive data at rest

## Support

For issues and questions, contact the development team.

## License

Copyright (c) 2024 Travel Management System
