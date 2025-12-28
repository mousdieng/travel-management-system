import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Payment, PaymentStatus } from '../../../core/models/payment.model';

@Component({
  selector: 'app-payment-confirmation',
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.scss']
})
export class PaymentConfirmationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  payment: Payment | null = null;
  paymentId: string | null = null;
  bookingId: string | null = null;
  status: string | null = null;

  isLoading = false;
  isDownloading = false;
  isEmailing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadConfirmationDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConfirmationDetails(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.paymentId = params['paymentId'];
        this.bookingId = params['bookingId'];
        this.status = params['status'];

        if (this.paymentId) {
          this.loadPaymentDetails(this.paymentId);
        }
      });
  }

  loadPaymentDetails(paymentId: string): void {
    this.isLoading = true;
    this.paymentService.getPaymentById(paymentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (payment) => {
          this.payment = payment;
        },
        error: (error) => {
          console.error('Error loading payment details:', error);
          this.notificationService.showError('Failed to load payment details');
        }
      });
  }

  downloadReceipt(): void {
    if (!this.paymentId) return;

    this.isDownloading = true;
    this.paymentService.downloadPaymentReceipt(this.paymentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isDownloading = false)
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `receipt-${this.paymentId}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.showSuccess('Receipt downloaded successfully');
        },
        error: (error) => {
          console.error('Error downloading receipt:', error);
          this.notificationService.showError('Failed to download receipt');
        }
      });
  }

  emailReceipt(): void {
    if (!this.paymentId) return;

    this.isEmailing = true;
    this.paymentService.emailPaymentReceipt(this.paymentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isEmailing = false)
      )
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Receipt sent to your email');
        },
        error: (error) => {
          console.error('Error sending receipt:', error);
          this.notificationService.showError('Failed to send receipt');
        }
      });
  }

  viewReceipt(): void {
    if (this.paymentId) {
      this.router.navigate(['/payments/receipt', this.paymentId]);
    }
  }

  viewBooking(): void {
    if (this.bookingId) {
      this.router.navigate(['/bookings', this.bookingId]);
    } else if (this.payment?.metadata?.['bookingId']) {
      this.router.navigate(['/bookings', this.payment.metadata['bookingId']]);
    } else {
      this.router.navigate(['/bookings']);
    }
  }

  goToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  isPaymentSuccessful(): boolean {
    return this.status === 'COMPLETED' || this.payment?.status === PaymentStatus.COMPLETED;
  }

  getStatusIcon(): string {
    if (this.isPaymentSuccessful()) {
      return 'check_circle';
    } else {
      return 'error';
    }
  }

  getStatusColor(): string {
    if (this.isPaymentSuccessful()) {
      return '#4caf50';
    } else {
      return '#f44336';
    }
  }

  getStatusTitle(): string {
    if (this.isPaymentSuccessful()) {
      return 'Payment Successful!';
    } else {
      return 'Payment Failed';
    }
  }

  getStatusMessage(): string {
    if (this.isPaymentSuccessful()) {
      return 'Your payment has been processed successfully. You will receive a confirmation email shortly.';
    } else {
      return 'We were unable to process your payment. Please try again or contact support.';
    }
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentMethodDisplay(): string {
    if (!this.payment || !this.payment.method) return 'N/A';
    return this.payment.method.name || 'Payment Method';
  }

  printPage(): void {
    window.print();
  }
}
