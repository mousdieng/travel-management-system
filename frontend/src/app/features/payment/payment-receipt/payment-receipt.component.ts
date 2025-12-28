import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Payment } from '../../../core/models/payment.model';

@Component({
  selector: 'app-payment-receipt',
  templateUrl: './payment-receipt.component.html',
  styleUrls: ['./payment-receipt.component.scss']
})
export class PaymentReceiptComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  payment: Payment | null = null;
  paymentId: string | null = null;

  isLoading = false;
  isDownloading = false;
  isEmailing = false;

  // Company/Organization Details (should come from config)
  companyInfo = {
    name: 'Travel Plan Inc.',
    address: '123 Travel Street',
    city: 'San Francisco, CA 94102',
    country: 'United States',
    phone: '+1 (555) 123-4567',
    email: 'support@travelplan.com',
    website: 'www.travelplan.com',
    taxId: 'TAX-123456789'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadReceipt();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReceipt(): void {
    this.paymentId = this.route.snapshot.paramMap.get('id');

    if (!this.paymentId) {
      this.notificationService.showError('Invalid receipt ID');
      this.router.navigate(['/payments']);
      return;
    }

    this.isLoading = true;
    this.paymentService.getPaymentById(this.paymentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (payment) => {
          this.payment = payment;
        },
        error: (error) => {
          console.error('Error loading receipt:', error);
          this.notificationService.showError('Failed to load receipt');
          this.router.navigate(['/payments']);
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

  printReceipt(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/payments']);
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
      day: 'numeric'
    });
  }

  formatDateTime(date: Date | string): string {
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

  calculateSubtotal(): number {
    if (!this.payment) return 0;
    return this.payment.amount * 0.9; // Assuming 90% is subtotal
  }

  calculateTaxes(): number {
    if (!this.payment) return 0;
    return this.payment.amount * 0.1; // Assuming 10% is taxes
  }

  getReceiptNumber(): string {
    if (!this.payment) return 'N/A';
    return `REC-${this.payment.id.substring(0, 8).toUpperCase()}`;
  }

  getInvoiceNumber(): string {
    if (!this.payment) return 'N/A';
    return `INV-${new Date(this.payment.createdAt).getFullYear()}-${this.payment.id.substring(0, 6).toUpperCase()}`;
  }
}
