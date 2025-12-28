import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TravelService } from '../../../core/services/travel.service';
import { UserService } from '../../../core/services/user.service';
import { ReportService } from '../../../core/services/report.service';
import { User } from '../../../core/models/user.model';
import { Travel } from '../../../core/models/travel.model';
import { ReportModalComponent } from '../reports/report-modal.component';
import { ReportType } from '../../../core/models/report.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-manager-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReportModalComponent, AlertComponent],
  template: `
    <div class="page-container">
      <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error"></app-alert>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      }

      @if (!loading() && manager()) {
        <!-- Manager Header -->
        <div class="card bg-gradient-to-r from-primary-600 to-primary-700 text-white mb-8">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-6">
              <div class="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                @if (manager()!.profilePictureUrl) {
                  <img [src]="manager()!.profilePictureUrl" alt="Profile" class="w-full h-full rounded-full object-cover">
                } @else {
                  <span class="text-4xl font-bold">{{ manager()!.username.charAt(0).toUpperCase() }}</span>
                }
              </div>
              <div>
                <h1 class="text-3xl font-heading font-bold mb-2">{{ manager()!.username }}</h1>
                <p class="text-primary-100 mb-3">Travel Manager</p>
                <div class="flex items-center space-x-4">
                  @if (stats()?.averageRating > 0) {
                    <div class="flex items-center space-x-2 bg-white/20 px-3 py-1.5 rounded-lg">
                      <svg class="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span class="font-semibold">{{ stats()!.averageRating.toFixed(1) }}</span>
                      <span class="text-primary-200 text-sm">({{ stats()!.totalReviews }} reviews)</span>
                    </div>
                  }
                  <div class="flex items-center space-x-2 bg-white/20 px-3 py-1.5 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="font-semibold">{{ stats()?.totalTravels || 0 }}</span>
                    <span class="text-primary-200 text-sm">travels</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              (click)="openReportModal()"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>Report Manager</span>
            </button>
          </div>
        </div>

        <!-- Statistics Grid -->
        @if (stats()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="card">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600 font-medium">Active Travels</p>
                  <p class="text-3xl font-heading font-bold text-primary-600 mt-2">
                    {{ stats()!.activeTravels }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600 font-medium">Completed</p>
                  <p class="text-3xl font-heading font-bold text-green-600 mt-2">
                    {{ stats()!.completedTravels }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600 font-medium">Total Travelers</p>
                  <p class="text-3xl font-heading font-bold text-blue-600 mt-2">
                    {{ stats()!.totalParticipants }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p class="text-3xl font-heading font-bold text-purple-600 mt-2">
                    \${{ (stats()!.totalRevenuePotential || 0).toFixed(0) }}
                  </p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Travels List -->
        <div class="card">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-heading font-bold text-gray-900">Travel Offerings</h2>
            <span class="text-sm text-gray-500">{{ travels().length }} total</span>
          </div>

          @if (travels().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (travel of travels(); track travel.id) {
                <a [routerLink]="['/travels', travel.id]"
                   class="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <!-- Travel Image -->
                  <div class="relative h-48 bg-gray-200 overflow-hidden">
                    @if (travel.images && travel.images.length > 0) {
                      <img [src]="travel.images[0]" [alt]="travel.title"
                           class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    } @else {
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    }
                    <div class="absolute top-3 right-3 px-2.5 py-1 bg-white rounded-lg shadow-lg">
                      <span class="text-sm font-bold text-gray-900">\${{ travel.price }}</span>
                    </div>
                  </div>

                  <!-- Travel Info -->
                  <div class="p-4">
                    <h3 class="font-heading font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {{ travel.title }}
                    </h3>
                    <div class="flex items-center text-sm text-gray-600 mb-3">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span class="line-clamp-1">{{ travel.destination }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-1">
                        <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span class="text-sm font-medium text-gray-900">{{ travel.averageRating.toFixed(1) || 'N/A' }}</span>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ travel.currentParticipants }}/{{ travel.maxParticipants }} spots
                      </div>
                    </div>
                  </div>
                </a>
              }
            </div>
          } @else {
            <div class="text-center py-12">
              <p class="text-gray-500">This manager has no active travels at the moment.</p>
            </div>
          }
        </div>
      }

      <!-- Report Modal -->
      <app-report-modal
        #reportModal
        [reportType]="ReportType.TRAVEL_MANAGER"
        [targetId]="managerId()"
        [targetName]="manager()?.username || ''"
        (submitted)="onReportSubmitted()"
      ></app-report-modal>
    </div>
  `
})
export class ManagerProfileComponent implements OnInit {
  managerId = signal<number>(0);
  manager = signal<User | null>(null);
  stats = signal<any>(null);
  travels = signal<Travel[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  ReportType = ReportType;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private travelService: TravelService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.managerId.set(id);
        this.loadManagerProfile(id);
      }
    });
  }

  loadManagerProfile(managerId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    // Load manager info
    this.userService.getUserById(managerId.toString()).subscribe({
      next: (user) => {
        this.manager.set(user);
      },
      error: (error) => {
        console.error('Error loading manager:', error);
        this.errorMessage.set('Failed to load manager profile.');
        this.loading.set(false);
      }
    });

    // Load manager stats
    this.travelService.getManagerStatsByManagerId(managerId).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });

    // Load manager travels
    this.travelService.getManagerTravels(managerId).subscribe({
      next: (travels) => {
        this.travels.set(travels);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading travels:', error);
        this.loading.set(false);
      }
    });
  }

  openReportModal(): void {
    const reportModal = document.querySelector('app-report-modal') as any;
    if (reportModal?.open) {
      reportModal.open();
    }
  }

  onReportSubmitted(): void {
    // Could show a success message or refresh data
    console.log('Report submitted successfully');
  }
}
