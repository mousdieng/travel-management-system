import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { Booking, BookingStatus } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.scss']
})
export class BookingDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  booking: Booking | null = null;
  isLoading = false;
  bookingId: string = '';

  // Status tracking
  BookingStatus = BookingStatus;

  // Timeline events
  timelineEvents: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('id') || '';
    if (this.bookingId) {
      this.loadBooking();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBooking(): void {
    this.isLoading = true;

    this.bookingService.getBookingById(this.bookingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (booking) => {
          this.booking = booking;
          this.buildTimeline();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.showError('Failed to load booking details');
          this.router.navigate(['/bookings']);
        }
      });
  }

  buildTimeline(): void {
    if (!this.booking) return;

    this.timelineEvents = [
      {
        icon: 'event_note',
        title: 'Booking Created',
        date: this.booking.bookingDate,
        description: `Booking ${this.booking.bookingReference} was created`,
        color: '#2196f3'
      }
    ];

    if (this.booking.status === BookingStatus.CONFIRMED ||
        this.booking.status === BookingStatus.PAID ||
        this.booking.status === BookingStatus.COMPLETED) {
      this.timelineEvents.push({
        icon: 'check_circle',
        title: 'Booking Confirmed',
        date: this.booking.updatedAt,
        description: 'Booking has been confirmed',
        color: '#4caf50'
      });
    }

    if (this.booking.paidAt) {
      this.timelineEvents.push({
        icon: 'payment',
        title: 'Payment Received',
        date: this.booking.paidAt,
        description: `Payment of ${this.formatCurrency(this.booking.pricing.totalAmount)} received`,
        color: '#4caf50'
      });
    }

    if (this.booking.status === BookingStatus.CANCELLED) {
      this.timelineEvents.push({
        icon: 'cancel',
        title: 'Booking Cancelled',
        date: this.booking.cancelledAt,
        description: this.booking.cancellationReason || 'Booking was cancelled',
        color: '#f44336'
      });
    }

    if (this.booking.status === BookingStatus.COMPLETED) {
      this.timelineEvents.push({
        icon: 'done_all',
        title: 'Trip Completed',
        date: this.booking.travelEndDate,
        description: 'Travel has been completed',
        color: '#4caf50'
      });
    }
  }

  confirmBooking(): void {
    if (!this.booking) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Booking',
        message: `Are you sure you want to confirm booking ${this.booking.bookingReference}?`,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed && this.booking) {
          this.bookingService.confirmBooking(this.booking.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadBooking();
                this.notificationService.showSuccess('Booking confirmed successfully');
              },
              error: (error) => {
                this.notificationService.showError('Failed to confirm booking');
              }
            });
        }
      });
  }

  cancelBooking(): void {
    if (!this.booking) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancel Booking',
        message: `Are you sure you want to cancel booking ${this.booking.bookingReference}?`,
        confirmText: 'Cancel Booking',
        cancelText: 'Keep Booking',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed && this.booking) {
          this.bookingService.cancelBooking(this.booking.id, { reason: 'Cancelled by user' })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadBooking();
                this.notificationService.showSuccess('Booking cancelled successfully');
              },
              error: (error) => {
                this.notificationService.showError('Failed to cancel booking');
              }
            });
        }
      });
  }

  processPayment(): void {
    if (!this.booking) return;

    this.router.navigate(['/payments/create'], {
      queryParams: { bookingId: this.booking.id }
    });
  }

  downloadConfirmation(): void {
    if (!this.booking) return;

    this.bookingService.downloadBookingConfirmation(this.booking.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `booking-${this.booking?.bookingReference}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.notificationService.showSuccess('Confirmation downloaded successfully');
        },
        error: (error) => {
          this.notificationService.showError('Failed to download confirmation');
        }
      });
  }

  downloadInvoice(): void {
    if (!this.booking) return;

    this.bookingService.downloadBookingInvoice(this.booking.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${this.booking?.bookingReference}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.notificationService.showSuccess('Invoice downloaded successfully');
        },
        error: (error) => {
          this.notificationService.showError('Failed to download invoice');
        }
      });
  }

  resendConfirmation(): void {
    if (!this.booking) return;

    this.bookingService.sendConfirmationEmail(this.booking.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Confirmation email sent successfully');
        },
        error: (error) => {
          this.notificationService.showError('Failed to send confirmation email');
        }
      });
  }

  editBooking(): void {
    if (!this.booking) return;

    // Navigate to edit page (to be implemented)
    this.notificationService.showInfo('Edit functionality coming soon');
  }

  goBack(): void {
    this.router.navigate(['/bookings']);
  }

  // Utility Methods

  canConfirm(): boolean {
    return this.booking?.status === BookingStatus.PENDING;
  }

  canCancel(): boolean {
    return this.booking?.status === BookingStatus.PENDING ||
           this.booking?.status === BookingStatus.CONFIRMED;
  }

  canProcessPayment(): boolean {
    return this.booking?.status === BookingStatus.CONFIRMED &&
           !this.booking?.paymentId;
  }

  canEdit(): boolean {
    return this.booking?.status === BookingStatus.PENDING ||
           this.booking?.status === BookingStatus.CONFIRMED;
  }

  getDaysUntilTravel(): number {
    if (!this.booking) return 0;
    return this.bookingService.getDaysUntilTravel(this.booking);
  }

  getTotalPassengers(): number {
    if (!this.booking) return 0;
    return this.bookingService.getTotalPassengers(this.booking);
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getStatusColor(status: BookingStatus): string {
    return this.bookingService.getBookingStatusColor(status);
  }

  getStatusIcon(status: BookingStatus): string {
    return this.bookingService.getBookingStatusIcon(status);
  }

  getPassengerTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ADULT': 'Adult',
      'CHILD': 'Child',
      'INFANT': 'Infant',
      'SENIOR': 'Senior'
    };
    return labels[type] || type;
  }
}
