# Payment-First Checkout Flow

This document explains the new **payment-first checkout** flow that ensures payment is confirmed **BEFORE** creating a travel subscription/booking.

## Overview

### Old Flow (Booking First)
```
1. User creates subscription → Subscription created (ACTIVE)
2. User pays → Payment processed
3. Subscription exists regardless of payment status
```

**Problem**: Users could book without paying, reserving spots without commitment.

### New Flow (Payment First) ✅
```
1. User initiates checkout → Payment intent/session created (PENDING)
2. User completes payment → Payment confirmed (COMPLETED)
3. Subscription automatically created → Booking finalized (ACTIVE)
```

**Benefit**: Subscription is **only created after successful payment**.

---

## Architecture

### Components

1. **CheckoutService** (`payment-service`)
   - Initiates payment-first checkout
   - Stores pending booking details
   - Creates subscription after payment confirmation

2. **TravelServiceClient** (`payment-service`)
   - Communicates with travel-service via REST
   - Creates subscription after payment succeeds

3. **PaymentService** (Modified)
   - Extended to support subscription creation on payment confirmation
   - Works for both Stripe and PayPal

4. **Payment Entity** (Modified)
   - `bookingId` is now nullable (populated after subscription created)
   - Added `pendingBookingDetails` field to store booking info temporarily

---

## API Endpoints

### New Endpoint: Payment-First Checkout

**POST** `/api/v1/payments/checkout`

**Description**: Initiates checkout by creating payment intent/session BEFORE subscription.

**Request Body** (`CheckoutRequest`):
```json
{
  "userId": 1,
  "travelId": 5,
  "numberOfParticipants": 2,
  "passengerDetails": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-01",
      "passportNumber": "AB123456",
      "phoneNumber": "+1234567890",
      "email": "john@example.com"
    },
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "dateOfBirth": "1992-05-15",
      "passportNumber": "CD789012",
      "phoneNumber": "+1234567891",
      "email": "jane@example.com"
    }
  ],
  "amount": 1500.00,
  "paymentMethod": "STRIPE",
  "currency": "USD",
  "stripePaymentMethodId": "pm_1234567890",
  "savePaymentMethod": true,
  "cardholderName": "John Doe"
}
```

**Response** (`PaymentDTO`):
```json
{
  "id": 42,
  "userId": 1,
  "bookingId": null,
  "amount": 1500.00,
  "fee": 43.80,
  "netAmount": 1456.20,
  "paymentMethod": "STRIPE",
  "status": "PROCESSING",
  "transactionId": "TXN-ABC123",
  "paymentIntentId": "pi_1234567890",
  "sessionId": "cs_test_1234567890",
  "currency": "USD",
  "clientSecret": "pi_1234567890_secret_xyz",
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "createdAt": "2025-12-03T10:00:00"
}
```

**Flow**:
1. Client calls `/checkout` with travel and payment details
2. Payment service creates payment intent/session (status: PENDING/PROCESSING)
3. Payment service stores booking details as JSON in `pendingBookingDetails`
4. Client receives `clientSecret` or `checkoutUrl` to complete payment
5. User completes payment on Stripe/PayPal
6. Client calls confirmation endpoint
7. Payment service confirms payment → creates subscription → updates `bookingId`

---

### Modified Endpoints: Payment Confirmation

#### Stripe Confirmation

**POST** `/api/v1/payments/stripe/confirm`

**Query Parameters**:
- `sessionId` or `paymentIntentId` (one required)

**Headers**:
- `Authorization: Bearer <jwt_token>` (required for subscription creation)

**Response**: `PaymentDTO` with updated status and `bookingId`

**Changes**:
- Now automatically creates subscription if payment has `pendingBookingDetails`
- Requires JWT token in Authorization header

---

#### PayPal Confirmation

**POST** `/api/v1/payments/paypal/confirm`

**Query Parameters**:
- `paymentId` (required)
- `payerId` (required)

**Headers**:
- `Authorization: Bearer <jwt_token>` (required for subscription creation)

**Response**: `PaymentDTO` with updated status and `bookingId`

**Changes**:
- Now automatically creates subscription if payment has `pendingBookingDetails`
- Requires JWT token in Authorization header

---

### Legacy Endpoint (Still Supported)

**POST** `/api/v1/payments`

The original payment endpoint still works for backwards compatibility. It requires an existing `bookingId`.

**POST** `/api/v1/subscriptions`

Still available for creating subscriptions directly (old flow).

---

## Sequence Diagram

