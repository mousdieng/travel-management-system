import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Booking,
  BookingStatus,
  BookingSearchCriteria,
  BookingListResponse,
  BookingStatistics,
  CreateBookingRequest,
  UpdateBookingRequest,
  ConfirmBookingRequest,
  CancelBookingRequest,
  BookingCalendarEvent,
  BookingAvailability,
  BookingValidation,
  BookingNotification
} from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly API_URL = `${environment.apiUrl}/api/bookings`;

  // State management
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  public readonly bookings$ = this.bookingsSubject.asObservable();

  private selectedBookingSubject = new BehaviorSubject<Booking | null>(null);
  public readonly selectedBooking$ = this.selectedBookingSubject.asObservable();

  private statisticsSubject = new BehaviorSubject<BookingStatistics | null>(null);
  public readonly statistics$ = this.statisticsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // CRUD Operations

  /**
   * Get all bookings with optional search criteria
   */
  getAllBookings(criteria?: BookingSearchCriteria): Observable<BookingListResponse> {
    let params = new HttpParams();

    if (criteria) {
      Object.keys(criteria).forEach(key => {
        const value = (criteria as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<BookingListResponse>(this.API_URL, { params })
      .pipe(
        tap(response => this.bookingsSubject.next(response.bookings))
      );
  }

  /**
   * Get booking by ID
   */
  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/${id}`)
      .pipe(
        tap(booking => this.selectedBookingSubject.next(booking))
      );
  }

  /**
   * Get booking by reference number
   */
  getBookingByReference(reference: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/reference/${reference}`)
      .pipe(
        tap(booking => this.selectedBookingSubject.next(booking))
      );
  }

  /**
   * Create a new booking
   */
  createBooking(booking: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.API_URL, booking)
      .pipe(
        tap(newBooking => {
          const currentBookings = this.bookingsSubject.value;
          this.bookingsSubject.next([newBooking, ...currentBookings]);
          this.selectedBookingSubject.next(newBooking);
        })
      );
  }

  /**
   * Update an existing booking
   */
  updateBooking(id: string, booking: UpdateBookingRequest): Observable<Booking> {
    return this.http.put<Booking>(`${this.API_URL}/${id}`, booking)
      .pipe(
        tap(updatedBooking => {
          const currentBookings = this.bookingsSubject.value;
          const index = currentBookings.findIndex(b => b.id === id);
          if (index !== -1) {
            currentBookings[index] = updatedBooking;
            this.bookingsSubject.next([...currentBookings]);
          }
          this.selectedBookingSubject.next(updatedBooking);
        })
      );
  }

  /**
   * Confirm a booking
   */
  confirmBooking(id: string, request?: ConfirmBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.API_URL}/${id}/confirm`, request || {})
      .pipe(
        tap(confirmedBooking => {
          this.updateBookingInList(confirmedBooking);
        })
      );
  }

  /**
   * Cancel a booking
   */
  cancelBooking(id: string, request: CancelBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.API_URL}/${id}/cancel`, request)
      .pipe(
        tap(cancelledBooking => {
          this.updateBookingInList(cancelledBooking);
        })
      );
  }

  /**
   * Delete a booking (admin only)
   */
  deleteBooking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        tap(() => {
          const currentBookings = this.bookingsSubject.value;
          this.bookingsSubject.next(currentBookings.filter(b => b.id !== id));
          if (this.selectedBookingSubject.value?.id === id) {
            this.selectedBookingSubject.next(null);
          }
        })
      );
  }

  // Query Operations

  /**
   * Get bookings by user ID
   */
  getBookingsByUser(userId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API_URL}/user/${userId}`);
  }

  /**
   * Get bookings by travel ID
   */
  getBookingsByTravel(travelId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API_URL}/travel/${travelId}`);
  }

  /**
   * Get current user's bookings
   */
  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API_URL}/my-bookings`)
      .pipe(
        tap(bookings => this.bookingsSubject.next(bookings))
      );
  }

  /**
   * Get upcoming bookings
   */
  getUpcomingBookings(userId?: string): Observable<Booking[]> {
    const params = userId ? new HttpParams().set('userId', userId) : new HttpParams();
    return this.http.get<Booking[]>(`${this.API_URL}/upcoming`, { params });
  }

  /**
   * Get past bookings
   */
  getPastBookings(userId?: string): Observable<Booking[]> {
    const params = userId ? new HttpParams().set('userId', userId) : new HttpParams();
    return this.http.get<Booking[]>(`${this.API_URL}/past`, { params });
  }

  /**
   * Get bookings by status
   */
  getBookingsByStatus(status: BookingStatus): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API_URL}/status/${status}`);
  }

  /**
   * Get pending bookings
   */
  getPendingBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API_URL}/pending`);
  }

  /**
   * Search bookings
   */
  searchBookings(query: string): Observable<Booking[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Booking[]>(`${this.API_URL}/search`, { params });
  }

  // Statistics & Analytics

  /**
   * Get booking statistics
   */
  getBookingStatistics(): Observable<BookingStatistics> {
    return this.http.get<BookingStatistics>(`${this.API_URL}/statistics`)
      .pipe(
        tap(stats => this.statisticsSubject.next(stats))
      );
  }

  /**
   * Get user booking statistics
   */
  getUserBookingStatistics(userId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/user/${userId}/statistics`);
  }

  /**
   * Get booking analytics
   */
  getBookingAnalytics(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get(`${this.API_URL}/analytics`, { params });
  }

  // Calendar Operations

  /**
   * Get calendar events for bookings
   */
  getBookingCalendarEvents(startDate: string, endDate: string): Observable<BookingCalendarEvent[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<Booking[]>(`${this.API_URL}/calendar`, { params })
      .pipe(
        map(bookings => this.convertBookingsToCalendarEvents(bookings))
      );
  }

  // Availability & Validation

  /**
   * Check booking availability for a travel
   */
  checkAvailability(travelId: string, numberOfPassengers: number): Observable<BookingAvailability> {
    const params = new HttpParams()
      .set('travelId', travelId)
      .set('numberOfPassengers', numberOfPassengers.toString());
    return this.http.get<BookingAvailability>(`${this.API_URL}/availability`, { params });
  }

  /**
   * Validate booking data
   */
  validateBooking(booking: CreateBookingRequest): Observable<BookingValidation> {
    return this.http.post<BookingValidation>(`${this.API_URL}/validate`, booking);
  }

  // Payment Integration

  /**
   * Link payment to booking
   */
  linkPayment(bookingId: string, paymentId: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.API_URL}/${bookingId}/payment`, { paymentId })
      .pipe(
        tap(booking => this.updateBookingInList(booking))
      );
  }

  /**
   * Get booking payment status
   */
  getBookingPaymentStatus(bookingId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${bookingId}/payment-status`);
  }

  // Notifications

  /**
   * Get booking notifications
   */
  getBookingNotifications(bookingId: string): Observable<BookingNotification[]> {
    return this.http.get<BookingNotification[]>(`${this.API_URL}/${bookingId}/notifications`);
  }

  /**
   * Send booking confirmation email
   */
  sendConfirmationEmail(bookingId: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${bookingId}/send-confirmation`, {});
  }

  /**
   * Resend booking details
   */
  resendBookingDetails(bookingId: string, email?: string): Observable<void> {
    const body = email ? { email } : {};
    return this.http.post<void>(`${this.API_URL}/${bookingId}/resend`, body);
  }

  // Export Operations

  /**
   * Export bookings to CSV/Excel
   */
  exportBookings(criteria?: BookingSearchCriteria, format: 'csv' | 'xlsx' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    if (criteria) {
      Object.keys(criteria).forEach(key => {
        const value = (criteria as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get(`${this.API_URL}/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Download booking confirmation PDF
   */
  downloadBookingConfirmation(bookingId: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${bookingId}/confirmation-pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Download booking invoice
   */
  downloadBookingInvoice(bookingId: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${bookingId}/invoice`, {
      responseType: 'blob'
    });
  }

  // Bulk Operations

  /**
   * Bulk update booking status
   */
  bulkUpdateStatus(bookingIds: string[], status: BookingStatus): Observable<{ updated: string[]; failed: string[] }> {
    return this.http.post<{ updated: string[]; failed: string[] }>(
      `${this.API_URL}/bulk/update-status`,
      { bookingIds, status }
    );
  }

  /**
   * Bulk cancel bookings
   */
  bulkCancelBookings(bookingIds: string[], reason: string): Observable<{ cancelled: string[]; failed: string[] }> {
    return this.http.post<{ cancelled: string[]; failed: string[] }>(
      `${this.API_URL}/bulk/cancel`,
      { bookingIds, reason }
    );
  }

  // Utility Methods

  /**
   * Format booking reference
   */
  formatBookingReference(reference: string): string {
    return reference.toUpperCase();
  }

  /**
   * Get booking status color
   */
  getBookingStatusColor(status: BookingStatus): string {
    const colorMap: { [key: string]: string } = {
      'DRAFT': '#9e9e9e',
      'PENDING': '#ff9800',
      'CONFIRMED': '#2196f3',
      'PAID': '#4caf50',
      'CANCELLED': '#f44336',
      'COMPLETED': '#4caf50',
      'REFUNDED': '#e91e63'
    };
    return colorMap[status] || '#9e9e9e';
  }

  /**
   * Get booking status icon
   */
  getBookingStatusIcon(status: BookingStatus): string {
    const iconMap: { [key: string]: string } = {
      'DRAFT': 'edit',
      'PENDING': 'schedule',
      'CONFIRMED': 'check_circle',
      'PAID': 'payment',
      'CANCELLED': 'cancel',
      'COMPLETED': 'done_all',
      'REFUNDED': 'undo'
    };
    return iconMap[status] || 'help';
  }

  /**
   * Calculate days until travel
   */
  getDaysUntilTravel(booking: Booking): number {
    const travelDate = new Date(booking.travelStartDate);
    const today = new Date();
    const diffTime = travelDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if booking can be cancelled
   */
  canCancelBooking(booking: Booking): boolean {
    const daysUntilTravel = this.getDaysUntilTravel(booking);
    return (
      (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PAID) &&
      daysUntilTravel > 0
    );
  }

  /**
   * Check if booking can be modified
   */
  canModifyBooking(booking: Booking): boolean {
    const daysUntilTravel = this.getDaysUntilTravel(booking);
    return (
      (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) &&
      daysUntilTravel > 2
    );
  }

  /**
   * Calculate total passengers
   */
  getTotalPassengers(booking: Booking): number {
    return booking.passengers?.length || booking.numberOfPassengers || 0;
  }

  /**
   * Format currency amount
   */
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // State Management Helpers

  /**
   * Select a booking
   */
  selectBooking(booking: Booking): void {
    this.selectedBookingSubject.next(booking);
  }

  /**
   * Clear selected booking
   */
  clearSelectedBooking(): void {
    this.selectedBookingSubject.next(null);
  }

  /**
   * Refresh bookings list
   */
  refreshBookings(): void {
    this.getAllBookings().subscribe();
  }

  /**
   * Refresh statistics
   */
  refreshStatistics(): void {
    this.getBookingStatistics().subscribe();
  }

  // Private Helper Methods

  /**
   * Update booking in the current list
   */
  private updateBookingInList(booking: Booking): void {
    const currentBookings = this.bookingsSubject.value;
    const index = currentBookings.findIndex(b => b.id === booking.id);
    if (index !== -1) {
      currentBookings[index] = booking;
      this.bookingsSubject.next([...currentBookings]);
    }
  }

  /**
   * Convert bookings to calendar events
   */
  private convertBookingsToCalendarEvents(bookings: Booking[]): BookingCalendarEvent[] {
    return bookings.map(booking => ({
      id: `event-${booking.id}`,
      bookingId: booking.id,
      title: `${booking.travel?.title} - ${booking.bookingReference}`,
      start: new Date(booking.travelStartDate),
      end: new Date(booking.travelEndDate),
      color: this.getBookingStatusColor(booking.status),
      booking: booking
    }));
  }
}
