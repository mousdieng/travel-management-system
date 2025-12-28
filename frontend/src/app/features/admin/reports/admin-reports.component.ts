import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { Report, ReportStatus, ReportType } from '../../../core/models/report.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingComponent, AlertComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-gray-900">Reports Management</h1>
          <p class="text-gray-600 mt-2">Review and manage user-submitted reports</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="mb-6 flex space-x-2 border-b border-gray-200">
        <button
          (click)="filterStatus.set('ALL')"
          [class]="getTabClasses('ALL')"
        >
          All Reports
          @if (reports().length > 0) {
            <span class="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">{{ reports().length }}</span>
          }
        </button>
        <button
          (click)="filterStatus.set('PENDING')"
          [class]="getTabClasses('PENDING')"
        >
          Pending
          @if (pendingCount() > 0) {
            <span class="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">{{ pendingCount() }}</span>
          }
        </button>
        <button
          (click)="filterStatus.set('UNDER_REVIEW')"
          [class]="getTabClasses('UNDER_REVIEW')"
        >
          Under Review
        </button>
        <button
          (click)="filterStatus.set('RESOLVED')"
          [class]="getTabClasses('RESOLVED')"
        >
          Resolved
        </button>
        <button
          (click)="filterStatus.set('DISMISSED')"
          [class]="getTabClasses('DISMISSED')"
        >
          Dismissed
        </button>
      </div>

      <!-- Alert Messages -->
      <app-alert *ngIf="successMessage()" [message]="successMessage()!" type="success" class="mb-6"></app-alert>
      <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error" class="mb-6"></app-alert>

      <app-loading *ngIf="loading()"></app-loading>

      @if (!loading()) {
        <!-- Reports List -->
        @if (filteredReports().length > 0) {
          <div class="space-y-4">
            @for (report of filteredReports(); track report.id) {
              <div class="card hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <!-- Report Header -->
                    <div class="flex items-center space-x-3 mb-3">
                      <!-- Report Type Icon -->
                      <div [class]="getTypeIconClasses(report.reportType)">
                        @if (report.reportType === ReportType.TRAVEL_MANAGER) {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                        } @else if (report.reportType === ReportType.TRAVELER) {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                        } @else {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        }
                      </div>

                      <div class="flex-1">
                        <div class="flex items-center space-x-3">
                          <span class="font-semibold text-gray-900">{{ getTypeLabel(report.reportType) }}</span>
                          <span [class]="getStatusBadgeClasses(report.status)">{{ report.status }}</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">
                          Reported by <span class="font-medium">{{ report.reporterName }}</span>
                          • {{ report.createdAt | date:'medium' }}
                        </p>
                      </div>
                    </div>

                    <!-- Report Details -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-3">
                      <p class="text-sm font-medium text-gray-700 mb-2">Reason:</p>
                      <p class="text-gray-900">{{ report.reason }}</p>
                    </div>

                    <!-- Admin Notes (if any) -->
                    @if (report.adminNotes) {
                      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-3">
                        <p class="text-sm font-medium text-blue-900 mb-1">Admin Notes:</p>
                        <p class="text-blue-800">{{ report.adminNotes }}</p>
                        @if (report.reviewedAt) {
                          <p class="text-xs text-blue-600 mt-2">Reviewed {{ report.reviewedAt | date:'short' }}</p>
                        }
                      </div>
                    }
                  </div>

                  <!-- Action Buttons -->
                  @if (report.status === ReportStatus.PENDING || report.status === ReportStatus.UNDER_REVIEW) {
                    <div class="ml-4 flex flex-col space-y-2">
                      <button
                        (click)="openReviewModal(report)"
                        class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Review
                      </button>
                      @if (report.reportedUserId) {
                        <button
                          [routerLink]="['/managers', report.reportedUserId]"
                          class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          View Profile
                        </button>
                      }
                      @if (report.reportedTravelId) {
                        <button
                          [routerLink]="['/travels', report.reportedTravelId]"
                          class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          View Travel
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="card text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-gray-600 text-lg">No reports found</p>
          </div>
        }
      }
    </div>

    <!-- Review Modal -->
    @if (selectedReport()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" (click)="closeReviewModal()">
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-heading font-bold text-gray-900">Review Report</h3>
              <button (click)="closeReviewModal()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Report Info -->
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600 mb-2"><strong>Type:</strong> {{ getTypeLabel(selectedReport()!.reportType) }}</p>
              <p class="text-sm text-gray-600 mb-2"><strong>Reporter:</strong> {{ selectedReport()!.reporterName }}</p>
              <p class="text-sm text-gray-600"><strong>Reason:</strong> {{ selectedReport()!.reason }}</p>
            </div>

            <!-- Admin Notes -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
              <textarea
                [(ngModel)]="reviewNotes"
                rows="4"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add your review notes here..."
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
              <button
                (click)="reviewReport(ReportStatus.DISMISSED)"
                class="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                [disabled]="reviewing()"
              >
                Dismiss
              </button>
              <button
                (click)="reviewReport(ReportStatus.UNDER_REVIEW)"
                class="px-6 py-3 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
                [disabled]="reviewing()"
              >
                Mark Under Review
              </button>
              <button
                (click)="reviewReport(ReportStatus.RESOLVED)"
                class="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                [disabled]="reviewing()"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminReportsComponent implements OnInit {
  reports = signal<Report[]>([]);
  loading = signal(true);
  filterStatus = signal<string>('ALL');
  selectedReport = signal<Report | null>(null);
  reviewing = signal(false);
  reviewNotes = '';
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ReportType = ReportType;
  ReportStatus = ReportStatus;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);
    this.reportService.getAllReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.errorMessage.set('Failed to load reports');
        this.loading.set(false);
      }
    });
  }

  filteredReports(): Report[] {
    const status = this.filterStatus();
    if (status === 'ALL') {
      return this.reports();
    }
    return this.reports().filter(r => r.status === status);
  }

  pendingCount(): number {
    return this.reports().filter(r => r.status === ReportStatus.PENDING).length;
  }

  getTabClasses(status: string): string {
    const isActive = this.filterStatus() === status;
    return `px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'text-primary-600 border-b-2 border-primary-600'
        : 'text-gray-600 hover:text-gray-900'
    }`;
  }

  getTypeIconClasses(type: ReportType): string {
    const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center';
    switch (type) {
      case ReportType.TRAVEL_MANAGER:
        return `${baseClasses} bg-red-100 text-red-600`;
      case ReportType.TRAVELER:
        return `${baseClasses} bg-blue-100 text-blue-600`;
      case ReportType.TRAVEL:
        return `${baseClasses} bg-purple-100 text-purple-600`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  }

  getTypeLabel(type: ReportType): string {
    switch (type) {
      case ReportType.TRAVEL_MANAGER:
        return 'Travel Manager Report';
      case ReportType.TRAVELER:
        return 'Traveler Report';
      case ReportType.TRAVEL:
        return 'Travel Report';
      default:
        return 'Report';
    }
  }

  getStatusBadgeClasses(status: ReportStatus): string {
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case ReportStatus.PENDING:
        return `${baseClasses} bg-orange-100 text-orange-700`;
      case ReportStatus.UNDER_REVIEW:
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case ReportStatus.RESOLVED:
        return `${baseClasses} bg-green-100 text-green-700`;
      case ReportStatus.DISMISSED:
        return `${baseClasses} bg-gray-100 text-gray-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  }

  openReviewModal(report: Report): void {
    this.selectedReport.set(report);
    this.reviewNotes = report.adminNotes || '';
  }

  closeReviewModal(): void {
    this.selectedReport.set(null);
    this.reviewNotes = '';
  }

  reviewReport(status: ReportStatus): void {
    const report = this.selectedReport();
    if (!report) return;

    this.reviewing.set(true);
    this.reportService.reviewReport(report.id, status, this.reviewNotes).subscribe({
      next: (updatedReport) => {
        // Update the report in the list
        const reports = this.reports();
        const index = reports.findIndex(r => r.id === updatedReport.id);
        if (index !== -1) {
          reports[index] = updatedReport;
          this.reports.set([...reports]);
        }

        this.successMessage.set('Report reviewed successfully');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.closeReviewModal();
        this.reviewing.set(false);
      },
      error: (error) => {
        console.error('Error reviewing report:', error);
        this.errorMessage.set('Failed to review report');
        setTimeout(() => this.errorMessage.set(null), 3000);
        this.reviewing.set(false);
      }
    });
  }
}
