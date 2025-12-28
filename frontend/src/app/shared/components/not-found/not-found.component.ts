import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 class="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p class="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
        <a routerLink="/" class="btn-primary">Go Home</a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
