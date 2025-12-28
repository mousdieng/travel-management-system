import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TravelService } from '../../../core/services/travel.service';
import { TravelSubscriber, Travel } from '../../../core/models';

@Component({
  selector: 'app-subscribers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a routerLink="/manager/dashboard" class="hover:text-indigo-600">Dashboard</a>
          <span>/</span>
          @if (travelId()) {
            <a routerLink="/manager/travels" class="hover:text-indigo-600">My Travels</a>
            <span>/</span>
            <span class="text-gray-700">{{ travel()?.title || 'Travel' }} Subscribers</span>
          } @else {
            <span class="text-gray-700">All Subscribers</span>
          }
        </div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ travelId() ? 'Travel Subscribers' : 'All My Subscribers' }}
            </h1>
            <p class="text-gray-600 mt-1">
              {{ travelId() ? 'Manage subscribers for ' + (travel()?.title || 'this travel') : 'View all subscribers across your travels' }}
            </p>
          </div>
          <div class="flex gap-2">
            @if (filteredSubscribers().length > 0) {
              <button (click)="exportSubscribers()" class="btn-secondary flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export CSV
              </button>
            }
            @if (!travelId()) {
              <a routerLink="/manager/travels" class="btn-primary">
                View Travels
              </a>
            }
          </div>
        </div>
      </div>

      <!-- Travel Info Card (when viewing specific travel) -->
      @if (travelId() && travel()) {
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex items-start gap-4">
            <img [src]="travel()!.images[0] || 'assets/images/travel-placeholder.jpg'"
                 [alt]="travel()!.title"
                 class="w-24 h-24 rounded-lg object-cover">
            <div class="flex-1">
              <h2 class="text-xl font-semibold text-gray-900">{{ travel()!.title }}</h2>
              <p class="text-gray-600">{{ travel()!.destination }}</p>
              <div class="flex items-center gap-4 mt-2 text-sm">
                <span class="text-indigo-600 font-medium">\${{ travel()!.price }}</span>
                <span class="text-gray-500">{{ travel()!.currentParticipants }}/{{ travel()!.maxParticipants }} participants</span>
                <span [class]="getStatusBadgeClass(travel()!.status)">{{ travel()!.status }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Total Subscribers</p>
          <p class="text-2xl font-bold text-gray-900">{{ subscribers().length }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Confirmed</p>
          <p class="text-2xl font-bold text-green-600">{{ getCountByStatus('CONFIRMED') }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Pending</p>
          <p class="text-2xl font-bold text-yellow-600">{{ getCountByStatus('PENDING') }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Total Revenue</p>
          <p class="text-2xl font-bold text-indigo-600">\${{ getTotalRevenue() | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input type="text"
                   [(ngModel)]="searchQuery"
                   (ngModelChange)="filterSubscribers()"
                   placeholder="Search by name or email..."
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
          <select [(ngModel)]="statusFilter"
                  (ngModelChange)="filterSubscribers()"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select [(ngModel)]="paymentFilter"
                  (ngModelChange)="filterSubscribers()"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && filteredSubscribers().length === 0) {
        <div class="bg-white rounded-lg shadow p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No subscribers found</h3>
          <p class="text-gray-500">
            {{ searchQuery || statusFilter || paymentFilter ? 'Try adjusting your filters' : 'No one has subscribed yet' }}
          </p>
        </div>
      }

      <!-- Subscribers Table -->
      @if (!loading() && filteredSubscribers().length > 0) {
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traveler</th>
                  @if (!travelId()) {
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travel</th>
                  }
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (subscriber of filteredSubscribers(); track subscriber.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <img [src]="subscriber.travelerAvatar || 'assets/images/avatar-placeholder.png'"
                             [alt]="subscriber.travelerName"
                             class="w-10 h-10 rounded-full object-cover mr-3">
                        <div>
                          <p class="font-medium text-gray-900">{{ subscriber.travelerName }}</p>
                          <p class="text-sm text-gray-500">{{ subscriber.travelerEmail }}</p>
                        </div>
                      </div>
                    </td>
                    @if (!travelId()) {
                      <td class="px-6 py-4 whitespace-nowrap">
                        <a [routerLink]="['/manager/travels', subscriber.travelId]"
                           class="text-indigo-600 hover:text-indigo-800 font-medium">
                          View Travel
                        </a>
                      </td>
                    }
                    <td class="px-6 py-4 whitespace-nowrap text-gray-900">
                      {{ subscriber.numberOfParticipants }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      \${{ subscriber.totalAmount | number:'1.2-2' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getStatusBadgeClass(subscriber.status)">
                        {{ subscriber.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getPaymentBadgeClass(subscriber.paymentStatus)">
                        {{ subscriber.paymentStatus }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ subscriber.subscribedAt | date:'mediumDate' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="flex justify-end gap-2">
                        @if (subscriber.travelerPhone) {
                          <a [href]="'tel:' + subscriber.travelerPhone"
                             class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                             title="Call">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                          </a>
                        }
                        <a [href]="'mailto:' + subscriber.travelerEmail"
                           class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                           title="Email">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                        </a>
                        @if (subscriber.status === 'CONFIRMED') {
                          <button (click)="openUnsubscribeModal(subscriber)"
                                  class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Unsubscribe">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/>
                            </svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Unsubscribe Confirmation Modal -->
      @if (showUnsubscribeModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Unsubscribe Traveler</h3>
            <p class="text-gray-600 mb-6">
              Are you sure you want to unsubscribe <strong>{{ subscriberToUnsubscribe()?.travelerName }}</strong>?
              This will cancel their subscription and may trigger a refund process.
            </p>
            <div class="flex gap-3">
              <button (click)="closeUnsubscribeModal()"
                      class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button (click)="confirmUnsubscribe()"
                      [disabled]="unsubscribing()"
                      class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                @if (unsubscribing()) {
                  <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Processing...
                  </span>
                } @else {
                  Unsubscribe
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SubscribersComponent implements OnInit {
  private travelService = inject(TravelService);
  private route = inject(ActivatedRoute);

  travelId = signal<string | null>(null);
  travel = signal<Travel | null>(null);
  subscribers = signal<TravelSubscriber[]>([]);
  filteredSubscribers = signal<TravelSubscriber[]>([]);
  loading = signal(true);

  showUnsubscribeModal = signal(false);
  subscriberToUnsubscribe = signal<TravelSubscriber | null>(null);
  unsubscribing = signal(false);

  searchQuery = '';
  statusFilter = '';
  paymentFilter = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.travelId.set(id);
      this.loadTravel(id);
      this.loadTravelSubscribers(id);
    } else {
      this.loadAllSubscribers();
    }
  }

  loadTravel(id: string) {
    this.travelService.getTravelById(id).subscribe({
      next: (travel) => this.travel.set(travel),
      error: (err) => console.error('Error loading travel:', err)
    });
  }

  loadTravelSubscribers(travelId: string) {
    this.loading.set(true);
    this.travelService.getTravelSubscribers(travelId).subscribe({
      next: (subscribers) => {
        this.subscribers.set(subscribers);
        this.filterSubscribers();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading subscribers:', err);
        this.subscribers.set([]);
        this.filteredSubscribers.set([]);
        this.loading.set(false);
      }
    });
  }

  loadAllSubscribers() {
    this.loading.set(true);
    this.travelService.getAllMySubscribers().subscribe({
      next: (subscribers) => {
        this.subscribers.set(subscribers);
        this.filterSubscribers();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading subscribers:', err);
        this.subscribers.set([]);
        this.filteredSubscribers.set([]);
        this.loading.set(false);
      }
    });
  }

  filterSubscribers() {
    let filtered = [...this.subscribers()];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.travelerName.toLowerCase().includes(query) ||
        s.travelerEmail.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(s => s.status === this.statusFilter);
    }

    if (this.paymentFilter) {
      filtered = filtered.filter(s => s.paymentStatus === this.paymentFilter);
    }

    this.filteredSubscribers.set(filtered);
  }

  getCountByStatus(status: string): number {
    return this.subscribers().filter(s => s.status === status).length;
  }

  getTotalRevenue(): number {
    return this.subscribers()
      .filter(s => s.paymentStatus === 'PAID')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'CONFIRMED': 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      'PENDING': 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
      'CANCELLED': 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
      'PUBLISHED': 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      'DRAFT': 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
      'COMPLETED': 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800'
    };
    return classes[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
  }

  getPaymentBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'PAID': 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      'PENDING': 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
      'REFUNDED': 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
      'FAILED': 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
    };
    return classes[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
  }

  openUnsubscribeModal(subscriber: TravelSubscriber) {
    this.subscriberToUnsubscribe.set(subscriber);
    this.showUnsubscribeModal.set(true);
  }

  closeUnsubscribeModal() {
    this.showUnsubscribeModal.set(false);
    this.subscriberToUnsubscribe.set(null);
  }

  confirmUnsubscribe() {
    const subscriber = this.subscriberToUnsubscribe();
    if (!subscriber) return;

    this.unsubscribing.set(true);
    this.travelService.unsubscribeTraveler(subscriber.id).subscribe({
      next: () => {
        // Update subscriber status locally
        const updated = this.subscribers().map(s =>
          s.id === subscriber.id ? { ...s, status: 'CANCELLED' } : s
        );
        this.subscribers.set(updated);
        this.filterSubscribers();
        this.closeUnsubscribeModal();
        this.unsubscribing.set(false);
      },
      error: (err) => {
        console.error('Error unsubscribing:', err);
        this.unsubscribing.set(false);
      }
    });
  }

  /**
   * Export subscribers to CSV file
   */
  exportSubscribers() {
    const subscribers = this.filteredSubscribers();
    if (subscribers.length === 0) return;

    // CSV headers
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Participants',
      'Amount',
      'Status',
      'Payment Status',
      'Subscribed Date'
    ];

    // CSV rows
    const rows = subscribers.map(s => [
      s.travelerName,
      s.travelerEmail,
      s.travelerPhone || 'N/A',
      s.numberOfParticipants.toString(),
      s.totalAmount.toFixed(2),
      s.status,
      s.paymentStatus,
      new Date(s.subscribedAt).toLocaleDateString()
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = this.travelId()
      ? `subscribers-${this.travel()?.title || 'travel'}-${new Date().toISOString().split('T')[0]}.csv`
      : `all-subscribers-${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
