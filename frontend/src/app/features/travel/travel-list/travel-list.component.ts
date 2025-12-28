import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TravelService } from '../../../core/services/travel.service';
import { Travel } from '../../../core/models/travel.model';
import { TravelCardComponent } from '../../../shared/components/travel-card/travel-card.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-travel-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TravelCardComponent, LoadingComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Explore Travels</h1>

        <!-- Search Bar -->
        <div class="flex gap-4">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Search travels..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            (click)="loadTravels()"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Search
          </button>
        </div>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (travels().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (travel of travels(); track travel.id) {
            <app-travel-card [travel]="travel" />
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No travels found</h3>
          <p class="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
        </div>
      }
    </div>
  `
})
export class TravelListComponent implements OnInit {
  private travelService = inject(TravelService);

  travels = signal<Travel[]>([]);
  loading = signal(true);
  searchQuery = '';

  ngOnInit(): void {
    this.loadTravels();
  }

  loadTravels(): void {
    this.loading.set(true);
    if (this.searchQuery.trim()) {
      this.travelService.search(this.searchQuery).subscribe({
        next: (travels) => {
          this.travels.set(travels);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.travelService.getAvailable().subscribe({
        next: (travels) => {
          this.travels.set(travels);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  onSearch(): void {
    if (this.searchQuery.length >= 3 || this.searchQuery.length === 0) {
      this.loadTravels();
    }
  }
}
