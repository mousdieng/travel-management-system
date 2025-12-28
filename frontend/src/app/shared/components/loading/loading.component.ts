import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center p-8">
      <div class="spinner"></div>
      <span class="ml-3 text-gray-600">Loading...</span>
    </div>
  `
})
export class LoadingComponent {}
