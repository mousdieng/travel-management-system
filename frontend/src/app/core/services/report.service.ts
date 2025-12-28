import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report, CreateReportRequest, ReportStatus } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/reports`;

  createReport(request: CreateReportRequest): Observable<Report> {
    return this.http.post<Report>(this.apiUrl, request);
  }

  getReport(id: number): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`);
  }

  getMyReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/my`);
  }

  getAllReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.apiUrl);
  }

  getReportsByStatus(status: ReportStatus): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/status/${status}`);
  }

  updateReportStatus(id: number, status: ReportStatus, adminResponse?: string): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}/status`, { status, adminResponse });
  }

  getPendingReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/pending`);
  }

  reviewReport(id: number, status: ReportStatus, adminNotes: string): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}/review`, { status, adminNotes });
  }
}
