import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { Subscription, SubscriptionStatus } from '../../../core/models/subscription.model';
import { PaymentMethod } from '../../../core/models/payment.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingComponent, ErrorMessageComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">My Subscriptions</h1>

      @if (loading()) {
        <app-loading />
      } @else if (subscriptions().length > 0) {
        <div class="space-y-6">
          @for (subscription of subscriptions(); track subscription.id) {
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <div class="p-6">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ subscription.travelTitle }}</h3>

                    <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span class="flex items-center">
                        <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {{ formatDate(subscription.createdAt) }}
                      </span>
                      <span [class]="getStatusClass(subscription.status)" class="px-2 py-1 rounded text-xs font-medium">
                        {{ subscription.status }}
                      </span>
                    </div>

                    @if (subscription.status === SubscriptionStatus.CANCELLED && subscription.cancelledAt) {
                      <p class="text-sm text-red-600">Cancelled on {{ formatDate(subscription.cancelledAt) }}</p>
                    }
                  </div>

                  <div class="flex flex-col space-y-2">
                    <a
                      [routerLink]="['/travels', subscription.travelId]"
                      class="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      View Travel
                    </a>

                    @if (subscription.status === SubscriptionStatus.ACTIVE) {
                      @if (subscription.canBeCancelled) {
                        <button
                          (click)="cancelSubscription(subscription.id)"
                          [disabled]="cancelling().has(subscription.id)"
                          class="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                        >
                          {{ cancelling().has(subscription.id) ? 'Cancelling...' : 'Cancel' }}
                        </button>
                      } @else {
                        <span class="text-gray-400 text-sm">Cannot cancel (< 3 days)</span>
                      }

                      <button
                        (click)="showPaymentModal(subscription)"
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        Make Payment
                      </button>
                    }
                  </div>
                </div>

                @if (errorMessage()) {
                  <app-error-message [message]="errorMessage()!" />
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No subscriptions</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by browsing available travels.</p>
          <div class="mt-6">
            <a
              routerLink="/travels"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Travels
            </a>
          </div>
        </div>
      }
    </div>

    <!-- Payment Modal -->
    @if (showPayment()) {
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Make Payment</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              [(ngModel)]="selectedPaymentMethod"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option [value]="PaymentMethod.CREDIT_CARD">Credit Card</option>
              <option [value]="PaymentMethod.DEBIT_CARD">Debit Card</option>
              <option [value]="PaymentMethod.PAYPAL">PayPal</option>
              <option [value]="PaymentMethod.BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          @if (paymentError()) {
            <app-error-message [message]="paymentError()!" />
          }

          <div class="flex space-x-3">
            <button
              (click)="processPayment()"
              [disabled]="processing()"
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              {{ processing() ? 'Processing...' : 'Pay Now' }}
            </button>
            <button
              (click)="closePaymentModal()"
              [disabled]="processing()"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class SubscriptionListComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private paymentService = inject(PaymentService);
  private confirmDialog = inject(ConfirmDialogService);

  subscriptions = signal<Subscription[]>([]);
  loading = signal(true);
  cancelling = signal(new Set<number>());
  errorMessage = signal<string | null>(null);

  showPayment = signal(false);
  selectedSubscription = signal<Subscription | null>(null);
  selectedPaymentMethod = PaymentMethod.CREDIT_CARD;
  processing = signal(false);
  paymentError = signal<string | null>(null);

  SubscriptionStatus = SubscriptionStatus;
  PaymentMethod = PaymentMethod;

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.subscriptionService.getMySubscriptions().subscribe({
      next: (subscriptions) => {
        this.subscriptions.set(subscriptions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  cancelSubscription(id: number): void {
    this.cancelling.update(set => new Set(set).add(id));
    this.errorMessage.set(null);

    this.subscriptionService.cancelSubscription(id).subscribe({
      next: () => {
        this.loadSubscriptions();
        this.cancelling.update(set => {
          const newSet = new Set(set);
          newSet.delete(id);
          return newSet;
        });
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to cancel subscription');
        this.cancelling.update(set => {
          const newSet = new Set(set);
          newSet.delete(id);
          return newSet;
        });
      }
    });
  }

  showPaymentModal(subscription: Subscription): void {
    this.selectedSubscription.set(subscription);
    this.showPayment.set(true);
    this.paymentError.set(null);
  }

  closePaymentModal(): void {
    this.showPayment.set(false);
    this.selectedSubscription.set(null);
    this.paymentError.set(null);
  }

  processPayment(): void {
    const subscription = this.selectedSubscription();
    if (!subscription) return;

    this.processing.set(true);
    this.paymentError.set(null);

    this.paymentService.createPayment({
      subscriptionId: subscription.id,
      paymentMethod: this.selectedPaymentMethod
    }).subscribe({
      next: () => {
        this.processing.set(false);
        this.closePaymentModal();
        this.confirmDialog.info('Payment Successful', 'Your payment has been processed successfully!');
      },
      error: (error) => {
        this.processing.set(false);
        this.paymentError.set(error.error?.message || 'Payment failed');
      }
    });
  }

  getStatusClass(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case SubscriptionStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case SubscriptionStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
