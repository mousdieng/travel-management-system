# Frontend Payment-First Checkout Guide

This guide explains how to use the complete frontend checkout flow that ensures payment is confirmed before booking is created.

## 🎯 Overview

The new checkout flow provides a seamless end-to-end experience:

1. User selects a travel
2. User fills passenger information
3. User enters payment details
4. Payment is processed FIRST
5. Booking is created automatically after payment succeeds
6. User sees confirmation

---

## 📂 New Files Created

### Components

1. **Checkout Component**
   - Path: `frontend/src/app/features/checkout/checkout.component.ts`
   - Handles complete checkout flow with Stripe integration
   - Features:
     - Travel summary display
     - Passenger details form (dynamic based on number of travelers)
     - Stripe Elements card input
     - Payment method selection (Stripe/PayPal)
     - Real-time total calculation
     - Payment processing with loading states

2. **Payment Success Component**
   - Path: `frontend/src/app/features/payment-success/payment-success.component.ts`
   - Displays payment confirmation and booking details
   - Handles:
     - Stripe redirect confirmation
     - Direct link confirmation
     - Success, pending, and error states
     - Print confirmation option

### Updated Files

3. **Payment Models**
   - Added `CheckoutRequest` interface
   - Added `PassengerDetail` interface

4. **Payment Service**
   - Added `initiateCheckout()` method

5. **Environment**
   - Added `stripePublicKey` configuration

6. **Routes**
   - Added `/travels/:id/checkout` route
   - Updated `/payment/success` route
   - Added `/payment/pending` route

---

## 🚀 User Flow

### Step 1: Browse and Select Travel

User browses available travels and clicks on one to see details.

**URL**: `/travels/:id`

### Step 2: Click "Book Now"

From the travel detail page, user clicks "Book Now" button which navigates to:

**URL**: `/travels/:id/checkout`

Example: `/travels/5/checkout`

### Step 3: Fill Checkout Form

The checkout page shows:

#### A. Travel Summary (Left Side - Sticky)
- Travel image
- Title and destination
- Travel dates
- Price per person

####B. Checkout Form (Right Side)

**1. Number of Travelers**
```html
<input type="number" min="1" max="availableSpots">
```

**2. Passenger Information** (Optional but recommended)
- First Name *
- Last Name *
- Date of Birth *
- Passport Number
- Phone Number
- Email

Dynamically generates forms based on number of travelers.

**3. Payment Method Selection**
- Stripe (Credit/Debit Card)
- PayPal

**4. Card Details** (if Stripe selected)
- Cardholder Name
- Card Number, Expiry, CVC (Stripe Elements)
- Save card for future purchases checkbox

**5. Order Summary**
- Price breakdown
- Total amount

**6. Terms & Conditions**
- Acceptance checkbox

### Step 4: Submit Payment

User clicks "Pay $XX.XX" button.

**What Happens:**
1. Frontend creates Stripe payment method
2. Calls `/api/v1/payments/checkout` with:
   - User ID
   - Travel ID
   - Number of participants
   - Passenger details
   - Amount
   - Payment method ID

3. Backend creates payment record and Stripe payment intent
4. Returns `clientSecret` or `checkoutUrl`

5. Frontend:
   - **Option A**: Confirms payment inline (Payment Intent)
   - **Option B**: Redirects to Stripe Checkout page

### Step 5: Payment Processing

**If using Stripe Checkout (redirect flow):**
1. User is redirected to Stripe hosted page
2. User enters card details on Stripe's secure page
3. After payment, Stripe redirects back to:
   ```
   /payment/success?session_id=cs_test_xxx
   ```

**If using Stripe Elements (inline flow):**
1. Payment is confirmed in-page
2. On success, frontend calls confirmation endpoint
3. Navigates to success page with payment ID

### Step 6: Payment Confirmation

**URL**: `/payment/success?session_id=cs_test_xxx`

**What Happens:**
1. Frontend calls `/api/v1/payments/stripe/confirm?sessionId=xxx`
2. Backend:
   - Confirms payment with Stripe
   - Automatically creates subscription/booking
   - Links booking ID to payment
3. Frontend receives updated payment with `bookingId`
4. Loads subscription details
5. Shows success page

### Step 7: Success Page

Displays:
- ✅ Success icon with animation
- Booking reference number
- Travel details
- Payment details (amount, transaction ID, date)
- Next steps:
  - Email confirmation sent
  - View bookings in dashboard
  - Contact support if needed
- Action buttons:
  - Print Confirmation
  - View My Bookings

---

## 🔗 URLs and Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/travels` | Browse all travels | No |
| `/travels/:id` | View travel details | No |
| `/travels/:id/checkout` | Checkout page | **Yes** |
| `/payment/success` | Payment success/confirmation | No |
| `/payment/pending` | Payment pending state | No |
| `/payment/cancel` | Payment cancelled | No |
| `/traveler/subscriptions` | User's bookings | **Yes** |

---

## 💻 Code Examples

### 1. Navigate to Checkout (From Travel Detail)

```typescript
// In travel-detail.component.ts
bookTravel() {
  this.router.navigate(['/travels', this.travel.id, 'checkout']);
}
```

**HTML Button:**
```html
<button (click)="bookTravel()" class="btn btn-primary">
  Book Now
</button>
```

### 2. Checkout Component Usage

The checkout component automatically:
- Loads travel details from route parameter
- Initializes Stripe Elements
- Handles form validation
- Processes payment
- Redirects on success

**No additional code needed!** Just navigate to the route.

### 3. Handling Payment Confirmation

The payment-success component automatically:
- Reads URL parameters
- Confirms payment with backend
- Creates booking
- Shows appropriate state (success/pending/error)

**No additional code needed!** Just ensure the redirect URL is correct.

