export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL'
}

export interface Payment {
  id: number;
  userId: number;
  bookingId: number;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  externalTransactionId?: string;
  paymentIntentId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  failureReason?: string;

  // Redirect URLs for payment completion
  checkoutUrl?: string;     // For Stripe Checkout Session
  clientSecret?: string;    // For Stripe Payment Intent (legacy)
  approvalUrl?: string;     // For PayPal
}

export interface ProcessPaymentRequest {
  userId: number;
  bookingId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  currency?: string;
  stripeToken?: string;
  stripePaymentMethodId?: string;
  paypalOrderId?: string;
}

// Payment-first checkout interfaces
export interface PassengerDetail {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  phoneNumber?: string;
  email?: string;
}

export interface CheckoutRequest {
  userId: number;
  travelId: number;
  subscriptionId?: number; // For subscribe-first flow: pay for existing subscription
  numberOfParticipants: number;
  passengerDetails?: PassengerDetail[];
  amount: number;
  paymentMethod: PaymentMethod;
  currency?: string;
  stripePaymentMethodId?: string;
  savedPaymentMethodId?: number;
  savePaymentMethod?: boolean;
  cardholderName?: string;
  paypalOrderId?: string;
}

export interface ManagerIncomeStats {
  managerId: number;
  totalIncome: number;
  thisMonthIncome: number;
  lastMonthIncome: number;
  pendingPayments: number;
  completedPayments: number;
  averageTransactionValue: number;
}

// Saved Payment Method interfaces
export interface SavedPaymentMethod {
  id: number;
  userId: number;
  paymentMethod: PaymentMethod;
  stripePaymentMethodId?: string;
  cardholderName?: string;
  last4?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavePaymentMethodRequest {
  stripePaymentMethodId?: string;
  cardholderName?: string;
  setAsDefault?: boolean;
}
