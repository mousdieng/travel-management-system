import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TravelService } from '../../../core/services/travel.service';
import { Travel, TravelStatus } from '../../../core/models';

@Component({
  selector: 'app-my-travels',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">My Travels</h1>
          <p class="text-gray-600 mt-1">Manage your travel offerings</p>
        </div>
        <a routerLink="/manager/travels/create"
           class="mt-4 md:mt-0 btn-primary flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create New Travel
        </a>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text"
                     [(ngModel)]="searchQuery"
                     (ngModelChange)="filterTravels()"
                     placeholder="Search travels..."
                     class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            </div>
          </div>

          <!-- Status Filter -->
          <select [(ngModel)]="statusFilter"
                  (ngModelChange)="filterTravels()"
                  class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <!-- Sort -->
          <select [(ngModel)]="sortBy"
                  (ngModelChange)="filterTravels()"
                  class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="subscribers">Most Subscribers</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && filteredTravels().length === 0" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          {{ searchQuery || statusFilter ? 'No travels found' : 'No travels created yet' }}
        </h3>
        <p class="text-gray-500 mb-6">
          {{ searchQuery || statusFilter ? 'Try adjusting your filters' : 'Start by creating your first travel offering' }}
        </p>
        <a *ngIf="!searchQuery && !statusFilter"
           routerLink="/manager/travels/create"
           class="btn-primary inline-flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Your First Travel
        </a>
      </div>

      <!-- Travels Grid -->
      <div *ngIf="!loading() && filteredTravels().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let travel of filteredTravels()"
             class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <!-- Travel Image -->
          <div class="relative">
            <img [src]="travel.images[0] || 'assets/images/travel-placeholder.jpg'"
                 [alt]="travel.title"
                 class="w-full h-48 object-cover">
            <span [class]="'absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ' + getStatusClass(travel.status)">
              {{ travel.status }}
            </span>
          </div>

          <!-- Travel Details -->
          <div class="p-5">
            <h3 class="text-lg font-semibold text-gray-900 mb-1 truncate">{{ travel.title }}</h3>
            <p class="text-gray-500 text-sm mb-3 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ travel.destination }}
            </p>

            <!-- Stats Row -->
            <div class="flex items-center justify-between text-sm mb-4">
              <div class="flex items-center gap-4">
                <span class="text-gray-600">
                  <span class="font-semibold text-primary-600">{{ travel.currentParticipants }}</span>/{{ travel.maxParticipants }} travelers
                </span>
              </div>
              <span class="text-2xl font-bold text-gray-900">\${{ travel.price }}</span>
            </div>

            <!-- Date Info -->
            <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ travel.departureDate | date:'mediumDate' }} - {{ travel.returnDate | date:'mediumDate' }}
            </div>

            <!-- Rating -->
            <div *ngIf="travel.averageRating" class="flex items-center gap-2 mb-4">
              <div class="flex text-yellow-400">
                <svg *ngFor="let star of [1,2,3,4,5]" class="w-4 h-4"
                     [class.text-yellow-400]="star <= (travel.averageRating || 0)"
                     [class.text-gray-300]="star > (travel.averageRating || 0)"
                     fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <span class="text-sm text-gray-600">{{ travel.averageRating | number:'1.1-1' }} ({{ travel.totalFeedbacks || 0 }} reviews)</span>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <a [routerLink]="['/manager/travels', travel.id, 'edit']"
                 class="flex-1 btn-outline text-sm py-2 text-center">
                Edit
              </a>
              <a [routerLink]="['/manager/travels', travel.id]"
                 class="flex-1 btn-secondary text-sm py-2 text-center">
                View
              </a>
              <button (click)="openDeleteModal(travel)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>

            <!-- Quick Actions -->
            <div class="mt-3 pt-3 border-t border-gray-100 flex gap-2">
              <button *ngIf="travel.status === 'DRAFT'"
                      (click)="publishTravel(travel)"
                      class="flex-1 text-sm text-green-600 hover:text-green-700 font-medium">
                Publish
              </button>
              <button *ngIf="travel.status === 'PUBLISHED'"
                      (click)="cancelTravel(travel)"
                      class="flex-1 text-sm text-red-600 hover:text-red-700 font-medium">
                Cancel
              </button>
              <a [routerLink]="['/manager/travels', travel.id, 'subscribers']"
                 class="flex-1 text-sm text-primary-600 hover:text-primary-700 font-medium text-center">
                Subscribers ({{ travel.currentParticipants }})
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="showDeleteModal()"
           class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Delete Travel</h3>
          <p class="text-gray-600 mb-6">
            Are you sure you want to delete "{{ travelToDelete()?.title }}"? This action cannot be undone.
          </p>
          <div class="flex gap-3">
            <button (click)="closeDeleteModal()"
                    class="flex-1 btn-outline">
              Cancel
            </button>
            <button (click)="confirmDelete()"
                    class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyTravelsComponent implements OnInit {
  loading = signal(true);
  travels = signal<Travel[]>([]);
  filteredTravels = signal<Travel[]>([]);
  showDeleteModal = signal(false);
  travelToDelete = signal<Travel | null>(null);

  searchQuery = '';
  statusFilter = '';
  sortBy = 'newest';

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.loadTravels();
  }

  loadTravels(): void {
    this.loading.set(true);
    this.travelService.getMyTravels().subscribe({
      next: (travels) => {
        this.travels.set(travels);
        this.filterTravels();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading travels:', err);
        this.travels.set([]);
        this.filteredTravels.set([]);
        this.loading.set(false);
      }
    });
  }

  filterTravels(): void {
    let filtered = [...this.travels()];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.destination.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(t => t.status === this.statusFilter);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'subscribers':
        filtered.sort((a, b) => b.currentParticipants - a.currentParticipants);
        break;
    }

    this.filteredTravels.set(filtered);
  }

  getStatusClass(status: TravelStatus): string {
    const classes: Record<TravelStatus, string> = {
      [TravelStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [TravelStatus.PUBLISHED]: 'bg-green-100 text-green-800',
      [TravelStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [TravelStatus.COMPLETED]: 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  publishTravel(travel: Travel): void {
    this.travelService.publishTravel(travel.id).subscribe({
      next: (updated) => {
        const travels = this.travels().map(t => t.id === updated.id ? updated : t);
        this.travels.set(travels);
        this.filterTravels();
      },
      error: (err) => console.error('Error publishing travel:', err)
    });
  }

  cancelTravel(travel: Travel): void {
    this.travelService.cancelTravel(travel.id).subscribe({
      next: (updated) => {
        const travels = this.travels().map(t => t.id === updated.id ? updated : t);
        this.travels.set(travels);
        this.filterTravels();
      },
      error: (err) => console.error('Error cancelling travel:', err)
    });
  }

  openDeleteModal(travel: Travel): void {
    this.travelToDelete.set(travel);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.travelToDelete.set(null);
  }

  confirmDelete(): void {
    const travel = this.travelToDelete();
    if (travel) {
      this.travelService.deleteTravel(travel.id).subscribe({
        next: () => {
          const travels = this.travels().filter(t => t.id !== travel.id);
          this.travels.set(travels);
          this.filterTravels();
          this.closeDeleteModal();
        },
        error: (err) => console.error('Error deleting travel:', err)
      });
    }
  }
}
