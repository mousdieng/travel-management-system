import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../core/services/report.service';
import { Report, ReportStatus, ReportType } from '../../../core/models/report.model';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-my-reports',
  standalone: true,
  imports: [CommonModule, AlertComponent],
  template: `
    <div class="page-container">
      <div class="mb-8">
        <h1 class="section-title">My Reports</h1>
        <p class="text-gray-600 mt-2">View and track the status of your submitted reports</p>
      </div>

      <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error"></app-alert>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      }

      <!-- Reports List -->
      @if (!loading() && reports().length > 0) {
        <div class="space-y-4">
          @for (report of reports(); track report.id) {
            <div class="card hover:shadow-lg transition-shadow">
              <!-- Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-start space-x-3 flex-1">
                  <div [class]="getReportIconClasses(report.reportType)">
                    @switch (report.reportType) {
                      @case (ReportType.TRAVEL_MANAGER) {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      }
                      @case (ReportType.TRAVELER) {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                      }
                      @case (ReportType.TRAVEL) {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      }
                    }
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                      <h3 class="font-heading font-semibold text-gray-900">
                        {{ getReportTypeLabel(report.reportType) }} Report
                      </h3>
                      <span [class]="getStatusBadgeClasses(report.status)">
                        {{ getStatusLabel(report.status) }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500">
                      Submitted on {{ formatDate(report.createdAt) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Reason -->
              <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                <p class="text-sm font-medium text-gray-700 mb-2">Reason:</p>
                <p class="text-gray-900">{{ report.reason }}</p>
              </div>

              <!-- Admin Notes -->
              @if (report.adminNotes) {
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-start space-x-2">
                    <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-blue-900 mb-1">Admin Response:</p>
                      <p class="text-sm text-blue-800">{{ report.adminNotes }}</p>
                    </div>
                  </div>
                </div>
              }

              <!-- Timeline -->
              <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex items-center space-x-2 text-xs text-gray-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Report ID: #{{ report.id }}</span>
                  @if (report.reviewedAt) {
                    <span>•</span>
                    <span>Reviewed on {{ formatDate(report.reviewedAt) }}</span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && reports().length === 0) {
        <div class="text-center py-16">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-lg font-heading font-semibold text-gray-900 mb-2">No Reports Submitted</h3>
          <p class="text-gray-600 mb-6">You haven't submitted any reports yet.</p>
        </div>
      }
    </div>
  `
})
export class MyReportsComponent implements OnInit {
  reports = signal<Report[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  ReportType = ReportType;

  constructor(
    private reportService: ReportService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorMessage.set('User not authenticated');
      this.loading.set(false);
      return;
    }

    this.reportService.getMyReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.errorMessage.set('Failed to load reports. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  getReportTypeLabel(type: ReportType): string {
    switch (type) {
      case ReportType.TRAVEL_MANAGER:
        return 'Travel Manager';
      case ReportType.TRAVELER:
        return 'Traveler';
      case ReportType.TRAVEL:
        return 'Travel';
      default:
        return '';
    }
  }

  getReportIconClasses(type: ReportType): string {
    const base = 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0';
    switch (type) {
      case ReportType.TRAVEL_MANAGER:
        return `${base} bg-purple-100 text-purple-600`;
      case ReportType.TRAVELER:
        return `${base} bg-blue-100 text-blue-600`;
      case ReportType.TRAVEL:
        return `${base} bg-orange-100 text-orange-600`;
      default:
        return base;
    }
  }

  getStatusLabel(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.PENDING:
        return 'Pending Review';
      case ReportStatus.UNDER_REVIEW:
        return 'Under Review';
      case ReportStatus.RESOLVED:
        return 'Resolved';
      case ReportStatus.DISMISSED:
        return 'Dismissed';
      default:
        return status;
    }
  }

  getStatusBadgeClasses(status: ReportStatus): string {
    const base = 'px-2.5 py-0.5 rounded-full text-xs font-semibold';
    switch (status) {
      case ReportStatus.PENDING:
        return `${base} bg-yellow-100 text-yellow-700`;
      case ReportStatus.UNDER_REVIEW:
        return `${base} bg-blue-100 text-blue-700`;
      case ReportStatus.RESOLVED:
        return `${base} bg-green-100 text-green-700`;
      case ReportStatus.DISMISSED:
        return `${base} bg-gray-100 text-gray-700`;
      default:
        return base;
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
