import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="section-title">Analytics & Reports</h1>
      <div class="card">
        <p class="text-gray-600">Advanced analytics dashboard with charts and graphs coming soon...</p>
      </div>
    </div>
  `
})
export class AdminAnalyticsComponent {}
