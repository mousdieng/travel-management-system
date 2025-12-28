export interface ManagerRanking {
  managerId: number;
  managerName: string;
  email: string;
  profileImage?: string;
  totalTravelsOrganized: number;
  completedTravels: number;
  activeTravels: number;
  totalIncome: number;
  lastMonthIncome: number;
  last3MonthsIncome: number;
  averageRating: number;
  totalReviews: number;
  totalParticipants: number;
  reportsReceived: number;
  performanceScore: number;
  rank: number;
}

export interface TravelPerformance {
  travelId: number;
  title: string;
  destination: string;
  category: string;
  managerId: number;
  managerName: string;
  price: number;
  totalRevenue: number;
  currentParticipants: number;
  maxParticipants: number;
  occupancyRate: number;
  averageRating: number;
  totalReviews: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  rank: number;
}

export interface MonthlyIncome {
  year: number;
  month: number;
  monthName: string;
  totalIncome: number;
  numberOfPayments: number;
  numberOfTravels: number;
  averagePaymentAmount: number;
}

export interface PlatformAnalytics {
  // User statistics
  totalUsers: number;
  totalManagers: number;
  totalTravelers: number;
  totalAdmins: number;
  newUsersThisMonth: number;

  // Travel statistics
  totalTravels: number;
  activeTravels: number;
  upcomingTravels: number;
  ongoingTravels: number;
  completedTravels: number;

  // Financial statistics
  totalPlatformIncome: number;
  thisMonthIncome: number;
  lastMonthIncome: number;
  last3MonthsIncome: number;
  last6MonthsIncome: number;
  last12MonthsIncome: number;

  // Payment statistics
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;

  // Feedback statistics
  totalFeedbacks: number;
  averagePlatformRating: number;

  // Report statistics
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  rejectedReports: number;

  // Monthly breakdown
  monthlyIncomeBreakdown: MonthlyIncome[];

  // Category statistics
  travelsByCategory: { [category: string]: number };
  incomeByCategory: { [category: string]: number };
}

// Feedback Analytics Interfaces
export interface TravelFeedbackGroup {
  travelId: number;
  travelTitle: string;
  destination: string;
  category: string;
  managerId: number;
  managerName: string;
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: { [rating: number]: number };
  feedbacks: FeedbackSummary[];
}

export interface ManagerFeedbackGroup {
  managerId: number;
  managerName: string;
  email: string;
  profileImage?: string;
  totalFeedbacks: number;
  averageRating: number;
  travelCount: number;
  ratingDistribution: { [rating: number]: number };
  feedbacks: FeedbackSummary[];
}

export interface FeedbackSummary {
  id: number;
  travelId: number;
  travelTitle: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface FeedbackStatistics {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: { [rating: number]: number };
  feedbacksThisMonth: number;
  feedbacksLastMonth: number;
  growthRate: number;
  topRatedTravels: Array<{ travelId: number; travelTitle: string; rating: number }>;
  lowestRatedTravels: Array<{ travelId: number; travelTitle: string; rating: number }>;
}

// Income Analytics Interfaces
export interface ManagerIncomeBreakdown {
  managerId: number;
  managerName: string;
  email: string;
  profileImage?: string;
  totalIncome: number;
  thisMonthIncome: number;
  lastMonthIncome: number;
  last3MonthsIncome: number;
  paymentCount: number;
  averagePayment: number;
  monthlyHistory: Array<{ month: string; income: number; paymentCount: number }>;
  travelCount: number;
  completedTravels: number;
  rank: number;
  growthRate: number;
}

export interface CategoryIncomeBreakdown {
  category: string;
  totalIncome: number;
  paymentCount: number;
  travelCount: number;
  averageIncomePerTravel: number;
  percentageOfTotal: number;
}

export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  pendingPayments: number;
  pendingAmount: number;
  failedPayments: number;
  failedAmount: number;
  averagePaymentAmount: number;
  thisMonthPayments: number;
  thisMonthAmount: number;
  lastMonthPayments: number;
  lastMonthAmount: number;
  growthRate: number;
  paymentMethodDistribution: { [method: string]: number };
}

// Travel Performance Interfaces
export interface TravelPerformanceMetrics {
  travelId: number;
  title: string;
  destination: string;
  category: string;
  managerId: number;
  managerName: string;
  price: number;
  revenue: number;
  currentParticipants: number;
  maxParticipants: number;
  occupancyRate: number;
  averageRating: number;
  reviewCount: number;
  revenueGrowth: number;
  subscriberGrowth: number;
  startDate: string;
  endDate: string;
  status: string;
  performanceScore: number;
  recommendations: string[];
}

export interface UnderperformingTravel {
  travelId: number;
  title: string;
  destination: string;
  managerId: number;
  managerName: string;
  occupancyRate: number;
  averageRating: number;
  revenue: number;
  issues: string[];
  recommendations: string[];
}

// Manager Stats Interfaces
export interface TravelDetailedStats {
  travelId: number;
  title: string;
  destination: string;
  description: string;
  category: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  endDate: string;
  status: string;
  averageRating: number;
  totalRevenue: number;
  occupancyRate: number;
  subscribers: SubscriberProfile[];
  feedbacks: FeedbackDetail[];
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

export interface SubscriberProfile {
  subscriptionId: number;
  userId: number;
  userName: string;
  userEmail: string;
  subscriptionStatus: string;
  subscriptionDate: string;
  numberOfParticipants: number;
  totalPaid: number;
  paymentStatus: string;
  lastPaymentDate?: string;
}

export interface FeedbackDetail {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Admin Action Interfaces
export interface CreateTravelRequest {
  title: string;
  description: string;
  destination: string;
  category: string;
  price: number;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  imageUrl?: string;
}

export interface CreateSubscriptionRequest {
  userId: number;
  travelId: number;
  numberOfParticipants: number;
}

export interface CreateFeedbackRequest {
  userId: number;
  travelId: number;
  rating: number;
  comment: string;
}
