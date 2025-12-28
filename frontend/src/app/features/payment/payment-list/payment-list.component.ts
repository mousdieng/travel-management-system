import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { PaymentService } from '../../../core/services/payment.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import {
  Payment,
  PaymentStatus,
  PaymentMethodType,
  PaymentProvider,
  PaymentSearchCriteria
} from '../../../core/models/payment.model';

@Component({
  selector: 'app-payment-list',
  template: `
    <div class="payment-list-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>Payment Management</h1>
          <p class="subtitle">Monitor and manage payment transactions</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="exportPayments()">
            <mat-icon>download</mat-icon>
            Export
          </button>
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-value">{{ totalPayments | number }}</div>
              <div class="stat-label">Total Payments</div>
            </div>
            <mat-icon class="stat-icon">payment</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-value">{{ totalAmount | currency:'USD':'symbol':'1.0-0' }}</div>
              <div class="stat-label">Total Amount</div>
            </div>
            <mat-icon class="stat-icon">attach_money</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-value">{{ pendingCount | number }}</div>
              <div class="stat-label">Pending</div>
            </div>
            <mat-icon class="stat-icon">schedule</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <div class="stat-value">{{ failedCount | number }}</div>
              <div class="stat-label">Failed</div>
            </div>
            <mat-icon class="stat-icon">error</mat-icon>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-grid">
            <!-- Search -->
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search payments...</mat-label>
              <input matInput [formControl]="searchControl" placeholder="Payment ID, user, booking...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <!-- Status Filter -->
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusControl" multiple>
                <mat-option *ngFor="let status of statusOptions" [value]="status.value">
                  <mat-chip [style.background-color]="getStatusColor(status.value)" class="status-chip">
                    {{ status.label }}
                  </mat-chip>
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Method Filter -->
            <mat-form-field appearance="outline">
              <mat-label>Payment Method</mat-label>
              <mat-select [formControl]="methodControl" multiple>
                <mat-option *ngFor="let method of methodOptions" [value]="method.value">
                  <mat-icon>{{ getMethodIcon(method.value) }}</mat-icon>
                  {{ method.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Date Range -->
            <mat-form-field appearance="outline">
              <mat-label>Date From</mat-label>
              <input matInput [matDatepicker]="fromDatePicker" [formControl]="fromDateControl">
              <mat-datepicker-toggle matSuffix [for]="fromDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #fromDatePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date To</mat-label>
              <input matInput [matDatepicker]="toDatePicker" [formControl]="toDateControl">
              <mat-datepicker-toggle matSuffix [for]="toDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #toDatePicker></mat-datepicker>
            </mat-form-field>

            <!-- Actions -->
            <div class="filter-actions">
              <button mat-button (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Clear
              </button>
              <button mat-raised-button color="primary" (click)="applyFilters()">
                <mat-icon>filter_list</mat-icon>
                Apply
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Bulk Actions -->
      <div class="bulk-actions" *ngIf="selection.hasValue()">
        <mat-card>
          <mat-card-content>
            <div class="bulk-actions-content">
              <span class="selection-count">{{ selection.selected.length }} payment(s) selected</span>
              <div class="bulk-buttons">
                <button mat-button (click)="bulkProcess()" [disabled]="isLoading$ | async">
                  <mat-icon>check_circle</mat-icon>
                  Process
                </button>
                <button mat-button color="warn" (click)="bulkCancel()" [disabled]="isLoading$ | async">
                  <mat-icon>cancel</mat-icon>
                  Cancel
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h3>Payments ({{ totalElements }})</h3>
          <div class="table-actions">
            <button mat-icon-button (click)="refreshData()" [disabled]="isLoading$ | async">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>

        <div class="table-container">
          <table mat-table [dataSource]="dataSource" matSort class="payments-table">
            <!-- Selection Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox
                  (change)="$event ? toggleAllRows() : null"
                  [checked]="selection.hasValue() && isAllSelected()"
                  [indeterminate]="selection.hasValue() && !isAllSelected()">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let row">
                <mat-checkbox
                  (click)="$event.stopPropagation()"
                  (change)="$event ? selection.toggle(row) : null"
                  [checked]="selection.isSelected(row)">
                </mat-checkbox>
              </td>
            </ng-container>

            <!-- Payment ID Column -->
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Payment ID</th>
              <td mat-cell *matCellDef="let payment" class="id-cell">
                <div class="payment-id">
                  <span class="id">{{ payment.id | slice:0:8 }}...</span>
                  <button mat-icon-button matTooltip="Copy ID" (click)="copyToClipboard(payment.id)">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <!-- User Column -->
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>User</th>
              <td mat-cell *matCellDef="let payment" class="user-cell">
                <div class="user-info" *ngIf="payment.user">
                  <app-avatar [name]="payment.user.firstName + ' ' + payment.user.lastName" size="small"></app-avatar>
                  <div class="user-details">
                    <span class="name">{{ payment.user.firstName }} {{ payment.user.lastName }}</span>
                    <span class="email">{{ payment.user.email }}</span>
                  </div>
                </div>
                <span *ngIf="!payment.user">{{ payment.userId }}</span>
              </td>
            </ng-container>

            <!-- Amount Column -->
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Amount</th>
              <td mat-cell *matCellDef="let payment" class="amount-cell">
                <div class="amount">{{ formatAmount(payment.amount, payment.currency) }}</div>
                <div class="net-amount" *ngIf="payment.totalFees > 0">
                  Net: {{ formatAmount(payment.netAmount, payment.currency) }}
                </div>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let payment">
                <mat-chip [style.background-color]="getStatusColor(payment.status)" class="status-chip">
                  {{ payment.status | titlecase }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Method Column -->
            <ng-container matColumnDef="method">
              <th mat-header-cell *matHeaderCellDef>Method</th>
              <td mat-cell *matCellDef="let payment" class="method-cell">
                <div class="method-info">
                  <mat-icon>{{ getMethodIcon(payment.method.type) }}</mat-icon>
                  <div>
                    <div class="method-type">{{ payment.method.type | titlecase }}</div>
                    <div class="method-provider">{{ payment.method.provider }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
              <td mat-cell *matCellDef="let payment" class="date-cell">
                <div>{{ payment.createdAt | date:'MMM dd, yyyy' }}</div>
                <div class="time">{{ payment.createdAt | date:'HH:mm' }}</div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let payment" class="actions-cell">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu" (click)="$event.stopPropagation()">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <button mat-menu-item (click)="viewPayment(payment)">
                    <mat-icon>visibility</mat-icon>
                    View Details
                  </button>
                  <button mat-menu-item (click)="processPayment(payment)" *ngIf="canProcess(payment)">
                    <mat-icon>check_circle</mat-icon>
                    Process
                  </button>
                  <button mat-menu-item (click)="capturePayment(payment)" *ngIf="canCapture(payment)">
                    <mat-icon>account_balance</mat-icon>
                    Capture
                  </button>
                  <button mat-menu-item (click)="refundPayment(payment)" *ngIf="canRefund(payment)">
                    <mat-icon>money_off</mat-icon>
                    Refund
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="voidPayment(payment)" *ngIf="canVoid(payment)">
                    <mat-icon>block</mat-icon>
                    Void
                  </button>
                  <button mat-menu-item (click)="cancelPayment(payment)" class="warn-action">
                    <mat-icon>cancel</mat-icon>
                    Cancel
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                (click)="viewPayment(row)" class="table-row"></tr>
          </table>

          <!-- No Data -->
          <div class="no-data" *ngIf="dataSource.data.length === 0 && !(isLoading$ | async)">
            <mat-icon>payment</mat-icon>
            <h3>No payments found</h3>
            <p>No payments match your current filters.</p>
          </div>

          <!-- Loading -->
          <div class="loading" *ngIf="isLoading$ | async">
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          </div>
        </div>

        <!-- Pagination -->
        <mat-paginator
          [length]="totalElements"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50, 100]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .payment-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 300;
    }

    .header-content .subtitle {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      min-height: 120px;
    }

    .stat-card mat-card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      padding: 24px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #333;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      font-weight: 500;
    }

    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.3;
      color: #666;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
      gap: 16px;
      align-items: center;
    }

    .search-field {
      min-width: 300px;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
    }

    .bulk-actions {
      margin-bottom: 16px;
    }

    .bulk-actions-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bulk-buttons {
      display: flex;
      gap: 8px;
    }

    .table-card {
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .table-container {
      position: relative;
      overflow-x: auto;
    }

    .payments-table {
      width: 100%;
      min-width: 900px;
    }

    .table-row {
      cursor: pointer;
    }

    .table-row:hover {
      background-color: #f5f5f5;
    }

    .id-cell .payment-id {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .id-cell .id {
      font-family: monospace;
      font-size: 13px;
    }

    .user-cell .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-details .name {
      font-weight: 500;
      font-size: 14px;
    }

    .user-details .email {
      font-size: 12px;
      color: #666;
    }

    .amount-cell .amount {
      font-weight: 600;
      font-size: 16px;
    }

    .amount-cell .net-amount {
      font-size: 12px;
      color: #666;
    }

    .status-chip {
      color: white;
      font-weight: 500;
      font-size: 11px;
      min-height: 24px;
    }

    .method-cell .method-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .method-info .method-type {
      font-weight: 500;
      font-size: 13px;
    }

    .method-info .method-provider {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
    }

    .date-cell {
      font-size: 13px;
    }

    .date-cell .time {
      color: #666;
      font-size: 11px;
    }

    .actions-cell {
      width: 60px;
    }

    .warn-action {
      color: #f44336;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      text-align: center;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .filters-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .search-field {
        min-width: unset;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .payment-list-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
        justify-content: stretch;
      }

      .header-actions button {
        flex: 1;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PaymentListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  // Data
  dataSource = new MatTableDataSource<Payment>();
  selection = new SelectionModel<Payment>(true, []);
  totalElements = 0;
  pageSize = 25;
  currentPage = 0;

  // Stats
  totalPayments = 0;
  totalAmount = 0;
  pendingCount = 0;
  failedCount = 0;

  // Loading state
  isLoading$ = this.loadingService.isLoading(LoadingService.KEYS.LOAD_PAYMENTS);

  // Form controls
  searchControl = new FormControl('');
  statusControl = new FormControl([]);
  methodControl = new FormControl([]);
  fromDateControl = new FormControl();
  toDateControl = new FormControl();

  // Display
  displayedColumns: string[] = [
    'select', 'id', 'user', 'amount', 'status', 'method', 'date', 'actions'
  ];

  // Options
  statusOptions = Object.values(PaymentStatus).map(status => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')
  }));

  methodOptions = Object.values(PaymentMethodType).map(method => ({
    value: method,
    label: method.charAt(0) + method.slice(1).toLowerCase().replace('_', ' ')
  }));

  constructor(
    private paymentService: PaymentService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.setupFilters();
    this.loadPayments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters(): void {
    // Search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());

    // Other filters
    [this.statusControl, this.methodControl, this.fromDateControl, this.toDateControl].forEach(control => {
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        setTimeout(() => this.applyFilters(), 100);
      });
    });
  }

  loadPayments(): void {
    const criteria = this.buildSearchCriteria();

    this.paymentService.getAllPayments(criteria).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.payments;
        this.totalElements = response.totalElements;
        this.selection.clear();

        // Update stats
        if (response.summary) {
          this.totalPayments = response.summary.totalCount;
          this.totalAmount = response.summary.totalAmount;
          this.pendingCount = response.summary.byStatus?.[PaymentStatus.PENDING]?.count || 0;
          this.failedCount = response.summary.byStatus?.[PaymentStatus.FAILED]?.count || 0;
        }
      },
      error: (error) => {
        this.notificationService.showError('Failed to load payments');
        console.error('Load payments error:', error);
      }
    });
  }

  private buildSearchCriteria(): PaymentSearchCriteria {
    return {
      query: this.searchControl.value || undefined,
      status: this.statusControl.value?.length ? this.statusControl.value : undefined,
      method: this.methodControl.value?.length ? this.methodControl.value : undefined,
      dateFrom: this.fromDateControl.value?.toISOString().split('T')[0] || undefined,
      dateTo: this.toDateControl.value?.toISOString().split('T')[0] || undefined,
      page: this.currentPage,
      size: this.pageSize,
      sort: this.sort?.active || 'createdAt',
      direction: (this.sort?.direction?.toUpperCase() as 'ASC' | 'DESC') || 'DESC'
    };
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadPayments();
  }

  clearFilters(): void {
    this.searchControl.reset();
    this.statusControl.reset();
    this.methodControl.reset();
    this.fromDateControl.reset();
    this.toDateControl.reset();
    this.applyFilters();
  }

  refreshData(): void {
    this.loadPayments();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  // Action methods
  viewPayment(payment: Payment): void {
    console.log('View payment:', payment);
    // TODO: Open payment details dialog
  }

  processPayment(payment: Payment): void {
    this.confirmDialog.confirm({
      title: 'Process Payment',
      message: `Process payment ${payment.id}?`,
      confirmText: 'Process'
    }).subscribe(confirmed => {
      if (confirmed) {
        // TODO: Implement process payment
        this.notificationService.showInfo('Payment processing feature will be implemented');
      }
    });
  }

  capturePayment(payment: Payment): void {
    this.confirmDialog.confirm({
      title: 'Capture Payment',
      message: `Capture payment ${payment.id}?`,
      confirmText: 'Capture'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.paymentService.capturePayment(payment.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Payment captured successfully');
            this.refreshData();
          },
          error: () => this.notificationService.showError('Failed to capture payment')
        });
      }
    });
  }

  refundPayment(payment: Payment): void {
    console.log('Refund payment:', payment);
    // TODO: Open refund dialog
  }

  voidPayment(payment: Payment): void {
    this.confirmDialog.confirm({
      title: 'Void Payment',
      message: `Void payment ${payment.id}? This action cannot be undone.`,
      confirmText: 'Void',
      confirmColor: 'warn'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.paymentService.voidPayment(payment.id, 'Manual void').subscribe({
          next: () => {
            this.notificationService.showSuccess('Payment voided successfully');
            this.refreshData();
          },
          error: () => this.notificationService.showError('Failed to void payment')
        });
      }
    });
  }

  cancelPayment(payment: Payment): void {
    this.confirmDialog.confirm({
      title: 'Cancel Payment',
      message: `Cancel payment ${payment.id}?`,
      confirmText: 'Cancel',
      confirmColor: 'warn'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.paymentService.cancelPayment(payment.id, 'Manual cancellation').subscribe({
          next: () => {
            this.notificationService.showSuccess('Payment cancelled successfully');
            this.refreshData();
          },
          error: () => this.notificationService.showError('Failed to cancel payment')
        });
      }
    });
  }

  bulkProcess(): void {
    const eligiblePayments = this.selection.selected.filter(p => this.canProcess(p));
    if (eligiblePayments.length === 0) {
      this.notificationService.showWarning('No eligible payments selected');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Bulk Process',
      message: `Process ${eligiblePayments.length} selected payment(s)?`,
      confirmText: 'Process'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.notificationService.showInfo('Bulk processing feature will be implemented');
      }
    });
  }

  bulkCancel(): void {
    this.confirmDialog.confirm({
      title: 'Bulk Cancel',
      message: `Cancel ${this.selection.selected.length} selected payment(s)?`,
      confirmText: 'Cancel',
      confirmColor: 'warn'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.notificationService.showInfo('Bulk cancel feature will be implemented');
      }
    });
  }

  exportPayments(): void {
    const criteria = this.buildSearchCriteria();
    this.paymentService.exportPayments(criteria, 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.showError('Failed to export payments')
    });
  }

  // Utility methods
  formatAmount(amount: number, currency: string): string {
    return this.paymentService.formatAmount(amount, currency);
  }

  getStatusColor(status: string): string {
    return this.paymentService.getPaymentStatusColor(status);
  }

  getMethodIcon(methodType: string): string {
    return this.paymentService.getMethodIcon(methodType);
  }

  canProcess(payment: Payment): boolean {
    return payment.status === PaymentStatus.PENDING;
  }

  canCapture(payment: Payment): boolean {
    return this.paymentService.canCapture(payment);
  }

  canRefund(payment: Payment): boolean {
    return this.paymentService.canRefund(payment);
  }

  canVoid(payment: Payment): boolean {
    return this.paymentService.canVoid(payment);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.showSuccess('Copied to clipboard');
    });
  }
}