import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Travel } from '../models/travel.model';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/recommendations`;

  getPersonalizedRecommendations(limit: number = 10): Observable<Travel[]> {
    return this.http.get<Travel[]>(`${this.apiUrl}/personalized`, {
      params: { limit: limit.toString() }
    });
  }
}
