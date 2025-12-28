import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { TravelService, TravelSuggestions } from '../../../core/services/travel.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { TravelSuggestionsModalComponent } from '../../../shared/components/travel-suggestions-modal/travel-suggestions-modal.component';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent, TravelSuggestionsModalComponent],
  template: `
    <app-loading *ngIf="loading()"></app-loading>

    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="max-w-md w-full">
        @if (!loading()) {
          <!-- Success State -->
          @if (paymentConfirmed()) {
            <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
              <!-- Success Icon -->
              <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <h1 class="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
              <p class="text-gray-600 mb-8">
                Your payment has been processed successfully. Your booking is now confirmed.
              </p>

              <!-- Payment Details -->
              <div class="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 class="font-semibold text-gray-900 mb-4">Payment Details</h3>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Transaction ID:</span>
                    <span class="font-mono text-gray-900">{{ payment()?.transactionId }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Amount:</span>
                    <span class="font-semibold text-gray-900">\${{ payment()?.amount }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Status:</span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="space-y-3">
                <button
                  routerLink="/traveler/subscriptions"
                  class="w-full btn-primary"
                >
                  View My Bookings
                </button>
                <button
                  routerLink="/traveler/home"
                  class="w-full btn-outline"
                >
                  Browse More Travels
                </button>
              </div>
            </div>
          }

          <!-- Error State -->
          @if (error()) {
            <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
              <!-- Error Icon -->
              <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>

              <h1 class="text-3xl font-bold text-gray-900 mb-3">Payment Verification Failed</h1>
              <p class="text-gray-600 mb-8">
                {{ error() }}
              </p>

              <button
                routerLink="/traveler/home"
                class="w-full btn-primary"
              >
                Return to Home
              </button>
            </div>
          }
        }
      </div>
    </div>

    <!-- Travel Suggestions Modal -->
    <app-travel-suggestions-modal
      #suggestionsModal
      [suggestions]="suggestions() || { similar: [], trending: [], personalized: [] }"
    ></app-travel-suggestions-modal>
  `
})
export class PaymentSuccessComponent implements OnInit {
  @ViewChild('suggestionsModal') suggestionsModal!: TravelSuggestionsModalComponent;

  loading = signal(true);
  paymentConfirmed = signal(false);
  error = signal<string | null>(null);
  payment = signal<any>(null);
  suggestions = signal<TravelSuggestions | null>(null);
  travelId = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private travelService: TravelService
  ) {}

  ngOnInit(): void {
    // Capture travelId from query params for suggestions
    const travelIdParam = this.route.snapshot.queryParamMap.get('travelId');
    if (travelIdParam) {
      this.travelId.set(travelIdParam);
    }

    // Get payment parameters from query params
    const sessionId = this.route.snapshot.queryParamMap.get('session_id'); // Stripe Checkout Session
    const paymentIntentId = this.route.snapshot.queryParamMap.get('payment_intent'); // Stripe Payment Intent (legacy)
    const paymentId = this.route.snapshot.queryParamMap.get('paymentId'); // PayPal
    const payerId = this.route.snapshot.queryParamMap.get('PayerID'); // PayPal

    if (sessionId) {
      // Stripe Checkout Session confirmation (new flow)
      this.confirmStripePayment(sessionId);
    } else if (paymentIntentId) {
      // Stripe Payment Intent confirmation (legacy flow)
      this.confirmStripePayment(paymentIntentId);
    } else if (paymentId && payerId) {
      // PayPal payment confirmation
      this.confirmPayPalPayment(paymentId, payerId);
    } else {
      this.error.set('Invalid payment parameters');
      this.loading.set(false);
    }
  }

  confirmStripePayment(sessionIdOrPaymentIntentId: string): void {
    this.paymentService.confirmStripePayment(sessionIdOrPaymentIntentId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.paymentConfirmed.set(true);
        this.loading.set(false);
        // Load travel suggestions after successful payment
        this.loadSuggestions();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to confirm payment');
        this.loading.set(false);
      }
    });
  }

  confirmPayPalPayment(paymentId: string, payerId: string): void {
    this.paymentService.confirmPayPalPayment(paymentId, payerId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.paymentConfirmed.set(true);
        this.loading.set(false);
        // Load travel suggestions after successful payment
        this.loadSuggestions();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to confirm payment');
        this.loading.set(false);
      }
    });
  }

  loadSuggestions(): void {
    const travelId = this.travelId();
    if (!travelId) return;

    this.travelService.getTravelSuggestions(travelId).subscribe({
      next: (suggestions) => {
        this.suggestions.set(suggestions);
        // Auto-open modal after 1 second
        setTimeout(() => {
          if (this.suggestionsModal) {
            this.suggestionsModal.open();
          }
        }, 1000);
      },
      error: (error) => {
        console.error('Failed to load suggestions:', error);
        // Fail silently - not critical to user flow
      }
    });
  }
}
