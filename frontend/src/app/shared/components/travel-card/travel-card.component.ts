import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Travel } from '../../../core/models/travel.model';

@Component({
  selector: 'app-travel-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">

      <!-- Image Section -->
      <div class="relative h-64 overflow-hidden">
        @if (travel.images && travel.images.length > 0) {
          <img
            [src]="travel.images[0]"
            [alt]="travel.title"
            class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700">

          <!-- Gradient Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
        } @else {
          <div class="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <svg class="h-20 w-20 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        }

        <!-- Status Badges -->
        <div class="absolute top-4 left-4 flex flex-col gap-2">
          @if (!travel.active) {
            <span class="badge bg-red-500 text-white shadow-lg backdrop-blur-sm">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/>
              </svg>
              Inactive
            </span>
          }
          @if (travel.currentParticipants >= travel.maxParticipants) {
            <span class="badge bg-yellow-500 text-white shadow-lg backdrop-blur-sm">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              Full
            </span>
          } @else if (getAvailableSpots() <= 3 && getAvailableSpots() > 0) {
            <span class="badge bg-orange-500 text-white shadow-lg backdrop-blur-sm animate-pulse">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              Only {{ getAvailableSpots() }} left
            </span>
          }
        </div>

        <!-- Category Badge -->
        @if (travel.category) {
          <div class="absolute top-4 right-4">
            <span class="glass px-3 py-1.5 rounded-full text-xs font-bold text-white backdrop-blur-md shadow-lg">
              {{ travel.category }}
            </span>
          </div>
        }

        <!-- Rating Overlay -->
        @if (travel.averageRating && travel.averageRating > 0) {
          <div class="absolute bottom-4 left-4">
            <div class="glass px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md shadow-lg">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="ml-1 font-bold text-white">{{ travel.averageRating.toFixed(1) }}</span>
              </div>
              <span class="text-white/80 text-xs">({{ travel.totalReviews || 0 }})</span>
            </div>
          </div>
        }

        <!-- Price Tag -->
        <div class="absolute bottom-4 right-4">
          <div class="bg-white rounded-xl px-4 py-2 shadow-xl">
            <div class="text-xs text-gray-500">From</div>
            <div class="text-2xl font-black gradient-text">\${{ travel.price }}</div>
          </div>
        </div>
      </div>

      <!-- Content Section -->
      <div class="p-6 space-y-4">

        <!-- Title -->
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
            {{ travel.title }}
          </h3>
          <p class="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {{ travel.description }}
          </p>
        </div>

        <!-- Details Grid -->
        <div class="space-y-3">

          <!-- Location -->
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span class="font-medium">{{ travel.destination }}{{ travel.city ? ', ' + travel.city : '' }}</span>
          </div>

          <!-- Dates -->
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <div class="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span class="font-medium">{{ formatDateRange(travel.startDate, travel.endDate) }}</span>
          </div>

          <!-- Participants -->
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <div class="flex-shrink-0 w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span class="font-medium">{{ travel.currentParticipants }} / {{ travel.maxParticipants }} participants</span>
          </div>

        </div>

        <!-- Progress Bar -->
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-gray-600">
            <span>Availability</span>
            <span class="font-semibold">{{ getAvailabilityPercentage() }}% booked</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              [class]="getProgressBarColor()"
              [style.width.%]="getAvailabilityPercentage()">
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <a
          [routerLink]="['/travels', travel.id]"
          class="group/btn w-full btn-primary flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
          View Details
          <svg class="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>

        <!-- Manager Info -->
        @if (travel.travelManagerName) {
          <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                <span class="text-white text-xs font-bold">{{ travel.travelManagerName.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="text-xs">
                <div class="text-gray-500">Managed by</div>
                <div class="font-semibold text-gray-900">{{ travel.travelManagerName }}</div>
              </div>
            </div>

            @if (getDaysUntilStart() !== null) {
              <div class="text-right">
                <div class="text-xs text-gray-500">Starts in</div>
                <div class="font-bold text-blue-600">{{ getDaysUntilStart() }} days</div>
              </div>
            }
          </div>
        }

      </div>

      <!-- Hover Glow Effect -->
      <div class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
           style="box-shadow: 0 0 40px rgba(59, 130, 246, 0.3);"></div>
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
export class TravelCardComponent {
  @Input({ required: true }) travel!: Travel;

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateRange(startDate: Date | string | undefined, endDate: Date | string | undefined): string {
    if (!startDate || !endDate) return 'TBD';

    const start = new Date(startDate);
    const end = new Date(endDate);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  }

  getAvailableSpots(): number {
    return this.travel.maxParticipants - this.travel.currentParticipants;
  }

  getAvailabilityPercentage(): number {
    return Math.round((this.travel.currentParticipants / this.travel.maxParticipants) * 100);
  }

  getProgressBarColor(): string {
    const percentage = this.getAvailabilityPercentage();
    if (percentage >= 90) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (percentage >= 70) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    if (percentage >= 50) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-green-500 to-green-600';
  }

  getDaysUntilStart(): number | null {
    const startDate = this.travel.startDate || this.travel.departureDate;
    if (!startDate) return null;

    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : null;
  }
}
