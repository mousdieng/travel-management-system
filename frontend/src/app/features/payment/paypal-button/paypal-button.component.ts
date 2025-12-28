import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

/**
 * PayPal Button Component
 *
 * This component provides PayPal payment integration using PayPal Checkout SDK.
 *
 * To use PayPal:
 * 1. Load PayPal SDK in index.html or dynamically
 * 2. Initialize PayPal buttons with your client ID
 * 3. Handle order creation and capture
 *
 * SDK URL: https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD
 */
@Component({
  selector: 'app-paypal-button',
  templateUrl: './paypal-button.component.html',
  styleUrls: ['./paypal-button.component.scss']
})
export class PayPalButtonComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() amount: number = 0;
  @Input() currency: string = 'USD';
  @Input() orderId?: string;

  @Output() orderCreated = new EventEmitter<string>();
  @Output() paymentCompleted = new EventEmitter<any>();
  @Output() paymentCancelled = new EventEmitter<void>();
  @Output() paymentError = new EventEmitter<string>();

  isLoading = false;
  paypalLoaded = false;
  paypalButtonsRendered = false;

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPayPal();
  }

  ngAfterViewInit(): void {
    if (this.paypalLoaded) {
      this.renderPayPalButtons();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPayPal(): void {
    // Check if PayPal SDK is already loaded
    if (typeof (window as any).paypal !== 'undefined') {
      this.paypalLoaded = true;
      this.renderPayPalButtons();
      return;
    }

    // Load PayPal SDK dynamically
    const clientId = environment.paypalClientId;
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${this.currency}`;
    script.async = true;

    script.onload = () => {
      this.paypalLoaded = true;
      this.renderPayPalButtons();
    };

    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      this.notificationService.showError('Failed to load PayPal');
    };

    document.body.appendChild(script);
  }

  renderPayPalButtons(): void {
    if (this.paypalButtonsRendered || !this.paypalLoaded) return;

    const paypal = (window as any).paypal;
    if (!paypal) return;

    const buttonContainer = document.getElementById('paypal-button-container');
    if (!buttonContainer) {
      setTimeout(() => this.renderPayPalButtons(), 100);
      return;
    }

    try {
      paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 48
        },

        createOrder: (data: any, actions: any) => {
          return this.handleCreateOrder(data, actions);
        },

        onApprove: (data: any, actions: any) => {
          return this.handleApprove(data, actions);
        },

        onCancel: (data: any) => {
          this.handleCancel(data);
        },

        onError: (err: any) => {
          this.handleError(err);
        }
      }).render('#paypal-button-container');

      this.paypalButtonsRendered = true;
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error);
      this.notificationService.showError('Failed to initialize PayPal');
    }
  }

  private async handleCreateOrder(data: any, actions: any): Promise<string> {
    try {
      this.isLoading = true;

      // If order ID is provided, use it
      if (this.orderId) {
        return this.orderId;
      }

      // Otherwise, create a new order
      const order = await actions.order.create({
        purchase_units: [{
          amount: {
            currency_code: this.currency,
            value: this.amount.toFixed(2)
          },
          description: 'Travel Booking Payment'
        }]
      });

      this.orderCreated.emit(order);
      return order;
    } catch (error: any) {
      console.error('Error creating PayPal order:', error);
      this.notificationService.showError('Failed to create payment order');
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async handleApprove(data: any, actions: any): Promise<void> {
    try {
      this.isLoading = true;
      this.notificationService.showInfo('Processing payment...');

      const order = await actions.order.capture();

      this.isLoading = false;
      this.paymentCompleted.emit({
        orderId: order.id,
        status: order.status,
        payer: order.payer,
        purchase_units: order.purchase_units
      });

      this.notificationService.showSuccess('Payment successful!');
    } catch (error: any) {
      this.isLoading = false;
      console.error('Error capturing PayPal order:', error);
      this.notificationService.showError('Failed to process payment');
      this.paymentError.emit(error.message);
    }
  }

  private handleCancel(data: any): void {
    this.notificationService.showInfo('Payment cancelled');
    this.paymentCancelled.emit();
  }

  private handleError(err: any): void {
    console.error('PayPal error:', err);
    this.notificationService.showError('Payment failed. Please try again.');
    this.paymentError.emit(err.message || 'Payment failed');
  }

  formatAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }
}
