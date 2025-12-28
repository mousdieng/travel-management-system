import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TravelService, AutocompleteSuggestion } from '../../../core/services/travel.service';
import { Travel } from '../../../core/models/travel.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-travel-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="relative w-full max-w-2xl">
      <!-- Search Input -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            (focus)="onFocus()"
            (blur)="onBlur()"
            placeholder="Search travels by destination, title, or category..."
            class="block w-full pl-12 pr-12 py-4 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
        >
        @if (searchQuery) {
          <button
              (mousedown)="$event.preventDefault(); clearSearch()"
              type="button"
              class="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        }
      </div>

      <!-- Autocomplete Dropdown -->
      @if (showDropdown() && (suggestions().length > 0 || isSearching())) {
        <div class="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
          <!-- Loading State -->
          @if (isSearching()) {
            <div class="p-4 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p class="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          }

          <!-- Suggestions List -->
          @if (!isSearching() && suggestions().length > 0) {
            <div class="py-2">
              @for (suggestion of suggestions(); track suggestion.id) {
                <a
                    [routerLink]="['/travels', suggestion.id]"
                    (mousedown)="$event.preventDefault()"
                    (click)="selectSuggestion(suggestion)"
                    class="flex items-center space-x-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <!-- Travel Icon -->
                  <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>

                  <!-- Travel Info -->
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-gray-900 truncate">{{ suggestion.title }}</h4>
                    <div class="flex items-center space-x-3 mt-1">
                      <div class="flex items-center space-x-1">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="text-xs text-gray-500 truncate">{{ suggestion.destination }}</span>
                      </div>
                      @if (suggestion.category) {
                        <span class="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                          {{ suggestion.category }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Price & Rating -->
                  <div class="flex-shrink-0 text-right">
                    <p class="text-sm font-bold text-primary-600">\${{ suggestion.price }}</p>
                    @if (suggestion.averageRating && suggestion.averageRating > 0) {
                      <div class="flex items-center justify-end space-x-1 mt-1">
                        <svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span class="text-xs text-gray-600">{{ suggestion.averageRating.toFixed(1) }}</span>
                      </div>
                    }
                  </div>
                </a>
              }
            </div>

            <!-- View All Results -->
            @if (searchQuery && suggestions().length > 0) {
              <div class="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <button
                    type="button"
                    (mousedown)="$event.preventDefault()"
                    (click)="viewAllResults()"
                    class="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all results for "{{ searchQuery }}"
                </button>
              </div>
            }
          }
        </div>
      }
    </div>
  `
})
export class TravelSearchComponent {
  @Output() suggestionSelected = new EventEmitter<AutocompleteSuggestion>();
  @Output() searchSubmitted = new EventEmitter<string>();

  searchQuery = '';
  suggestions = signal<AutocompleteSuggestion[]>([]);
  showDropdown = signal(false);
  isSearching = signal(false);

  private searchSubject = new Subject<string>();
  private blurTimeout: any;

  constructor(private travelService: TravelService) {
    // Set up autocomplete with debounce using Elasticsearch
    this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.trim().length < 2) {
            this.isSearching.set(false);
            return of([]);
          }
          this.isSearching.set(true);
          return this.travelService.autocompleteAll(query.trim(), 10);
        })
    ).subscribe({
      next: (results) => {
        this.suggestions.set(results);
        this.isSearching.set(false);
      },
      error: (error) => {
        console.error('Autocomplete error:', error);
        this.suggestions.set([]);
        this.isSearching.set(false);
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
    if (query && query.trim().length >= 2) {
      this.showDropdown.set(true);
    } else {
      this.suggestions.set([]);
    }
  }

  onFocus(): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }
    if (this.searchQuery && this.searchQuery.trim().length >= 2) {
      this.showDropdown.set(true);
    }
  }

  selectSuggestion(suggestion: AutocompleteSuggestion): void {
    this.suggestionSelected.emit(suggestion);
    this.showDropdown.set(false);
    // Navigation is handled by routerLink
  }

  viewAllResults(): void {
    this.searchSubmitted.emit(this.searchQuery);
    this.showDropdown.set(false);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions.set([]);
    this.showDropdown.set(false);
  }

  onBlur(): void {
    // Delay to allow click events on suggestions
    this.blurTimeout = setTimeout(() => {
      this.showDropdown.set(false);
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }
  }
}