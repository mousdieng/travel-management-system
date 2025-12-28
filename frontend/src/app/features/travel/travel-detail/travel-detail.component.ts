import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TravelService } from '../../../core/services/travel.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { FeedbackService } from '../../../core/services/feedback.service';
import { AuthService } from '../../../core/services/auth.service';
import { Travel } from '../../../core/models/travel.model';
import { Feedback } from '../../../core/models/feedback.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-travel-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, ErrorMessageComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      @if (loading()) {
        <app-loading />
      } @else if (travel()) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2">
            <!-- Images -->
            @if (travel()!.images && travel()!.images.length > 0) {
              <div class="mb-6 rounded-lg overflow-hidden">
                <img [src]="travel()!.images[0]" [alt]="travel()!.title" class="w-full h-96 object-cover">
              </div>
            }

            <!-- Title and Description -->
            <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ travel()!.title }}</h1>
            <p class="text-gray-600 mb-6">{{ travel()!.description }}</p>

            <!-- Details -->
            <div class="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 class="text-xl font-semibold mb-4">Travel Details</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Destination</p>
                  <p class="font-medium">{{ travel()!.destination }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Category</p>
                  <p class="font-medium">{{ travel()!.category || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Start Date</p>
                  <p class="font-medium">{{ formatDate(travel()!.startDate) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">End Date</p>
                  <p class="font-medium">{{ formatDate(travel()!.endDate) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Participants</p>
                  <p class="font-medium">{{ travel()!.currentParticipants }} / {{ travel()!.maxParticipants }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Rating</p>
                  <p class="font-medium">
                    @if (travel()!.averageRating > 0) {
                      ⭐ {{ travel()!.averageRating.toFixed(1) }} ({{ travel()!.totalReviews }} reviews)
                    } @else {
                      No ratings yet
                    }
                  </p>
                </div>
              </div>
            </div>

            <!-- Itinerary -->
            @if (travel()!.itinerary) {
              <div class="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                <h2 class="text-xl font-semibold mb-4">Itinerary</h2>
                <p class="text-gray-600">{{ travel()!.itinerary }}</p>
              </div>
            }

            <!-- Highlights -->
            @if (travel()!.highlights && travel()!.highlights.length > 0) {
              <div class="bg-white rounded-lg p-6 border border-gray-200">
                <h2 class="text-xl font-semibold mb-4">Highlights</h2>
                <ul class="space-y-2">
                  @for (highlight of travel()!.highlights; track $index) {
                    <li class="flex items-start">
                      <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      <span>{{ highlight }}</span>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <div class="text-3xl font-bold text-indigo-600 mb-4">\${{ travel()!.price }}</div>

              @if (errorMessage()) {
                <app-error-message [message]="errorMessage()!" />
              }

              @if (isAuthenticated()) {
                <button
                  (click)="subscribe()"
                  [disabled]="subscribing() || !travel()!.active || travel()!.currentParticipants >= travel()!.maxParticipants"
                  class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ subscribing() ? 'Subscribing...' : 'Subscribe Now' }}
                </button>
              } @else {
                <a
                  routerLink="/login"
                  class="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
                >
                  Login to Subscribe
                </a>
              }

              <div class="mt-4 space-y-2 text-sm text-gray-600">
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Secure payment
                </div>
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cancel up to 3 days before
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="text-center py-12">
          <p class="text-gray-500">Travel not found</p>
          <a routerLink="/travels" class="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to travels
          </a>
        </div>
      }
    </div>
  `
})
export class TravelDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private travelService = inject(TravelService);
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);

  travel = signal<Travel | null>(null);
  loading = signal(true);
  subscribing = signal(false);
  errorMessage = signal<string | null>(null);
  isAuthenticated = this.authService.isAuthenticated;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTravel(+id);
    }
  }

  loadTravel(id: number): void {
    this.travelService.getById(id).subscribe({
      next: (travel) => {
        this.travel.set(travel);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  subscribe(): void {
    if (!this.travel()) return;

    this.subscribing.set(true);
    this.errorMessage.set(null);

    this.subscriptionService.subscribe({ travelId: this.travel()!.id }).subscribe({
      next: () => {
        this.router.navigate(['/subscriptions']);
      },
      error: (error) => {
        this.subscribing.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to subscribe. Please try again.');
      }
    });
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}
