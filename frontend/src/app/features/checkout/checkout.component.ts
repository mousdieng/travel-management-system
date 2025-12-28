import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../core/services/payment.service';
import { TravelService } from '../../core/services/travel.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoadingService } from '../../core/services/loading.service';
import { environment } from '../../../environments/environment';
import { CheckoutRequest, PaymentMethod, PassengerDetail } from '../../core/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  travel: any;
  subscription: any;
  travelId!: number;
  subscriptionId: string | null = null;
  checkoutForm!: FormGroup;

  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;

  isProcessing = false;
  showPassengerForm = false;
  totalAmount = 0;
  currentUser: any;

  PaymentMethod = PaymentMethod;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private travelService: TravelService,
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {}

  async ngOnInit() {
    // Check for subscriptionId in query params (subscribe-first flow)
    this.subscriptionId = this.route.snapshot.queryParamMap.get('subscriptionId');

    if (this.subscriptionId) {
      // Load existing subscription
      this.loadSubscription();
    } else {
      // Legacy flow: Get travel ID from route params
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        this.travelId = +params['id'];
        this.loadTravel();
      });
    }

    // Get current user
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });

    // Initialize form
    this.initForm();

    // Initialize Stripe
    await this.initStripe();

    // Check if PayPal is already selected and render buttons
    setTimeout(() => {
      if (this.checkoutForm.get('paymentMethod')?.value === PaymentMethod.PAYPAL) {
        this.renderPayPalButtons();
      }
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up Stripe elements
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  initForm() {
    this.checkoutForm = this.fb.group({
      numberOfParticipants: [1, [Validators.required, Validators.min(1)]],
      passengers: this.fb.array([]),
      paymentMethod: [PaymentMethod.STRIPE, Validators.required],
      cardholderName: ['', Validators.required],
      savePaymentMethod: [false],
      termsAccepted: [false, Validators.requiredTrue]
    });

    // Listen to participant number changes
    this.checkoutForm.get('numberOfParticipants')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.updatePassengersForm(count);
        this.calculateTotal();
      });

    // Listen to payment method changes
    this.checkoutForm.get('paymentMethod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(paymentMethod => {
        // Cardholder name only required for Stripe
        const cardholderNameControl = this.checkoutForm.get('cardholderName');
        if (paymentMethod === PaymentMethod.STRIPE) {
          cardholderNameControl?.setValidators([Validators.required]);
        } else {
          cardholderNameControl?.clearValidators();
        }
        cardholderNameControl?.updateValueAndValidity();

        // Render PayPal buttons when PayPal is selected
        if (paymentMethod === PaymentMethod.PAYPAL) {
          setTimeout(() => this.renderPayPalButtons(), 100);
        }
      });
  }

  get passengers(): FormArray {
    return this.checkoutForm.get('passengers') as FormArray;
  }

  updatePassengersForm(count: number) {
    const passengers = this.passengers;

    // Clear existing
    while (passengers.length > 0) {
      passengers.removeAt(0);
    }

    // Add new passenger forms
    for (let i = 0; i < count; i++) {
      passengers.push(this.createPassengerForm());
    }

    this.showPassengerForm = count > 0;
  }

  createPassengerForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      passportNumber: [''],
      phoneNumber: [''],
      email: ['', [Validators.email]]
    });
  }

  async initStripe() {
    try {
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (!this.stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Create Stripe Elements
      this.elements = this.stripe.elements();

      // Create card element with styling
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

      // Mount card element to DOM after view init
      setTimeout(() => {
        const cardElementContainer = document.getElementById('card-element');
        if (cardElementContainer && this.cardElement) {
          this.cardElement.mount('#card-element');
        }
      }, 100);

    } catch (error) {
      console.error('Stripe initialization failed:', error);
      this.notificationService.showError('Failed to initialize payment system');
    }
  }

  loadTravel() {
    this.loadingService.show();
    this.travelService.getTravelById(this.travelId.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (travel) => {
          this.travel = travel;
          this.calculateTotal();
          this.loadingService.hide();
        },
        error: (error) => {
          this.notificationService.showError('Failed to load travel details');
          this.loadingService.hide();
          this.router.navigate(['/travels']);
        }
      });
  }

  loadSubscription() {
    if (!this.subscriptionId) return;

    this.loadingService.show();
    this.subscriptionService.getSubscriptionById(this.subscriptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subscription) => {
          this.subscription = subscription;
          this.travelId = Number(subscription.travelId);

          // Load travel details for the subscription
          this.travelService.getTravelById(this.travelId.toString())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (travel) => {
                this.travel = travel;

                // Pre-fill form with subscription data
                this.checkoutForm.patchValue({
                  numberOfParticipants: subscription.numberOfParticipants
                });

                this.totalAmount = subscription.totalAmount;
                this.loadingService.hide();
              },
              error: (error) => {
                this.notificationService.showError('Failed to load travel details');
                this.loadingService.hide();
              }
            });
        },
        error: (error) => {
          this.notificationService.showError('Failed to load subscription');
          this.loadingService.hide();
          this.router.navigate(['/traveler/subscriptions']);
        }
      });
  }

  calculateTotal() {
    if (this.travel && this.checkoutForm) {
      const participants = this.checkoutForm.get('numberOfParticipants')?.value || 1;
      this.totalAmount = this.travel.price * participants;
    }
  }

  async onSubmit() {
    if (this.checkoutForm.invalid) {
      this.notificationService.showError('Please fill in all required fields');
      return;
    }

    const selectedPaymentMethod = this.checkoutForm.get('paymentMethod')?.value;

    // Handle PayPal payment separately - PayPal Smart Buttons handle this
    if (selectedPaymentMethod === PaymentMethod.PAYPAL) {
      this.notificationService.showInfo('Please use the PayPal buttons below to complete payment');
      return;
    }

    // Handle Stripe payment
    if (!this.stripe || !this.cardElement) {
      this.notificationService.showError('Payment system not initialized');
      return;
    }

    this.isProcessing = true;
    this.loadingService.show();

    try {
      // Step 1: Create payment method with Stripe
      const { paymentMethod, error: stripeError } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
        billing_details: {
          name: this.checkoutForm.get('cardholderName')?.value
        }
      });

      if (stripeError || !paymentMethod) {
        throw new Error(stripeError?.message || 'Failed to create payment method');
      }

      // Step 2: Prepare checkout request
      const checkoutRequest: CheckoutRequest = {
        userId: this.currentUser.id,
        travelId: this.travelId,
        subscriptionId: this.subscriptionId ? Number(this.subscriptionId) : undefined, // Convert to number for backend
        numberOfParticipants: this.checkoutForm.get('numberOfParticipants')?.value,
        passengerDetails: this.subscriptionId ? [] : this.getPassengerDetails(), // Skip passenger details if subscription already exists
        amount: this.totalAmount,
        paymentMethod: this.checkoutForm.get('paymentMethod')?.value,
        currency: 'USD',
        stripePaymentMethodId: paymentMethod.id,
        savePaymentMethod: this.checkoutForm.get('savePaymentMethod')?.value,
        cardholderName: this.checkoutForm.get('cardholderName')?.value
      };

      // Step 3: Initiate checkout
      this.paymentService.initiateCheckout(checkoutRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (payment) => {
            // Step 4: Handle payment response
            if (payment.checkoutUrl) {
              // Redirect to Stripe Checkout
              window.location.href = payment.checkoutUrl;
            } else if (payment.clientSecret && this.stripe) {
              // Confirm payment with Payment Intent
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
            this.notificationService.showError(error.error?.message || 'Checkout failed');
            this.isProcessing = false;
            this.loadingService.hide();
          }
        });

    } catch (error: any) {
      this.notificationService.showError(error.message || 'Payment processing failed');
      this.isProcessing = false;
      this.loadingService.hide();
    }
  }

  confirmPayment(paymentIntentId: string) {
    this.paymentService.confirmStripePayment(paymentIntentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payment) => {
          this.isProcessing = false;
          this.loadingService.hide();

          if (payment.status === 'COMPLETED' && payment.bookingId) {
            // Success! Redirect to confirmation page
            this.notificationService.showSuccess('Payment successful! Your booking is confirmed.');
            this.router.navigate(['/payment/success'], {
              queryParams: {
                paymentId: payment.id,
                bookingId: payment.bookingId,
                travelId: this.travelId
              }
            });
          } else {
            // Payment succeeded but booking creation failed
            this.notificationService.showWarning(
              'Payment completed but booking creation is pending. Please contact support.'
            );
            this.router.navigate(['/payment/pending'], {
              queryParams: { paymentId: payment.id }
            });
          }
        },
        error: (error) => {
          this.notificationService.showError('Failed to confirm payment');
          this.isProcessing = false;
          this.loadingService.hide();
        }
      });
  }

  processPayPalPayment() {
    this.isProcessing = true;
    this.loadingService.show();

    // Prepare checkout request for PayPal
    const checkoutRequest: CheckoutRequest = {
      userId: this.currentUser.id,
      travelId: this.travelId,
      subscriptionId: this.subscriptionId ? Number(this.subscriptionId) : undefined, // Convert to number for backend
      numberOfParticipants: this.checkoutForm.get('numberOfParticipants')?.value,
      passengerDetails: this.subscriptionId ? [] : this.getPassengerDetails(), // Skip passenger details if subscription already exists
      amount: this.totalAmount,
      paymentMethod: PaymentMethod.PAYPAL,
      currency: 'USD'
    };

    // Initiate PayPal checkout
    this.paymentService.initiateCheckout(checkoutRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payment) => {
          this.isProcessing = false;
          this.loadingService.hide();

          // Redirect to PayPal approval URL
          if (payment.checkoutUrl) {
            this.notificationService.showInfo('Redirecting to PayPal...');
            window.location.href = payment.checkoutUrl;
          } else {
            this.notificationService.showError('Failed to create PayPal payment');
          }
        },
        error: (error) => {
          this.notificationService.showError(error.error?.message || 'Failed to initiate PayPal payment');
          this.isProcessing = false;
          this.loadingService.hide();
        }
      });
  }

  getPassengerDetails(): PassengerDetail[] {
    return this.passengers.controls.map(control => {
      const dateOfBirth = control.get('dateOfBirth')?.value;
      return {
        firstName: control.get('firstName')?.value,
        lastName: control.get('lastName')?.value,
        dateOfBirth: dateOfBirth instanceof Date
          ? dateOfBirth.toISOString().split('T')[0]  // Convert Date to YYYY-MM-DD string
          : dateOfBirth,  // Already a string
        passportNumber: control.get('passportNumber')?.value,
        phoneNumber: control.get('phoneNumber')?.value,
        email: control.get('email')?.value
      };
    });
  }

  togglePassengerForm() {
    this.showPassengerForm = !this.showPassengerForm;
  }

  renderPayPalButtons() {
    const container = document.getElementById('paypal-button-container');
    if (!container) {
      console.error('PayPal button container not found');
      return;
    }

    // Clear existing buttons
    container.innerHTML = '';

    // Check if paypal is available
    if (typeof (window as any).paypal === 'undefined') {
      console.error('PayPal SDK not loaded. Please refresh the page.');
      container.innerHTML = '<p style="color: red;">PayPal is loading... Please refresh the page if this persists.</p>';
      return;
    }

    console.log('Rendering PayPal buttons...');

    // Render PayPal buttons
    (window as any).paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      },

      // Create order on backend
      createOrder: async () => {
        if (this.checkoutForm.invalid) {
          this.notificationService.showError('Please fill in all required fields');
          throw new Error('Form invalid');
        }

        try {
          const checkoutRequest: CheckoutRequest = {
            userId: this.currentUser.id,
            travelId: this.travelId,
            numberOfParticipants: this.checkoutForm.get('numberOfParticipants')?.value,
            passengerDetails: this.getPassengerDetails(),
            amount: this.totalAmount,
            paymentMethod: PaymentMethod.PAYPAL,
            currency: 'USD'
          };

          this.loadingService.show();
          const payment = await this.paymentService.initiateCheckout(checkoutRequest).toPromise();
          this.loadingService.hide();

          if (!payment || !payment.externalTransactionId) {
            throw new Error('Failed to create PayPal order');
          }

          return payment.externalTransactionId; // Return PayPal order ID
        } catch (error: any) {
          this.loadingService.hide();
          this.notificationService.showError(error.error?.message || 'Failed to create order');
          throw error;
        }
      },

      // Capture payment after approval
      onApprove: async (data: any) => {
        try {
          this.loadingService.show();

          // Confirm payment with backend
          const payment = await this.paymentService.confirmPayPalPayment(
            data.orderID,
            data.payerID
          ).toPromise();

          this.loadingService.hide();

          if (!payment) {
            throw new Error('Payment confirmation failed');
          }

          if (payment.status === 'COMPLETED' && payment.bookingId) {
            this.notificationService.showSuccess('Payment successful! Your booking is confirmed.');
            this.router.navigate(['/payment/success'], {
              queryParams: {
                paymentId: payment.id,
                bookingId: payment.bookingId,
                travelId: this.travelId
              }
            });
          } else {
            this.notificationService.showWarning(
              'Payment completed but booking creation is pending. Please contact support.'
            );
            this.router.navigate(['/payment/pending'], {
              queryParams: { paymentId: payment.id }
            });
          }
        } catch (error: any) {
          this.loadingService.hide();
          this.notificationService.showError(error.error?.message || 'Payment confirmation failed');
        }
      },

      // Handle cancellation
      onCancel: () => {
        this.notificationService.showInfo('Payment cancelled');
      },

      // Handle errors
      onError: (err: any) => {
        console.error('PayPal error:', err);
        this.notificationService.showError('Payment failed. Please try again.');
      }
    }).render('#paypal-button-container');
  }
}
