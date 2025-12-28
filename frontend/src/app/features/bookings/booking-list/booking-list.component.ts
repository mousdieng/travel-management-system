import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Booking, BookingStatus } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'select',
    'bookingReference',
    'user',
    'travel',
    'travelDate',
    'passengers',
    'amount',
    'status',
    'bookingDate',
    'actions'
  ];

  dataSource = new MatTableDataSource<Booking>([]);
  selection = new SelectionModel<Booking>(true, []);
  isLoading = false;
  stats: any = null;

  // Filter controls
  searchControl = new FormControl('');
  statusControl = new FormControl<BookingStatus[]>([]);
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');

  statusOptions = [
    { value: BookingStatus.PENDING, label: 'Pending', icon: 'schedule', color: '#ff9800' },
    { value: BookingStatus.CONFIRMED, label: 'Confirmed', icon: 'check_circle', color: '#2196f3' },
    { value: BookingStatus.PAID, label: 'Paid', icon: 'payment', color: '#4caf50' },
    { value: BookingStatus.CANCELLED, label: 'Cancelled', icon: 'cancel', color: '#f44336' },
    { value: BookingStatus.COMPLETED, label: 'Completed', icon: 'done_all', color: '#4caf50' }
  ];

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.loadStatistics();
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

    this.startDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());

    this.endDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());
  }

  loadBookings(): void {
    this.isLoading = true;

    this.bookingService.getAllBookings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.bookings;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.showError('Failed to load bookings');
        }
      });
  }

  loadStatistics(): void {
    this.bookingService.getBookingStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Failed to load booking statistics:', error);
        }
      });
  }

  applyFilter(): void {
    const searchValue = this.searchControl.value?.toLowerCase() || '';
    const statusValues = this.statusControl.value || [];
    const startDate = this.startDateControl.value;
    const endDate = this.endDateControl.value;

    this.dataSource.filterPredicate = (booking: Booking, filter: string): boolean => {
      const matchesSearch = !searchValue ||
        booking.bookingReference.toLowerCase().includes(searchValue) ||
        (booking.user?.firstName + ' ' + booking.user?.lastName).toLowerCase().includes(searchValue) ||
        (booking.travel?.title?.toLowerCase().includes(searchValue) || false);

      const matchesStatus = statusValues.length === 0 || statusValues.includes(booking.status);

      const bookingDate = new Date(booking.bookingDate);
      const matchesDateRange = (!startDate || bookingDate >= new Date(startDate)) &&
        (!endDate || bookingDate <= new Date(endDate));

      return !!(matchesSearch && matchesStatus && matchesDateRange);
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

  createBooking(): void {
    this.router.navigate(['/bookings/create']);
  }

  viewBooking(booking: Booking): void {
    this.router.navigate(['/bookings', booking.id]);
  }

  confirmBooking(booking: Booking): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Booking',
        message: `Are you sure you want to confirm booking ${booking.bookingReference}?`,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.bookingService.confirmBooking(booking.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadBookings();
                this.notificationService.showSuccess('Booking confirmed successfully');
              },
              error: (error) => {
                this.notificationService.showError('Failed to confirm booking');
              }
            });
        }
      });
  }

  cancelBooking(booking: Booking): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancel Booking',
        message: `Are you sure you want to cancel booking ${booking.bookingReference}?`,
        confirmText: 'Cancel Booking',
        cancelText: 'Keep Booking',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.bookingService.cancelBooking(booking.id, { reason: 'Cancelled by admin' })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadBookings();
                this.notificationService.showSuccess('Booking cancelled successfully');
              },
              error: (error) => {
                this.notificationService.showError('Failed to cancel booking');
              }
            });
        }
      });
  }

  processPayment(booking: Booking): void {
    this.router.navigate(['/payments/create'], {
      queryParams: { bookingId: booking.id }
    });
  }

  downloadConfirmation(booking: Booking): void {
    this.bookingService.downloadBookingConfirmation(booking.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `booking-${booking.bookingReference}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.notificationService.showError('Failed to download confirmation');
        }
      });
  }

  resendConfirmation(booking: Booking): void {
    this.bookingService.sendConfirmationEmail(booking.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Confirmation email sent');
        },
        error: (error) => {
          this.notificationService.showError('Failed to send confirmation email');
        }
      });
  }

  bulkCancel(): void {
    const selectedBookings = this.selection.selected.filter(
      b => b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED
    );

    if (selectedBookings.length === 0) {
      this.notificationService.showWarning('No eligible bookings selected for cancellation');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Bulk Cancel',
        message: `Are you sure you want to cancel ${selectedBookings.length} selected bookings?`,
        confirmText: 'Cancel All',
        cancelText: 'Keep',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          const bookingIds = selectedBookings.map(b => b.id);
          this.bookingService.bulkCancelBookings(bookingIds, 'Bulk cancellation by admin')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (result) => {
                this.selection.clear();
                this.loadBookings();
                this.notificationService.showSuccess(
                  `${result.cancelled.length} bookings cancelled successfully`
                );
              },
              error: (error) => {
                this.notificationService.showError('Failed to cancel some bookings');
              }
            });
        }
      });
  }

  exportBookings(): void {
    this.bookingService.exportBookings(undefined, 'csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.notificationService.showSuccess('Bookings exported successfully');
        },
        error: (error) => {
          this.notificationService.showError('Failed to export bookings');
        }
      });
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getStatusIcon(status: BookingStatus): string {
    return this.bookingService.getBookingStatusIcon(status);
  }

  getStatusColor(status: BookingStatus): string {
    return this.bookingService.getBookingStatusColor(status);
  }
}
