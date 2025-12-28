import { PaymentMethod } from './payment.model';

export interface DashboardStats {
  // Common stats
  totalTravels?: number;
  activeTravels?: number;
  completedTravels?: number;

  // Traveler stats
  totalSubscriptions?: number;
  activeSubscriptions?: number;
  cancelledSubscriptions?: number;
  completedPayments?: number;
  paymentMethodPreferences?: { [key in PaymentMethod]?: number };
  reportsFiled?: number;

  // Manager stats
  totalIncome?: number;
  lastMonthIncome?: number;
  totalParticipants?: number;
  averageRating?: number;
  totalReviews?: number;
  reportsReceived?: number;

  // Admin stats
  totalUsers?: number;
  totalManagers?: number;
  totalTravelers?: number;
  platformIncome?: number;
  pendingReports?: number;
  totalFeedbacks?: number;
  averagePlatformRating?: number;
}