---

## 🎨 Styling and UX

### Responsive Design

✅ Desktop: 2-column layout (summary | form)
✅ Tablet: Single column, summary at top
✅ Mobile: Optimized for small screens

### Loading States

✅ Spinner during travel load
✅ "Processing..." button state during payment
✅ Loading message during confirmation

### Error Handling

✅ Form validation messages
✅ Card error messages from Stripe
✅ Payment failure messages
✅ Booking creation failure handling

---

## 🔐 Security

### Payment Security

✅ **PCI Compliance**: Card details never touch your server (Stripe Elements)
✅ **HTTPS Only**: All payment requests over HTTPS
✅ **JWT Authentication**: Checkout requires valid user session
✅ **CSRF Protection**: Angular CSRF tokens

### Data Protection

✅ **Encrypted transmission**: All data encrypted in transit
✅ **Secure storage**: Passwords hashed, sensitive data encrypted
✅ **Token expiration**: JWT tokens expire after set time

---

## 🛠️ Configuration

### 1. Stripe Setup

#### Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → API Keys
3. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

#### Update Environment

**File**: `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9080',
  stripePublicKey: 'pk_test_YOUR_KEY_HERE', // ← Update this
  endpoints: {
    // ...
  }
};
```

**For Production** (`environment.prod.ts`):
```typescript
stripePublicKey: 'pk_live_YOUR_LIVE_KEY_HERE'
```

### 2. Backend Configuration

Ensure payment service is running with correct Stripe secret key.

**File**: `services/payment-service/src/main/resources/application.yml`

```yaml
stripe:
  api:
    key: ${STRIPE_API_KEY:sk_test_YOUR_SECRET_KEY}
  success:
    url: ${STRIPE_SUCCESS_URL:http://localhost:4200/payment/success}
  cancel:
    url: ${STRIPE_CANCEL_URL:http://localhost:4200/payment/cancel}
```

### 3. CORS Configuration

Ensure gateway allows frontend origin:

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: "http://localhost:4200"
            allowedMethods: "*"
            allowedHeaders: "*"
            allowCredentials: true
```

---

## 🧪 Testing

### Test Cards (Stripe)

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | 3D Secure required |

**Use any future expiry date and any 3-digit CVC.**

### Test Flow

1. **Start Backend**:
   ```bash
   ./run-all.sh
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Navigate**: `http://localhost:4200`

4. **Login** as traveler

5. **Browse travels**: Click on a travel

6. **Click "Book Now"**

7. **Fill form**:
   - Number of travelers: 2
   - Passenger details (optional)
   - Cardholder name: "Test User"
   - Card: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVC: 123

8. **Submit**

9. **Verify**:
   - Payment processing
   - Redirect to success page
   - Booking details displayed
   - Check database: payment has bookingId

---

## 🐛 Troubleshooting

### Issue: "Stripe failed to initialize"

**Cause**: Invalid or missing Stripe public key

**Solution**:
1. Check `environment.ts` has correct key
2. Ensure key starts with `pk_test_` or `pk_live_`
3. Verify key is from correct Stripe account

---

### Issue: "Payment completed but booking creation failed"

**Cause**: Travel service unavailable or travel is full

**Solution**:
1. Check travel service is running
2. Check travel has available spots
3. View payment in database - should have failureReason
4. User will see pending page with support contact info
5. Admin can manually create booking or refund

---

### Issue: Card element not showing

**Cause**: DOM not ready when Stripe mounts

**Solution**: Already handled in code with `setTimeout`. If still occurs:
```typescript
ngAfterViewInit() {
  this.cardElement?.mount('#card-element');
}
```

---

### Issue: CORS errors

**Cause**: API gateway not allowing frontend origin

**Solution**: Update gateway CORS configuration (see Configuration section)

---

### Issue: 401 Unauthorized on checkout

**Cause**: User not logged in or token expired

**Solution**:
1. Ensure user is logged in
2. Check JWT token is being sent
3. Verify authGuard is working
4. Check token expiration

---

## 📊 Monitoring

### Key Metrics to Track

1. **Checkout Abandonment**: Users who start but don't complete
2. **Payment Success Rate**: Completed / Attempted
3. **Average Time to Complete**: From checkout load to confirmation
4. **Error Rate**: Failed payments / Total attempts

### Logging

Frontend logs to console:
```typescript
console.log('Checkout initiated:', { travelId, amount });
console.log('Payment confirmed:', { paymentId, bookingId });
```

Backend logs:
```
INFO  - Initiating payment-first checkout for user 1 and travel 5
INFO  - Payment confirmed successfully. Creating subscription for payment 42
INFO  - Successfully created subscription 123 for payment 42
```

---

## ✅ Checklist for Going Live

- [ ] Update `stripePublicKey` to live key (`pk_live_...`)
- [ ] Update backend with live Stripe secret key
- [ ] Test with real card (small amount)
- [ ] Verify email notifications work
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure proper success/cancel URLs
- [ ] Enable HTTPS on frontend
- [ ] Test from mobile devices
- [ ] Review PCI compliance requirements
- [ ] Set up webhook endpoints (Stripe)
- [ ] Configure refund policy in Terms & Conditions

---

## 🎉 Summary

The frontend checkout flow provides a complete, secure, payment-first booking experience:

✅ **Seamless UX**: Single page checkout
✅ **Secure Payments**: PCI-compliant Stripe integration
✅ **Payment Guarantee**: Booking only after payment succeeds
✅ **Error Handling**: Graceful handling of all edge cases
✅ **Mobile Responsive**: Works on all devices
✅ **Real-time Validation**: Instant feedback
✅ **Professional UI**: Clean, modern design

**Users can now smoothly book travels with confidence that payment is confirmed before their booking is finalized!** 🚀
