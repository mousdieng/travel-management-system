import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TravelService, TravelRecommendation } from '../../../core/services/travel.service';
import { Travel } from '../../../core/models/travel.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, RouterModule, AlertComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div class="container mx-auto px-4 py-12">
          <div class="flex items-center gap-3 mb-3">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            <h1 class="text-4xl font-bold">Recommended for You</h1>
          </div>
          <p class="text-indigo-100 text-lg">
            AI-powered travel recommendations based on your preferences, feedback, and participation history
          </p>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        <!-- Info Card -->
        <div class="bg-white rounded-lg shadow-sm border border-indigo-100 p-6 mb-8">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 mb-1">How Recommendations Work</h3>
              <p class="text-sm text-gray-600">
                Our Neo4j-powered recommendation engine analyzes your travel patterns across multiple dimensions:
              </p>
              <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="flex items-center gap-2 text-sm">
                  <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                  <span class="text-gray-700"><strong>Categories</strong> you've explored</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                  <span class="text-gray-700"><strong>Destinations</strong> you prefer</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span class="text-gray-700"><strong>Ratings</strong> you've given</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error"></app-alert>

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-20">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
            <p class="text-gray-600 animate-pulse">Analyzing your preferences...</p>
          </div>
        }

        <!-- Recommendations Grid -->
        @if (!loading() && recommendations().length > 0) {
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-900">
              {{ recommendations().length }} Perfect Matches
            </h2>
            <div class="text-sm text-gray-600">
              Powered by <span class="font-semibold text-indigo-600">Neo4j Graph Database</span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            @for (rec of recommendations(); track rec.travelId) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div class="flex flex-col sm:flex-row">
                  <!-- Travel Image -->
                  <div class="relative sm:w-56 h-56 sm:h-auto bg-gray-200 overflow-hidden flex-shrink-0">
                    @if (rec.travel.images && rec.travel.images.length > 0) {
                      <img [src]="rec.travel.images[0]" [alt]="rec.travel.title"
                           class="w-full h-full object-cover hover:scale-110 transition-transform duration-300">
                    } @else {
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                        <svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    }

                    <!-- Match Score Badge -->
                    <div class="absolute top-4 left-4">
                      <div class="bg-white rounded-xl shadow-lg px-4 py-2.5 backdrop-blur-sm bg-opacity-95">
                        <div class="text-center">
                          <div class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {{ getMatchPercentage(rec.score) }}%
                          </div>
                          <div class="text-[10px] text-gray-600 uppercase tracking-wide font-semibold">Match</div>
                        </div>
                      </div>
                    </div>

                    <!-- Neo4j Badge -->
                    <div class="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"/>
                        <circle cx="4" cy="12" r="2"/>
                        <circle cx="20" cy="12" r="2"/>
                        <circle cx="12" cy="4" r="2"/>
                        <circle cx="12" cy="20" r="2"/>
                        <line x1="12" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="1"/>
                        <line x1="12" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1"/>
                        <line x1="12" y1="12" x2="12" y2="4" stroke="currentColor" stroke-width="1"/>
                        <line x1="12" y1="12" x2="12" y2="20" stroke="currentColor" stroke-width="1"/>
                      </svg>
                      <span>AI Powered</span>
                    </div>
                  </div>

                  <!-- Travel Info -->
                  <div class="p-6 flex-1 flex flex-col">
                    <!-- Title -->
                    <a [routerLink]="['/travels', rec.travel.id]" class="group mb-3">
                      <h3 class="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                        {{ rec.travel.title }}
                      </h3>
                    </a>

                    <!-- Metadata -->
                    <div class="flex flex-wrap items-center gap-3 mb-3">
                      <div class="flex items-center text-sm text-gray-600">
                        <svg class="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        <span class="font-medium">{{ rec.travel.destination }}</span>
                      </div>

                      @if (rec.travel.category) {
                        <span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full">
                          {{ rec.travel.category }}
                        </span>
                      }

                      @if (rec.travel.averageRating && rec.travel.averageRating > 0) {
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          <span class="text-sm font-semibold text-gray-900">{{ rec.travel.averageRating.toFixed(1) }}</span>
                          @if (rec.travel.totalReviews && rec.travel.totalReviews > 0) {
                            <span class="text-xs text-gray-500">({{ rec.travel.totalReviews }})</span>
                          }
                        </div>
                      }
                    </div>

                    <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ rec.travel.description }}</p>

                    <!-- Recommendation Reasons -->
                    @if (rec.reasons && rec.reasons.length > 0) {
                      <div class="mb-4 flex-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                        <div class="flex items-center gap-1.5 mb-2">
                          <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <div class="text-xs font-bold text-green-800 uppercase tracking-wide">
                            Why you'll love this
                          </div>
                        </div>
                        <div class="space-y-1.5">
                          @for (reason of rec.reasons; track reason) {
                            <div class="flex items-start gap-2 text-sm text-gray-700">
                              <svg class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                              </svg>
                              <span class="line-clamp-2">{{ reason }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <!-- Price & Action -->
                    <div class="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <div class="flex flex-col">
                        <span class="text-sm text-gray-600">From</span>
                        <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          \${{ rec.travel.price }}
                        </span>
                      </div>
                      <a [routerLink]="['/travels', rec.travel.id]"
                         class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all">
                        Explore Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Additional Info -->
          <div class="mt-8 bg-indigo-50 rounded-lg p-6 border border-indigo-100">
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <h4 class="font-semibold text-gray-900 mb-1">How to get better recommendations</h4>
                <ul class="text-sm text-gray-700 space-y-1">
                  <li>• Subscribe to travels that interest you</li>
                  <li>• Leave ratings and feedback after your travels</li>
                  <li>• Explore different categories and destinations</li>
                </ul>
              </div>
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (!loading() && recommendations().length === 0) {
          <div class="text-center py-20">
            <div class="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Build Your Travel Profile</h3>
            <p class="text-gray-600 mb-8 max-w-lg mx-auto">
              Start exploring travels, subscribe to your favorites, and provide feedback to unlock personalized recommendations powered by AI and Neo4j graph technology.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a routerLink="/travels" class="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all">
                Browse All Travels
              </a>
              <a routerLink="/traveler/subscriptions" class="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 font-semibold transition-all">
                View My Subscriptions
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class RecommendationsComponent implements OnInit {
  recommendations = signal<TravelRecommendation[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.travelService.getPersonalizedRecommendations(10).subscribe({
      next: (recommendations) => {
        console.log('Neo4j Recommendations loaded:', recommendations);
        this.recommendations.set(recommendations);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading recommendations:', error);
        this.errorMessage.set('Failed to load recommendations. Please try again later.');
        this.recommendations.set([]);
        this.loading.set(false);
      }
    });
  }

  getMatchPercentage(score: number): number {
    // Neo4j scoring: category (3.0) + destination (2.5) + rating (2.0) = max 7.5
    // Convert to percentage with some buffer for visual appeal
    const maxScore = 8;
    const percentage = Math.min(100, Math.round((score / maxScore) * 100));
    return Math.max(50, percentage); // Minimum 50% for visual appeal
  }
}
