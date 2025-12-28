import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { CreateReportRequest, ReportType } from '../../../core/models/report.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" (click)="close()"></div>

        <!-- Modal panel -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-heading font-bold text-gray-900">Submit Report</h3>
              </div>
              <button (click)="close()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Alert Messages -->
            <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error" class="mb-4"></app-alert>
            <app-alert *ngIf="successMessage()" [message]="successMessage()!" type="success" class="mb-4"></app-alert>

            <!-- Form -->
            <form [formGroup]="reportForm" (ngSubmit)="onSubmit()">
              <div class="space-y-4">
                <!-- Report Target Info -->
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p class="text-sm text-gray-600 mb-1">Reporting:</p>
                  <p class="font-semibold text-gray-900">{{ targetName }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ getReportTypeLabel() }}</p>
                </div>

                <!-- Reason -->
                <div>
                  <label for="reason" class="label">Reason for Report *</label>
                  <textarea
                    id="reason"
                    formControlName="reason"
                    rows="5"
                    class="input-field"
                    placeholder="Please provide a detailed explanation of why you're submitting this report (minimum 10 characters)..."
                  ></textarea>
                  @if (reportForm.get('reason')?.invalid && reportForm.get('reason')?.touched) {
                    <p class="text-sm text-red-600 mt-1">
                      Reason must be between 10 and 1000 characters
                    </p>
                  }
                </div>

                <!-- Info Box -->
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div class="text-sm text-blue-700">
                      <p class="font-medium mb-1">Please note:</p>
                      <ul class="list-disc list-inside space-y-1 text-blue-600">
                        <li>All reports are reviewed by our admin team</li>
                        <li>False reports may result in account penalties</li>
                        <li>Please provide specific details and evidence</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  (click)="close()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  [disabled]="submitting()"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  [disabled]="reportForm.invalid || submitting()"
                >
                  @if (submitting()) {
                    <span class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  } @else {
                    Submit Report
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class ReportModalComponent {
  @Input() reportType!: ReportType;
  @Input() targetId!: number;
  @Input() targetName!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  isOpen = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  reportForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {
    this.reportForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  open(): void {
    this.isOpen.set(true);
    this.reportForm.reset();
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  close(): void {
    if (!this.submitting()) {
      this.isOpen.set(false);
      this.closed.emit();
    }
  }

  getReportTypeLabel(): string {
    switch (this.reportType) {
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

  onSubmit(): void {
    if (this.reportForm.valid) {
      this.submitting.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const request: CreateReportRequest = {
        reportType: this.reportType,
        reason: this.reportForm.value.reason
      };

      // Set the appropriate ID based on report type
      if (this.reportType === ReportType.TRAVEL) {
        request.reportedTravelId = this.targetId;
      } else {
        request.reportedUserId = this.targetId;
      }

      this.reportService.createReport(request).subscribe({
        next: () => {
          this.submitting.set(false);
          this.successMessage.set('Report submitted successfully. Our team will review it shortly.');
          setTimeout(() => {
            this.submitted.emit();
            this.close();
          }, 2000);
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to submit report. Please try again.');
        }
      });
    }
  }
}
