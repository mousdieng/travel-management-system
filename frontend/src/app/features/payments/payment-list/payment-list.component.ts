import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';

import { Payment, PaymentStatus, PaymentMethod } from '../../../shared/models/payment.model';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-payment-list',
  template: `
    <div class="payments-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Payment Management</h1>
          <p>Track and manage travel payments and transactions</p>
        </div>
        <div class="header-actions">
          <button
            mat-raised-button
            color="primary"
            (click)="createPayment()"
            [disabled]="isLoading">
            <mat-icon>payment</mat-icon>
            Process Payment
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="stats">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon color="primary">account_balance_wallet</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatCurrency(stats.totalAmount) }}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon color="accent">check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.successfulPayments }}</div>
              <div class="stat-label">Successful Payments</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon color="warn">pending</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingPayments }}</div>
              <div class="stat-label">Pending Payments</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon style="color: #f44336;">error</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.failedPayments }}</div>
              <div class="stat-label">Failed Payments</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search payments</mat-label>
              <input
                matInput
                [formControl]="searchControl"
                placeholder="Transaction ID, user name...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusControl" multiple>
                <mat-option *ngFor="let status of statusOptions" [value]="status.value">
                  {{ status.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Payment Method</mat-label>
              <mat-select [formControl]="methodControl" multiple>
                <mat-option *ngFor="let method of methodOptions" [value]="method.value">
                  {{ method.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date Range</mat-label>
              <mat-date-range-input [rangePicker]="dateRangePicker">
                <input matStartDate [formControl]="startDateControl" placeholder="Start date">
                <input matEndDate [formControl]="endDateControl" placeholder="End date">
              </mat-date-range-input>
              <mat-datepicker-toggle matSuffix [for]="dateRangePicker"></mat-datepicker-toggle>
              <mat-date-range-picker #dateRangePicker></mat-date-range-picker>
            </mat-form-field>

            <button
              mat-stroked-button
              color="warn"
              [disabled]="selection.isEmpty()"
              (click)="bulkRefund()">
              <mat-icon>undo</mat-icon>
              Refund Selected ({{ selection.selected.length }})
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Payments Table -->
      <mat-card class="payments-card">
        <mat-card-header>
          <mat-card-title>All Payments</mat-card-title>
          <mat-card-subtitle>{{ dataSource.data.length }} payments found</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="payments-table">
              <!-- Checkbox Column -->
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

              <!-- Transaction ID Column -->
              <ng-container matColumnDef="transactionId">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Transaction ID</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="transaction-id">
                    <span class="id-text">{{ payment.transactionId }}</span>
                    <button mat-icon-button (click)="copyTransactionId(payment.transactionId)">
                      <mat-icon>content_copy</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <!-- User Column -->
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="user-info">
                    <app-avatar
                      [src]="payment.user?.profilePicture"
                      [name]="payment.user?.firstName + ' ' + payment.user?.lastName"
                      size="small">
                    </app-avatar>
                    <div class="user-details">
                      <div class="user-name">{{ payment.user?.firstName }} {{ payment.user?.lastName }}</div>
                      <div class="user-email">{{ payment.user?.email }}</div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Travel Column -->
              <ng-container matColumnDef="travel">
                <th mat-header-cell *matHeaderCellDef>Travel</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="travel-info">
                    <div class="travel-title">{{ payment.travel?.title }}</div>
                    <div class="travel-destination">{{ payment.travel?.destination?.name }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Amount</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="amount-info">
                    <div class="amount">{{ formatCurrency(payment.amount, payment.currency) }}</div>
                    <div class="fees" *ngIf="payment.fees">
                      Fees: {{ formatCurrency(payment.fees, payment.currency) }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Payment Method Column -->
              <ng-container matColumnDef="method">
                <th mat-header-cell *matHeaderCellDef>Method</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="method-info">
                    <mat-chip [class]="'method-' + payment.paymentMethod.toLowerCase()">
                      <mat-icon>{{ getMethodIcon(payment.paymentMethod) }}</mat-icon>
                      {{ payment.paymentMethod }}
                    </mat-chip>
                    <div class="card-info" *ngIf="payment.cardLast4">
                      **** {{ payment.cardLast4 }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                <td mat-cell *matCellDef="let payment">
                  <mat-chip [class]="'status-' + payment.status.toLowerCase()">
                    <mat-icon>{{ getStatusIcon(payment.status) }}</mat-icon>
                    {{ payment.status | titlecase }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Date Column -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
                <td mat-cell *matCellDef="let payment">
                  <div class="date-info">
                    <div>{{ payment.createdAt | date:'MMM dd, yyyy' }}</div>
                    <div class="time">{{ payment.createdAt | date:'HH:mm' }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let payment">
                  <button
                    mat-icon-button
                    [matMenuTriggerFor]="paymentMenu"
                    [matMenuTriggerData]="{payment: payment}">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: displayedColumns;"
                class="payment-row"
                (click)="viewPayment(row)">
              </tr>
            </table>

            <!-- Loading state -->
            <div *ngIf="isLoading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading payments...</p>
            </div>

            <!-- Empty state -->
            <div *ngIf="dataSource.data.length === 0 && !isLoading" class="empty-state">
              <mat-icon class="empty-icon">payment</mat-icon>
              <h3>No payments found</h3>
              <p>Payments will appear here once users start booking travels.</p>
            </div>
          </div>

          <mat-paginator
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageSize]="25"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>

      <!-- Payment actions menu -->
      <mat-menu #paymentMenu="matMenu">
        <ng-template matMenuContent let-payment="payment">
          <button mat-menu-item (click)="viewPayment(payment)">
            <mat-icon>visibility</mat-icon>
            <span>View Details</span>
          </button>
          <button
            mat-menu-item
            (click)="refundPayment(payment)"
            [disabled]="payment.status !== 'COMPLETED'">
            <mat-icon>undo</mat-icon>
            <span>Refund Payment</span>
          </button>
          <button
            mat-menu-item
            (click)="retryPayment(payment)"
            [disabled]="payment.status !== 'FAILED'">
            <mat-icon>refresh</mat-icon>
            <span>Retry Payment</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="downloadReceipt(payment)">
            <mat-icon>download</mat-icon>
            <span>Download Receipt</span>
          </button>
          <button mat-menu-item (click)="sendReceiptEmail(payment)">
            <mat-icon>email</mat-icon>
            <span>Email Receipt</span>
          </button>
        </ng-template>
      </mat-menu>
    </div>
  `,
  styles: [`
    .payments-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 500;
      color: #333;
    }

    .header-content p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      .mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
      }
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: rgba(63, 81, 181, 0.1);
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 300px;
    }

    .payments-card {
      margin-bottom: 24px;
    }

    .table-container {
      overflow-x: auto;
      min-height: 400px;
      position: relative;
    }

    .payments-table {
      width: 100%;
      min-width: 1200px;
    }

    .payment-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .payment-row:hover {
      background-color: #f5f5f5;
    }

    .transaction-id {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .id-text {
      font-family: monospace;
      font-size: 12px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 12px;
      color: #666;
    }

    .travel-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .travel-title {
      font-weight: 500;
      color: #333;
    }

    .travel-destination {
      font-size: 12px;
      color: #666;
    }

    .amount-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .amount {
      font-weight: 600;
      font-size: 16px;
      color: #333;
    }

    .fees {
      font-size: 11px;
      color: #666;
    }

    .method-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }

    .card-info {
      font-size: 11px;
      color: #666;
      font-family: monospace;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .time {
      font-size: 11px;
      color: #666;
    }

    /* Status and method chips */
    .status-pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-completed {
      background-color: #d4edda;
      color: #155724;
    }

    .status-failed {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-refunded {
      background-color: #d1ecf1;
      color: #0c5460;
    }

    .method-stripe {
      background-color: #635bff;
      color: white;
    }

    .method-paypal {
      background-color: #0070ba;
      color: white;
    }

    .method-bank_transfer {
      background-color: #28a745;
      color: white;
    }

    .loading-container,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: #666;
    }

    /* Dark theme support */
    :host-context(.dark-theme) .header-content h1 {
      color: #fff;
    }

    :host-context(.dark-theme) .header-content p {
      color: #ccc;
    }

    :host-context(.dark-theme) .user-name,
    :host-context(.dark-theme) .travel-title,
    :host-context(.dark-theme) .amount,
    :host-context(.dark-theme) .stat-value {
      color: #fff;
    }

    :host-context(.dark-theme) .user-email,
    :host-context(.dark-theme) .travel-destination,
    :host-context(.dark-theme) .fees,
    :host-context(.dark-theme) .time,
    :host-context(.dark-theme) .stat-label {
      color: #ccc;
    }

    :host-context(.dark-theme) .payment-row:hover {
      background-color: #333;
    }

    :host-context(.dark-theme) .empty-state h3 {
      color: #fff;
    }

    :host-context(.dark-theme) .empty-state p {
      color: #ccc;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .payments-container {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-content h1 {
        font-size: 24px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field {
        min-width: auto;
        width: 100%;
      }

      .table-container {
        margin-left: -16px;
        margin-right: -16px;
        padding: 0 16px;
      }
    }
  `]
})
export class PaymentListComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'select',
    'transactionId',
    'user',
    'travel',
    'amount',
    'method',
    'status',
    'createdAt',
    'actions'
  ];

  dataSource = new MatTableDataSource<Payment>([]);
  selection = new SelectionModel<Payment>(true, []);
  isLoading = false;
  stats: any = null;

  // Filter controls
  searchControl = new FormControl('');
  statusControl = new FormControl([]);
  methodControl = new FormControl([]);
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');

  statusOptions = [
    { value: PaymentStatus.PENDING, label: 'Pending' },
    { value: PaymentStatus.COMPLETED, label: 'Completed' },
    { value: PaymentStatus.FAILED, label: 'Failed' },
    { value: PaymentStatus.REFUNDED, label: 'Refunded' }
  ];

  methodOptions = [
    { value: PaymentMethod.STRIPE, label: 'Stripe' },
    { value: PaymentMethod.PAYPAL, label: 'PayPal' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' }
  ];

  constructor(
    private paymentService: PaymentService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPayments();
    this.loadStats();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());

    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());

    this.methodControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());

    this.startDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());

    this.endDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());
  }

  loadPayments(): void {
    this.isLoading = true;

    this.paymentService.getPayments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payments) => {
          this.dataSource.data = payments;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.showError('Failed to load payments');
        }
      });
  }

  loadStats(): void {
    this.paymentService.getPaymentStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Failed to load payment statistics:', error);
        }
      });
  }

  applyFilter(): void {
    const searchValue = this.searchControl.value?.toLowerCase() || '';
    const statusValues = this.statusControl.value || [];
    const methodValues = this.methodControl.value || [];
    const startDate = this.startDateControl.value;
    const endDate = this.endDateControl.value;

    this.dataSource.filterPredicate = (payment: Payment) => {
      const matchesSearch = !searchValue ||
        payment.transactionId.toLowerCase().includes(searchValue) ||
        (payment.user?.firstName + ' ' + payment.user?.lastName).toLowerCase().includes(searchValue) ||
        payment.user?.email.toLowerCase().includes(searchValue);

      const matchesStatus = statusValues.length === 0 || statusValues.includes(payment.status);
      const matchesMethod = methodValues.length === 0 || methodValues.includes(payment.paymentMethod);

      const paymentDate = new Date(payment.createdAt);
      const matchesDateRange = (!startDate || paymentDate >= new Date(startDate)) &&
        (!endDate || paymentDate <= new Date(endDate));

      return matchesSearch && matchesStatus && matchesMethod && matchesDateRange;
    };

    this.dataSource.filter = 'trigger';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  createPayment(): void {
    const dialogRef = this.dialog.open(PaymentFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { payment: null }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadPayments();
          this.loadStats();
          this.notificationService.showSuccess('Payment processed successfully');
        }
      });
  }

  viewPayment(payment: Payment): void {
    const dialogRef = this.dialog.open(PaymentFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { payment, readonly: true }
    });
  }

  refundPayment(payment: Payment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Refund Payment',
        message: `Are you sure you want to refund ${this.formatCurrency(payment.amount, payment.currency)} for transaction ${payment.transactionId}?`,
        confirmText: 'Refund',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.paymentService.refundPayment(payment.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadPayments();
                this.loadStats();
                this.notificationService.showSuccess('Payment refunded successfully');
              },
              error: (error) => {
                this.notificationService.showError('Failed to refund payment');
              }
            });
        }
      });
  }

  retryPayment(payment: Payment): void {
    this.paymentService.retryPayment(payment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadPayments();
          this.notificationService.showSuccess('Payment retry initiated');
        },
        error: (error) => {
          this.notificationService.showError('Failed to retry payment');
        }
      });
  }

  bulkRefund(): void {
    const selectedPayments = this.selection.selected.filter(p => p.status === PaymentStatus.COMPLETED);

    if (selectedPayments.length === 0) {
      this.notificationService.showWarning('No completed payments selected for refund');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Bulk Refund',
        message: `Are you sure you want to refund ${selectedPayments.length} selected payments?`,
        confirmText: 'Refund All',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          const refundPromises = selectedPayments.map(payment =>
            this.paymentService.refundPayment(payment.id).toPromise()
          );

          Promise.all(refundPromises)
            .then(() => {
              this.selection.clear();
              this.loadPayments();
              this.loadStats();
              this.notificationService.showSuccess(`${selectedPayments.length} payments refunded successfully`);
            })
            .catch(() => {
              this.notificationService.showError('Failed to refund some payments');
            });
        }
      });
  }

  copyTransactionId(transactionId: string): void {
    navigator.clipboard.writeText(transactionId).then(() => {
      this.notificationService.showSuccess('Transaction ID copied to clipboard');
    });
  }

  downloadReceipt(payment: Payment): void {
    this.paymentService.downloadReceipt(payment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `receipt-${payment.transactionId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.notificationService.showError('Failed to download receipt');
        }
      });
  }

  sendReceiptEmail(payment: Payment): void {
    this.paymentService.sendReceiptEmail(payment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Receipt sent to customer email');
        },
        error: (error) => {
          this.notificationService.showError('Failed to send receipt email');
        }
      });
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'schedule';
      case PaymentStatus.COMPLETED:
        return 'check_circle';
      case PaymentStatus.FAILED:
        return 'error';
      case PaymentStatus.REFUNDED:
        return 'undo';
      default:
        return 'help';
    }
  }

  getMethodIcon(method: string): string {
    switch (method) {
      case PaymentMethod.STRIPE:
        return 'credit_card';
      case PaymentMethod.PAYPAL:
        return 'account_balance_wallet';
      case PaymentMethod.BANK_TRANSFER:
        return 'account_balance';
      default:
        return 'payment';
    }
  }
}