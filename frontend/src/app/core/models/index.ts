export * from './user.model';
export * from './travel.model';
export * from './subscription.model';
export * from './payment.model';
export * from './feedback.model';
export * from './traveler-statistics.model';

// Re-export PassengerDetail explicitly from payment.model to avoid ambiguity
export type { PassengerDetail } from './payment.model';


export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T
}