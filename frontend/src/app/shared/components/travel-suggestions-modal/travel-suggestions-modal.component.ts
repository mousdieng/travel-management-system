import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Travel } from '../../../core/models';
import { TravelRecommendation } from '../../../core/services/travel.service';

export interface TravelSuggestions {
  similar: Travel[];
  trending: Travel[];
  personalized: TravelRecommendation[];
}

@Component({
  selector: 'app-travel-suggestions-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Modal Overlay -->
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" (click)="close()">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background Overlay -->
          <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"></div>

          <!-- Modal Panel -->
          <div class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
               (click)="$event.stopPropagation()">

            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-3xl font-bold text-white mb-2">
                    🎉 Subscription Confirmed!
                  </h2>
                  <p class="text-indigo-100">
                    Explore more amazing travels you might love
                  </p>
                </div>
                <button
                  (click)="close()"
                  class="text-white hover:text-gray-200 transition-colors">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="px-8 py-6 max-h-[70vh] overflow-y-auto">

              <!-- Similar Travels Section -->
              @if (suggestions().similar && suggestions().similar.length > 0) {
                <div class="mb-8">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900">Similar Travels</h3>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    @for (travel of suggestions().similar; track travel.id) {
                      <div class="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-300">
                        <div class="relative h-48 bg-gray-200">
                          @if (travel.images && travel.images.length > 0) {
                            <img [src]="travel.images[0]" [alt]="travel.title" class="w-full h-full object-cover">
                          }
                          <div class="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-md">
                            <span class="text-sm font-bold text-indigo-600">\${{ travel.price }}</span>
                          </div>
                        </div>
                        <div class="p-4">
                          <h4 class="font-bold text-gray-900 mb-2 line-clamp-2">{{ travel.title }}</h4>
                          <div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            </svg>
                            <span>{{ travel.destination }}</span>
                          </div>
                          <a [routerLink]="['/travels', travel.id]"
                             (click)="close()"
                             class="block w-full text-center py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors">
                            View Details
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Trending Travels Section -->
              @if (suggestions().trending && suggestions().trending.length > 0) {
                <div class="mb-8">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                      </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900">Trending Now</h3>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    @for (travel of suggestions().trending; track travel.id) {
                      <div class="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all duration-300">
                        <div class="relative h-48 bg-gray-200">
                          @if (travel.images && travel.images.length > 0) {
                            <img [src]="travel.images[0]" [alt]="travel.title" class="w-full h-full object-cover">
                          }
                          <div class="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            <span class="text-xs font-bold">HOT</span>
                          </div>
                          <div class="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-md">
                            <span class="text-sm font-bold text-orange-600">\${{ travel.price }}</span>
                          </div>
                        </div>
                        <div class="p-4">
                          <h4 class="font-bold text-gray-900 mb-2 line-clamp-2">{{ travel.title }}</h4>
                          <div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            </svg>
                            <span>{{ travel.destination }}</span>
                          </div>
                          <a [routerLink]="['/travels', travel.id]"
                             (click)="close()"
                             class="block w-full text-center py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition-colors">
                            View Details
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Personalized Recommendations Section -->
              @if (suggestions().personalized && suggestions().personalized.length > 0) {
                <div>
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h3 class="text-2xl font-bold text-gray-900">Recommended For You</h3>
                      <p class="text-sm text-gray-600">Based on your preferences and travel history</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @for (rec of suggestions().personalized; track rec.travelId) {
                      <div class="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all duration-300">
                        <div class="flex">
                          <div class="relative w-48 h-48 bg-gray-200 flex-shrink-0">
                            @if (rec.travel.images && rec.travel.images.length > 0) {
                              <img [src]="rec.travel.images[0]" [alt]="rec.travel.title" class="w-full h-full object-cover">
                            }
                            <div class="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1.5 rounded-xl shadow-lg">
                              <div class="text-xs font-bold">{{ getMatchPercentage(rec.score) }}% Match</div>
                            </div>
                          </div>
                          <div class="p-4 flex-1 flex flex-col">
                            <h4 class="font-bold text-gray-900 mb-2 line-clamp-2">{{ rec.travel.title }}</h4>
                            <div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              </svg>
                              <span>{{ rec.travel.destination }}</span>
                            </div>
                            @if (rec.reasons && rec.reasons.length > 0) {
                              <div class="mb-3 flex-1">
                                <div class="text-xs text-green-700 font-semibold mb-1">Why you'll love this:</div>
                                <div class="text-xs text-gray-600 line-clamp-2">{{ rec.reasons[0] }}</div>
                              </div>
                            }
                            <div class="flex items-center justify-between mt-auto">
                              <span class="text-lg font-bold text-purple-600">\${{ rec.travel.price }}</span>
                              <a [routerLink]="['/travels', rec.travel.id]"
                                 (click)="close()"
                                 class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm transition-colors">
                                View Details
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Footer -->
            <div class="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <button
                  (click)="close()"
                  class="text-gray-600 hover:text-gray-900 font-medium">
                  Close
                </button>
                <a
                  routerLink="/traveler/subscriptions"
                  (click)="close()"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors">
                  View My Subscriptions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
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
export class TravelSuggestionsModalComponent {
  @Input() suggestions = signal<TravelSuggestions>({ similar: [], trending: [], personalized: [] });
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  getMatchPercentage(score: number): number {
    const maxScore = 8;
    const percentage = Math.min(100, Math.round((score / maxScore) * 100));
    return Math.max(50, percentage);
  }
}
