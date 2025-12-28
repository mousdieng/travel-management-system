import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Travel,
  TravelSearchCriteria,
  CreateTravelRequest,
  ManagerStats,
  TravelSubscriber,
  TravelFeedback,
  ApiResponse,
  TravelStatus,
  TravelDocument
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class TravelService {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.travels.base}`;

  constructor(private http: HttpClient) {}

  // ============================================
  // PUBLIC TRAVEL ENDPOINTS
  // ============================================

  getAllTravels(): Observable<Travel[]> {
    return this.http.get<Travel[]>(this.baseUrl);
  }

  getTravelById(id: string): Observable<Travel> {
    return this.http.get<Travel>(`${this.baseUrl}/${id}`);
  }

  searchTravels(criteria: TravelSearchCriteria): Observable<Travel[]> {
    let params = new HttpParams();
    if (criteria.query) params = params.set('query', criteria.query);
    if (criteria.destination) params = params.set('destination', criteria.destination);
    if (criteria.minPrice) params = params.set('minPrice', criteria.minPrice.toString());
    if (criteria.maxPrice) params = params.set('maxPrice', criteria.maxPrice.toString());
    if (criteria.startDate) params = params.set('startDate', criteria.startDate.toISOString());
    if (criteria.endDate) params = params.set('endDate', criteria.endDate.toISOString());

    const url = `${environment.apiUrl}${environment.endpoints.travels.search}`;
    return this.http.get<Travel[]>(url, { params });
  }

  // ============================================
  // MANAGER TRAVEL MANAGEMENT
  // ============================================

  getMyTravels(): Observable<Travel[]> {
    const url = `${environment.apiUrl}${environment.endpoints.travels.byManager}`;
    return this.http.get<Travel[]>(url);
  }

  createTravel(travel: CreateTravelRequest): Observable<Travel> {
    return this.http.post<Travel>(this.baseUrl, travel);
  }

  updateTravel(id: string, travel: Partial<Travel>): Observable<Travel> {
    return this.http.put<Travel>(`${this.baseUrl}/${id}`, travel);
  }

  deleteTravel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  publishTravel(id: string): Observable<Travel> {
    return this.http.patch<Travel>(`${this.baseUrl}/${id}/publish`, {});
  }

  cancelTravel(id: string): Observable<Travel> {
    return this.http.patch<Travel>(`${this.baseUrl}/${id}/cancel`, {});
  }

  // ============================================
  // MANAGER DASHBOARD STATISTICS
  // ============================================

  getManagerStats(): Observable<ManagerStats> {
    const url = `${environment.apiUrl}${environment.endpoints.travels.managerStats}`;
    return this.http.get<ManagerStats>(url);
  }

  getManagerStatsByManagerId(managerId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/manager/${managerId}/stats`);
  }

  getManagerTravels(managerId: number): Observable<Travel[]> {
    return this.http.get<Travel[]>(`${this.baseUrl}/manager/${managerId}`);
  }

  autocomplete(query: string): Observable<Travel[]> {
    return this.http.get<Travel[]>(`${this.baseUrl}/autocomplete`, {
      params: { query }
    });
  }

  searchByKeyword(keyword: string): Observable<Travel[]> {
    return this.http.get<Travel[]>(`${this.baseUrl}/search`, {
      params: { keyword }
    });
  }

  // ============================================
  // SUBSCRIBER MANAGEMENT
  // ============================================

  getTravelSubscribers(travelId: string): Observable<TravelSubscriber[]> {
    const url = `${environment.apiUrl}${environment.endpoints.subscriptions.base}/travel/${travelId}`;
    return this.http.get<TravelSubscriber[]>(url);
  }

  getAllMySubscribers(): Observable<TravelSubscriber[]> {
    const url = `${environment.apiUrl}${environment.endpoints.subscriptions.base}/manager/all`;
    return this.http.get<TravelSubscriber[]>(url);
  }

  unsubscribeTraveler(subscriptionId: string): Observable<void> {
    const url = `${environment.apiUrl}${environment.endpoints.subscriptions.base}/${subscriptionId}/unsubscribe`;
    return this.http.delete<void>(url);
  }

  // ============================================
  // FEEDBACK MANAGEMENT
  // ============================================

  getMyTravelsFeedbacks(): Observable<TravelFeedback[]> {
    const url = `${environment.apiUrl}${environment.endpoints.feedbacks.base}/manager/travels`;
    return this.http.get<TravelFeedback[]>(url);
  }

  getTravelFeedbacks(travelId: string): Observable<TravelFeedback[]> {
    const url = `${environment.apiUrl}${environment.endpoints.feedbacks.base}/travel/${travelId}`;
    return this.http.get<TravelFeedback[]>(url);
  }

  // ============================================
  // TRAVEL STATUS HELPERS
  // ============================================

  getTravelStatusLabel(status: TravelStatus): string {
    const labels: Record<TravelStatus, string> = {
      [TravelStatus.DRAFT]: 'Draft',
      [TravelStatus.PUBLISHED]: 'Published',
      [TravelStatus.CANCELLED]: 'Cancelled',
      [TravelStatus.COMPLETED]: 'Completed'
    };
    return labels[status] || status;
  }

  getTravelStatusColor(status: TravelStatus): string {
    const colors: Record<TravelStatus, string> = {
      [TravelStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [TravelStatus.PUBLISHED]: 'bg-green-100 text-green-800',
      [TravelStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [TravelStatus.COMPLETED]: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // ============================================
  // ELASTICSEARCH SEARCH & AUTOCOMPLETE
  // ============================================

  /**
   * Advanced search using Elasticsearch
   */
  advancedSearch(query: string, limit: number = 20): Observable<TravelDocument[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());
    return this.http.get<TravelDocument[]>(`${this.baseUrl}/search/advanced`, { params });
  }

  /**
   * Autocomplete travel titles
   */
  autocompleteTitles(query: string, limit: number = 10): Observable<string[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());
    return this.http.get<string[]>(`${this.baseUrl}/search/autocomplete/titles`, { params });
  }

  /**
   * Autocomplete suggestions across all fields
   */
  autocompleteAll(query: string, limit: number = 10): Observable<AutocompleteSuggestion[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());
    return this.http.get<AutocompleteSuggestion[]>(`${this.baseUrl}/search/autocomplete/all`, { params });
  }

  /**
   * Search by destination
   */
  searchByDestination(destination: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/search/destination/${destination}`);
  }

  /**
   * Search by category
   */
  searchByCategory(category: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/search/category/${category}`);
  }

  // ============================================
  // PERSONALIZED RECOMMENDATIONS (Neo4j)
  // ============================================

  /**
   * Get personalized travel recommendations based on user's feedback and participation
   */
  getPersonalizedRecommendations(limit: number = 10): Observable<TravelRecommendation[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TravelRecommendation[]>(`${this.baseUrl}/recommendations`, { params });
  }

  // ============================================
  // POST-SUBSCRIPTION TRAVEL SUGGESTIONS
  // ============================================

  /**
   * Get similar travels based on category, destination, and price range
   */
  getSimilarTravels(travelId: string, limit: number = 6): Observable<Travel[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Travel[]>(`${this.baseUrl}/${travelId}/similar`, { params });
  }

  /**
   * Get trending travels (most subscribed in last 30 days)
   */
  getTrendingTravels(limit: number = 6): Observable<Travel[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Travel[]>(`${this.baseUrl}/trending`, { params });
  }

  /**
   * Get all post-subscription travel suggestions in one call
   */
  getTravelSuggestions(travelId: string): Observable<TravelSuggestions> {
    return this.http.get<TravelSuggestions>(`${this.baseUrl}/${travelId}/suggestions`);
  }

  // ============================================
  // IMAGE MANAGEMENT
  // ============================================

  uploadTravelImage(file: File): Observable<{ message: string; imageKey: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; imageKey: string }>(`${this.baseUrl}/upload-image`, formData);
  }

  deleteTravelImage(imageKey: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/delete-image`, {
      params: { imageKey }
    });
  }
}

// ============================================
// INTERFACES
// ============================================

export interface AutocompleteSuggestion {
  id: string;
  title: string;
  destination: string;
  country: string;
  city: string;
  category: string;
  price: number;
  averageRating: number;
}

export interface TravelRecommendation {
  travelId: number;
  travel: Travel;
  score: number;
  reasons: string[];
}

export interface TravelSuggestions {
  similar: Travel[];
  trending: Travel[];
  personalized: TravelRecommendation[];
}
