# PayPal Setup Instructions - School Project

## ✅ What I Fixed

Your PayPal integration was showing in the dropdown but not actually processing payments. Here's what I fixed:

### 1. Added PayPal Client ID to Environment
**File:** `frontend/src/environments/environment.ts` (Line 9)
```typescript
paypalClientId: 'YOUR_PAYPAL_CLIENT_ID'
```

### 2. Updated PayPal Button Component
**File:** `frontend/src/app/features/payment/paypal-button/paypal-button.component.ts`
- Line 5: Added environment import
- Line 68: Changed from hardcoded `'YOUR_PAYPAL_CLIENT_ID'` to `environment.paypalClientId`

### 3. Fixed Checkout Component to Handle PayPal
**File:** `frontend/src/app/features/checkout/checkout.component.ts`
- Lines 203-209: Added payment method check (Stripe vs PayPal)
- Lines 317-354: Added `processPayPalPayment()` method
- Lines 98-110: Made cardholder name optional for PayPal

---

## 🚀 How to Set Up PayPal (5 Minutes)

### Step 1: Get PayPal Sandbox Credentials

1. Go to https://developer.paypal.com/dashboard
2. Log in (or create account)
3. Click "Apps & Credentials"
4. Click "Sandbox" tab
5. Under "REST API apps", you'll see "Default Application"
6. Copy the **Client ID** (starts with `A...`)
7. Click "Show" under **Secret** and copy it

### Step 2: Update Frontend Configuration

Edit: `frontend/src/environments/environment.ts`

```typescript
paypalClientId: 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUAtJ3TqB7dKlQ7P'
```

Replace with YOUR actual client ID from Step 1.

### Step 3: Update Backend Configuration

Edit: `services/payment-service/src/main/resources/application.yml`

Or set environment variables:
```bash
export PAYPAL_CLIENT_ID="your-client-id-here"
export PAYPAL_CLIENT_SECRET="your-secret-here"
export PAYPAL_MODE="sandbox"
```

### Step 4: Restart Services

```bash
# Stop services
docker-compose down

# Start services
docker-compose up

# Or just restart payment service
docker-compose restart payment-service

# And restart frontend
cd frontend
npm start
```

---

## 🧪 How to Test PayPal Payment

### 1. Create PayPal Test Account

1. Go to https://developer.paypal.com/dashboard/accounts
2. Click "Create Account"
3. Select "Personal (Buyer Account)"
4. Set Country: Your country
5. Click "Create"
6. Note the email and password shown

Example test account:
```
Email: sb-test47xyz@personal.example.com
Password: TestPassword123
```

### 2. Test the Payment Flow

1. Start your application
2. Browse to a travel
3. Click "Book Now"
4. Select **PayPal** from payment method dropdown
5. Fill in traveler details
6. Accept terms
7. Click "Pay $XXX"
8. You should be redirected to PayPal
9. Log in with your **test account** (from Step 1)
10. Click "Pay Now"
11. You'll be redirected back to your app
12. Payment should be completed!

---

## 📝 Payment Flow Diagram

```
User selects PayPal → Frontend calls backend → Backend creates PayPal order
     ↓
Backend returns PayPal approval URL
     ↓
User redirected to PayPal.com
     ↓
User logs in with test account
     ↓
User approves payment
     ↓
PayPal redirects back to your app
     ↓
Backend confirms payment with PayPal
     ↓
Subscription created → Payment marked COMPLETED
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "PayPal is not defined"
**Cause:** Client ID not configured
**Fix:** Add your client ID to `environment.ts` (see Step 2)

### Issue 2: "Failed to load PayPal SDK"
**Cause:** Invalid client ID
**Fix:** Double-check you copied the correct Client ID from PayPal dashboard

### Issue 3: Payment stays in PROCESSING
**Cause:** PayPal webhook not configured or backend not confirming
**Solution:** For school project, you can manually confirm via API or ignore (it's a demo)

### Issue 4: Redirect URL error from PayPal
**Cause:** Return URLs not configured in PayPal app
**Fix:** In PayPal dashboard → Your App → Add return URL: `http://localhost:4200/payment/success`

### Issue 5: "CORS error" when redirecting
**Cause:** Frontend and backend on different domains
**Fix:** Make sure your backend CORS configuration allows your frontend URL

---

## 🎓 For Your Presentation

### What to Show:
1. ✅ Payment method selection (Stripe vs PayPal)
2. ✅ PayPal redirect flow
3. ✅ PayPal sandbox login
4. ✅ Payment approval
5. ✅ Successful redirect back
6. ✅ Booking confirmation
7. ✅ Payment history showing completed payment

### What to Mention:
- "Using PayPal Sandbox for testing"
- "Real production would require webhook verification"
- "Payment-first architecture ensures no free bookings"
- "System tracks payment status from creation to completion"

### Technical Highlights:
- ✅ Third-party payment integration (PayPal REST API)
- ✅ OAuth2 redirect flow implementation
- ✅ Payment state management across services
- ✅ Microservices architecture (separate payment service)
- ✅ Frontend/backend coordination for payment flows

---

## 🔒 Security Note (For Academic Context)

For your school project, you don't need:
- ❌ Webhook signature verification (production only)
- ❌ PCI compliance (using PayPal hosted)
- ❌ Rate limiting (not expecting high traffic)
- ❌ Payment reconciliation (demo purposes)

These are important for production but overkill for a school demo.

---

## 📊 Test Scenarios for Demo

### Scenario 1: Successful Payment
```
1. Select travel: Paris Adventure - $1000
2. Select 2 travelers
3. Fill passenger details
4. Select PayPal
5. Pay with test account
6. Show booking confirmation
```

### Scenario 2: Payment Cancellation
```
1. Start checkout
2. Select PayPal
3. Redirect to PayPal
4. Click "Cancel and return to merchant"
5. Show user returned to booking page
```

### Scenario 3: View Payment History
```
1. Go to "My Subscriptions"
2. Show PayPal payment status
3. Show payment details
4. Show booking is active
```

---

## 🎉 You're All Set!

After following these steps:
1. ✅ PayPal will appear in payment dropdown
2. ✅ Clicking "Pay" will redirect to PayPal
3. ✅ Payment will process correctly
4. ✅ Booking will be created after payment
5. ✅ Payment history will show the transaction

**Total setup time:** ~5 minutes
**Difficulty:** Easy

Good luck with your project presentation! 🚀

---

## 🆘 Still Having Issues?

Check these files to ensure changes were applied:

1. `frontend/src/environments/environment.ts` - Line 9 has your PayPal Client ID
2. `frontend/src/app/features/payment/paypal-button/paypal-button.component.ts` - Line 68 uses environment.paypalClientId
3. `frontend/src/app/features/checkout/checkout.component.ts` - Lines 206-208 check for PayPal payment method
4. Backend environment variables are set (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)

If everything is configured but still not working, check browser console for errors - it will tell you exactly what's wrong!
