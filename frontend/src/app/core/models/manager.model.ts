export interface ManagerAnalytics {
  // Travel Statistics
  totalTravels: number;
  activeTravels: number;
  completedTravels: number;
  upcomingTravels: number;

  // Financial Statistics
  totalIncome: number;
  thisMonthIncome: number;
  lastMonthIncome: number;
  averageIncomePerTravel: number;

  // Participant Statistics
  totalParticipants: number;
  activeSubscribers: number;
  averageParticipantsPerTravel: number;
  averageOccupancyRate: number;

  // Feedback Statistics
  averageRating: number;
  totalFeedbacks: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;

  // Performance Indicators
  performanceScore: number;
  performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  trendPercentage: number;

  // Breakdown Data
  monthlyIncomeBreakdown: MonthlyIncome[];
  categoryBreakdown: CategoryStats[];
  topTravels: TravelPerformance[];
}

export interface MonthlyIncome {
  month: string;
  year: number;
  income: number;
  travelCount: number;
  participantCount: number;
}

export interface CategoryStats {
  category: string;
  travelCount: number;
  totalIncome: number;
  averageRating: number;
}

export interface TravelPerformance {
  travelId: number;
  title: string;
  destination: string;
  category: string;
  totalRevenue: number;
  participantCount: number;
  averageRating: number;
  occupancyRate: number;
  performanceScore: number;
}

export interface TravelDetailedStats {
  travelId: number;
  title: string;
  destination: string;
  category: string;

  // Subscription Stats
  totalSubscribers: number;
  activeSubscribers: number;
  cancelledSubscribers: number;
  completedSubscribers: number;
  occupancyRate: number;

  // Financial Stats
  totalRevenue: number;
  expectedRevenue: number;
  averageRevenuePerSubscriber: number;

  // Feedback Stats
  averageRating: number;
  totalFeedbacks: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;

  // Recent Feedbacks
  recentFeedbacks: any[];

  // Subscribers List
  subscribers: SubscriberProfile[];
}

export interface SubscriberProfile {
  // Subscription Info
  subscriptionId: number;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  subscribedAt: string;
  cancelledAt?: string;

  // Traveler Info
  travelerId: number;
  travelerName: string;
  travelerEmail: string;
  travelerPhone?: string;

  // Traveler Statistics
  totalSubscriptions: number;
  completedTravels: number;
  cancelledTravels: number;
  averageRating: number;

  // Payment Info
  paymentCompleted: boolean;
  paymentStatus: string;
  amountPaid?: number;
}

export interface DashboardStats {
  // Quick Stats
  totalTravels: number;
  activeTravels: number;
  totalIncome: number;
  thisMonthIncome: number;
  totalParticipants: number;
  activeSubscribers: number;
  averageRating: number;
  totalFeedbacks: number;

  // Recent Activity
  recentSubscriptions: any[];
  recentFeedbacks: any[];
  upcomingTravels: any[];
}
