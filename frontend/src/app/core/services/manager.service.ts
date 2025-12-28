import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ManagerAnalytics,
  TravelDetailedStats,
  DashboardStats,
  SubscriberProfile,
  MonthlyIncome,
  TravelPerformance
} from '../models/manager.model';
import { Travel, CreateTravelRequest } from '../models/travel.model';
import { Subscription } from '../models/subscription.model';
import { Feedback, CreateFeedbackRequest } from '../models/feedback.model';
import { AuthService } from './auth.service';

// Backend response interfaces
interface ManagerTravelStats {
  managerId: number;
  totalTravels: number;
  activeTravels: number;
  completedTravels: number;
  upcomingTravels: number;
  totalParticipants: number;
  activeSubscribers: number;
  cancelledSubscribers: number;
  completedSubscribers: number;
  averageRating: number;
  totalReviews: number;
  totalRevenuePotential: number;
  travelsByCategory: Record<string, number>;
  topPerformingTravels: BackendTravelPerformance[];
  monthlyStats: BackendMonthlyStats[];
}

interface BackendTravelPerformance {
  travelId: number;
  title: string;
  destination: string;
  participants: number;
  maxParticipants: number;
  occupancyRate: number;
  averageRating: number;
  totalReviews: number;
  price: number;
  revenue: number;
}

interface BackendMonthlyStats {
  month: string;
  year: number;
  travelsCreated: number;
  subscribersGained: number;
  revenueGenerated: number;
}

interface ManagerIncomeStats {
  managerId: number;
  totalIncome: number;
  lastMonthIncome: number;
  thisMonthIncome: number;
  lastYearIncome: number;
  totalTransactions: number;
  completedTransactions: number;
  refundedTransactions: number;
  averageTransactionAmount: number;
  incomeByTravel: { travelId: number; totalIncome: number; transactionCount: number }[];
  monthlyIncome: { month: string; year: number; income: number; transactionCount: number }[];
  incomeByPaymentMethod: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private travelApiUrl = `${environment.apiUrl}${environment.endpoints.travels.base}`;
  private paymentApiUrl = `${environment.apiUrl}${environment.endpoints.payments.base}`;
  private subscriptionApiUrl = `${environment.apiUrl}${environment.endpoints.subscriptions.base}`;
  private feedbackApiUrl = `${environment.apiUrl}${environment.endpoints.feedbacks.base}`;

  // ========== ANALYTICS & DASHBOARD ==========

