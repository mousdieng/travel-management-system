import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TravelService } from '../../../core/services/travel.service';
import { TravelFeedback } from '../../../core/models';

@Component({
  selector: 'app-manager-feedbacks',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a routerLink="/manager/dashboard" class="hover:text-indigo-600">Dashboard</a>
          <span>/</span>
          <span class="text-gray-700">Feedbacks</span>
        </div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Travel Feedbacks</h1>
            <p class="text-gray-600 mt-1">View all feedback and reviews for your travels</p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Total Reviews</p>
          <p class="text-2xl font-bold text-gray-900">{{ feedbacks().length }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Average Rating</p>
          <div class="flex items-center gap-2">
            <p class="text-2xl font-bold text-yellow-500">{{ getAverageRating() | number:'1.1-1' }}</p>
            <svg class="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">5-Star Reviews</p>
          <p class="text-2xl font-bold text-green-600">{{ getCountByRating(5) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-500">Recent (30 days)</p>
          <p class="text-2xl font-bold text-indigo-600">{{ getRecentCount() }}</p>
        </div>
      </div>

      <!-- Rating Distribution -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
        <div class="space-y-3">
          @for (rating of [5, 4, 3, 2, 1]; track rating) {
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1 w-20">
                <span class="text-sm font-medium text-gray-700">{{ rating }}</span>
                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-300"
                     [class]="getRatingBarColor(rating)"
                     [style.width.%]="getRatingPercentage(rating)">
                </div>
              </div>
              <span class="text-sm text-gray-600 w-12 text-right">{{ getCountByRating(rating) }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input type="text"
                   [(ngModel)]="searchQuery"
                   (ngModelChange)="filterFeedbacks()"
                   placeholder="Search by traveler name or comment..."
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
          <select [(ngModel)]="ratingFilter"
                  (ngModelChange)="filterFeedbacks()"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select [(ngModel)]="sortBy"
                  (ngModelChange)="filterFeedbacks()"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
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
      @if (!loading() && filteredFeedbacks().length === 0) {
        <div class="bg-white rounded-lg shadow p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No feedbacks found</h3>
          <p class="text-gray-500">
            {{ searchQuery || ratingFilter ? 'Try adjusting your filters' : 'No one has left feedback yet' }}
          </p>
        </div>
      }

      <!-- Feedbacks List -->
      @if (!loading() && filteredFeedbacks().length > 0) {
        <div class="space-y-4">
          @for (feedback of filteredFeedbacks(); track feedback.id) {
            <div class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start gap-4">
                <!-- Avatar -->
                <img [src]="feedback.travelerAvatar || 'assets/images/avatar-placeholder.png'"
                     [alt]="feedback.travelerName"
                     class="w-12 h-12 rounded-full object-cover">

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <!-- Header -->
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div>
                      <h3 class="font-semibold text-gray-900">{{ feedback.travelerName }}</h3>
                      <a [routerLink]="['/manager/travels', feedback.travelId]"
                         class="text-sm text-indigo-600 hover:text-indigo-800">
                        {{ feedback.travelTitle }}
                      </a>
                    </div>
                    <div class="flex items-center gap-3">
                      <!-- Star Rating -->
                      <div class="flex items-center gap-1">
                        @for (star of [1,2,3,4,5]; track star) {
                          <svg class="w-5 h-5"
                               [class.text-yellow-400]="star <= feedback.rating"
                               [class.text-gray-300]="star > feedback.rating"
                               fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        }
                      </div>
                      <span class="text-sm text-gray-500">
                        {{ feedback.createdAt | date:'mediumDate' }}
                      </span>
                    </div>
                  </div>

                  <!-- Comment -->
                  <p class="text-gray-700 leading-relaxed">{{ feedback.comment }}</p>

                  <!-- Sentiment Badge -->
                  <div class="mt-3">
                    <span [class]="getSentimentBadgeClass(feedback.rating)">
                      {{ getSentimentLabel(feedback.rating) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ManagerFeedbacksComponent implements OnInit {
  private travelService = inject(TravelService);

  feedbacks = signal<TravelFeedback[]>([]);
  filteredFeedbacks = signal<TravelFeedback[]>([]);
  loading = signal(true);

  searchQuery = '';
  ratingFilter = '';
  sortBy = 'newest';

  ngOnInit() {
    this.loadFeedbacks();
  }

  loadFeedbacks() {
    this.loading.set(true);
    this.travelService.getMyTravelsFeedbacks().subscribe({
      next: (feedbacks) => {
        this.feedbacks.set(feedbacks);
        this.filterFeedbacks();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading feedbacks:', err);
        this.feedbacks.set([]);
        this.filteredFeedbacks.set([]);
        this.loading.set(false);
      }
    });
  }

  filterFeedbacks() {
    let filtered = [...this.feedbacks()];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.travelerName.toLowerCase().includes(query) ||
        f.comment.toLowerCase().includes(query) ||
        f.travelTitle.toLowerCase().includes(query)
      );
    }

    // Apply rating filter
    if (this.ratingFilter) {
      const rating = parseInt(this.ratingFilter);
      filtered = filtered.filter(f => f.rating === rating);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
    }

    this.filteredFeedbacks.set(filtered);
  }

  getAverageRating(): number {
    const allFeedbacks = this.feedbacks();
    if (allFeedbacks.length === 0) return 0;
    const sum = allFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    return sum / allFeedbacks.length;
  }

  getCountByRating(rating: number): number {
    return this.feedbacks().filter(f => f.rating === rating).length;
  }

  getRatingPercentage(rating: number): number {
    const total = this.feedbacks().length;
    if (total === 0) return 0;
    return (this.getCountByRating(rating) / total) * 100;
  }

  getRatingBarColor(rating: number): string {
    const colors: Record<number, string> = {
      5: 'bg-green-500',
      4: 'bg-green-400',
      3: 'bg-yellow-400',
      2: 'bg-orange-400',
      1: 'bg-red-400'
    };
    return colors[rating] || 'bg-gray-400';
  }

  getRecentCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.feedbacks().filter(f => new Date(f.createdAt) >= thirtyDaysAgo).length;
  }

  getSentimentLabel(rating: number): string {
    if (rating >= 4) return 'Positive';
    if (rating === 3) return 'Neutral';
    return 'Needs Attention';
  }

  getSentimentBadgeClass(rating: number): string {
    if (rating >= 4) return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800';
    if (rating === 3) return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800';
    return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
  }
}
