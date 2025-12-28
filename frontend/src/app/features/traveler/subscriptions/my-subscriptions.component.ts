import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { Subscription, SubscriptionStatus } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-my-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">My Travel Subscriptions</h1>
          <p class="text-gray-600">Manage your booked travels and subscriptions</p>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        <!-- Cancellation Policy Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h3 class="font-semibold text-blue-900 mb-1">Cancellation Policy</h3>
            <p class="text-sm text-blue-800">
              You can cancel your subscription up to <strong>3 days before the travel start date</strong>.
              After this period, cancellations are not allowed for flexibility.
            </p>
          </div>
        </div>

        <app-loading *ngIf="loading()"></app-loading>

        <!-- Subscriptions Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" *ngIf="!loading() && subscriptions().length > 0">
          @for (subscription of subscriptions(); track subscription.id) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <!-- Status Banner -->
              <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between"
                   [ngClass]="{
                     'bg-green-50 border-green-200': subscription.status === 'ACTIVE' || subscription.status === 'CONFIRMED',
                     'bg-gray-50 border-gray-200': subscription.status === 'PENDING',
                     'bg-red-50 border-red-200': subscription.status === 'CANCELLED',
                     'bg-blue-50 border-blue-200': subscription.status === 'COMPLETED'
                   }">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      [ngClass]="{
                        'bg-green-100 text-green-800': subscription.status === 'ACTIVE' || subscription.status === 'CONFIRMED',
                        'bg-gray-100 text-gray-800': subscription.status === 'PENDING',
                        'bg-red-100 text-red-800': subscription.status === 'CANCELLED',
                        'bg-blue-100 text-blue-800': subscription.status === 'COMPLETED'
                      }">
                  {{ getStatusLabel(subscription.status) }}
                </span>
                @if (subscription.travelDestination) {
                  <span class="text-xs text-gray-600 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                    {{ subscription.travelDestination }}
                  </span>
                }
              </div>

              <!-- Content -->
              <div class="p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                  {{ subscription.travelTitle }}
                </h3>

                <!-- Travel Dates -->
                @if (subscription.travelStartDate) {
                  <div class="bg-gray-50 rounded-lg p-3 mb-4">
                    <div class="flex items-center justify-between text-sm mb-2">
                      <span class="text-gray-600 flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        Travel Dates
                      </span>
                    </div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ formatDate(subscription.travelStartDate) }}
                      @if (subscription.travelEndDate) {
                        <span class="text-gray-500 mx-1">→</span>
                        {{ formatDate(subscription.travelEndDate) }}
                      }
                    </div>
                  </div>
                }

                <!-- Cancellation Deadline (if active and has start date) -->
                @if ((subscription.status === 'ACTIVE' || subscription.status === 'CONFIRMED') && subscription.travelStartDate) {
                  <div class="mb-4">
                    @if (canCancel(subscription)) {
                      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div class="flex items-center gap-2 mb-1">
                          <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span class="text-xs font-semibold text-amber-900">Cancellation Deadline</span>
                        </div>
                        <div class="text-sm font-bold text-amber-900">
                          {{ getCancellationDeadline(subscription.travelStartDate) }}
                        </div>
                        <div class="text-xs text-amber-700 mt-1">
                          {{ getDaysUntilDeadline(subscription.travelStartDate) }} days remaining
                        </div>
                      </div>
                    } @else {
                      <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div class="flex items-center gap-2 mb-1">
                          <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                          </svg>
                          <span class="text-xs font-semibold text-red-900">Cancellation Not Available</span>
                        </div>
                        <p class="text-xs text-red-700">
                          Too close to travel start date (less than 3 days)
                        </p>
                      </div>
                    }
                  </div>
                }

                <!-- Details Grid -->
                <div class="space-y-2.5 mb-5">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                      Participants
                    </span>
                    <span class="font-semibold text-gray-900">{{ subscription.numberOfParticipants }}</span>
                  </div>

                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Total Amount
                    </span>
                    <span class="text-lg font-bold text-indigo-600">\${{ subscription.totalAmount }}</span>
                  </div>

                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                      Payment
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          [ngClass]="{
                            'bg-green-100 text-green-800': subscription.paymentStatus === 'PAID' || subscription.paymentStatus === 'COMPLETED',
                            'bg-yellow-100 text-yellow-800': subscription.paymentStatus === 'PENDING',
                            'bg-red-100 text-red-800': subscription.paymentStatus === 'FAILED'
                          }">
                      {{ subscription.paymentStatus || 'PENDING' }}
                    </span>
                  </div>

                  <div class="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                    <span class="text-gray-600 flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      Booked on
                    </span>
                    <span class="text-xs text-gray-500">{{ formatDate(subscription.subscribedAt) }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col gap-2">
                  <div class="flex gap-2">
                    <a [routerLink]="['/travels', subscription.travelId]"
                       class="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm text-center transition-colors">
                      View Travel
                    </a>

                    @if (subscription.status === 'ACTIVE' || subscription.status === 'CONFIRMED') {
                      @if (canCancel(subscription)) {
                        <button
                          (click)="confirmCancellation(subscription)"
                          [disabled]="cancelling()"
                          class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm transition-colors">
                          {{ cancelling() ? 'Cancelling...' : 'Cancel Booking' }}
                        </button>
                      } @else {
                        <button
                          disabled
                          class="flex-1 px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium text-sm"
                          title="Cannot cancel within 3 days of travel start date">
                          Cancel Not Available
                        </button>
                      }
                    }
                  </div>

                  <!-- Pay Now Button (shown if payment is pending) -->
                  @if (needsPayment(subscription)) {
                    <a [routerLink]="['/checkout']"
                       [queryParams]="{ subscriptionId: subscription.id }"
                       class="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold text-sm text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                      Pay Now - \${{ subscription.totalAmount }}
                    </a>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Empty State -->
        @if (!loading() && subscriptions().length === 0) {
          <div class="text-center py-16">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">No Subscriptions Yet</h3>
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't booked any travels yet. Start exploring and book your next adventure!
            </p>
            <a routerLink="/travels" class="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all">
              Explore Travels
            </a>
          </div>
        }

        <!-- Cancellation Confirmation Modal -->
        @if (subscriptionToCancel()) {
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="closeCancellationModal()">
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Cancel Subscription?</h3>
                  <p class="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div class="bg-gray-50 rounded-lg p-4 mb-5">
                <p class="text-sm text-gray-700 mb-2">You are about to cancel:</p>
                <p class="font-semibold text-gray-900 mb-1">{{ subscriptionToCancel()?.travelTitle }}</p>
                <p class="text-sm text-gray-600">
                  {{ subscriptionToCancel()?.numberOfParticipants }} participant(s) • \${{ subscriptionToCancel()?.totalAmount }}
                </p>
              </div>

              <div class="flex gap-3">
                <button
                  (click)="closeCancellationModal()"
                  [disabled]="cancelling()"
                  class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                  Keep Booking
                </button>
                <button
                  (click)="cancelSubscription()"
                  [disabled]="cancelling()"
                  class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 font-medium transition-colors">
                  {{ cancelling() ? 'Cancelling...' : 'Yes, Cancel' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class MySubscriptionsComponent implements OnInit {
  subscriptions = signal<Subscription[]>([]);
  loading = signal(false);
  cancelling = signal(false);
  subscriptionToCancel = signal<Subscription | null>(null);

  constructor(
    private subscriptionService: SubscriptionService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading.set(true);
    this.subscriptionService.getMySubscriptions().subscribe({
      next: (subscriptions) => {
        this.subscriptions.set(subscriptions);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading subscriptions:', error);
        this.loading.set(false);
      }
    });
  }

  canCancel(subscription: Subscription): boolean {
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'CONFIRMED') {
      return false;
    }

    if (!subscription.travelStartDate) {
      return false;
    }

    const startDate = new Date(subscription.travelStartDate);
    const cutoffDate = new Date(startDate);
    cutoffDate.setDate(cutoffDate.getDate() - 3);
    const now = new Date();

    return now < cutoffDate;
  }

  getDaysUntilDeadline(travelStartDate: string): number {
    const startDate = new Date(travelStartDate);
    const cutoffDate = new Date(startDate);
    cutoffDate.setDate(cutoffDate.getDate() - 3);
    const now = new Date();

    const diffTime = cutoffDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  getCancellationDeadline(travelStartDate: string): string {
    const startDate = new Date(travelStartDate);
    const cutoffDate = new Date(startDate);
    cutoffDate.setDate(cutoffDate.getDate() - 3);

    return this.formatDate(cutoffDate.toISOString());
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pending',
      'ACTIVE': 'Active',
      'CONFIRMED': 'Confirmed',
      'CANCELLED': 'Cancelled',
      'COMPLETED': 'Completed'
    };
    return labels[status] || status;
  }

  needsPayment(subscription: Subscription): boolean {
    // Show "Pay Now" button if subscription is active but payment is pending
    if (subscription.status === 'CANCELLED' || subscription.status === 'COMPLETED') {
      return false;
    }
    const paymentStatus = subscription.paymentStatus?.toUpperCase();
    return !paymentStatus || paymentStatus === 'PENDING' || paymentStatus === 'UNPAID';
  }

  confirmCancellation(subscription: Subscription): void {
    this.subscriptionToCancel.set(subscription);
  }

  closeCancellationModal(): void {
    if (!this.cancelling()) {
      this.subscriptionToCancel.set(null);
    }
  }

  cancelSubscription(): void {
    const subscription = this.subscriptionToCancel();
    if (!subscription) return;

    this.cancelling.set(true);
    this.subscriptionService.cancelSubscription(subscription.id).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.subscriptionToCancel.set(null);
        // Reload subscriptions to show updated status
        this.loadSubscriptions();
      },
      error: (error) => {
        console.error('Error cancelling subscription:', error);
        this.confirmDialog.error('Cancellation Failed', 'Failed to cancel subscription. Please try again.');
        this.cancelling.set(false);
      }
    });
  }
}
