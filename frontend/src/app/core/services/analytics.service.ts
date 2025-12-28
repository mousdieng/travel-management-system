import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface DashboardOverview {
  revenue: {
    total: number;
    change: number;
  };
  bookings: {
    total: number;
    change: number;
  };
  users: {
    active: number;
    change: number;
  };
  conversion: {
    rate: number;
    change: number;
  };
}

export interface ChartData {
  labels: string[];
  values: number[];
}

export interface TopTravel {
  id: string;
  title: string;
  bookings: number;
  revenue: number;
  rating?: number;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  metadata?: any;
}

export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  travelId?: string;
  userId?: string;
  destinationId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/analytics`;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard overview with KPI metrics
   */
  getDashboardOverview(startDate: string, endDate: string): Observable<DashboardOverview> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<DashboardOverview>(`${this.apiUrl}/dashboard`, { params });
  }

  /**
   * Get revenue data for charts
   */
  getRevenueData(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' = 'day'): Observable<ChartData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('groupBy', groupBy);

    return this.http.get<ChartData>(`${this.apiUrl}/revenue`, { params });
  }

  /**
   * Get bookings data for charts
   */
  getBookingsData(startDate: string, endDate: string): Observable<ChartData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ChartData>(`${this.apiUrl}/bookings`, { params });
  }

  /**
   * Get user demographics data
   */
  getUserDemographics(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/demographics`);
  }

  /**
   * Get top destinations data
   */
  getTopDestinations(startDate: string, endDate: string, limit: number = 10): Observable<ChartData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('limit', limit.toString());

    return this.http.get<ChartData>(`${this.apiUrl}/destinations`, { params });
  }

  /**
   * Get payment method statistics
   */
  getPaymentMethodStats(startDate: string, endDate: string): Observable<ChartData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ChartData>(`${this.apiUrl}/payment-methods`, { params });
  }

  /**
   * Get travel category statistics
   */
  getTravelCategoryStats(startDate: string, endDate: string): Observable<ChartData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ChartData>(`${this.apiUrl}/travel-categories`, { params });
  }

  /**
   * Get top performing travels
   */
  getTopTravels(startDate: string, endDate: string, limit: number = 10): Observable<TopTravel[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('limit', limit.toString());

    return this.http.get<TopTravel[]>(`${this.apiUrl}/top-travels`, { params });
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit: number = 20): Observable<Activity[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Activity[]>(`${this.apiUrl}/activity`, { params });
  }

  /**
   * Get conversion funnel data
   */
  getConversionFunnel(startDate: string, endDate: string): Observable<{
    steps: string[];
    values: number[];
    rates: number[];
  }> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/conversion-funnel`, { params });
  }

  /**
   * Get user retention data
   */
  getUserRetention(startDate: string, endDate: string): Observable<{
    cohorts: string[];
    retentionRates: number[][];
  }> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/user-retention`, { params });
  }

  /**
   * Get seasonal trends
   */
  getSeasonalTrends(year?: number): Observable<{
    months: string[];
    bookings: number[];
    revenue: number[];
  }> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/seasonal-trends`, { params });
  }

  /**
   * Get travel performance by destination
   */
  getTravelPerformanceByDestination(startDate: string, endDate: string): Observable<{
    destinations: string[];
    bookings: number[];
    revenue: number[];
    averageRating: number[];
  }> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/travel-performance`, { params });
  }

  /**
   * Get customer lifetime value analysis
   */
  getCustomerLifetimeValue(): Observable<{
    segments: string[];
    averageLTV: number[];
    totalCustomers: number[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/customer-ltv`);
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(): Observable<{
    activeUsers: number;
    onlineBookings: number;
    pendingPayments: number;
    systemHealth: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/real-time`);
  }

  /**
   * Get geographical distribution
   */
  getGeographicalDistribution(): Observable<{
    countries: string[];
    users: number[];
    revenue: number[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/geographical`);
  }

  /**
   * Get device and platform analytics
   */
  getDeviceAnalytics(startDate: string, endDate: string): Observable<{
    devices: ChartData;
    browsers: ChartData;
    operatingSystems: ChartData;
  }> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/device-analytics`, { params });
  }

  /**
   * Get marketing campaign performance
   */
  getCampaignPerformance(startDate: string, endDate: string): Observable<{
    campaigns: string[];
    clicks: number[];
    conversions: number[];
    revenue: number[];
    cost: number[];
  }> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/campaigns`, { params });
  }

  /**
   * Get advanced filters for analytics
   */
  getAnalyticsFilters(): Observable<{
    destinations: { id: string; name: string }[];
    travelCategories: string[];
    userSegments: string[];
    paymentMethods: string[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/filters`);
  }

  /**
   * Export analytics data
   */
  exportAnalytics(
    filters: AnalyticsFilter,
    format: 'csv' | 'xlsx' | 'pdf' = 'csv'
  ): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Get predictive analytics
   */
  getPredictiveAnalytics(months: number = 3): Observable<{
    revenue: {
      predicted: number[];
      confidence: number[];
      dates: string[];
    };
    bookings: {
      predicted: number[];
      confidence: number[];
      dates: string[];
    };
  }> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<any>(`${this.apiUrl}/predictions`, { params });
  }

  /**
   * Get A/B testing results
   */
  getABTestResults(): Observable<{
    tests: {
      id: string;
      name: string;
      status: string;
      variants: {
        name: string;
        conversions: number;
        visitors: number;
        conversionRate: number;
      }[];
    }[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/ab-tests`);
  }

  /**
   * Get travel booking patterns
   */
  getBookingPatterns(startDate: string, endDate: string): Observable<{
    hourlyPattern: ChartData;
    weeklyPattern: ChartData;
    monthlyPattern: ChartData;
    leadTimes: ChartData;
  }> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/booking-patterns`, { params });
  }

  /**
   * Get custom analytics query
   */
  executeCustomQuery(query: {
    metrics: string[];
    dimensions: string[];
    filters: { [key: string]: any };
    startDate: string;
    endDate: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/custom-query`, query);
  }
}