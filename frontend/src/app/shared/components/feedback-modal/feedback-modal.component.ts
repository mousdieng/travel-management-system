import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackService } from '../../../core/services/feedback.service';
import { CreateFeedbackRequest } from '../../../core/models/feedback.model';
import { AlertComponent } from '../alert/alert.component';

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" (click)="close()"></div>

        <!-- Modal panel -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-heading font-bold text-gray-900">Rate Your Experience</h3>
              </div>
              <button (click)="close()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Alert Messages -->
            <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error" class="mb-4"></app-alert>
            <app-alert *ngIf="successMessage()" [message]="successMessage()!" type="success" class="mb-4"></app-alert>

            <!-- Travel Info -->
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
              <p class="text-sm text-gray-600 mb-1">Travel:</p>
              <p class="font-semibold text-gray-900">{{ travelTitle }}</p>
            </div>

            <!-- Form -->
            <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()">
              <div class="space-y-6">
                <!-- Rating -->
                <div>
                  <label class="label mb-3">Your Rating *</label>
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
                  @if (feedbackForm.get('rating')?.invalid && feedbackForm.get('rating')?.touched) {
                    <p class="text-sm text-red-600 text-center mt-2">
                      Please select a rating
                    </p>
                  }
                </div>

                <!-- Comment -->
                <div>
                  <label for="comment" class="label">Your Review *</label>
                  <textarea
                    id="comment"
                    formControlName="comment"
                    rows="5"
                    class="input-field"
                    placeholder="Share your experience with this travel... (minimum 10 characters)"
                  ></textarea>
                  @if (feedbackForm.get('comment')?.invalid && feedbackForm.get('comment')?.touched) {
                    <p class="text-sm text-red-600 mt-1">
                      Comment must be between 10 and 1000 characters
                    </p>
                  }
                </div>

                <!-- Info Box -->
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div class="text-sm text-blue-700">
                      <p class="font-medium mb-1">Your feedback helps others:</p>
                      <ul class="list-disc list-inside space-y-1 text-blue-600">
                        <li>Share your honest experience</li>
                        <li>Help improve future travels</li>
                        <li>Guide other travelers in their choices</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  (click)="close()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  [disabled]="submitting()"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  [disabled]="feedbackForm.invalid || submitting()"
                >
                  @if (submitting()) {
                    <span class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  } @else {
                    Submit Review
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class FeedbackModalComponent {
  @Input() travelId!: string;
  @Input() travelTitle!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  isOpen = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  selectedRating = signal(0);
  hoverRating = signal(0);

  feedbackForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService
  ) {
    this.feedbackForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  open(): void {
    this.isOpen.set(true);
    this.feedbackForm.reset();
    this.selectedRating.set(0);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  close(): void {
    if (!this.submitting()) {
      this.isOpen.set(false);
      this.closed.emit();
    }
  }

  setRating(rating: number): void {
    this.selectedRating.set(rating);
    this.feedbackForm.patchValue({ rating });
  }

  getRatingLabel(rating: number): string {
    const labels: { [key: number]: string } = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating] || '';
  }

  onSubmit(): void {
    if (this.feedbackForm.valid) {
      this.submitting.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const request: CreateFeedbackRequest = {
        travelId: this.travelId,
        rating: this.feedbackForm.value.rating,
        comment: this.feedbackForm.value.comment
      };

      this.feedbackService.createFeedback(request).subscribe({
        next: () => {
          this.submitting.set(false);
          this.successMessage.set('Thank you for your feedback!');
          setTimeout(() => {
            this.submitted.emit();
            this.close();
          }, 2000);
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to submit feedback. Please try again.');
        }
      });
    }
  }
}
