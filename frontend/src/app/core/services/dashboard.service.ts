import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/dashboard`;

  getTravelerStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/traveler`);
  }

  getManagerStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/manager`);
  }

  getAdminStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin`);
  }
}
