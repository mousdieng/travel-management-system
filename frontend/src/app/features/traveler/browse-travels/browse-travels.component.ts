import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TravelService, AutocompleteSuggestion } from '../../../core/services/travel.service';
import { Travel, TravelDocument } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { TravelSearchComponent } from '../../../shared/components/travel-search/travel-search.component';
import { TravelCardComponent } from '../../../shared/components/travel-card/travel-card.component';

@Component({
  selector: 'app-browse-travels',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingComponent, TravelSearchComponent, TravelCardComponent],
  template: `
    <!-- Hero Section with Modern Gradient -->
    <div class="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <!-- Animated Background Shapes -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div class="absolute top-60 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
        <div class="absolute bottom-20 right-1/3 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" style="animation-delay: 4s;"></div>
      </div>

      <div class="relative container mx-auto px-4 py-20 lg:py-28">
        <div class="text-center text-white space-y-8 animate-slide-up">
          <!-- Title -->
          <div class="space-y-4">
            <h1 class="text-5xl lg:text-7xl font-display font-black leading-tight">
              Discover Your Next
              <span class="block mt-2 gradient-text bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200">
                Adventure
              </span>
            </h1>
            <p class="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Explore extraordinary travel destinations and create unforgettable memories around the world
            </p>
          </div>

          <!-- Search Bar -->
          <div class="max-w-3xl mx-auto animate-fade-in" style="animation-delay: 0.2s;">
            <app-travel-search
              (searchSubmitted)="onSearchSubmitted($event)"
              (suggestionSelected)="onSuggestionSelected($event)"
            ></app-travel-search>
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 animate-fade-in" style="animation-delay: 0.4s;">
            <div class="glass px-6 py-4 rounded-xl backdrop-blur-md">
              <div class="text-3xl font-black">{{ travels.length }}</div>
              <div class="text-blue-200 text-sm font-medium">Available Trips</div>
            </div>
            <div class="glass px-6 py-4 rounded-xl backdrop-blur-md">
              <div class="text-3xl font-black">{{ getAvailableDestinations() }}</div>
              <div class="text-blue-200 text-sm font-medium">Destinations</div>
            </div>
            <div class="glass px-6 py-4 rounded-xl backdrop-blur-md">
              <div class="text-3xl font-black">4.9★</div>
              <div class="text-blue-200 text-sm font-medium">Avg Rating</div>
            </div>
            <div class="glass px-6 py-4 rounded-xl backdrop-blur-md">
              <div class="text-3xl font-black">24/7</div>
              <div class="text-blue-200 text-sm font-medium">Support</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wave Divider -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" class="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                fill="currentColor" class="text-gray-50"/>
        </svg>
      </div>
    </div>

    <!-- Filters and Content Section -->
    <div class="bg-gray-50 min-h-screen">
      <div class="container-page py-12">

        <!-- Filters Bar -->
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-slide-up">
          <div class="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">

            <!-- Left: Filters -->
            <div class="flex flex-wrap gap-4 flex-1">
              <!-- Category Filter -->
              <div class="relative">
                <button
                  (click)="toggleFilters()"
                  class="btn-outline flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                  </svg>
                  Filters
                  @if (activeFiltersCount() > 0) {
                    <span class="badge badge-gradient text-xs">{{ activeFiltersCount() }}</span>
                  }
                </button>

                <!-- Filter Dropdown -->
                @if (showFilters) {
                  <div class="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50 animate-scale-in">
                    <div class="space-y-6">
                      <!-- Price Range -->
                      <div>
                        <label class="label mb-3">Price Range</label>
                        <div class="flex gap-3">
                          <input type="number"
                                 [(ngModel)]="filters.minPrice"
                                 placeholder="Min"
                                 class="input-field flex-1 text-sm">
                          <input type="number"
                                 [(ngModel)]="filters.maxPrice"
                                 placeholder="Max"
                                 class="input-field flex-1 text-sm">
                        </div>
                      </div>

                      <!-- Availability -->
                      <div>
                        <label class="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox"
                                 [(ngModel)]="filters.availableOnly"
                                 class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                          <span class="text-sm font-medium text-gray-700">Available spots only</span>
                        </label>
                      </div>

                      <!-- Active Only -->
                      <div>
                        <label class="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox"
                                 [(ngModel)]="filters.activeOnly"
                                 class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                          <span class="text-sm font-medium text-gray-700">Active travels only</span>
                        </label>
                      </div>

                      <!-- Actions -->
                      <div class="flex gap-3 pt-4 border-t border-gray-200">
                        <button (click)="clearFilters()" class="btn-ghost flex-1 text-sm">
                          Clear All
                        </button>
                        <button (click)="applyFilters()" class="btn-primary flex-1 text-sm">
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Active Filters Tags -->
              @if (activeFiltersCount() > 0) {
                <div class="flex flex-wrap gap-2">
                  @if (filters.minPrice !== null) {
                    <span class="badge bg-blue-100 text-blue-700 flex items-center gap-2">
                      Min: \${{ filters.minPrice }}
                      <button (click)="removeFilter('minPrice')" class="hover:text-blue-900">×</button>
                    </span>
                  }
                  @if (filters.maxPrice !== null) {
                    <span class="badge bg-blue-100 text-blue-700 flex items-center gap-2">
                      Max: \${{ filters.maxPrice }}
                      <button (click)="removeFilter('maxPrice')" class="hover:text-blue-900">×</button>
                    </span>
                  }
                  @if (filters.availableOnly) {
                    <span class="badge bg-green-100 text-green-700 flex items-center gap-2">
                      Available Only
                      <button (click)="removeFilter('availableOnly')" class="hover:text-green-900">×</button>
                    </span>
                  }
                  @if (filters.activeOnly) {
                    <span class="badge bg-purple-100 text-purple-700 flex items-center gap-2">
                      Active Only
                      <button (click)="removeFilter('activeOnly')" class="hover:text-purple-900">×</button>
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Right: Sort and View Options -->
            <div class="flex items-center gap-4">
              <!-- Sort Dropdown -->
              <select [(ngModel)]="sortBy"
                      (change)="onSortChange()"
                      class="input-field text-sm min-w-[200px]">
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
                <option value="date">Departure Date</option>
              </select>

              <!-- Results Count -->
              <div class="text-sm text-gray-600 whitespace-nowrap">
                <span class="font-semibold text-gray-900">{{ filteredTravels.length }}</span> travels
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        @if (loading) {
          <div class="flex justify-center items-center py-20">
            <div class="text-center space-y-4">
              <div class="spinner spinner-lg mx-auto"></div>
              <p class="text-gray-600 font-medium">Loading amazing travels...</p>
            </div>
          </div>
        }

        <!-- Travel Grid -->
        @if (!loading && filteredTravels.length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-animation">
            @for (travel of filteredTravels; track travel.id) {
              <app-travel-card [travel]="travel"></app-travel-card>
            }
          </div>
        }

        <!-- Empty State -->
        @if (!loading && filteredTravels.length === 0) {
          <div class="text-center py-20 animate-fade-in">
            <div class="max-w-md mx-auto space-y-6">
              <!-- Empty State Icon -->
              <div class="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              <!-- Empty State Message -->
              <div class="space-y-3">
                <h3 class="text-2xl font-bold text-gray-900">No travels found</h3>
                <p class="text-gray-600">
                  We couldn't find any travels matching your criteria.
                  <br>Try adjusting your filters or search query.
                </p>
              </div>

              <!-- Clear Filters Button -->
              @if (activeFiltersCount() > 0 || searchQuery) {
                <button (click)="resetAll()" class="btn-primary mt-6">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Reset All Filters
                </button>
              }
            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class BrowseTravelsComponent implements OnInit {
  travels: Travel[] = [];
  filteredTravels: Travel[] = [];
  loading = false;
  searchQuery = '';
  sortBy = 'newest';
  showFilters = false;

  filters = {
    minPrice: null as number | null,
    maxPrice: null as number | null,
    availableOnly: false,
    activeOnly: true
  };

  constructor(
    private travelService: TravelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTravels();
  }

  loadTravels(): void {
    this.loading = true;
    this.travelService.getAllTravels().subscribe({
      next: (travels) => {
        this.travels = travels;
        this.applyFiltersAndSort();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearchSubmitted(query: string): void {
    this.searchQuery = query;
    if (query.trim()) {
      this.loading = true;
      // Use Elasticsearch advanced search for better results
      this.travelService.advancedSearch(query, 100).subscribe({
        next: (documents) => {
          this.travels = documents.map(this.mapTravelDocumentToTravel);
          this.applyFiltersAndSort();
          this.loading = false;
        },
        error: (err) => {
          console.error('Search error:', err);
          // Fallback to regular search if Elasticsearch fails and query is not empty
          if (query.trim()) {
            this.travelService.searchByKeyword(query).subscribe({
              next: (travels) => {
                this.travels = travels;
                this.applyFiltersAndSort();
                this.loading = false;
              },
              error: () => {
                this.loading = false;
                // If fallback also fails, load all travels
                this.loadTravels();
              }
            });
          } else {
            // If no query, just load all travels
            this.loadTravels();
          }
        }
      });
    } else {
      this.loadTravels();
    }
  }

  mapTravelDocumentToTravel(doc: TravelDocument): Travel {
    return {
      ...doc,
      // Add any missing properties from Travel that are not in TravelDocument
      // For example, if Travel has properties that TravelDocument doesn't,
      // you can provide default values here.
      status: doc.active ? 'PUBLISHED' : 'DRAFT', // Example mapping
      images: [], // Assuming images are not in TravelDocument
      itinerary: null, // Assuming itinerary is not in TravelDocument
      // Add other missing properties with default values
      state: '', // TravelDocument doesn't have state property
      departureDate: doc.startDate, // Or some other logic
      returnDate: doc.endDate, // Or some other logic
      totalFeedbacks: doc.totalReviews,
      included: [],
      excluded: [],
      managerId: doc.travelManagerId.toString(),
      managerName: doc.travelManagerName,
      imageKeys: []
    } as Travel;
  }

  onSuggestionSelected(suggestion: AutocompleteSuggestion): void {
    // Navigate to the travel detail page
    this.router.navigate(['/travels', suggestion.id]);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    this.applyFiltersAndSort();
    this.showFilters = false;
  }

  applyFiltersAndSort(): void {
    let result = [...this.travels];

    // Apply price filters
    if (this.filters.minPrice !== null) {
      result = result.filter(t => t.price >= this.filters.minPrice!);
    }
    if (this.filters.maxPrice !== null) {
      result = result.filter(t => t.price <= this.filters.maxPrice!);
    }

    // Apply availability filter
    if (this.filters.availableOnly) {
      result = result.filter(t => t.currentParticipants < t.maxParticipants);
    }

    // Apply active filter
    if (this.filters.activeOnly) {
      result = result.filter(t => t.active);
    }

    // Apply sorting
    result = this.sortTravels(result);

    this.filteredTravels = result;
  }

  sortTravels(travels: Travel[]): Travel[] {
    switch (this.sortBy) {
      case 'price-low':
        return travels.sort((a, b) => a.price - b.price);
      case 'price-high':
        return travels.sort((a, b) => b.price - a.price);
      case 'rating':
        return travels.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'popular':
        return travels.sort((a, b) => b.currentParticipants - a.currentParticipants);
      case 'date':
        return travels.sort((a, b) => {
          const dateA = new Date(a.startDate || a.departureDate).getTime();
          const dateB = new Date(b.startDate || b.departureDate).getTime();
          return dateA - dateB;
        });
      case 'newest':
      default:
        return travels.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
    }
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  clearFilters(): void {
    this.filters = {
      minPrice: null,
      maxPrice: null,
      availableOnly: false,
      activeOnly: true
    };
    this.applyFiltersAndSort();
    this.showFilters = false;
  }

  removeFilter(filterKey: string): void {
    switch (filterKey) {
      case 'minPrice':
        this.filters.minPrice = null;
        break;
      case 'maxPrice':
        this.filters.maxPrice = null;
        break;
      case 'availableOnly':
        this.filters.availableOnly = false;
        break;
      case 'activeOnly':
        this.filters.activeOnly = false;
        break;
    }
    this.applyFiltersAndSort();
  }

  activeFiltersCount(): number {
    let count = 0;
    if (this.filters.minPrice !== null) count++;
    if (this.filters.maxPrice !== null) count++;
    if (this.filters.availableOnly) count++;
    if (this.filters.activeOnly) count++;
    return count;
  }

  resetAll(): void {
    this.searchQuery = '';
    this.clearFilters();
    this.loadTravels();
  }

  getAvailableDestinations(): number {
    const destinations = new Set(this.travels.map(t => t.destination));
    return destinations.size;
  }
}
