import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { Payment, PaymentMethod, PaymentStatus } from '../../../shared/models/payment.model';
import { PaymentService } from '../../../core/services/payment.service';
import { UserService } from '../../../core/services/user.service';
import { TravelService } from '../../../core/services/travel.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-payment-form',
  template: `
    <div class="payment-form-container">
      <h2 mat-dialog-title>
        {{ data.payment ? (data.readonly ? 'Payment Details' : 'Edit Payment') : 'Process New Payment' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="paymentForm" class="payment-form">
          <!-- Payment Information -->
          <div class="form-section">
            <h3>Payment Information</h3>

            <div class="form-row" *ngIf="data.payment">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Transaction ID</mat-label>
                <input matInput [value]="data.payment.transactionId" readonly>
                <button mat-icon-button matSuffix (click)="copyTransactionId()">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>User</mat-label>
                <mat-select formControlName="userId" [disabled]="data.readonly">
                  <mat-option *ngFor="let user of users" [value]="user.id">
                    {{ user.firstName }} {{ user.lastName }} ({{ user.email }})
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="paymentForm.get('userId')?.hasError('required')">
                  User is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Travel Package</mat-label>
                <mat-select formControlName="travelId" [disabled]="data.readonly">
                  <mat-option *ngFor="let travel of travels" [value]="travel.id">
                    {{ travel.title }} - {{ formatCurrency(travel.price, travel.currency) }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="paymentForm.get('travelId')?.hasError('required')">
                  Travel package is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Amount</mat-label>
                <input matInput type="number" step="0.01" formControlName="amount" [readonly]="data.readonly">
                <span matPrefix>$&nbsp;</span>
                <mat-error *ngIf="paymentForm.get('amount')?.hasError('required')">
                  Amount is required
                </mat-error>
                <mat-error *ngIf="paymentForm.get('amount')?.hasError('min')">
                  Amount must be greater than 0
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Currency</mat-label>
                <mat-select formControlName="currency" [disabled]="data.readonly">
                  <mat-option value="USD">USD - US Dollar</mat-option>
                  <mat-option value="EUR">EUR - Euro</mat-option>
                  <mat-option value="GBP">GBP - British Pound</mat-option>
                  <mat-option value="CAD">CAD - Canadian Dollar</mat-option>
                  <mat-option value="AUD">AUD - Australian Dollar</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="paymentMethod" [disabled]="data.readonly">
                  <mat-option value="STRIPE">
                    <mat-icon>credit_card</mat-icon>
                    Stripe (Credit Card)
                  </mat-option>
                  <mat-option value="PAYPAL">
                    <mat-icon>account_balance_wallet</mat-icon>
                    PayPal
                  </mat-option>
                  <mat-option value="BANK_TRANSFER">
                    <mat-icon>account_balance</mat-icon>
                    Bank Transfer
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="paymentForm.get('paymentMethod')?.hasError('required')">
                  Payment method is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width" *ngIf="data.payment">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status" [disabled]="data.readonly">
                  <mat-option value="PENDING">
                    <mat-icon>schedule</mat-icon>
                    Pending
                  </mat-option>
                  <mat-option value="COMPLETED">
                    <mat-icon>check_circle</mat-icon>
                    Completed
                  </mat-option>
                  <mat-option value="FAILED">
                    <mat-icon>error</mat-icon>
                    Failed
                  </mat-option>
                  <mat-option value="REFUNDED">
                    <mat-icon>undo</mat-icon>
                    Refunded
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row" *ngIf="paymentForm.get('paymentMethod')?.value === 'STRIPE'">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Card Last 4 Digits</mat-label>
                <input matInput formControlName="cardLast4" maxlength="4" [readonly]="data.readonly">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Card Brand</mat-label>
                <mat-select formControlName="cardBrand" [disabled]="data.readonly">
                  <mat-option value="visa">Visa</mat-option>
                  <mat-option value="mastercard">Mastercard</mat-option>
                  <mat-option value="amex">American Express</mat-option>
                  <mat-option value="discover">Discover</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Payment Gateway Integration -->
          <div class="form-section" *ngIf="!data.payment && paymentForm.get('paymentMethod')?.value">
            <h3>Payment Gateway</h3>

            <!-- Stripe Payment Form -->
            <div *ngIf="paymentForm.get('paymentMethod')?.value === 'STRIPE'" class="gateway-section">
              <div class="stripe-elements">
                <div class="form-row">
                  <div class="stripe-card-element" id="stripe-card-element">
                    <!-- Stripe Elements will be mounted here -->
                  </div>
                </div>
                <div class="stripe-errors" id="stripe-card-errors" role="alert"></div>
              </div>
            </div>

            <!-- PayPal Payment Form -->
            <div *ngIf="paymentForm.get('paymentMethod')?.value === 'PAYPAL'" class="gateway-section">
              <div class="paypal-buttons" id="paypal-button-container">
                <!-- PayPal Buttons will be rendered here -->
              </div>
            </div>

            <!-- Bank Transfer Instructions -->
            <div *ngIf="paymentForm.get('paymentMethod')?.value === 'BANK_TRANSFER'" class="gateway-section">
              <mat-card class="bank-transfer-info">
                <mat-card-header>
                  <mat-card-title>Bank Transfer Instructions</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="transfer-details">
                    <div class="detail-row">
                      <span class="label">Account Name:</span>
                      <span class="value">Travel Management Inc.</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Account Number:</span>
                      <span class="value">1234567890</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Routing Number:</span>
                      <span class="value">021000021</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Reference:</span>
                      <span class="value">TRV-{{ generateReference() }}</span>
                    </div>
                  </div>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Transfer Reference Number</mat-label>
                    <input matInput formControlName="bankReference" placeholder="Enter your transfer reference">
                  </mat-form-field>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <!-- Additional Details -->
          <div class="form-section">
            <h3>Additional Details</h3>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Processing Fees</mat-label>
                <input matInput type="number" step="0.01" formControlName="fees" [readonly]="data.readonly">
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Number of Participants</mat-label>
                <input matInput type="number" formControlName="participants" min="1" [readonly]="data.readonly">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Payment Description</mat-label>
                <textarea
                  matInput
                  formControlName="description"
                  rows="3"
                  placeholder="Description of the payment..."
                  [readonly]="data.readonly">
                </textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Internal Notes</mat-label>
                <textarea
                  matInput
                  formControlName="notes"
                  rows="2"
                  placeholder="Internal notes (not visible to customer)..."
                  [readonly]="data.readonly">
                </textarea>
              </mat-form-field>
            </div>
          </div>

          <!-- Payment History -->
          <div class="form-section" *ngIf="data.payment && paymentHistory.length > 0">
            <h3>Payment History</h3>
            <div class="history-timeline">
              <div class="history-item" *ngFor="let item of paymentHistory">
                <div class="history-icon">
                  <mat-icon [class]="'status-' + item.status.toLowerCase()">
                    {{ getStatusIcon(item.status) }}
                  </mat-icon>
                </div>
                <div class="history-content">
                  <div class="history-title">{{ item.action }}</div>
                  <div class="history-description">{{ item.description }}</div>
                  <div class="history-timestamp">{{ item.timestamp | date:'medium' }}</div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.readonly ? 'Close' : 'Cancel' }}
        </button>
        <button
          *ngIf="!data.readonly"
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="paymentForm.invalid || isLoading">
          {{ data.payment ? 'Update Payment' : 'Process Payment' }}
        </button>
        <button
          *ngIf="data.payment && data.payment.status === 'COMPLETED'"
          mat-raised-button
          color="warn"
          (click)="onRefund()"
          [disabled]="isLoading">
          Refund Payment
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit, OnDestroy {
  paymentForm: FormGroup;
  isLoading = false;
  users: any[] = [];
  travels: any[] = [];
  paymentHistory: any[] = [];
  private destroy$ = new Subject<void>();

  // Stripe elements
  private stripe: any;
  private cardElement: any;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private userService: UserService,
    private travelService: TravelService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private dialogRef: MatDialogRef<PaymentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { payment?: Payment; readonly?: boolean }
  ) {
    this.paymentForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadFormData();

    if (this.data.payment) {
      this.populateForm(this.data.payment);
      this.loadPaymentHistory();
    }

    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isLoading = loading);

    // Initialize payment gateways for new payments
    if (!this.data.payment) {
      this.initializePaymentGateways();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      userId: ['', Validators.required],
      travelId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      currency: ['USD'],
      paymentMethod: ['', Validators.required],
      status: ['PENDING'],
      cardLast4: [''],
      cardBrand: [''],
      bankReference: [''],
      fees: [0],
      participants: [1, [Validators.min(1)]],
      description: [''],
      notes: ['']
    });
  }

  private loadFormData(): void {
    // Load users
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users = users;
      });

    // Load travels
    this.travelService.getAllTravels()
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.travels = response.travels || response;
      });
  }

  private populateForm(payment: Payment): void {
    this.paymentForm.patchValue({
      userId: payment.user?.id,
      travelId: payment.travel?.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      cardLast4: payment.cardLast4,
      cardBrand: payment.cardBrand,
      bankReference: payment.bankReference,
      fees: payment.fees || 0,
      participants: payment.participants || 1,
      description: payment.description || '',
      notes: payment.notes || ''
    });
  }

  private loadPaymentHistory(): void {
    if (this.data.payment) {
      this.paymentService.getPaymentHistory(this.data.payment.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (history) => {
            this.paymentHistory = history;
          },
          error: (error) => {
            console.error('Failed to load payment history:', error);
          }
        });
    }
  }

  private initializePaymentGateways(): void {
    // Initialize Stripe
    if ((window as any).Stripe) {
      this.stripe = (window as any).Stripe(environment.external.stripePublishableKey);

      setTimeout(() => {
        this.setupStripeElements();
      }, 100);
    }

    // Initialize PayPal
    if ((window as any).paypal) {
      setTimeout(() => {
        this.setupPayPalButtons();
      }, 100);
    }
  }

  private setupStripeElements(): void {
    if (!this.stripe) return;

    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
      },
    });

    const cardElementContainer = document.getElementById('stripe-card-element');
    if (cardElementContainer) {
      this.cardElement.mount('#stripe-card-element');

      this.cardElement.on('change', (event: any) => {
        const displayError = document.getElementById('stripe-card-errors');
        if (event.error) {
          displayError!.textContent = event.error.message;
        } else {
          displayError!.textContent = '';
        }
      });
    }
  }

  private setupPayPalButtons(): void {
    const paypalContainer = document.getElementById('paypal-button-container');
    if (!paypalContainer || !(window as any).paypal) return;

    (window as any).paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: this.paymentForm.get('amount')?.value || '0.00'
            }
          }]
        });
      },
      onApprove: (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          this.handlePayPalSuccess(details);
        });
      },
      onError: (err: any) => {
        this.notificationService.showError('PayPal payment failed');
        console.error('PayPal error:', err);
      }
    }).render('#paypal-button-container');
  }

  private async handleStripePayment(): Promise<boolean> {
    if (!this.stripe || !this.cardElement) {
      this.notificationService.showError('Stripe not initialized');
      return false;
    }

    const { token, error } = await this.stripe.createToken(this.cardElement);

    if (error) {
      this.notificationService.showError(error.message);
      return false;
    }

    // Process payment with backend
    return this.processPaymentWithToken(token);
  }

  private handlePayPalSuccess(details: any): void {
    // Update form with PayPal details
    this.paymentForm.patchValue({
      status: 'COMPLETED'
    });

    this.notificationService.showSuccess('PayPal payment completed');
  }

  private async processPaymentWithToken(token: any): Promise<boolean> {
    try {
      const paymentData = {
        ...this.paymentForm.value,
        stripeToken: token.id,
        cardLast4: token.card.last4,
        cardBrand: token.card.brand
      };

      await this.paymentService.processStripePayment(paymentData).toPromise();
      return true;
    } catch (error) {
      this.notificationService.showError('Payment processing failed');
      return false;
    }
  }

  generateReference(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  copyTransactionId(): void {
    if (this.data.payment) {
      navigator.clipboard.writeText(this.data.payment.transactionId).then(() => {
        this.notificationService.showSuccess('Transaction ID copied to clipboard');
      });
    }
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

  async onSave(): Promise<void> {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.loadingService.setLoading(true);

    try {
      if (this.data.payment) {
        // Update existing payment
        const updateData = this.paymentForm.value;
        await this.paymentService.updatePayment(this.data.payment.id, updateData).toPromise();
        this.notificationService.showSuccess('Payment updated successfully');
      } else {
        // Process new payment
        const paymentMethod = this.paymentForm.get('paymentMethod')?.value;

        if (paymentMethod === PaymentMethod.STRIPE) {
          const success = await this.handleStripePayment();
          if (!success) return;
        } else if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
          // For bank transfer, just create the payment record
          await this.paymentService.createPayment(this.paymentForm.value).toPromise();
        }

        this.notificationService.showSuccess('Payment processed successfully');
      }

      this.dialogRef.close(true);
    } catch (error) {
      this.notificationService.showError('Payment operation failed');
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  onRefund(): void {
    if (!this.data.payment) return;

    this.loadingService.setLoading(true);

    this.paymentService.refundPayment(this.data.payment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Payment refunded successfully');
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.notificationService.showError('Failed to refund payment');
        },
        complete: () => {
          this.loadingService.setLoading(false);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}