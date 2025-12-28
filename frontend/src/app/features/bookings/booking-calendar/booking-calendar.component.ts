import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Booking, BookingCalendarEvent } from '../../../core/models/booking.model';

@Component({
  selector: 'app-booking-calendar',
  templateUrl: './booking-calendar.component.html',
  styleUrls: ['./booking-calendar.component.scss']
})
export class BookingCalendarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Calendar data
  currentDate: Date = new Date();
  calendarEvents: BookingCalendarEvent[] = [];
  selectedDate: Date | null = null;
  selectedDateBookings: Booking[] = [];

  // View mode
  viewMode: 'month' | 'week' | 'day' = 'month';

  // Calendar grid
  calendarWeeks: Date[][] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  isLoading = false;

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCalendarData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCalendarData(): void {
    this.isLoading = true;

    const startDate = this.getMonthStart(this.currentDate);
    const endDate = this.getMonthEnd(this.currentDate);

    this.bookingService.getBookingCalendarEvents(
      startDate.toISOString(),
      endDate.toISOString()
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          this.calendarEvents = events;
          this.generateCalendar();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.showError('Failed to load calendar data');
        }
      });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    this.calendarWeeks = [];
    let currentWeek: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      currentWeek.push(new Date(current));

      if (currentWeek.length === 7) {
        this.calendarWeeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }
  }

  getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.loadCalendarData();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.loadCalendarData();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.loadCalendarData();
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
    this.selectedDateBookings = this.getBookingsForDate(date);
  }

  getBookingsForDate(date: Date): Booking[] {
    return this.calendarEvents
      .filter(event => this.isSameDay(new Date(event.start), date))
      .map(event => event.booking);
  }

  getBookingsCountForDate(date: Date): number {
    return this.calendarEvents.filter(event =>
      this.isSameDay(new Date(event.start), date)
    ).length;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  isSelectedDate(date: Date): boolean {
    return this.selectedDate ? this.isSameDay(date, this.selectedDate) : false;
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  viewBooking(booking: Booking): void {
    this.router.navigate(['/bookings', booking.id]);
  }

  createBooking(): void {
    this.router.navigate(['/bookings/create']);
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getCurrentMonthYear(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }
}
