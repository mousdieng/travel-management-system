import { Component, EventEmitter, Input, Output, signal, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PaymentService } from '../../../core/services/payment.service';
import { CreateSubscriptionRequest, Subscription, PaymentMethod, CheckoutRequest } from '../../../core/models';
import { AlertComponent } from '../alert/alert.component';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent, PaymentModalComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" (click)="close()"></div>

        <!-- Modal panel -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 transform transition-all">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-2xl font-heading font-bold text-gray-900">Complete Your Booking</h3>
                <p class="text-sm text-gray-600 mt-1">{{ travelTitle }}</p>
              </div>
              <button (click)="close()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Alert Messages -->
            <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error" class="mb-6"></app-alert>
            <app-alert *ngIf="successMessage()" [message]="successMessage()!" type="success" class="mb-6"></app-alert>

            <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
              <!-- Number of Participants -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Number of Participants</label>
                <input
                  type="number"
                  formControlName="numberOfParticipants"
                  (change)="updatePassengerForms()"
                  min="1"
                  [max]="maxAvailableSpots"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                <p class="text-sm text-gray-500 mt-1">Maximum {{ maxAvailableSpots }} spots available</p>
              </div>

              <!-- Passenger Details -->
              <div formArrayName="passengerDetails" class="space-y-6 mb-6">
                <h4 class="font-semibold text-gray-900">Passenger Details</h4>
                @for (passenger of passengerDetails.controls; track i; let i = $index) {
                  <div [formGroupName]="i" class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h5 class="font-medium text-gray-900 mb-4">Passenger {{ i + 1 }}</h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          formControlName="firstName"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="John"
                        >
                        @if (passenger.get('firstName')?.invalid && passenger.get('firstName')?.touched) {
                          <p class="text-red-600 text-xs mt-1">First name is required</p>
                        }
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          formControlName="lastName"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Doe"
                        >
                        @if (passenger.get('lastName')?.invalid && passenger.get('lastName')?.touched) {
                          <p class="text-red-600 text-xs mt-1">Last name is required</p>
                        }
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          formControlName="dateOfBirth"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                        @if (passenger.get('dateOfBirth')?.invalid && passenger.get('dateOfBirth')?.touched) {
                          <p class="text-red-600 text-xs mt-1">Date of birth is required</p>
                        }
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Passport Number (Optional)</label>
                        <input
                          type="text"
                          formControlName="passportNumber"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="AB123456"
                        >
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Payment Details -->
              <div class="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h4 class="font-semibold text-gray-900 mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  Payment Information
                </h4>

                <!-- Payment Method Selection -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <select
                    formControlName="paymentMethod"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option [value]="PaymentMethod.STRIPE">Credit/Debit Card (Stripe)</option>
                    <option [value]="PaymentMethod.PAYPAL">PayPal</option>
                  </select>
                </div>

                <!-- Stripe Card Element -->
                @if (bookingForm.get('paymentMethod')?.value === PaymentMethod.STRIPE) {
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Cardholder Name *</label>
                      <input
                        type="text"
                        formControlName="cardholderName"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="John Doe"
                      >
                      @if (bookingForm.get('cardholderName')?.invalid && bookingForm.get('cardholderName')?.touched) {
                        <p class="text-red-600 text-xs mt-1">Cardholder name is required</p>
                      }
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Card Information *</label>
                      <div
                        id="booking-card-element"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white"
                      ></div>
                      <p class="text-xs text-gray-500 mt-2 flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                        </svg>
                        Powered by Stripe - Secure Payment
                      </p>
                    </div>

                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        formControlName="savePaymentMethod"
                        id="savePaymentMethod"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      >
                      <label for="savePaymentMethod" class="ml-2 block text-sm text-gray-700">
                        Save this card for future purchases
                      </label>
                    </div>
                  </div>
                }

                <!-- PayPal Notice -->
                @if (bookingForm.get('paymentMethod')?.value === PaymentMethod.PAYPAL) {
                  <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-sm text-yellow-800 flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                      </svg>
                      You will be redirected to PayPal to complete your payment.
                    </p>
                  </div>
                }
              </div>

              <!-- Price Summary -->
              <div class="p-6 bg-primary-50 rounded-xl mb-8 border border-primary-200">
                <div class="flex justify-between items-center">
                  <div>
                    <p class="text-sm text-gray-600">Total Amount</p>
                    <p class="text-xs text-gray-500 mt-1">{{ bookingForm.value.numberOfParticipants }} × \${{ pricePerPerson.toFixed(2) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-bold text-primary-600">\${{ getTotalAmount().toFixed(2) }}</p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end space-x-4">
                <button
                  type="button"
                  (click)="close()"
                  class="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  [disabled]="submitting()"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-8 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                  [disabled]="bookingForm.invalid || submitting()"
                >
                  @if (submitting()) {
                    <span class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Payment...
                    </span>
                  } @else {
                    <span class="flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Complete Booking & Pay \${{ getTotalAmount().toFixed(2) }}
                    </span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Payment Modal -->
    <app-payment-modal
      #paymentModal
      [bookingId]="createdSubscriptionId()"
      [bookingTitle]="travelTitle"
      [amount]="getTotalAmount()"
      [participants]="bookingForm.value.numberOfParticipants || 1"
      [currency]="'USD'"
      (paymentCompleted)="onPaymentCompleted()"
      (paymentCancelled)="onPaymentCancelled()"
    />
  `
})
export class BookingModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() travelId!: string;
  @Input() travelTitle!: string;
  @Input() pricePerPerson!: number;
  @Input() maxAvailableSpots!: number;
  @Output() bookingCreated = new EventEmitter<Subscription>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('paymentModal') paymentModal!: PaymentModalComponent;

  isOpen = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  createdSubscriptionId = signal<number>(0);
  bookingForm: FormGroup;

  // Stripe integration
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;
  stripeInitialized = signal(false);

  // Payment method enum for template
  PaymentMethod = PaymentMethod;

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService,
    private router: Router
  ) {
    this.bookingForm = this.fb.group({
      numberOfParticipants: [1, [Validators.required, Validators.min(1)]],
      passengerDetails: this.fb.array([]),
      paymentMethod: [PaymentMethod.STRIPE, Validators.required],
      cardholderName: ['', Validators.required],
      savePaymentMethod: [false]
    });

    // Listen to payment method changes to update validation
    this.bookingForm.get('paymentMethod')?.valueChanges.subscribe(paymentMethod => {
      const cardholderNameControl = this.bookingForm.get('cardholderName');
      if (paymentMethod === PaymentMethod.STRIPE) {
        cardholderNameControl?.setValidators([Validators.required]);
      } else {
        // PayPal doesn't need cardholder name
        cardholderNameControl?.clearValidators();
      }
      cardholderNameControl?.updateValueAndValidity();
    });
  }

  async ngOnInit() {
    await this.initStripe();
  }

  ngAfterViewInit() {
    // Modal is not rendered yet, mounting happens in open()
  }

  ngOnDestroy() {
    // Clean up Stripe elements
    this.unmountCardElement();
  }

  async initStripe() {
    try {
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (!this.stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Create Stripe Elements
      this.elements = this.stripe.elements();

      this.stripeInitialized.set(true);
      console.log('Stripe initialized successfully');
    } catch (error) {
      console.error('Stripe initialization failed:', error);
      this.errorMessage.set('Failed to initialize payment system');
    }
  }

  createCardElement() {
    if (!this.elements) {
      console.error('Stripe elements not initialized');
      return;
    }

    // Clean up existing card element if any
    if (this.cardElement) {
      try {
        this.cardElement.unmount();
        this.cardElement.destroy();
      } catch (e) {
        console.warn('Error cleaning up existing card element:', e);
      }
    }

    // Create new card element with styling
    const style = {
      base: {
        fontSize: '16px',
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };

    this.cardElement = this.elements.create('card', { style });
    console.log('Card element created');
  }

  mountStripeCardElement() {
    if (!this.stripeInitialized()) {
      console.warn('Stripe not initialized yet');
      return;
    }

    // Create card element if not exists
    if (!this.cardElement) {
      this.createCardElement();
    }

    // Use longer timeout to ensure DOM is ready
    setTimeout(() => {
      const cardElementContainer = document.getElementById('booking-card-element');

      if (!cardElementContainer) {
        console.error('Card element container not found in DOM');
        return;
      }

      if (!this.cardElement) {
        console.error('Card element not created');
        return;
      }

      try {
        // Clear container first
        cardElementContainer.innerHTML = '';

        // Mount the card element
        this.cardElement.mount('#booking-card-element');
        console.log('Stripe card element mounted successfully');
      } catch (error) {
        console.error('Error mounting Stripe card element:', error);
        this.errorMessage.set('Failed to load payment form. Please refresh and try again.');
      }
    }, 300);
  }

  unmountCardElement() {
    if (this.cardElement) {
      try {
        this.cardElement.unmount();
        this.cardElement.destroy();
        this.cardElement = null;
      } catch (e) {
        console.warn('Error unmounting card element:', e);
      }
    }
  }

  get passengerDetails(): FormArray {
    return this.bookingForm.get('passengerDetails') as FormArray;
  }

  open(): void {
    this.isOpen.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.bookingForm.patchValue({ numberOfParticipants: 1 });
    this.updatePassengerForms();

    // Mount Stripe card element when modal opens
    if (this.stripeInitialized()) {
      this.mountStripeCardElement();
    }
  }

  close(): void {
    if (!this.submitting()) {
      this.unmountCardElement();
      this.isOpen.set(false);
      this.closed.emit();
    }
  }

  updatePassengerForms(): void {
    const numberOfParticipants = this.bookingForm.value.numberOfParticipants || 1;
    const currentLength = this.passengerDetails.length;

    if (numberOfParticipants > currentLength) {
      for (let i = currentLength; i < numberOfParticipants; i++) {
        this.passengerDetails.push(this.createPassengerFormGroup());
      }
    } else if (numberOfParticipants < currentLength) {
      for (let i = currentLength - 1; i >= numberOfParticipants; i--) {
        this.passengerDetails.removeAt(i);
      }
    }
  }

  createPassengerFormGroup(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      passportNumber: ['']
    });
  }

  getTotalAmount(): number {
    const participants = this.bookingForm.value.numberOfParticipants || 1;
    return participants * this.pricePerPerson;
  }

  async onSubmit(): Promise<void> {
    if (this.bookingForm.invalid) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }

    const selectedPaymentMethod = this.bookingForm.get('paymentMethod')?.value;

    // Handle PayPal payment separately
    if (selectedPaymentMethod === PaymentMethod.PAYPAL) {
      this.processPayPalPayment();
      return;
    }

    // Handle Stripe payment
    if (!this.stripe || !this.cardElement) {
      this.errorMessage.set('Payment system not initialized');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      // Step 1: Create payment method with Stripe
      const { paymentMethod, error: stripeError } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
        billing_details: {
          name: this.bookingForm.get('cardholderName')?.value
        }
      });

      if (stripeError || !paymentMethod) {
        throw new Error(stripeError?.message || 'Failed to create payment method');
      }

      // Step 2: Prepare checkout request with booking and payment details
      const checkoutRequest: CheckoutRequest = {
        userId: 0, // Will be set by backend from JWT token
        travelId: parseInt(this.travelId),
        numberOfParticipants: this.bookingForm.get('numberOfParticipants')?.value,
        passengerDetails: this.bookingForm.get('passengerDetails')?.value,
        amount: this.getTotalAmount(),
        paymentMethod: this.bookingForm.get('paymentMethod')?.value,
        currency: 'USD',
        stripePaymentMethodId: paymentMethod.id,
        savePaymentMethod: this.bookingForm.get('savePaymentMethod')?.value,
        cardholderName: this.bookingForm.get('cardholderName')?.value
      };

      // Step 3: Initiate checkout (creates payment and processes it)
      this.paymentService.initiateCheckout(checkoutRequest).subscribe({
        next: async (payment) => {
          // Step 4: Handle payment response
          console.log('Payment response:', payment);
          console.log('Payment status:', payment.status);

          if (payment.status === 'COMPLETED') {
            // Payment succeeded immediately (card payment was auto-confirmed)
            console.log('Payment completed immediately');
            this.submitting.set(false);

            // Show detailed success message with booking information
            this.successMessage.set(`
              ✅ Booking Confirmed!

              Payment of $${payment.amount} has been processed successfully.
              Booking ID: #${payment.bookingId}
              Transaction ID: ${payment.transactionId}

              A confirmation email has been sent to your email address.
            `);

            // Emit the booking created event
            if (payment.bookingId) {
              this.bookingCreated.emit({
                id: payment.bookingId,
                travelId: this.travelId,
                numberOfParticipants: this.bookingForm.get('numberOfParticipants')?.value
              } as any);
            }

            // Close modal and refresh after showing message
            setTimeout(() => {
              this.close();
              window.location.reload(); // Refresh to show updated bookings
            }, 4000);
          } else if (payment.checkoutUrl) {
            // Redirect to Stripe Checkout Session
            window.location.href = payment.checkoutUrl;
          } else if (payment.clientSecret && this.stripe) {
            // Confirm payment with Payment Intent (requires user action)
            const { error } = await this.stripe.confirmCardPayment(payment.clientSecret);

            if (error) {
              throw new Error(error.message);
            }

            // Payment succeeded, confirm with backend
            this.confirmPayment(payment.paymentIntentId || '');
          } else {
            throw new Error('Invalid payment response');
          }
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to create booking. Please try again.');
        }
      });
    } catch (error: any) {
      this.submitting.set(false);
      this.errorMessage.set(error.message || 'Payment processing failed');
    }
  }

  processPayPalPayment(): void {
    this.submitting.set(true);
    this.errorMessage.set(null);

    // Prepare checkout request for PayPal
    const checkoutRequest: CheckoutRequest = {
      userId: 0, // Will be set by backend from JWT token
      travelId: parseInt(this.travelId),
      numberOfParticipants: this.bookingForm.get('numberOfParticipants')?.value,
      passengerDetails: this.bookingForm.get('passengerDetails')?.value,
      amount: this.getTotalAmount(),
      paymentMethod: PaymentMethod.PAYPAL,
      currency: 'USD'
    };

    // Initiate PayPal checkout
    this.paymentService.initiateCheckout(checkoutRequest).subscribe({
      next: (payment) => {
        this.submitting.set(false);

        // Redirect to PayPal approval URL
        if (payment.checkoutUrl) {
          window.location.href = payment.checkoutUrl;
        } else {
          this.errorMessage.set('Failed to create PayPal payment');
        }
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to initiate PayPal payment');
      }
    });
  }

  confirmPayment(paymentIntentId: string): void {
    this.paymentService.confirmStripePayment(paymentIntentId).subscribe({
      next: (payment) => {
        this.submitting.set(false);

        if (payment.status === 'COMPLETED' && payment.bookingId) {
          // Success! Navigate to success page
          this.close();
          this.router.navigate(['/payment/success'], {
            queryParams: { paymentId: payment.id, bookingId: payment.bookingId }
          });
        } else {
          // Payment succeeded but booking creation failed
          this.errorMessage.set('Payment completed but booking creation is pending. Please contact support.');
        }
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set('Failed to confirm payment');
      }
    });
  }

  onPaymentCompleted(): void {
    // Payment completed successfully, emit booking created event
    this.bookingCreated.emit();
    this.resetForm();
  }

  onPaymentCancelled(): void {
    // Payment was cancelled, user can retry or cancel booking
    this.errorMessage.set('Payment was cancelled. Please try again or contact support.');
    this.isOpen.set(true);
  }

  private resetForm(): void {
    this.bookingForm.reset({ numberOfParticipants: 1 });
    this.passengerDetails.clear();
    this.createdSubscriptionId.set(0);
  }
}
