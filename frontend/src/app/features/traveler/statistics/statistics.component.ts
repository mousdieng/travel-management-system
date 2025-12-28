import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { TravelerStatistics } from '../../../core/models';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-traveler-statistics',
  standalone: true,
  imports: [CommonModule, AlertComponent],
  template: `
    <div class="page-container">
      <div class="mb-8">
        <h1 class="section-title">My Travel Statistics</h1>
        <p class="text-gray-600 mt-2">Track your travel journey and engagement</p>
      </div>

      <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error"></app-alert>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      }

      <!-- Statistics Dashboard -->
      @if (!loading() && statistics()) {
        <div class="space-y-8">
          <!-- User Info Card -->
          <div class="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div class="flex items-center space-x-6">
              <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div class="flex-1">
                <h2 class="text-2xl font-heading font-bold">{{ statistics()!.username }}</h2>
                <p class="text-primary-100 mt-1">{{ statistics()!.email }}</p>
                @if (statistics()!.memberSince) {
                  <p class="text-primary-200 text-sm mt-1">Member since {{ formatDate(statistics()!.memberSince!) }}</p>
                }
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Subscriptions -->
            <div class="card hover:shadow-lg transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-600 text-sm font-medium">Total Subscriptions</p>
                  <p class="text-3xl font-heading font-bold text-gray-900 mt-2">
                    {{ statistics()!.totalSubscriptions }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Active Subscriptions -->
            <div class="card hover:shadow-lg transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-600 text-sm font-medium">Active Subscriptions</p>
                  <p class="text-3xl font-heading font-bold text-green-600 mt-2">
                    {{ statistics()!.activeSubscriptions }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Completed Travels -->
            <div class="card hover:shadow-lg transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-600 text-sm font-medium">Completed Travels</p>
                  <p class="text-3xl font-heading font-bold text-purple-600 mt-2">
                    {{ statistics()!.completedTravels }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Upcoming Travels -->
            <div class="card hover:shadow-lg transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-600 text-sm font-medium">Upcoming Travels</p>
                  <p class="text-3xl font-heading font-bold text-orange-600 mt-2">
                    {{ statistics()!.upcomingTravels }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Financial & Engagement Stats -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Financial Stats -->
            <div class="card">
              <h3 class="text-lg font-heading font-semibold text-gray-900 mb-6">Financial Overview</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <span class="text-gray-700 font-medium">Total Spent</span>
                  </div>
                  <span class="text-xl font-heading font-bold text-gray-900">
                    \${{ statistics()!.totalSpent.toFixed(2) }}
                  </span>
                </div>

                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                    </div>
                    <span class="text-gray-700 font-medium">Preferred Payment</span>
                  </div>
                  <span class="text-gray-900 font-semibold">
                    {{ statistics()!.preferredPaymentMethod }}
                  </span>
                </div>

                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </div>
                    <span class="text-gray-700 font-medium">Cancelled</span>
                  </div>
                  <span class="text-xl font-heading font-bold text-red-600">
                    {{ statistics()!.cancelledSubscriptions }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Engagement Stats -->
            <div class="card">
              <h3 class="text-lg font-heading font-semibold text-gray-900 mb-6">Engagement & Feedback</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    <span class="text-gray-700 font-medium">Feedbacks Given</span>
                  </div>
                  <span class="text-xl font-heading font-bold text-gray-900">
                    {{ statistics()!.feedbacksGiven }}
                  </span>
                </div>

                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <span class="text-gray-700 font-medium">Average Rating</span>
                  </div>
                  <span class="text-xl font-heading font-bold text-gray-900">
                    {{ statistics()!.averageRatingGiven.toFixed(1) }} / 5.0
                  </span>
                </div>

                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <span class="text-gray-700 font-medium">Reports Filed</span>
                  </div>
                  <span class="text-xl font-heading font-bold text-gray-900">
                    {{ statistics()!.reportsFiledByUser }}
                  </span>
                </div>

                @if (statistics()!.reportsAgainstUser > 0) {
                  <div class="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <span class="text-red-700 font-medium">Reports Against You</span>
                    </div>
                    <span class="text-xl font-heading font-bold text-red-700">
                      {{ statistics()!.reportsAgainstUser }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card bg-gray-50">
            <h3 class="text-lg font-heading font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a routerLink="/traveler/browse-travels"
                 class="flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-medium text-gray-700">Browse Travels</span>
              </a>

              <a routerLink="/traveler/subscriptions"
                 class="flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <span class="font-medium text-gray-700">My Subscriptions</span>
              </a>

              <a routerLink="/traveler/feedbacks"
                 class="flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
                <span class="font-medium text-gray-700">My Feedbacks</span>
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class StatisticsComponent implements OnInit {
  statistics = signal<TravelerStatistics | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userService.getMyStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.errorMessage.set('Failed to load statistics. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
