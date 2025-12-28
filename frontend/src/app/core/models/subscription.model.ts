export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface Subscription {
  id: string;
  travelId: string;
  travelTitle: string;
  travelStartDate?: string;
  travelEndDate?: string;
  travelDestination?: string;
  travelPrice?: number;
  travelManagerName?: string;
  travelerId: string;
  travelerName: string;
  numberOfParticipants: number;
  totalAmount: number;
  status: SubscriptionStatus;
  paymentStatus: string;
  subscribedAt: Date | string;
  updatedAt: Date | string;
  cancelledAt?: Date | string;
  canBeCancelled?: boolean;
}

export interface CreateSubscriptionRequest {
  travelId: string;
  numberOfParticipants: number;
  passengerDetails: import('./payment.model').PassengerDetail[];
}
