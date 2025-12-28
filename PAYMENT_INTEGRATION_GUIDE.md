# Complete Payment Integration Guide

## ✅ Backend Changes Completed

### 1. Payment Method Storage
- **Created `SavedPaymentMethod` entity** - Stores user's saved cards
- **Created `SavedPaymentMethodRepository`** - Database operations
- **Created `PaymentMethodService`** - Business logic for managing saved cards
- **Created `PaymentMethodController`** - REST endpoints:
  - `POST /api/v1/payment-methods` - Save a payment method
  - `GET /api/v1/payment-methods/user/{userId}` - Get all saved methods
  - `GET /api/v1/payment-methods/user/{userId}/default` - Get default method
  - `DELETE /api/v1/payment-methods/user/{userId}/{methodId}` - Delete method
  - `PUT /api/v1/payment-methods/user/{userId}/{methodId}/default` - Set as default

### 2. Updated Payment Processing
- **Updated `CreatePaymentRequest`** - Added fields:
  - `savedPaymentMethodId` - Use existing saved card
  - `savePaymentMethod` - Save this card for future
  - `cardholderName` - For saving the card

- **Updated `PaymentService.processStripePayment()`** - Now supports 3 flows:
  1. **Saved Card**: Uses saved payment method → immediate payment with Payment Intent
  2. **New Card (save)**: Processes with Stripe Elements → saves card → immediate payment
  3. **New Card (don't save)**: Redirects to Checkout Session

### 3. Added Stripe Payment Intent Method
- **Created `createPaymentIntentWithPaymentMethod()`** in StripeService
- Automatically confirms payment with provided payment method
- Returns client secret for 3D Secure if needed

## 🔄 Correct Payment Flow

### Old (Broken) Flow:
```
1. User fills form
2. Create subscription (ACTIVE) ❌ Booking created before payment!
3. Show payment modal
4. Redirect to Stripe
5. If cancelled → Subscription still exists ❌
```

### New (Correct) Flow:
```
1. User fills booking form (NO subscription created yet)
2. Show payment modal with:
   - List of saved payment methods
   - Option to add new card (Stripe Elements)
   - Option to save new card
3. Process payment FIRST ✅
4. If payment succeeds → Create subscription
5. If payment fails → Nothing created ✅
```

## 📝 Frontend Implementation Needed

### Step 1: Add Stripe Publishable Key to Environment

**File: `/frontend/src/environments/environment.ts`**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9090/api/v1',
  stripePublishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY' // Add this
};
```

### Step 2: Create Payment Method Models

**File: `/frontend/src/app/core/models/payment-method.model.ts`**
```typescript
export interface SavedPaymentMethod {
  id: number;
  userId: number;
  type: 'STRIPE' | 'PAYPAL';
  last4: string;
  brand: string;
  expMonth: string;
  expYear: string;
  cardholderName: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface SavePaymentMethodRequest {
  userId: number;
  type: 'STRIPE' | 'PAYPAL';
  stripePaymentMethodId: string;
  cardholderName: string;
  setAsDefault: boolean;
}
```

### Step 3: Create Payment Method Service

**File: `/frontend/src/app/core/services/payment-method.service.ts`**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SavedPaymentMethod, SavePaymentMethodRequest } from '../models/payment-method.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private baseUrl = `${environment.apiUrl}/payment-methods`;

  constructor(private http: HttpClient) {}

  savePaymentMethod(request: SavePaymentMethodRequest): Observable<SavedPaymentMethod> {
    return this.http.post<SavedPaymentMethod>(this.baseUrl, request);
  }

  getUserPaymentMethods(userId: number): Observable<SavedPaymentMethod[]> {
    return this.http.get<SavedPaymentMethod[]>(`${this.baseUrl}/user/${userId}`);
  }

  getDefaultPaymentMethod(userId: number): Observable<SavedPaymentMethod> {
    return this.http.get<SavedPaymentMethod>(`${this.baseUrl}/user/${userId}/default`);
  }

  deletePaymentMethod(userId: number, methodId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/${userId}/${methodId}`);
  }

  setDefaultPaymentMethod(userId: number, methodId: number): Observable<SavedPaymentMethod> {
    return this.http.put<SavedPaymentMethod>(`${this.baseUrl}/user/${userId}/${methodId}/default`, null);
  }
}
```

### Step 4: Update ProcessPaymentRequest Interface

**File: `/frontend/src/app/core/models/payment.model.ts`**
Add these fields to `ProcessPaymentRequest`:
```typescript
export interface ProcessPaymentRequest {
  userId: number;
  bookingId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  currency?: string;

  // For Stripe Elements
  stripePaymentMethodId?: string; // From Stripe.js

  // For saved cards
  savedPaymentMethodId?: number;

  // Option to save
  savePaymentMethod?: boolean;
  cardholderName?: string;

  // Legacy
  stripeToken?: string;
  paypalOrderId?: string;
}
```

### Step 5: Key Booking Flow Change

**CRITICAL**: The booking modal should:
1. ❌ **DON'T** create subscription immediately
2. ✅ **DO** collect booking details
3. ✅ **DO** open payment modal with booking details
4. ✅ **DO** process payment first
5. ✅ **DO** create subscription ONLY after payment succeeds

This requires updating `/frontend/src/app/shared/components/booking-modal` to:
- Remove immediate subscription creation
- Pass booking data to payment modal
- Create subscription after payment confirmation

## 🚀 Quick Start

1. **Add Stripe key to environment files**
2. **Create the new model and service files above**
3. **I'll help you integrate Stripe Elements in the payment modal**
4. **Update the booking flow to payment-first approach**

## 💡 Benefits of This Approach

✅ Payment collected BEFORE booking creation
✅ No orphaned bookings if payment fails
✅ Users can save cards for future bookings
✅ Faster checkout for returning users
✅ Full PCI compliance (Stripe handles card data)
✅ Supports 3D Secure automatically

## 📋 Next Steps

Let me know when you've:
1. Added the Stripe publishable key to environments
2. Created the payment-method model and service files

Then I'll help you:
1. Integrate Stripe Elements in the payment modal
2. Update the booking flow to process payment first
3. Add UI for selecting saved payment methods
