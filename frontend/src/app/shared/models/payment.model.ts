export interface Payment {
  id: string;
  transactionId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  travel?: {
    id: string;
    title: string;
    destination?: {
      name: string;
      country: string;
    };
    price: number;
    currency: string;
  };
  amount: number;
  currency: string;
  fees?: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;

  // Card details (for Stripe)
  cardLast4?: string;
  cardBrand?: string;

  // Bank transfer details
  bankReference?: string;

  // Additional info
  participants?: number;
  description?: string;
  notes?: string;

  // Gateway specific data
  stripePaymentIntentId?: string;
  paypalOrderId?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  refundedAt?: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface PaymentCreateRequest {
  userId: string;
  travelId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  participants?: number;
  description?: string;
  notes?: string;

  // Gateway specific
  stripeToken?: string;
  paypalOrderId?: string;
  bankReference?: string;
}

export interface PaymentUpdateRequest {
  status?: PaymentStatus;
  notes?: string;
  bankReference?: string;
}

export interface PaymentRefundRequest {
  amount?: number; // Partial refund amount, full refund if not specified
  reason?: string;
}

export interface PaymentSearchCriteria {
  query?: string;
  userId?: string;
  travelId?: string;
  status?: PaymentStatus[];
  paymentMethod?: PaymentMethod[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface PaymentListResponse {
  payments: Payment[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PaymentStatistics {
  totalAmount: number;
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  averagePaymentAmount: number;

  // By method
  paymentsByMethod: {
    [key in PaymentMethod]: {
      count: number;
      amount: number;
    };
  };

  // By currency
  paymentsByCurrency: {
    [currency: string]: {
      count: number;
      amount: number;
    };
  };

  // Recent trends
  monthlyTrends: {
    month: string;
    totalAmount: number;
    totalPayments: number;
  }[];
}

export interface PaymentHistory {
  id: string;
  paymentId: string;
  action: string;
  status: PaymentStatus;
  description: string;
  amount?: number;
  timestamp: Date;
  performedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
  links: {
    rel: string;
    href: string;
    method: string;
  }[];
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: Date;
}