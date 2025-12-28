import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminActionsService } from '../../../core/services/admin-actions.service';
import { UserService } from '../../../core/services/user.service';
import { TravelService } from '../../../core/services/travel.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { CreateFeedbackRequest, User, Travel, Subscription } from '../../../core/models';

@Component({
  selector: 'app-create-feedback-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" (click)="close()"></div>

        <!-- Modal panel -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900">Create Feedback as User</h3>
              </div>
              <button (click)="close()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Alert Messages -->
            @if (errorMessage()) {
              <app-alert [message]="errorMessage()!" type="error" class="mb-4"></app-alert>
            }
            @if (successMessage()) {
              <app-alert [message]="successMessage()!" type="success" class="mb-4"></app-alert>
            }

            <!-- Form -->
            <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()">
              <div class="space-y-6">
                <!-- User Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Select User *
                  </label>
                  <input
                    type="text"
                    formControlName="userSearch"
                    (input)="onUserSearch()"
                    placeholder="Search user by name or email..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />

                  <!-- User search results -->
                  @if (showUserResults() && userResults().length > 0) {
                    <div class="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      @for (user of userResults(); track user.id) {
                        <button
                          type="button"
                          (click)="selectUser(user)"
                          class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                        >
                          <div class="font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</div>
                          <div class="text-sm text-gray-600">{{ user.email }}</div>
                        </button>
                      }
                    </div>
                  }

                  <!-- Selected user -->
                  @if (selectedUser()) {
                    <div class="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ selectedUser()!.firstName }} {{ selectedUser()!.lastName }}
                        </div>
                        <div class="text-sm text-gray-600">{{ selectedUser()!.email }}</div>
                      </div>
                      <button
                        type="button"
                        (click)="clearUser()"
                        class="text-red-600 hover:text-red-800"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>

                <!-- Travel Selection (only user's subscriptions) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Select Travel to Review *
                  </label>

                  @if (selectedUser()) {
                    @if (loadingSubscriptions()) {
                      <div class="text-center py-4 text-gray-600">Loading user's subscriptions...</div>
                    } @else if (userSubscriptions().length === 0) {
                      <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                        This user has no subscriptions yet
                      </div>
                    } @else {
                      <div class="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                        @for (subscription of userSubscriptions(); track subscription.id) {
                          <button
                            type="button"
                            (click)="selectSubscription(subscription)"
                            [class.bg-yellow-50]="selectedSubscription()?.id === subscription.id"
                            [class.border-yellow-300]="selectedSubscription()?.id === subscription.id"
                            class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                          >
                            <div class="font-medium text-gray-900">{{ subscription.travel.title }}</div>
                            <div class="text-sm text-gray-600">{{ subscription.travel.destination }}</div>
                            <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>{{ formatDate(subscription.travel.startDate) }}</span>
                              <span class="px-2 py-0.5 rounded-full" [ngClass]="getSubscriptionStatusClass(subscription.status)">
                                {{ subscription.status }}
                              </span>
                            </div>
                          </button>
                        }
                      </div>
                    }
                  } @else {
                    <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                      Please select a user first
                    </div>
                  }
                </div>

                <!-- Rating -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">Rating *</label>
                  <div class="flex items-center justify-center space-x-2">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <button
                        type="button"
                        (click)="setRating(star)"
                        (mouseenter)="hoverRating.set(star)"
                        (mouseleave)="hoverRating.set(0)"
                        class="focus:outline-none transition-transform hover:scale-110"
                      >
                        <svg
                          class="w-12 h-12 transition-colors"
                          [class.text-yellow-400]="star <= (hoverRating() || selectedRating())"
                          [class.text-gray-300]="star > (hoverRating() || selectedRating())"
                          [attr.fill]="star <= (hoverRating() || selectedRating()) ? 'currentColor' : 'none'"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                      </button>
                    }
                  </div>
                  @if (selectedRating() > 0) {
                    <p class="text-center text-sm text-gray-600 mt-2">
                      {{ getRatingLabel(selectedRating()) }}
                    </p>
                  }
                </div>

                <!-- Comment -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Comment *
                  </label>
                  <textarea
                    formControlName="comment"
                    rows="5"
                    placeholder="Share your thoughts about this travel experience..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  ></textarea>
                  <p class="mt-1 text-xs text-gray-500">Minimum 10 characters</p>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    (click)="close()"
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    [disabled]="!feedbackForm.valid || !selectedUser() || !selectedSubscription() || !selectedRating() || submitting()"
                    class="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    @if (submitting()) {
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    } @else {
                      Submit Feedback
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class CreateFeedbackModalComponent implements OnInit {
  @Input() isOpen = signal(false);
  @Output() closeModal = new EventEmitter<void>();
  @Output() feedbackCreated = new EventEmitter<void>();

  feedbackForm!: FormGroup;
  selectedUser = signal<User | null>(null);
  selectedSubscription = signal<Subscription | null>(null);
  selectedRating = signal(0);
  hoverRating = signal(0);
  userResults = signal<User[]>([]);
  userSubscriptions = signal<Subscription[]>([]);
  showUserResults = signal(false);
  loadingSubscriptions = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private adminActionsService: AdminActionsService,
    private userService: UserService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    this.feedbackForm = this.fb.group({
      userSearch: [''],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onUserSearch() {
    const query = this.feedbackForm.get('userSearch')?.value;
    if (!query || query.length < 2) {
      this.showUserResults.set(false);
      return;
    }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        const filtered = users.filter(u =>
          u.firstName?.toLowerCase().includes(query.toLowerCase()) ||
          u.lastName?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase())
        );
        this.userResults.set(filtered);
        this.showUserResults.set(true);
      },
      error: () => {
        this.errorMessage.set('Failed to search users');
      }
    });
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
    this.showUserResults.set(false);
    this.feedbackForm.patchValue({ userSearch: `${user.firstName} ${user.lastName}` });
    this.loadUserSubscriptions(user.id);
  }

  loadUserSubscriptions(userId: number) {
    this.loadingSubscriptions.set(true);
    this.adminActionsService.getUserSubscriptions(userId).subscribe({
      next: (subscriptions) => {
        this.userSubscriptions.set(subscriptions);
        this.loadingSubscriptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load user subscriptions');
        this.loadingSubscriptions.set(false);
      }
    });
  }

  selectSubscription(subscription: Subscription) {
    this.selectedSubscription.set(subscription);
  }

  clearUser() {
    this.selectedUser.set(null);
    this.selectedSubscription.set(null);
    this.userSubscriptions.set([]);
    this.feedbackForm.patchValue({ userSearch: '' });
  }

  setRating(rating: number) {
    this.selectedRating.set(rating);
  }

  getRatingLabel(rating: number): string {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[rating] || '';
  }

  getSubscriptionStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  onSubmit() {
    if (!this.feedbackForm.valid || !this.selectedUser() || !this.selectedSubscription() || !this.selectedRating()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const feedbackData: CreateFeedbackRequest = {
      rating: this.selectedRating(),
      comment: this.feedbackForm.value.comment,
      travelId: this.selectedSubscription()!.travel.id.toString()
    };

    this.adminActionsService.createFeedbackForUser(
      this.selectedUser()!.id,
      this.selectedSubscription()!.travel.id.toString(),
      feedbackData
    ).subscribe({
      next: () => {
        this.successMessage.set('Feedback created successfully!');
        this.submitting.set(false);
        this.feedbackCreated.emit();
        setTimeout(() => this.close(), 1500);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to create feedback');
        this.submitting.set(false);
      }
    });
  }

  close() {
    this.isOpen.set(false);
    this.feedbackForm.reset();
    this.selectedUser.set(null);
    this.selectedSubscription.set(null);
    this.selectedRating.set(0);
    this.hoverRating.set(0);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.closeModal.emit();
  }
}
