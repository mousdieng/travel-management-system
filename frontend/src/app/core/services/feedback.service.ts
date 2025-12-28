import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Feedback, CreateFeedbackRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.feedbacks.base}`;

  constructor(private http: HttpClient) {}

  createFeedback(request: CreateFeedbackRequest): Observable<Feedback> {
    return this.http.post<Feedback>(this.baseUrl, request);
  }

  getFeedbacksForTravel(travelId: string): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/travel/${travelId}`);
  }

  getMyFeedbacks(): Observable<Feedback[]> {
    const url = `${environment.apiUrl}${environment.endpoints.feedbacks.myFeedbacks}`;
    return this.http.get<Feedback[]>(url);
  }

  updateFeedback(id: string, feedback: Partial<Feedback>): Observable<Feedback> {
    return this.http.put<Feedback>(`${this.baseUrl}/${id}`, feedback);
  }

  deleteFeedback(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
