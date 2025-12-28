import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { BillingAddress } from '../../../core/models/payment.model';

/**
 * Stripe Card Form Component
 *
 * This component provides a form for collecting card payment information
 * using Stripe Elements. In a production environment, this would integrate
 * with Stripe.js for PCI-compliant card input.
 *
 * To use Stripe Elements:
 * 1. Load Stripe.js in index.html: <script src="https://js.stripe.com/v3/"></script>
 * 2. Initialize Stripe with your publishable key
 * 3. Mount Card Element to the #card-element div
 * 4. Handle tokenization and 3D Secure
 */
@Component({
  selector: 'app-stripe-card-form',
  templateUrl: './stripe-card-form.component.html',
  styleUrls: ['./stripe-card-form.component.scss']
})
export class StripeCardFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() amount: number = 0;
  @Input() currency: string = 'USD';
  @Input() clientSecret?: string;

  @Output() paymentMethodCreated = new EventEmitter<string>();
  @Output() paymentCompleted = new EventEmitter<any>();
  @Output() paymentFailed = new EventEmitter<string>();

  cardForm!: FormGroup;
  isProcessing = false;
  cardElementMounted = false;

  // Stripe.js instances (to be initialized)
  stripe: any = null;
  cardElement: any = null;

  countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'BE', name: 'Belgium' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'IE', name: 'Ireland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'GR', name: 'Greece' },
    { code: 'PL', name: 'Poland' }
  ];

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadStripe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Cleanup Stripe elements
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  initializeForm(): void {
    this.cardForm = this.fb.group({
      cardholderName: ['', [Validators.required, Validators.minLength(3)]],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}(-[0-9]{4})?$/)]],
      country: ['US', Validators.required],
      saveCard: [false]
    });
  }

  loadStripe(): void {
    // Check if Stripe.js is loaded
    if (typeof (window as any).Stripe === 'undefined') {
      console.error('Stripe.js not loaded. Please add Stripe.js to your index.html');
      this.notificationService.showError('Payment system not initialized');
      return;
    }

    try {
      // Initialize Stripe (replace with your actual publishable key from environment)
      const stripePublishableKey = 'pk_test_YOUR_KEY_HERE'; // Should come from environment
      this.stripe = (window as any).Stripe(stripePublishableKey);

      // Create and mount card element
      this.mountCardElement();
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      this.notificationService.showError('Failed to initialize payment system');
    }
  }

  mountCardElement(): void {
    if (!this.stripe) return;

    const elements = this.stripe.elements();

    // Create card element with custom styling
    this.cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424242',
          '::placeholder': {
            color: '#aab7c4'
          },
          fontFamily: 'Roboto, "Helvetica Neue", sans-serif'
        },
        invalid: {
          color: '#f44336',
          iconColor: '#f44336'
        }
      },
      hidePostalCode: true // We're collecting it in the form
    });

    // Mount to DOM
    setTimeout(() => {
      const cardElementContainer = document.getElementById('card-element');
      if (cardElementContainer) {
        this.cardElement.mount('#card-element');
        this.cardElementMounted = true;

        // Listen for card element changes
        this.cardElement.on('change', (event: any) => {
          if (event.error) {
            this.notificationService.showError(event.error.message);
          }
        });
      }
    }, 100);
  }

  async handleSubmit(): Promise<void> {
    if (!this.cardForm.valid) {
      this.notificationService.showWarning('Please fill in all required fields');
      return;
    }

    if (!this.stripe || !this.cardElement) {
      this.notificationService.showError('Payment system not ready');
      return;
    }

    this.isProcessing = true;

    try {
      const billingDetails = this.getBillingDetails();

      if (this.clientSecret) {
        // Confirm payment with existing payment intent
        await this.confirmPayment(billingDetails);
      } else {
        // Create payment method for later use
        await this.createPaymentMethod(billingDetails);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      this.notificationService.showError(error.message || 'Payment failed');
      this.paymentFailed.emit(error.message);
      this.isProcessing = false;
    }
  }

  private async createPaymentMethod(billingDetails: any): Promise<void> {
    const { error, paymentMethod } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: this.cardElement,
      billing_details: billingDetails
    });

    this.isProcessing = false;

    if (error) {
      throw new Error(error.message);
    }

    if (paymentMethod) {
      this.paymentMethodCreated.emit(paymentMethod.id);
      this.notificationService.showSuccess('Payment method created');
    }
  }

  private async confirmPayment(billingDetails: any): Promise<void> {
    const { error, paymentIntent } = await this.stripe.confirmCardPayment(
      this.clientSecret,
      {
        payment_method: {
          card: this.cardElement,
          billing_details: billingDetails
        }
      }
    );

    this.isProcessing = false;

    if (error) {
      throw new Error(error.message);
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      this.paymentCompleted.emit(paymentIntent);
      this.notificationService.showSuccess('Payment successful!');
    } else if (paymentIntent && paymentIntent.status === 'requires_action') {
      // 3D Secure authentication required
      await this.handle3DSecure(paymentIntent);
    }
  }

  private async handle3DSecure(paymentIntent: any): Promise<void> {
    this.notificationService.showInfo('Additional authentication required');

    const { error: confirmError, paymentIntent: confirmedIntent } =
      await this.stripe.confirmCardPayment(paymentIntent.client_secret);

    if (confirmError) {
      throw new Error(confirmError.message);
    }

    if (confirmedIntent && confirmedIntent.status === 'succeeded') {
      this.paymentCompleted.emit(confirmedIntent);
      this.notificationService.showSuccess('Payment successful!');
    }
  }

  private getBillingDetails(): any {
    const formValue = this.cardForm.value;

    return {
      name: formValue.cardholderName,
      address: {
        line1: formValue.addressLine1,
        line2: formValue.addressLine2 || undefined,
        city: formValue.city,
        state: formValue.state,
        postal_code: formValue.postalCode,
        country: formValue.country
      }
    };
  }

  formatAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }

  reset(): void {
    this.cardForm.reset({ country: 'US', saveCard: false });
    if (this.cardElement) {
      this.cardElement.clear();
    }
  }
}
