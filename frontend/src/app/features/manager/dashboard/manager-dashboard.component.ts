import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TravelService } from '../../../core/services/travel.service';
import { ManagerStats, Travel, TravelFeedback, TravelStatus } from '../../../core/models';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p class="text-gray-600 mt-1">Overview of your travel business performance</p>
        </div>
        <a routerLink="/manager/travels/create"
           class="mt-4 md:mt-0 btn-primary flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create New Travel
        </a>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>

      <!-- Statistics Cards -->
      <div *ngIf="!loading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Travels -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Travels</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats().totalTravels }}</p>
              <p class="text-sm text-green-600 mt-1">{{ stats().activeTravels }} active</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Total Subscribers -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Subscribers</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats().totalSubscribers }}</p>
              <p class="text-sm text-blue-600 mt-1">+{{ stats().recentSubscriptions }} this month</p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Total Revenue -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Revenue</p>
              <p class="text-3xl font-bold text-gray-900 mt-1">\${{ stats().totalRevenue | number:'1.0-0' }}</p>
              <p class="text-sm text-gray-500 mt-1">From all travels</p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-full">
              <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Average Rating -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Average Rating</p>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-3xl font-bold text-gray-900">{{ stats().averageRating | number:'1.1-1' }}</p>
                <div class="flex text-yellow-400">
                  <svg *ngFor="let star of [1,2,3,4,5]" class="w-5 h-5"
                       [class.text-yellow-400]="star <= stats().averageRating"
                       [class.text-gray-300]="star > stats().averageRating"
                       fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ stats().totalFeedbacks }} reviews</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Recent Activity -->
      <div *ngIf="!loading()" class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Quick Actions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div class="space-y-3">
            <a routerLink="/manager/travels/create"
               class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div class="p-2 bg-blue-100 rounded-lg">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <span class="font-medium text-gray-700">Create New Travel</span>
            </a>
            <a routerLink="/manager/travels"
               class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div class="p-2 bg-green-100 rounded-lg">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <span class="font-medium text-gray-700">Manage My Travels</span>
            </a>
            <a routerLink="/manager/subscribers"
               class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div class="p-2 bg-purple-100 rounded-lg">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <span class="font-medium text-gray-700">View Subscribers</span>
            </a>
            <a routerLink="/manager/feedbacks"
               class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
              </div>
              <span class="font-medium text-gray-700">View Feedbacks</span>
            </a>
          </div>
        </div>

        <!-- Recent Travels -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Recent Travels</h2>
            <a routerLink="/manager/travels" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </a>
          </div>

          <div *ngIf="recentTravels().length === 0" class="text-center py-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <p>No travels created yet</p>
            <a routerLink="/manager/travels/create" class="text-primary-600 hover:underline mt-2 inline-block">
              Create your first travel
            </a>
          </div>

          <div class="space-y-4" *ngIf="recentTravels().length > 0">
            <div *ngFor="let travel of recentTravels()"
                 class="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <img [src]="travel.images[0] || 'assets/images/travel-placeholder.jpg'"
                   [alt]="travel.title"
                   class="w-16 h-16 rounded-lg object-cover">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 truncate">{{ travel.title }}</h3>
                <p class="text-sm text-gray-500">{{ travel.destination }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-sm font-medium text-primary-600">\${{ travel.price }}</span>
                  <span class="text-gray-300">|</span>
                  <span class="text-sm text-gray-500">{{ travel.currentParticipants }}/{{ travel.maxParticipants }} travelers</span>
                </div>
              </div>
              <span [class]="getStatusClass(travel.status)" class="px-3 py-1 rounded-full text-xs font-medium">
                {{ travel.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Feedbacks -->
      <div *ngIf="!loading()" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Recent Feedbacks</h2>
          <a routerLink="/manager/feedbacks" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </a>
        </div>

        <div *ngIf="recentFeedbacks().length === 0" class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <p>No feedbacks received yet</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" *ngIf="recentFeedbacks().length > 0">
          <div *ngFor="let feedback of recentFeedbacks()"
               class="p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
            <div class="flex items-start gap-3">
              <img [src]="feedback.travelerAvatar || 'assets/images/avatar-placeholder.png'"
                   [alt]="feedback.travelerName"
                   class="w-10 h-10 rounded-full object-cover">
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-gray-900 truncate">{{ feedback.travelerName }}</h4>
                  <div class="flex text-yellow-400">
                    <svg *ngFor="let star of [1,2,3,4,5]" class="w-4 h-4"
                         [class.text-yellow-400]="star <= feedback.rating"
                         [class.text-gray-300]="star > feedback.rating"
                         fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                </div>
                <p class="text-sm text-gray-500 mt-1 truncate">{{ feedback.travelTitle }}</p>
                <p class="text-sm text-gray-600 mt-2 line-clamp-2">{{ feedback.comment }}</p>
              </div>
            </div>
          </div>
        </div>
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
export class ManagerDashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<ManagerStats>({
    totalTravels: 0,
    totalBookings: 0,
    activeTravels: 0,
    totalSubscribers: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalFeedbacks: 0,
    recentSubscriptions: 0,
    upcomingTravels: 0
  });
  recentTravels = signal<Travel[]>([]);
  recentFeedbacks = signal<TravelFeedback[]>([]);

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);

    // Load manager stats
    this.travelService.getManagerStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        // Use mock data for demo
        this.stats.set({
          totalTravels: 12,
          totalBookings: 156,
          activeTravels: 8,
          totalSubscribers: 156,
          totalRevenue: 45600,
          averageRating: 4.5,
          totalFeedbacks: 89,
          recentSubscriptions: 23,
          upcomingTravels: 5
        });
      }
    });

    // Load recent travels
    this.travelService.getMyTravels().subscribe({
      next: (travels) => {
        this.recentTravels.set(travels.slice(0, 5));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading travels:', err);
        this.recentTravels.set([]);
        this.loading.set(false);
      }
    });

    // Load recent feedbacks
    this.travelService.getMyTravelsFeedbacks().subscribe({
      next: (feedbacks) => {
        this.recentFeedbacks.set(feedbacks.slice(0, 6));
      },
      error: (err) => {
        console.error('Error loading feedbacks:', err);
        this.recentFeedbacks.set([]);
      }
    });
  }

  getStatusClass(status: TravelStatus): string {
    const classes: Record<TravelStatus, string> = {
      [TravelStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [TravelStatus.PUBLISHED]: 'bg-green-100 text-green-800',
      [TravelStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [TravelStatus.COMPLETED]: 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