  /**
   * Get comprehensive analytics for the manager by combining data from multiple services
   */
  getAnalytics(): Observable<ManagerAnalytics> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return forkJoin({
      travelStats: this.http.get<ManagerTravelStats>(`${this.travelApiUrl}/manager/${userId}/stats`),
      incomeStats: this.http.get<ManagerIncomeStats>(`${this.paymentApiUrl}/manager/${userId}/stats`),
      feedbacks: this.http.get<Feedback[]>(`${this.feedbackApiUrl}/user/${userId}`)
    }).pipe(
      map(({ travelStats, incomeStats, feedbacks }) => this.combineAnalytics(travelStats, incomeStats, feedbacks))
    );
  }

  private combineAnalytics(travelStats: ManagerTravelStats, incomeStats: ManagerIncomeStats, feedbacks: Feedback[]): ManagerAnalytics {
    // Calculate feedback distribution
    const feedbackCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(f => {
      if (f.rating >= 1 && f.rating <= 5) {
        feedbackCounts[f.rating as 1|2|3|4|5]++;
      }
    });

    // Calculate performance score (simple formula)
    const performanceScore = Math.min(100,
      (travelStats.averageRating * 15) +
      (Math.min(travelStats.totalParticipants, 100) * 0.3) +
      (travelStats.completedTravels * 5)
    );

    // Determine trend
    const trend = incomeStats.thisMonthIncome > incomeStats.lastMonthIncome ? 'IMPROVING' :
                  incomeStats.thisMonthIncome < incomeStats.lastMonthIncome ? 'DECLINING' : 'STABLE';
    const trendPercentage = incomeStats.lastMonthIncome > 0
      ? ((incomeStats.thisMonthIncome - incomeStats.lastMonthIncome) / incomeStats.lastMonthIncome) * 100
      : 0;

    // Build category breakdown
    const categoryBreakdown = Object.entries(travelStats.travelsByCategory || {}).map(([category, count]) => ({
      category,
      travelCount: count,
      totalIncome: 0,
      averageRating: travelStats.averageRating
    }));

    // Build monthly income breakdown
    const monthlyIncomeBreakdown: MonthlyIncome[] = (incomeStats.monthlyIncome || []).map(m => ({
      month: m.month,
      year: m.year,
      income: m.income,
      travelCount: 0,
      participantCount: 0
    }));

    // Build top travels
    const topTravels: TravelPerformance[] = (travelStats.topPerformingTravels || []).map(t => ({
      travelId: t.travelId,
      title: t.title,
      destination: t.destination,
      category: '',
      totalRevenue: t.revenue,
      participantCount: t.participants,
      averageRating: t.averageRating,
      occupancyRate: t.occupancyRate,
      performanceScore: Math.min(100, (t.averageRating * 15) + (t.occupancyRate * 0.5))
    }));

    return {
      totalTravels: travelStats.totalTravels,
      activeTravels: travelStats.activeTravels,
      completedTravels: travelStats.completedTravels,
      upcomingTravels: travelStats.upcomingTravels,
      totalIncome: incomeStats.totalIncome,
      thisMonthIncome: incomeStats.thisMonthIncome,
      lastMonthIncome: incomeStats.lastMonthIncome,
      averageIncomePerTravel: travelStats.totalTravels > 0 ? incomeStats.totalIncome / travelStats.totalTravels : 0,
      totalParticipants: travelStats.totalParticipants,
      activeSubscribers: travelStats.activeSubscribers,
      averageParticipantsPerTravel: travelStats.totalTravels > 0 ? travelStats.totalParticipants / travelStats.totalTravels : 0,
      averageOccupancyRate: topTravels.length > 0 ? topTravels.reduce((sum, t) => sum + t.occupancyRate, 0) / topTravels.length : 0,
      averageRating: travelStats.averageRating,
      totalFeedbacks: travelStats.totalReviews,
      fiveStarCount: feedbackCounts[5],
      fourStarCount: feedbackCounts[4],
      threeStarCount: feedbackCounts[3],
      twoStarCount: feedbackCounts[2],
      oneStarCount: feedbackCounts[1],
      performanceScore,
      performanceTrend: trend,
      trendPercentage,
      monthlyIncomeBreakdown,
      categoryBreakdown,
      topTravels
    };
  }

  /**
   * Get dashboard summary statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return forkJoin({
      travelStats: this.http.get<ManagerTravelStats>(`${this.travelApiUrl}/manager/${userId}/stats`),
      incomeStats: this.http.get<ManagerIncomeStats>(`${this.paymentApiUrl}/manager/${userId}/stats`),
      travels: this.http.get<Travel[]>(`${this.travelApiUrl}/manager/${userId}`)
    }).pipe(
      map(({ travelStats, incomeStats, travels }) => ({
        totalTravels: travelStats.totalTravels,
        activeTravels: travelStats.activeTravels,
        totalIncome: incomeStats.totalIncome,
        thisMonthIncome: incomeStats.thisMonthIncome,
        totalParticipants: travelStats.totalParticipants,
        activeSubscribers: travelStats.activeSubscribers,
        averageRating: travelStats.averageRating,
        totalFeedbacks: travelStats.totalReviews,
        recentSubscriptions: [],
        recentFeedbacks: [],
        // upcomingTravels: travels.filter(t => new Date(t.startDate) > new Date()).slice(0, 5)
        upcomingTravels: travels
            .filter(t => t.startDate && new Date(t.startDate) > new Date())
            .slice(0, 5)

      }))
    );
  }

  // ========== TRAVEL MANAGEMENT ==========

  /**
   * Get all travels managed by this manager
   */
  getMyTravels(): Observable<Travel[]> {
    const userId = this.authService.getCurrentUserId();
    return this.http.get<Travel[]>(`${this.travelApiUrl}/manager/${userId}`);
  }

  /**
   * Create a new travel offering with cover image
   */
  createTravel(request: CreateTravelRequest, coverImage: File): Observable<Travel> {
    const formData = new FormData();

    // Add cover image (required)
    formData.append('cover', coverImage);

    // Add all travel data as form fields
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('destination', request.destination);

    if (request.country) formData.append('country', request.country);
    if (request.state) formData.append('state', request.state);
    if (request.city) formData.append('city', request.city);

    if (request.startDate) formData.append('startDate', request.startDate);
    if (request.endDate) formData.append('endDate', request.endDate);
    formData.append('price', request.price.toString());
    formData.append('maxParticipants', request.maxParticipants.toString());

    if (request.category) formData.append('category', request.category);
    if (request.itinerary) formData.append('itinerary', request.itinerary);

    // Add highlights as multiple fields
    if (request.highlights && request.highlights.length > 0) {
      request.highlights.forEach((highlight: string) => {
        formData.append('highlights', highlight);
      });
    }

    return this.http.post<Travel>(`${this.travelApiUrl}`, formData);
  }

  /**
   * Update an existing travel
   */
  updateTravel(id: string | number, request: CreateTravelRequest): Observable<Travel> {
    return this.http.put<Travel>(`${this.travelApiUrl}/${id}`, request);
  }

  /**
   * Delete (deactivate) a travel
   */
  deleteTravel(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.travelApiUrl}/${id}`);
  }

  /**
   * Get detailed statistics for a specific travel
   */
  getTravelStats(travelId: string | number): Observable<TravelDetailedStats> {
    const userId = this.authService.getCurrentUserId();
    return this.http.get<ManagerTravelStats>(`${this.travelApiUrl}/manager/${userId}/stats`).pipe(
      map(stats => {
        const travel = stats.topPerformingTravels?.find(t => t.travelId === Number(travelId));
        return {
          travelId: Number(travelId),
          title: travel?.title || '',
          destination: travel?.destination || '',
          category: '',
          totalSubscribers: travel?.participants || 0,
          activeSubscribers: stats.activeSubscribers,
          cancelledSubscribers: stats.cancelledSubscribers,
          completedSubscribers: stats.completedSubscribers,
          occupancyRate: travel?.occupancyRate || 0,
          totalRevenue: travel?.revenue || 0,
          expectedRevenue: 0,
          averageRevenuePerSubscriber: 0,
          averageRating: travel?.averageRating || 0,
          totalFeedbacks: travel?.totalReviews || 0,
          fiveStarCount: 0,
          fourStarCount: 0,
          threeStarCount: 0,
          twoStarCount: 0,
          oneStarCount: 0,
          recentFeedbacks: [],
          subscribers: []
        };
      })
    );
  }

  // ========== SUBSCRIBER MANAGEMENT ==========

  /**
   * Get all subscribers for a specific travel
   */
  getTravelSubscribers(travelId: string | number): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.subscriptionApiUrl}/travel/${travelId}`);
  }

  /**
   * Remove a subscriber from a travel (Manager action)
   */
  removeSubscriber(travelId: string | number, subscriptionId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.subscriptionApiUrl}/${subscriptionId}/manager-cancel/${travelId}`);
  }

  // ========== FEEDBACK MANAGEMENT ==========

  /**
   * Get all feedbacks for travels managed by this manager
   */
  getMyTravelsFeedbacks(): Observable<Feedback[]> {
    const userId = this.authService.getCurrentUserId();
    return this.http.get<Feedback[]>(`${this.feedbackApiUrl}/user/${userId}`);
  }

  /**
   * Get feedbacks for a specific travel
   */
  getTravelFeedbacks(travelId: string | number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.feedbackApiUrl}/travel/${travelId}`);
  }

  // ========== TRAVELER CAPABILITIES ==========
  // Managers can also act as travelers

  /**
   * Subscribe to a travel (as a traveler)
   */
  subscribeToTravel(travelId: string | number): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.subscriptionApiUrl}/subscribe/${travelId}`, {});
  }

  /**
   * Get my subscriptions (as a traveler)
   */
  getMySubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.subscriptionApiUrl}/my-subscriptions`);
  }

  /**
   * Cancel my subscription (as a traveler)
   */
  cancelMySubscription(subscriptionId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.subscriptionApiUrl}/${subscriptionId}/cancel`);
  }

  /**
   * Submit feedback for a travel (as a traveler)
   */
  submitFeedback(request: CreateFeedbackRequest): Observable<Feedback> {
    return this.http.post<Feedback>(`${this.feedbackApiUrl}`, request);
  }

  /**
   * Get my feedbacks (as a traveler)
   */
  getMyFeedbacks(): Observable<Feedback[]> {
    const userId = this.authService.getCurrentUserId();
    return this.http.get<Feedback[]>(`${this.feedbackApiUrl}/user/${userId}`);
  }
}
