import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  StripePaymentRequest,
  PayPalOrderRequest
} from '../../../core/models/payment.model';

export interface PaymentDetails {
  bookingId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: any;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  displayName: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-payment-create',
  templateUrl: './payment-create.component.html',
  styleUrls: ['./payment-create.component.scss']
})
export class PaymentCreateComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  paymentForm!: FormGroup;
  paymentDetails: PaymentDetails | null = null;

  isLoading = false;
  isProcessing = false;

  selectedPaymentMethod: 'saved' | 'new_card' | 'paypal' = 'new_card';
  savedPaymentMethods: SavedPaymentMethod[] = [];
  selectedSavedMethod: SavedPaymentMethod | null = null;

  // Stripe
  stripeClientSecret: string | null = null;
  stripePaymentCompleted = false;

  // PayPal
  paypalOrderId: string | null = null;
  paypalApprovalUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPaymentDetails();
    this.loadSavedPaymentMethods();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.paymentForm = this.fb.group({
      paymentMethod: ['new_card', Validators.required],
      savedMethodId: [''],
      savePaymentMethod: [false],
      billingName: ['', Validators.required],
      billingEmail: ['', [Validators.required, Validators.email]],
      billingAddress: this.fb.group({
        line1: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['US']
      })
    });

    // Watch for payment method changes
    this.paymentForm.get('paymentMethod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(method => {
        this.selectedPaymentMethod = method;
        this.updateFormValidators();
      });
  }

  updateFormValidators(): void {
    const savedMethodControl = this.paymentForm.get('savedMethodId');

    if (this.selectedPaymentMethod === 'saved') {
      savedMethodControl?.setValidators([Validators.required]);
    } else {
      savedMethodControl?.clearValidators();
    }

    savedMethodControl?.updateValueAndValidity();
  }

  loadPaymentDetails(): void {
    // Get payment details from route query params or state
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.paymentDetails = {
          bookingId: params['bookingId'],
          orderId: params['orderId'],
          amount: parseFloat(params['amount']) || 0,
          currency: params['currency'] || 'USD',
          description: params['description'] || 'Travel Booking Payment',
          metadata: {}
        };

        // If no payment details, redirect back
        if (!this.paymentDetails.amount || this.paymentDetails.amount <= 0) {
          this.notificationService.showError('Invalid payment details');
          this.router.navigate(['/bookings']);
        }
      });
  }

  loadSavedPaymentMethods(): void {
    // Mock data - replace with actual API call
    this.savedPaymentMethods = [
      {
        id: '1',
        type: 'card',
        displayName: 'Visa ending in 4242',
        last4: '4242',
        brand: 'Visa',
        isDefault: true
      },
      {
        id: '2',
        type: 'paypal',
        displayName: 'PayPal (user@example.com)',
        isDefault: false
      }
    ];

    // Pre-select default payment method if exists
    const defaultMethod = this.savedPaymentMethods.find(m => m.isDefault);
    if (defaultMethod) {
      this.selectedSavedMethod = defaultMethod;
      this.paymentForm.patchValue({
        paymentMethod: 'saved',
        savedMethodId: defaultMethod.id
      });
    }
  }

  onPaymentMethodChange(method: 'saved' | 'new_card' | 'paypal'): void {
    this.selectedPaymentMethod = method;
    this.paymentForm.patchValue({ paymentMethod: method });
  }

  onSavedMethodSelect(method: SavedPaymentMethod): void {
    this.selectedSavedMethod = method;
    this.paymentForm.patchValue({ savedMethodId: method.id });
  }

  async processPayment(): Promise<void> {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.notificationService.showError('Please complete all required fields');
      return;
    }

    if (!this.paymentDetails) {
      this.notificationService.showError('Payment details not found');
      return;
    }

    this.isProcessing = true;

    try {
      switch (this.selectedPaymentMethod) {
        case 'saved':
          await this.processSavedMethodPayment();
          break;
        case 'new_card':
          await this.processStripePayment();
          break;
        case 'paypal':
          await this.processPayPalPayment();
          break;
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      this.notificationService.showError('Payment processing failed');
      this.isProcessing = false;
    }
  }

  private async processSavedMethodPayment(): Promise<void> {
    // In real implementation, process payment with saved method
    this.notificationService.showInfo('Processing payment with saved method...');

    setTimeout(() => {
      this.isProcessing = false;
      this.navigateToConfirmation('payment-123', 'COMPLETED');
    }, 2000);
  }

  private async processStripePayment(): Promise<void> {
    if (!this.paymentDetails) return;

    // Create Stripe Payment Intent
    const request: StripePaymentRequest = {
      bookingId: this.paymentDetails.bookingId || '',
      amount: this.paymentDetails.amount,
      currency: this.paymentDetails.currency,
      returnUrl: `${window.location.origin}/payments/confirmation`
    };

    this.paymentService.createStripePaymentIntent(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing = false)
      )
      .subscribe({
        next: (result) => {
          if (result.success && result.clientSecret) {
            this.stripeClientSecret = result.clientSecret;
            // The stripe-card-form component will handle the rest
          } else {
            this.notificationService.showError(result.error || 'Failed to initialize payment');
          }
        },
        error: (error) => {
          console.error('Error creating payment intent:', error);
          this.notificationService.showError('Failed to initialize payment');
        }
      });
  }

  private async processPayPalPayment(): Promise<void> {
    if (!this.paymentDetails) return;

    // Create PayPal Order
    const request: PayPalOrderRequest = {
      bookingId: this.paymentDetails.bookingId || '',
      amount: this.paymentDetails.amount,
      currency: this.paymentDetails.currency,
      returnUrl: `${window.location.origin}/payments/confirmation`,
      cancelUrl: `${window.location.origin}/payments/create`
    };

    this.paymentService.createPayPalOrder(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing = false)
      )
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.paypalOrderId = result.paymentId || null;
            // The paypal-button component will handle the rest
          } else {
            this.notificationService.showError(result.error || 'Failed to initialize PayPal payment');
          }
        },
        error: (error) => {
          console.error('Error creating PayPal order:', error);
          this.notificationService.showError('Failed to initialize PayPal payment');
        }
      });
  }

  onStripePaymentCompleted(event: any): void {
    console.log('Stripe payment completed:', event);
    this.navigateToConfirmation(event.paymentId || 'unknown', 'COMPLETED');
  }

  onStripePaymentError(error: string): void {
    console.error('Stripe payment error:', error);
    this.notificationService.showError('Payment failed: ' + error);
    this.isProcessing = false;
  }

  onPayPalPaymentCompleted(event: any): void {
    console.log('PayPal payment completed:', event);
    this.navigateToConfirmation(event.orderId || 'unknown', 'COMPLETED');
  }

  onPayPalPaymentError(error: string): void {
    console.error('PayPal payment error:', error);
    this.notificationService.showError('Payment failed: ' + error);
    this.isProcessing = false;
  }

  onPayPalPaymentCancelled(): void {
    this.notificationService.showInfo('Payment cancelled');
    this.isProcessing = false;
  }

  navigateToConfirmation(paymentId: string, status: string): void {
    this.router.navigate(['/payments/confirmation'], {
      queryParams: {
        paymentId: paymentId,
        status: status,
        bookingId: this.paymentDetails?.bookingId
      }
    });
  }

  cancel(): void {
    if (this.paymentDetails?.bookingId) {
      this.router.navigate(['/bookings', this.paymentDetails.bookingId]);
    } else {
      this.router.navigate(['/bookings']);
    }
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getPaymentMethodIcon(type: string): string {
    switch (type) {
      case 'card':
        return 'credit_card';
      case 'paypal':
        return 'account_balance_wallet';
      default:
        return 'payment';
    }
  }
}
