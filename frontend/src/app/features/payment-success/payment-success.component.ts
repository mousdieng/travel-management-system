import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { LoadingService } from '../../core/services/loading.service';
import { Payment, PaymentStatus } from '../../core/models';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  payment: Payment | null = null;
  subscription: any = null;
  isLoading = true;
  error: string | null = null;

  // Handle URL parameters from Stripe redirect
  sessionId: string | null = null;
  paymentIntentId: string | null = null;
  paymentId: number | null = null;
  bookingId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private subscriptionService: SubscriptionService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'] || params['sessionId'];
      this.paymentIntentId = params['payment_intent'] || params['paymentIntentId'];
      this.paymentId = params['paymentId'] ? +params['paymentId'] : null;
      this.bookingId = params['bookingId'] ? +params['bookingId'] : null;

      this.processPaymentConfirmation();
    });
  }

  processPaymentConfirmation() {
    this.loadingService.show();

    if (this.sessionId || this.paymentIntentId) {
      // Coming from Stripe redirect - need to confirm payment
      const id = this.sessionId || this.paymentIntentId || '';

      this.paymentService.confirmStripePayment(id).subscribe({
        next: (payment) => {
          this.payment = payment;

          if (payment.status === PaymentStatus.COMPLETED) {
            if (payment.bookingId) {
              this.loadSubscription(payment.bookingId);
            } else {
              this.isLoading = false;
              this.loadingService.hide();
            }
          } else {
            this.error = 'Payment confirmation is pending';
            this.isLoading = false;
            this.loadingService.hide();
          }
        },
        error: (error) => {
          this.error = 'Failed to confirm payment';
          console.error(error);
          this.isLoading = false;
          this.loadingService.hide();
        }
      });

    } else if (this.paymentId) {
      // Coming from direct link with payment ID
      this.paymentService.getPaymentById(this.paymentId).subscribe({
        next: (payment) => {
          this.payment = payment;

          if (payment.bookingId) {
            this.loadSubscription(payment.bookingId);
          } else {
            this.isLoading = false;
            this.loadingService.hide();
          }
        },
        error: (error) => {
          this.error = 'Failed to load payment details';
          console.error(error);
          this.isLoading = false;
          this.loadingService.hide();
        }
      });

    } else {
      this.error = 'Invalid payment confirmation link';
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  loadSubscription(bookingId: number) {
    this.subscriptionService.getSubscriptionById(bookingId.toString()).subscribe({
      next: (subscription) => {
        this.subscription = subscription;
        this.isLoading = false;
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Failed to load subscription:', error);
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  printConfirmation() {
    window.print();
  }

  downloadInvoice() {
    // TODO: Implement invoice download
    console.log('Download invoice for payment:', this.payment?.id);
  }
}
