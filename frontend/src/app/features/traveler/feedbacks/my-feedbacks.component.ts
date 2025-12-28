import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../../core/services/feedback.service';
import { Feedback } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-my-feedbacks',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  template: `
    <div class="page-container">
      <h1 class="section-title">My Reviews</h1>

      <app-loading *ngIf="loading"></app-loading>

      <div class="space-y-4" *ngIf="!loading">
        <div *ngFor="let feedback of feedbacks" class="card">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="text-lg font-semibold">{{ feedback.travelTitle }}</h3>
              <p class="text-sm text-gray-500">{{ feedback.createdAt | date:'medium' }}</p>
            </div>
            <div class="flex items-center">
              <span class="text-yellow-500 mr-1">★</span>
              <span class="font-semibold">{{ feedback.rating }}/5</span>
            </div>
          </div>
          <p class="text-gray-700">{{ feedback.comment }}</p>
        </div>
      </div>

      <div *ngIf="!loading && feedbacks.length === 0" class="text-center py-12">
        <p class="text-gray-500 text-lg">You haven't left any reviews yet.</p>
      </div>
    </div>
  `
})
export class MyFeedbacksComponent implements OnInit {
  feedbacks: Feedback[] = [];
  loading = false;

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    this.loading = true;
    this.feedbackService.getMyFeedbacks().subscribe({
      next: (feedbacks) => {
        this.feedbacks = feedbacks;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
