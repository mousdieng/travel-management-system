export interface TravelerStatistics {
  // Basic Info
  userId: number;
  username: string;
  email: string;

  // Travel Participation Stats
  totalSubscriptions: number;
  activeSubscriptions: number;
  completedTravels: number;
  upcomingTravels: number;
  cancelledSubscriptions: number;

  // Financial Stats
  totalSpent: number;
  preferredPaymentMethod: string;

  // Feedback Stats
  feedbacksGiven: number;
  averageRatingGiven: number;

  // Report Stats
  reportsFiledByUser: number;
  reportsAgainstUser: number;

  // Engagement Stats
  wishlistCount?: number;
  memberSince?: string;
  lastActivityDate?: string;
}
