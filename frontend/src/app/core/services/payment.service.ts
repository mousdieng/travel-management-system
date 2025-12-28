import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, ProcessPaymentRequest, ManagerIncomeStats, CheckoutRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseUrl = `${environment.apiUrl}/api/v1/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Payment-first checkout flow
   * Creates payment intent/session BEFORE subscription
   */
  initiateCheckout(request: CheckoutRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/checkout`, request);
  }

  /**
   * Legacy payment method (for existing bookings)
   */
  processPayment(request: ProcessPaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.baseUrl, request);
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${id}`);
  }

  getUserPayments(userId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/user/${userId}`);
  }

  getUserCompletedPayments(userId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/user/${userId}/completed`);
  }

  getPaymentByBookingId(bookingId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/booking/${bookingId}`);
  }

  confirmStripePayment(sessionIdOrPaymentIntentId: string): Observable<Payment> {
    // Check if it's a session ID (starts with cs_) or payment intent ID (starts with pi_)
    const isSessionId = sessionIdOrPaymentIntentId.startsWith('cs_');

    if (isSessionId) {
      return this.http.post<Payment>(`${this.baseUrl}/stripe/confirm`, null, {
        params: { sessionId: sessionIdOrPaymentIntentId }
      });
    } else {
      return this.http.post<Payment>(`${this.baseUrl}/stripe/confirm`, null, {
        params: { paymentIntentId: sessionIdOrPaymentIntentId }
      });
    }
  }

  confirmPayPalPayment(paymentId: string, payerId: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/paypal/confirm`, null, {
      params: { paymentId, payerId }
    });
  }

  getManagerIncomeStats(managerId: number): Observable<ManagerIncomeStats> {
    return this.http.get<ManagerIncomeStats>(`${this.baseUrl}/manager/${managerId}/stats`);
  }

  getManagerPayments(managerId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/manager/${managerId}`);
  }
}
