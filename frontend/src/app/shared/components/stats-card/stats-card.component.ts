import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface TrendIndicator {
  value: number;
  direction: 'up' | 'down';
  label?: string;
}

export type StatsCardColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600 mb-1">{{ title }}</p>
          <p class="text-3xl font-bold text-gray-900">{{ formattedValue }}</p>

          @if (subtitle) {
            <p class="text-xs text-gray-500 mt-1">{{ subtitle }}</p>
          }

          @if (trend) {
            <div class="flex items-center mt-2">
              <span [class]="getTrendClass()">
                <svg
                  class="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  @if (trend.direction === 'up') {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  }
                </svg>
                {{ trend.value }}%
              </span>
              @if (trend.label) {
                <span class="text-xs text-gray-500 ml-2">{{ trend.label }}</span>
              }
            </div>
          }
        </div>

        <div [class]="getIconContainerClass()">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath()" />
          </svg>
        </div>
      </div>

      @if (link) {
        <div class="mt-4 pt-4 border-t border-gray-200">
          <a
            [routerLink]="link"
            class="text-sm font-medium hover:underline"
            [class]="getLinkClass()"
          >
            View Details →
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StatsCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: number | string;
  @Input({ required: true }) icon!: string;
  @Input() color: StatsCardColor = 'blue';
  @Input() trend?: TrendIndicator;
  @Input() subtitle?: string;
  @Input() link?: string;

  get formattedValue(): string {
    if (typeof this.value === 'number') {
      return this.value.toLocaleString();
    }
    return this.value;
  }

  getIconContainerClass(): string {
    const baseClasses = 'flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center';
    const colorMap: Record<StatsCardColor, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500'
    };
    return `${baseClasses} ${colorMap[this.color]}`;
  }

  getTrendClass(): string {
    const baseClasses = 'flex items-center text-sm font-medium';
    if (this.trend?.direction === 'up') {
      return `${baseClasses} text-green-600`;
    }
    return `${baseClasses} text-red-600`;
  }

  getLinkClass(): string {
    const colorMap: Record<StatsCardColor, string> = {
      blue: 'text-blue-600 hover:text-blue-800',
      green: 'text-green-600 hover:text-green-800',
      purple: 'text-purple-600 hover:text-purple-800',
      orange: 'text-orange-600 hover:text-orange-800',
      red: 'text-red-600 hover:text-red-800',
      yellow: 'text-yellow-600 hover:text-yellow-800'
    };
    return colorMap[this.color];
  }

  getIconPath(): string {
    const iconPaths: Record<string, string> = {
      'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      'currency': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'travel': 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'star': 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      'chart': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'trending-up': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      'trending-down': 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
      'check': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'alert': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'clock': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'briefcase': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    };
    return iconPaths[this.icon] || iconPaths['chart'];
  }
}
