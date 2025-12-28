import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentMethod, ProcessPaymentRequest } from '../../../core/models/payment.model';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../alert/alert.component';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" (click)="close()"></div>

        <!-- Modal panel -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 transform transition-all">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-2xl font-heading font-bold text-gray-900">Complete Payment</h3>
                  <p class="text-sm text-gray-600 mt-1">Secure payment processing</p>
                </div>
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

            <!-- Booking Summary -->
            <div class="p-6 bg-gray-50 rounded-xl mb-8 border border-gray-200">
              <h4 class="font-semibold text-gray-900 mb-4">Booking Summary</h4>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Travel:</span>
                  <span class="font-medium text-gray-900">{{ bookingTitle }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Participants:</span>
                  <span class="font-medium text-gray-900">{{ participants }}</span>
                </div>
                <div class="flex justify-between text-lg pt-3 border-t border-gray-300">
                  <span class="font-semibold text-gray-900">Total Amount:</span>
                  <span class="font-bold text-primary-600">\${{ amount.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- Payment Method Selection -->
            <div class="mb-8">
              <h4 class="font-semibold text-gray-900 mb-4">Select Payment Method</h4>
              <div class="grid grid-cols-2 gap-4">
                <!-- Stripe Option -->
                <button
                  (click)="selectedMethod.set(PaymentMethod.STRIPE)"
                  [class]="getPaymentMethodClasses(PaymentMethod.STRIPE)"
                  type="button"
                >
                  <div class="flex flex-col items-center space-y-3 py-6">
                    <svg class="w-16 h-16" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" rx="4" [attr.fill]="selectedMethod() === PaymentMethod.STRIPE ? '#635BFF' : '#E0E7FF'"/>
                      <path d="M9.5 10.5L12 8L14.5 10.5M12 8V16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="font-semibold text-gray-900">Credit/Debit Card</span>
                    <span class="text-xs text-gray-500">Powered by Stripe</span>
                  </div>
                </button>

                <!-- PayPal Option -->
                <button
                  (click)="selectedMethod.set(PaymentMethod.PAYPAL)"
                  [class]="getPaymentMethodClasses(PaymentMethod.PAYPAL)"
                  type="button"
                >
                  <div class="flex flex-col items-center space-y-3 py-6">
                    <svg class="w-16 h-16" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" rx="4" [attr.fill]="selectedMethod() === PaymentMethod.PAYPAL ? '#0070BA' : '#E0E7FF'"/>
                      <path d="M7 9H17V13L14 17H10L7 13V9Z" fill="white"/>
                    </svg>
                    <span class="font-semibold text-gray-900">PayPal</span>
                    <span class="text-xs text-gray-500">Secure checkout</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Payment Info (Stripe) -->
            @if (selectedMethod() === PaymentMethod.STRIPE) {
              <div class="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <div class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-blue-900 mb-1">Secure Card Payment</p>
                    <p class="text-xs text-blue-700">
                      Your payment information is encrypted and processed securely by Stripe.
                      We never store your card details.
                    </p>
                  </div>
                </div>
              </div>
            }

            <!-- Payment Info (PayPal) -->
            @if (selectedMethod() === PaymentMethod.PAYPAL) {
              <div class="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <div class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-blue-900 mb-1">PayPal Checkout</p>
                    <p class="text-xs text-blue-700">
                      You'll be redirected to PayPal to complete your payment securely.
                      No card details are shared with us.
                    </p>
                  </div>
                </div>
              </div>
            }

            <!-- Actions -->
            <div class="flex justify-end space-x-4">
              <button
                type="button"
                (click)="close()"
                class="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                [disabled]="processing()"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="processPayment()"
                class="px-8 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                [disabled]="!selectedMethod() || processing()"
              >
                @if (processing()) {
                  <span class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                } @else {
                  Pay \${{ amount.toFixed(2) }}
                }
              </button>
            </div>

            <!-- Security Notice -->
            <div class="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span>Secured with 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class PaymentModalComponent {
  @Input() bookingId!: string | number;
  @Input() bookingTitle: string = 'Travel Booking';
  @Input() amount!: number;
  @Input() participants: number = 1;
  @Input() currency: string = 'USD';
  @Output() paymentCompleted = new EventEmitter<void>();
  @Output() paymentCancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);
  processing = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  selectedMethod = signal<PaymentMethod | null>(null);

  PaymentMethod = PaymentMethod;

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

  open(): void {
    this.isOpen.set(true);
    this.selectedMethod.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  close(): void {
    if (!this.processing()) {
      this.isOpen.set(false);
      this.closed.emit();
      // Emit cancellation if there was a payment in progress
      if (this.selectedMethod()) {
        this.paymentCancelled.emit();
      }
    }
  }

  getPaymentMethodClasses(method: PaymentMethod): string {
    const base = 'w-full border-2 rounded-xl transition-all hover:shadow-lg';
    const selected = 'border-primary-600 bg-primary-50 ring-2 ring-primary-200';
    const unselected = 'border-gray-200 hover:border-primary-300';

    return `${base} ${this.selectedMethod() === method ? selected : unselected}`;
  }

  processPayment(): void {
    if (!this.selectedMethod()) {
      this.errorMessage.set('Please select a payment method');
      return;
    }

    this.processing.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.errorMessage.set('User not authenticated');
      this.processing.set(false);
      return;
    }

    const request: ProcessPaymentRequest = {
      userId: +currentUser.id,
      bookingId: typeof this.bookingId === 'string' ? parseInt(this.bookingId) : this.bookingId,
      amount: this.amount,
      paymentMethod: this.selectedMethod()!,
      currency: this.currency || 'USD'
    };

    this.paymentService.processPayment(request).subscribe({
      next: (payment) => {
        this.processing.set(false);

        // Handle Stripe payment with Checkout Session
        if (this.selectedMethod() === PaymentMethod.STRIPE && payment.checkoutUrl) {
          this.successMessage.set('Redirecting to Stripe checkout...');

          // Redirect to Stripe Checkout page
          setTimeout(() => {
            window.location.href = payment.checkoutUrl!;
          }, 500);
          return;
        }

        // Handle PayPal payment
        if (this.selectedMethod() === PaymentMethod.PAYPAL && payment.approvalUrl) {
          this.successMessage.set('Redirecting to PayPal...');

          // Redirect to PayPal approval page
          setTimeout(() => {
            window.location.href = payment.approvalUrl!;
          }, 500);
          return;
        }

        // For other payment methods or if no redirect needed
        this.successMessage.set('Payment processed successfully!');
        setTimeout(() => {
          this.paymentCompleted.emit();
          this.close();
        }, 2000);
      },
      error: (error) => {
        this.processing.set(false);
        this.errorMessage.set(
          error.error?.message || 'Payment processing failed. Please try again.'
        );
      }
    });
  }
}
