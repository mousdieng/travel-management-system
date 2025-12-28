import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Destination,
  DestinationCreateRequest,
  DestinationUpdateRequest,
  DestinationSearchCriteria,
  DestinationListResponse
} from '../../shared/models/destination.model';

@Injectable({
  providedIn: 'root'
})
export class DestinationService {
  private readonly apiUrl = `${environment.apiUrl}${environment.endpoints.destinations}`;

  constructor(private http: HttpClient) {}

  /**
   * Get all destinations with optional search criteria
   */
  getDestinations(criteria?: DestinationSearchCriteria): Observable<Destination[]> {
    let params = new HttpParams();

    if (criteria) {
      if (criteria.query) params = params.set('query', criteria.query);
      if (criteria.country) params = params.set('country', criteria.country);
      if (criteria.climate) params = params.set('climate', criteria.climate);
      if (criteria.safetyLevel) params = params.set('safetyLevel', criteria.safetyLevel);
      if (criteria.isActive !== undefined) params = params.set('isActive', criteria.isActive.toString());
      if (criteria.page !== undefined) params = params.set('page', criteria.page.toString());
      if (criteria.size !== undefined) params = params.set('size', criteria.size.toString());
      if (criteria.sort) params = params.set('sort', criteria.sort);
      if (criteria.direction) params = params.set('direction', criteria.direction);
    }

    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        // Handle both paginated and non-paginated responses
        if (response.destinations) {
          return response.destinations;
        }
        return response;
      })
    );
  }

  /**
   * Get destinations with pagination
   */
  getDestinationsPaginated(criteria?: DestinationSearchCriteria): Observable<DestinationListResponse> {
    let params = new HttpParams();

    if (criteria) {
      if (criteria.query) params = params.set('query', criteria.query);
      if (criteria.country) params = params.set('country', criteria.country);
      if (criteria.climate) params = params.set('climate', criteria.climate);
      if (criteria.safetyLevel) params = params.set('safetyLevel', criteria.safetyLevel);
      if (criteria.isActive !== undefined) params = params.set('isActive', criteria.isActive.toString());
      if (criteria.page !== undefined) params = params.set('page', criteria.page.toString());
      if (criteria.size !== undefined) params = params.set('size', criteria.size.toString());
      if (criteria.sort) params = params.set('sort', criteria.sort);
      if (criteria.direction) params = params.set('direction', criteria.direction);
    }

    return this.http.get<DestinationListResponse>(`${this.apiUrl}/paginated`, { params });
  }

  /**
   * Get a single destination by ID
   */
  getDestinationById(id: string): Observable<Destination> {
    return this.http.get<Destination>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new destination
   */
  createDestination(destination: DestinationCreateRequest): Observable<Destination> {
    return this.http.post<Destination>(`${this.apiUrl}`, destination);
  }

  /**
   * Update an existing destination
   */
  updateDestination(id: string, destination: DestinationUpdateRequest): Observable<Destination> {
    return this.http.put<Destination>(`${this.apiUrl}/${id}`, destination);
  }

  /**
   * Delete a destination
   */
  deleteDestination(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Bulk delete destinations
   */
  bulkDeleteDestinations(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bulk`, {
      body: { ids }
    });
  }

  /**
   * Get all countries from destinations
   */
  getCountries(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/countries`);
  }

  /**
   * Get destinations by country
   */
  getDestinationsByCountry(country: string): Observable<Destination[]> {
    return this.http.get<Destination[]>(`${this.apiUrl}/country/${encodeURIComponent(country)}`);
  }

  /**
   * Search destinations by location (latitude, longitude, radius)
   */
  searchByLocation(latitude: number, longitude: number, radius: number): Observable<Destination[]> {
    const params = new HttpParams()
      .set('lat', latitude.toString())
      .set('lng', longitude.toString())
      .set('radius', radius.toString());

    return this.http.get<Destination[]>(`${this.apiUrl}/search/location`, { params });
  }

  /**
   * Get popular destinations
   */
  getPopularDestinations(limit: number = 10): Observable<Destination[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Destination[]>(`${this.apiUrl}/popular`, { params });
  }

  /**
   * Get destinations by climate
   */
  getDestinationsByClimate(climate: string): Observable<Destination[]> {
    return this.http.get<Destination[]>(`${this.apiUrl}/climate/${encodeURIComponent(climate)}`);
  }

  /**
   * Upload destination image
   */
  uploadDestinationImage(destinationId: string, file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/${destinationId}/image`, formData);
  }

  /**
   * Get destination statistics
   */
  getDestinationStatistics(): Observable<{
    total: number;
    active: number;
    inactive: number;
    byCountry: { [country: string]: number };
    byClimate: { [climate: string]: number };
  }> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  /**
   * Validate destination data
   */
  validateDestination(destination: DestinationCreateRequest): Observable<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return this.http.post<any>(`${this.apiUrl}/validate`, destination);
  }

  /**
   * Get weather information for a destination
   */
  getDestinationWeather(destinationId: string): Observable<{
    current: any;
    forecast: any[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/${destinationId}/weather`);
  }

  /**
   * Get nearby destinations
   */
  getNearbyDestinations(destinationId: string, radius: number = 100): Observable<Destination[]> {
    const params = new HttpParams().set('radius', radius.toString());
    return this.http.get<Destination[]>(`${this.apiUrl}/${destinationId}/nearby`, { params });
  }

  /**
   * Check if destination name is available
   */
  checkDestinationNameAvailability(name: string, excludeId?: string): Observable<{ available: boolean }> {
    let params = new HttpParams().set('name', name);
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }

    return this.http.get<{ available: boolean }>(`${this.apiUrl}/check-name`, { params });
  }

  /**
   * Export destinations to CSV
   */
  exportDestinations(criteria?: DestinationSearchCriteria): Observable<Blob> {
    let params = new HttpParams();

    if (criteria) {
      if (criteria.query) params = params.set('query', criteria.query);
      if (criteria.country) params = params.set('country', criteria.country);
      if (criteria.climate) params = params.set('climate', criteria.climate);
      if (criteria.safetyLevel) params = params.set('safetyLevel', criteria.safetyLevel);
      if (criteria.isActive !== undefined) params = params.set('isActive', criteria.isActive.toString());
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Import destinations from CSV
   */
  importDestinations(file: File): Observable<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/import`, formData);
  }
}