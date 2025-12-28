import { Component, OnInit, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TravelService, AutocompleteSuggestion } from '../../../core/services/travel.service';
import { TravelCardComponent } from '../../../shared/components/travel-card/travel-card.component';
import { debounceTime, Subject } from 'rxjs';

interface TravelItem {
  id: string | number;
  title: string;
  description: string;
  destination: string;
  category: string;
  price: number;
  averageRating: number;
  totalReviews: number;
  images?: string[];
  startDate?: any;
  endDate?: any;
  maxParticipants?: number;
  currentParticipants?: number;
  active?: boolean;
}

@Component({
  selector: 'app-travel-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TravelCardComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header with Search -->
      <div class="bg-white border-b border-gray-200">
        <div class="container mx-auto px-4 py-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-6">Explore Travels</h1>

          <!-- Enhanced Search Bar with Autocomplete -->
          <div class="max-w-2xl">
            <div class="relative" #searchContainer>
              <input
                #searchInput
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchInput($event)"
                (focus)="onSearchFocus()"
                (keydown)="onKeyDown($event)"
                placeholder="Search destinations, categories, or keywords..."
                class="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autocomplete="off"
              />

              <!-- Search Icon -->
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              <!-- Clear Button -->
              @if (searchQuery) {
                <button
                  (click)="clearSearch()"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              }

              <!-- Autocomplete Dropdown -->
              @if (showSuggestions() && autocompleteSuggestions().length > 0) {
                <div class="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                  @for (suggestion of autocompleteSuggestions(); track suggestion.id; let i = $index) {
                    <div
                      (click)="selectSuggestion(suggestion)"
                      [class.bg-indigo-50]="selectedSuggestionIndex() === i"
                      class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <h4 class="font-semibold text-gray-900">{{ suggestion.title }}</h4>
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              {{ suggestion.category }}
                            </span>
                          </div>
                          <div class="flex items-center gap-4 text-sm text-gray-600">
                            <div class="flex items-center gap-1">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                              </svg>
                              <span>{{ suggestion.destination }}</span>
                            </div>
                            @if (suggestion.city) {
                              <span>• {{ suggestion.city }}, {{ suggestion.country }}</span>
                            }
                            @if (suggestion.averageRating > 0) {
                              <div class="flex items-center gap-1">
                                <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                                <span class="font-medium">{{ suggestion.averageRating.toFixed(1) }}</span>
                              </div>
                            }
                          </div>
                        </div>
                        <div class="ml-4 flex-shrink-0">
                          <span class="text-lg font-bold text-indigo-600">\${{ suggestion.price }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Autocomplete Loading -->
              @if (autocompleteLoading()) {
                <div class="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 px-4 py-3">
                  <div class="flex items-center gap-2 text-gray-600">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span class="text-sm">Searching...</span>
                  </div>
                </div>
              }

              <!-- No Suggestions Found -->
              @if (showSuggestions() && !autocompleteLoading() && autocompleteSuggestions().length === 0 && searchQuery.length >= 2) {
                <div class="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 px-4 py-3">
                  <p class="text-sm text-gray-600">No suggestions found for "{{ searchQuery }}"</p>
                </div>
              }
            </div>

            <!-- Search Tips -->
            <div class="mt-2 text-xs text-gray-500 flex items-center gap-4">
              <span>💡 Try searching by destination, category, or keywords</span>
              @if (searchQuery.length > 0 && searchQuery.length < 2) {
                <span class="text-amber-600">Type at least 2 characters</span>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col lg:flex-row gap-8">

          <!-- Filters Sidebar -->
          <aside class="lg:w-64 flex-shrink-0">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">Filters</h2>
                @if (hasActiveFilters()) {
                  <button
                    (click)="clearAllFilters()"
                    class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Clear all
                  </button>
                }
              </div>

              <!-- Categories -->
              <div class="mb-6">
                <h3 class="text-sm font-medium text-gray-900 mb-3">Category</h3>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  @for (cat of categories; track cat) {
                    <label class="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        [checked]="selectedCategories().includes(cat)"
                        (change)="toggleCategory(cat)"
                        class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span class="ml-2 text-sm text-gray-700">{{ cat }}</span>
                    </label>
                  }
                </div>
              </div>

              <!-- Price Range -->
              <div class="mb-6">
                <h3 class="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs text-gray-600">Min Price</label>
                    <input
                      type="number"
                      [(ngModel)]="minPrice"
                      (ngModelChange)="onPriceChange()"
                      placeholder="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label class="text-xs text-gray-600">Max Price</label>
                    <input
                      type="number"
                      [(ngModel)]="maxPrice"
                      (ngModelChange)="onPriceChange()"
                      placeholder="10000"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Sort -->
              <div>
                <h3 class="text-sm font-medium text-gray-900 mb-3">Sort By</h3>
                <select
                  [(ngModel)]="sortBy"
                  (ngModelChange)="onSortChange()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </aside>

          <!-- Results -->
          <main class="flex-1">
            <!-- Results Header -->
            <div class="flex items-center justify-between mb-6">
              <p class="text-gray-600">
                <span class="font-semibold text-gray-900">{{ filteredTravels().length }}</span>
                travel{{ filteredTravels().length !== 1 ? 's' : '' }} found
                @if (searchQuery) {
                  <span class="ml-1">for "<span class="font-semibold text-indigo-600">{{ searchQuery }}</span>"</span>
                }
              </p>
            </div>

            <!-- Loading State -->
            @if (loading()) {
              <div class="flex justify-center items-center py-20">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            }

            <!-- Travel Grid -->
            @if (!loading() && filteredTravels().length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                @for (travel of filteredTravels(); track travel.id) {
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <a [routerLink]="['/travels', travel.id]" class="block">
                      <!-- Image -->
                      <div class="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600">
                        @if (travel.images && travel.images.length > 0) {
                          <img [src]="travel.images[0]" [alt]="travel.title" class="w-full h-full object-cover">
                        } @else {
                          <div class="w-full h-full flex items-center justify-center">
                            <svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                        }
                        <div class="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-lg">
                          <span class="text-sm font-bold text-gray-900">\${{ travel.price }}</span>
                        </div>
                      </div>

                      <!-- Content -->
                      <div class="p-4">
                        <div class="mb-2">
                          @if (travel.category) {
                            <span class="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                              {{ travel.category }}
                            </span>
                          }
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{{ travel.title }}</h3>
                        <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ travel.description }}</p>

                        <div class="flex items-center justify-between text-sm">
                          <div class="flex items-center text-gray-600">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            </svg>
                            <span class="line-clamp-1">{{ travel.destination }}</span>
                          </div>
                          @if (travel.averageRating > 0) {
                            <div class="flex items-center">
                              <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                              <span class="ml-1 font-medium text-gray-900">{{ travel.averageRating.toFixed(1) }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    </a>
                  </div>
                }
              </div>
            }

            <!-- Empty State -->
            @if (!loading() && filteredTravels().length === 0) {
              <div class="text-center py-20">
                <svg class="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">No travels found</h3>
                <p class="text-gray-600 mb-6">Try adjusting your search or filters</p>
                <button
                  (click)="clearAllFilters()"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            }
          </main>
        </div>
      </div>
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
export class TravelListComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer') searchContainer!: ElementRef<HTMLDivElement>;

  searchQuery = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy = 'relevance';

  allTravels = signal<TravelItem[]>([]);
  filteredTravels = signal<TravelItem[]>([]);
  selectedCategories = signal<string[]>([]);
  loading = signal(false);

  // Autocomplete state
  autocompleteSuggestions = signal<AutocompleteSuggestion[]>([]);
  autocompleteLoading = signal(false);
  showSuggestions = signal(false);
  selectedSuggestionIndex = signal(-1);

  private searchSubject = new Subject<string>();

  categories = [
    'Adventure',
    'Beach & Coastal',
    'City Break',
    'Cultural & Heritage',
    'Cruise',
    'Eco-Tourism',
    'Family Vacation',
    'Food & Wine',
    'Honeymoon & Romance',
    'Luxury Travel',
    'Mountain & Hiking',
    'Safari & Wildlife',
    'Ski & Snow',
    'Backpacking',
    'Business Travel',
    'Road Trip',
    'Wellness & Spa'
  ];

  constructor(
    private travelService: TravelService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadTravels();
    this.setupAutocomplete();
  }

  private setupAutocomplete(): void {
    // Debounce search input for autocomplete
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(query => {
      if (query.trim().length >= 2) {
        this.fetchAutocompleteSuggestions(query);
      } else {
        this.autocompleteSuggestions.set([]);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close autocomplete dropdown when clicking outside
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target as Node)) {
      this.showSuggestions.set(false);
    }
  }

  onSearchInput(query: string): void {
    this.searchSubject.next(query);

    // Perform full search when query is empty or >= 2 characters
    if (query.trim().length >= 2) {
      this.performSearch(query);
    } else if (query.trim().length === 0) {
      this.loadTravels();
    }
  }

  onSearchFocus(): void {
    if (this.searchQuery.trim().length >= 2 && this.autocompleteSuggestions().length > 0) {
      this.showSuggestions.set(true);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    const suggestions = this.autocompleteSuggestions();
    const currentIndex = this.selectedSuggestionIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (suggestions.length > 0) {
          const newIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
          this.selectedSuggestionIndex.set(newIndex);
          this.showSuggestions.set(true);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (suggestions.length > 0) {
          const newIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
          this.selectedSuggestionIndex.set(newIndex);
          this.showSuggestions.set(true);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < suggestions.length) {
          this.selectSuggestion(suggestions[currentIndex]);
        } else if (this.searchQuery.trim()) {
          this.performSearch(this.searchQuery);
          this.showSuggestions.set(false);
        }
        break;

      case 'Escape':
        this.showSuggestions.set(false);
        this.selectedSuggestionIndex.set(-1);
        break;
    }
  }

  private fetchAutocompleteSuggestions(query: string): void {
    this.autocompleteLoading.set(true);
    this.travelService.autocompleteAll(query, 8).subscribe({
      next: (suggestions) => {
        this.autocompleteSuggestions.set(suggestions);
        this.autocompleteLoading.set(false);
        this.showSuggestions.set(true);
        this.selectedSuggestionIndex.set(-1);
      },
      error: (error) => {
        console.error('Autocomplete error:', error);
        this.autocompleteLoading.set(false);
        this.autocompleteSuggestions.set([]);
      }
    });
  }

  selectSuggestion(suggestion: AutocompleteSuggestion): void {
    // Navigate to travel detail page
    this.router.navigate(['/travels', suggestion.id]);
    this.showSuggestions.set(false);
    this.selectedSuggestionIndex.set(-1);
  }

  private performSearch(query: string): void {
    this.loading.set(true);
    this.travelService.advancedSearch(query, 100).subscribe({
      next: (documents) => {
        this.allTravels.set(documents as any[]);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.loading.set(false);
      }
    });
  }

  loadTravels(): void {
    this.loading.set(true);
    this.travelService.getAllTravels().subscribe({
      next: (travels) => {
        this.allTravels.set(travels as any[]);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading travels:', error);
        this.loading.set(false);
      }
    });
  }

  toggleCategory(category: string): void {
    const selected = this.selectedCategories();
    if (selected.includes(category)) {
      this.selectedCategories.set(selected.filter(c => c !== category));
    } else {
      this.selectedCategories.set([...selected, category]);
    }
    this.applyFilters();
  }

  onPriceChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let results = [...this.allTravels()];

    // Filter by categories
    if (this.selectedCategories().length > 0) {
      results = results.filter(t =>
        t.category && this.selectedCategories().includes(t.category)
      );
    }

    // Filter by price
    if (this.minPrice !== null && this.minPrice > 0) {
      results = results.filter(t => t.price >= this.minPrice!);
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      results = results.filter(t => t.price <= this.maxPrice!);
    }

    // Sort
    results = this.sortTravels(results);

    this.filteredTravels.set(results);
  }

  sortTravels(travels: TravelItem[]): TravelItem[] {
    switch (this.sortBy) {
      case 'price-low':
        return travels.sort((a, b) => a.price - b.price);
      case 'price-high':
        return travels.sort((a, b) => b.price - a.price);
      case 'rating':
        return travels.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'newest':
        return travels.sort((a, b) => {
          const dateA = new Date(a.startDate || 0).getTime();
          const dateB = new Date(b.startDate || 0).getTime();
          return dateB - dateA;
        });
      case 'relevance':
      default:
        return travels;
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.autocompleteSuggestions.set([]);
    this.showSuggestions.set(false);
    this.loadTravels();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.selectedCategories.set([]);
    this.sortBy = 'relevance';
    this.autocompleteSuggestions.set([]);
    this.showSuggestions.set(false);
    this.loadTravels();
  }

  hasActiveFilters(): boolean {
    return this.selectedCategories().length > 0 ||
           (this.minPrice !== null && this.minPrice > 0) ||
           (this.maxPrice !== null && this.maxPrice > 0) ||
           this.searchQuery.length > 0;
  }
}
