import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ManagerRanking,
  TravelPerformance,
  MonthlyIncome,
  PlatformAnalytics,
  TravelFeedbackGroup,
  ManagerFeedbackGroup,
  FeedbackStatistics,
  ManagerIncomeBreakdown,
  CategoryIncomeBreakdown,
  PaymentStatistics,
  TravelPerformanceMetrics,
  UnderperformingTravel,
  TravelDetailedStats
} from '../models/admin.model';
import { Travel } from '../models/travel.model';
import { Feedback } from '../models/feedback.model';
import { DashboardStats } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/v1/admin`;

  constructor(private http: HttpClient) {}

  // Platform Analytics
  getPlatformAnalytics(): Observable<PlatformAnalytics> {
    return this.http.get<PlatformAnalytics>(`${this.apiUrl}/analytics/platform`);
  }

  getMonthlyIncomeBreakdown(months: number = 12): Observable<MonthlyIncome[]> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<MonthlyIncome[]>(`${this.apiUrl}/analytics/income/monthly`, { params });
  }

  getAdminDashboardSummary(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/summary`);
  }

  // Manager Rankings
  getManagerRankings(limit?: number): Observable<ManagerRanking[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<ManagerRanking[]>(`${this.apiUrl}/rankings/managers`, { params });
  }

  // Travel Performance
  getTopPerformingTravels(limit: number = 10): Observable<TravelPerformance[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TravelPerformance[]>(`${this.apiUrl}/rankings/travels`, { params });
  }

  // Travel History
  getTravelHistory(): Observable<Travel[]> {
    return this.http.get<Travel[]>(`${this.apiUrl}/travels/history`);
  }

  // Feedbacks Management
  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/feedbacks`);
  }

  getFeedbacksByTravel(travelId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/feedbacks/travel/${travelId}`);
  }

  getFeedbacksByUser(userId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/feedbacks/user/${userId}`);
  }

  // Feedback Analytics
  getFeedbacksGroupedByTravel(filters?: {
    rating?: number;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<TravelFeedbackGroup[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.rating) params = params.set('rating', filters.rating.toString());
      if (filters.category) params = params.set('category', filters.category);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    }
    return this.http.get<TravelFeedbackGroup[]>(`${this.apiUrl}/feedbacks/grouped/travel`, { params });
  }

  getFeedbacksGroupedByManager(filters?: {
    rating?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<ManagerFeedbackGroup[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.rating) params = params.set('rating', filters.rating.toString());
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    }
    return this.http.get<ManagerFeedbackGroup[]>(`${this.apiUrl}/feedbacks/grouped/manager`, { params });
  }

  getFeedbackStatistics(): Observable<FeedbackStatistics> {
    return this.http.get<FeedbackStatistics>(`${this.apiUrl}/analytics/feedbacks`);
  }

  // Income Analytics
  getIncomeByManager(period?: string): Observable<ManagerIncomeBreakdown[]> {
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }
    return this.http.get<ManagerIncomeBreakdown[]>(`${this.apiUrl}/analytics/income/managers`, { params });
  }

  getIncomeByCategory(): Observable<CategoryIncomeBreakdown[]> {
    return this.http.get<CategoryIncomeBreakdown[]>(`${this.apiUrl}/analytics/income/categories`);
  }

  getPaymentStatistics(): Observable<PaymentStatistics> {
    return this.http.get<PaymentStatistics>(`${this.apiUrl}/analytics/payments`);
  }

  // Travel Performance Analytics
  getTravelPerformanceMetrics(filters?: {
    category?: string;
    status?: string;
    minRating?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<TravelPerformanceMetrics[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.minRating) params = params.set('minRating', filters.minRating.toString());
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    }
    return this.http.get<TravelPerformanceMetrics[]>(`${this.apiUrl}/analytics/travels/performance`, { params });
  }

  getUnderperformingTravels(threshold?: number): Observable<UnderperformingTravel[]> {
    let params = new HttpParams();
    if (threshold) {
      params = params.set('threshold', threshold.toString());
    }
    return this.http.get<UnderperformingTravel[]>(`${this.apiUrl}/analytics/travels/underperforming`, { params });
  }

  // Manager Income History
  getManagerIncomeHistory(managerId: number, months: number = 12): Observable<ManagerIncomeBreakdown> {
    const params = new HttpParams()
      .set('managerId', managerId.toString())
      .set('months', months.toString());
    return this.http.get<ManagerIncomeBreakdown>(`${this.apiUrl}/analytics/income/manager/history`, { params });
  }

  // Travel Detailed Stats (for manager view)
  getTravelStats(travelId: number): Observable<TravelDetailedStats> {
    return this.http.get<TravelDetailedStats>(`${this.apiUrl}/travels/${travelId}/stats`);
  }

  // Category Management
  getTravelCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }
}