```
User                 Frontend           Payment Service      Stripe/PayPal      Travel Service
 │                      │                      │                    │                  │
 │  1. Select Travel   │                      │                    │                  │
 │  & Click Checkout   │                      │                    │                  │
 ├────────────────────→│                      │                    │                  │
 │                      │                      │                    │                  │
 │                      │  2. POST /checkout   │                    │                  │
 │                      ├─────────────────────→│                    │                  │
 │                      │                      │  3. Create Payment │                  │
 │                      │                      │     Intent/Session │                  │
 │                      │                      ├───────────────────→│                  │
 │                      │                      │                    │                  │
 │                      │                      │  4. Return Secret  │                  │
 │                      │                      │←───────────────────┤                  │
 │                      │                      │  Save pending      │                  │
 │                      │                      │  booking details   │                  │
 │                      │  5. Payment Response │                    │                  │
 │                      │  (checkoutUrl/secret)│                    │                  │
 │                      │←─────────────────────┤                    │                  │
 │                      │                      │                    │                  │
 │  6. Redirect to Pay │                      │                    │                  │
 │←─────────────────────┤                      │                    │                  │
 │                      │                      │                    │                  │
 │  7. Enter Card Info │                      │                    │                  │
 │  & Complete Payment │                      │                    │                  │
 ├──────────────────────────────────────────────────────────────────→│                  │
 │                      │                      │                    │                  │
 │  8. Payment Success │                      │                    │                  │
 │←──────────────────────────────────────────────────────────────────┤                  │
 │                      │                      │                    │                  │
 │  9. Redirected Back │                      │                    │                  │
 ├────────────────────→│                      │                    │                  │
 │                      │                      │                    │                  │
 │                      │  10. POST /stripe/confirm                 │                  │
 │                      │     with sessionId   │                    │                  │
 │                      ├─────────────────────→│                    │                  │
 │                      │                      │  11. Verify Payment│                  │
 │                      │                      ├───────────────────→│                  │
 │                      │                      │  Status: COMPLETED │                  │
 │                      │                      │←───────────────────┤                  │
 │                      │                      │                    │                  │
 │                      │                      │  12. POST /subscriptions              │
 │                      │                      │     Create Subscription               │
 │                      │                      ├──────────────────────────────────────→│
 │                      │                      │                    │                  │
 │                      │                      │  13. Subscription Created             │
 │                      │                      │←──────────────────────────────────────┤
 │                      │                      │  Update payment    │                  │
 │                      │                      │  with bookingId    │                  │
 │                      │                      │                    │                  │
 │                      │  14. Payment + Booking Confirmed          │                  │
 │                      │←─────────────────────┤                    │                  │
 │                      │                      │                    │                  │
 │  15. Show Success   │                      │                    │                  │
 │←─────────────────────┤                      │                    │                  │
```

---

## Database Changes

### Payment Entity

**New Fields**:

```java
// BookingId is nullable initially for payment-first checkout flow
// It gets populated after subscription is created following payment confirmation
@Column(nullable = true)
private Long bookingId;

// Temporary storage for booking details until subscription is created
// Used in payment-first checkout flow
@Column(columnDefinition = "TEXT")
private String pendingBookingDetails; // JSON: {travelId, numberOfParticipants, passengerDetails, userName}
```

**Migration**: When you run the application, Hibernate will automatically add these fields. Existing rows will have `bookingId` (already populated) and `pendingBookingDetails` as null.

---

## Client-Side Implementation

### React/Angular Example

```typescript
// 1. Initiate Checkout
async function initiateCheckout(travelId: number, participants: number, passengerDetails: any[]) {
  const response = await fetch('/api/v1/payments/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      userId: currentUserId,
      travelId: travelId,
      numberOfParticipants: participants,
      passengerDetails: passengerDetails,
      amount: calculateAmount(travelPrice, participants),
      paymentMethod: 'STRIPE',
      currency: 'USD',
      stripePaymentMethodId: paymentMethodId, // from Stripe Elements
      savePaymentMethod: true,
      cardholderName: 'John Doe'
    })
  });

  const payment = await response.json();

  // Option A: Redirect to Stripe Checkout
  if (payment.checkoutUrl) {
    window.location.href = payment.checkoutUrl;
  }

  // Option B: Use Stripe Elements with Payment Intent
  if (payment.clientSecret) {
    const result = await stripe.confirmPayment({
      clientSecret: payment.clientSecret,
      confirmParams: {
        return_url: 'https://yourapp.com/payment/success'
      }
    });
  }
}

// 2. Confirm Payment (on return from Stripe)
async function confirmStripePayment(sessionId: string) {
  const response = await fetch(`/api/v1/payments/stripe/confirm?sessionId=${sessionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}` // Important!
    }
  });

  const payment = await response.json();

  if (payment.status === 'COMPLETED' && payment.bookingId) {
    // Success! Show confirmation
    showSuccessMessage(`Booking confirmed! Booking ID: ${payment.bookingId}`);
    redirectToBookingDetails(payment.bookingId);
  } else {
    // Payment succeeded but subscription creation failed
    showErrorMessage('Payment completed but booking creation failed. Please contact support.');
  }
}
```

---

## Error Handling

