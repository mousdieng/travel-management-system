import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SavedPaymentMethod, SavePaymentMethodRequest } from '../models';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private baseUrl = `${environment.apiUrl}/api/v1/payment-methods`;

  constructor(private http: HttpClient) {}

  // User methods
  getUserPaymentMethods(userId: number): Observable<SavedPaymentMethod[]> {
    return this.http.get<SavedPaymentMethod[]>(`${this.baseUrl}/user/${userId}`);
  }

  getMyPaymentMethods(): Observable<SavedPaymentMethod[]> {
    return this.http.get<SavedPaymentMethod[]>(`${this.baseUrl}/my-methods`);
  }

  savePaymentMethod(request: SavePaymentMethodRequest): Observable<SavedPaymentMethod> {
    return this.http.post<SavedPaymentMethod>(this.baseUrl, request);
  }

  setDefaultPaymentMethod(methodId: number): Observable<SavedPaymentMethod> {
    return this.http.patch<SavedPaymentMethod>(`${this.baseUrl}/${methodId}/set-default`, {});
  }

  deletePaymentMethod(methodId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${methodId}`);
  }

  // Admin methods
  getAllPaymentMethods(): Observable<SavedPaymentMethod[]> {
    return this.http.get<SavedPaymentMethod[]>(`${this.baseUrl}/admin/all`);
  }

  getPaymentMethodById(methodId: number): Observable<SavedPaymentMethod> {
    return this.http.get<SavedPaymentMethod>(`${this.baseUrl}/admin/${methodId}`);
  }

  updatePaymentMethod(methodId: number, request: SavePaymentMethodRequest): Observable<SavedPaymentMethod> {
    return this.http.put<SavedPaymentMethod>(`${this.baseUrl}/admin/${methodId}`, request);
  }

  deletePaymentMethodById(methodId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/${methodId}`);
  }
}
