import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Subscription, CreateSubscriptionRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.subscriptions.base}`;

  constructor(private http: HttpClient) {}

  createSubscription(request: CreateSubscriptionRequest): Observable<Subscription> {
    return this.http.post<Subscription>(this.baseUrl, request);
  }

  getMySubscriptions(): Observable<Subscription[]> {
    const url = `${environment.apiUrl}${environment.endpoints.subscriptions.byUser}`;
    return this.http.get<Subscription[]>(url);
  }

  getMyActiveSubscriptions(): Observable<Subscription[]> {
    const url = `${environment.apiUrl}${environment.endpoints.subscriptions.byUser}/active`;
    return this.http.get<Subscription[]>(url);
  }

  getSubscriptionById(id: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.baseUrl}/${id}`);
  }

  cancelSubscription(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/cancel`);
  }

  getSubscriptionsForTravel(travelId: string): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.baseUrl}/travel/${travelId}`);
  }
}