### Scenario 1: Payment Succeeds, Subscription Creation Fails

**What happens**:
1. Payment status: `COMPLETED`
2. `bookingId`: `null`
3. `failureReason`: "Payment completed but subscription creation failed: [reason]"
4. User paid but no booking created

**Resolution**:
- Admin can manually create subscription or issue refund
- Automatic refund can be configured in `CheckoutService.handleSubscriptionCreationFailure()`

**Frontend handling**:
```typescript
if (payment.status === 'COMPLETED' && !payment.bookingId) {
  alert('Payment succeeded but booking creation failed. Please contact support with Payment ID: ' + payment.id);
}
```

---

### Scenario 2: User Abandons Payment

**What happens**:
1. Payment status: `PENDING` or `PROCESSING`
2. `bookingId`: `null`
3. `pendingBookingDetails`: Contains booking info

**Resolution**:
- Payment expires after timeout (Stripe: 24 hours)
- No subscription created, no spots reserved
- User can restart checkout

---

### Scenario 3: Network Error During Confirmation

**What happens**:
- Payment succeeded at Stripe/PayPal
- Confirmation request failed

**Resolution**:
- Frontend should retry confirmation
- Backend is idempotent (calling confirm multiple times is safe)

```typescript
async function confirmWithRetry(sessionId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await confirmStripePayment(sessionId);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

---

## Testing

### Test Case 1: Successful Checkout

```bash
# 1. Initiate checkout
curl -X POST http://localhost:9084/api/v1/payments/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "travelId": 5,
    "numberOfParticipants": 2,
    "passengerDetails": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "dateOfBirth": "1990-01-01",
        "passportNumber": "AB123456",
        "phoneNumber": "+1234567890",
        "email": "john@example.com"
      }
    ],
    "amount": 1500.00,
    "paymentMethod": "STRIPE",
    "currency": "USD"
  }'

# 2. Complete payment at Stripe (use checkoutUrl from response)

# 3. Confirm payment
curl -X POST "http://localhost:9084/api/v1/payments/stripe/confirm?sessionId=cs_test_..." \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result**:
- Payment status: `COMPLETED`
- `bookingId` populated
- Subscription created in travel-service
- Travel participant count incremented

---

### Test Case 2: Payment Failure

```bash
# Use Stripe test card that triggers failure: 4000000000000002
```

**Expected Result**:
- Payment status: `FAILED`
- No subscription created
- No spots reserved

---

## Migration from Old Flow

### Backwards Compatibility

Both flows are supported:

1. **New Flow** (Recommended): Use `/checkout` endpoint
2. **Old Flow** (Legacy): Create subscription first, then pay

**Frontend changes required**:
- Replace calls to `POST /subscriptions` → `POST /payments` with single call to `POST /payments/checkout`
- Update success page to call confirmation endpoint

**No backend changes required for existing subscriptions**.

---

## Benefits

✅ **Payment guarantee**: No bookings without payment
✅ **Inventory accuracy**: Spots only reserved after payment
✅ **Better UX**: Single checkout flow
✅ **Fraud prevention**: Cannot hold spots without paying
✅ **Automatic**: Subscription created immediately after payment
✅ **Reliable**: Atomic operation (payment + booking)

---

## Configuration

No additional configuration required. The flow works with existing Stripe/PayPal setup.

**Required**:
- Eureka service discovery running
- Travel service registered with Eureka
- JWT authentication enabled

---

## Monitoring & Logs

Look for these log messages:

```
INFO  - Initiating payment-first checkout for user 1 and travel 5
INFO  - Checkout initiated. Payment ID: 42, Status: PROCESSING
INFO  - Payment confirmed successfully. Creating subscription for payment 42
INFO  - Successfully created subscription 123 for payment 42
```

Or errors:

```
ERROR - Failed to create subscription after payment confirmation: Travel is full
ERROR - Error calling travel service to create subscription: Connection timeout
```

---

## Support & Troubleshooting

### Issue: "Payment completed but subscription creation failed"

**Causes**:
- Travel is full
- Travel was cancelled
- Travel service is down
- JWT token expired

**Resolution**:
1. Check payment service logs
2. Verify travel service is running
3. Check travel availability
4. Issue refund if necessary: `POST /api/v1/payments/{id}/refund`

### Issue: "Cannot find booking ID in payment response"

**Cause**: Subscription creation is still pending (async)

**Resolution**: Wait a few seconds and query payment by ID: `GET /api/v1/payments/{id}`

---

## Summary

The payment-first checkout flow ensures that **payments are confirmed before bookings are created**, preventing reservation abuse and guaranteeing payment for every booking. The implementation is backwards compatible and works with both Stripe and PayPal payment methods.

**Key Endpoint**: `POST /api/v1/payments/checkout`

**Remember**: Always include the JWT token in the Authorization header when confirming payments!
