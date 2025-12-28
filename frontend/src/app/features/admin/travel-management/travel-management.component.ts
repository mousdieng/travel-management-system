import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TravelService } from '../../../core/services/travel.service';
import { Travel, TravelStatus } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-travel-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingComponent, AlertComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-gray-900">Travel Management</h1>
          <p class="text-gray-600 mt-2">Manage all travel packages on the platform</p>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="card mb-6">
        <div class="flex items-center space-x-4">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Search travels by title, destination..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
          </div>
          <button (click)="loadTravels()" class="btn-outline">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Alert Messages -->
      <app-alert *ngIf="successMessage()" [message]="successMessage()!" type="success" class="mb-6"></app-alert>
      <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error" class="mb-6"></app-alert>

      <app-loading *ngIf="loading()"></app-loading>

      @if (!loading()) {
        <!-- Travels Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (travel of filteredTravels(); track travel.id) {
            <div class="card hover:shadow-xl transition-all">
              <!-- Travel Image -->
              <div class="relative">
                @if (travel.images && travel.images.length > 0) {
                  <img [src]="travel.images[0]" [alt]="travel.title" class="w-full h-48 object-cover rounded-lg mb-4">
                } @else {
                  <div class="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg mb-4 flex items-center justify-center">
                    <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                }
                <span [class]="getStatusBadgeClass(travel.status)" class="absolute top-4 right-4">{{ travel.status }}</span>
              </div>

              <!-- Travel Info -->
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ travel.title }}</h3>
                <div class="flex items-center text-gray-600 text-sm mb-2">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ travel.destination }}
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">{{ travel.departureDate | date:'mediumDate' }}</span>
                  <span class="text-primary-600 font-bold text-lg">\${{ travel.price }}</span>
                </div>
                <div class="mt-2 text-sm text-gray-600">
                  <span>{{ travel.currentParticipants || 0 }}/{{ travel.maxParticipants }} participants</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex space-x-2">
                <button
                  [routerLink]="['/travels', travel.id]"
                  class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View
                </button>
                <button
                  (click)="confirmDelete(travel)"
                  class="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-full">
              <div class="card text-center py-12">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-gray-600 text-lg">No travels found</p>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Delete Confirmation Modal -->
    @if (deletingTravel()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" (click)="closeDeleteModal()">
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" (click)="$event.stopPropagation()">
            <!-- Icon -->
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>

            <!-- Content -->
            <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">Delete Travel</h3>
            <p class="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to delete <strong>{{ deletingTravel()!.title }}</strong>? This action cannot be undone and will affect all related bookings.
            </p>

            <!-- Actions -->
            <div class="flex space-x-3">
              <button
                (click)="closeDeleteModal()"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                (click)="deleteTravel()"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                [disabled]="saving()"
              >
                @if (saving()) {
                  Deleting...
                } @else {
                  Delete
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class TravelManagementComponent implements OnInit {
  travels = signal<Travel[]>([]);
  loading = signal(true);
  saving = signal(false);
  searchQuery = '';
  deletingTravel = signal<Travel | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  TravelStatus = TravelStatus;

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.loadTravels();
  }

  loadTravels(): void {
    this.loading.set(true);
    this.travelService.getAllTravels().subscribe({
      next: (travels) => {
        this.travels.set(travels);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading travels:', error);
        this.errorMessage.set('Failed to load travels');
        this.loading.set(false);
      }
    });
  }

  filteredTravels(): Travel[] {
    if (!this.searchQuery.trim()) {
      return this.travels();
    }

    const query = this.searchQuery.toLowerCase();
    return this.travels().filter(travel =>
      travel.title.toLowerCase().includes(query) ||
      travel.destination.toLowerCase().includes(query) ||
      travel.description?.toLowerCase().includes(query)
    );
  }

  onSearchChange(): void {
    // Debouncing is handled by the template
  }

  getStatusBadgeClass(status: string): string {
    const baseClass = 'px-3 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'ACTIVE':
        return `${baseClass} bg-green-100 text-green-700`;
      case 'DRAFT':
        return `${baseClass} bg-gray-100 text-gray-700`;
      case 'CANCELLED':
        return `${baseClass} bg-red-100 text-red-700`;
      case 'COMPLETED':
        return `${baseClass} bg-blue-100 text-blue-700`;
      default:
        return `${baseClass} bg-gray-100 text-gray-700`;
    }
  }

  confirmDelete(travel: Travel): void {
    this.deletingTravel.set(travel);
  }

  closeDeleteModal(): void {
    this.deletingTravel.set(null);
  }

  deleteTravel(): void {
    const travel = this.deletingTravel();
    if (!travel) return;

    this.saving.set(true);
    this.travelService.deleteTravel(travel.id).subscribe({
      next: () => {
        this.travels.set(this.travels().filter(t => t.id !== travel.id));
        this.successMessage.set('Travel deleted successfully');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.closeDeleteModal();
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error deleting travel:', error);
        this.errorMessage.set('Failed to delete travel. It may have active bookings.');
        setTimeout(() => this.errorMessage.set(null), 5000);
        this.saving.set(false);
      }
    });
  }
}
