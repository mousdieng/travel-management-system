import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Booking, BookingStatus } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-booking-card',
  templateUrl: './booking-card.component.html',
  styleUrls: ['./booking-card.component.scss']
})
export class BookingCardComponent {
  @Input() booking!: Booking;
  @Input() showActions: boolean = true;

  @Output() viewDetails = new EventEmitter<Booking>();
  @Output() confirm = new EventEmitter<Booking>();
  @Output() cancel = new EventEmitter<Booking>();
  @Output() processPayment = new EventEmitter<Booking>();

  BookingStatus = BookingStatus;

  constructor(private bookingService: BookingService) {}

  onViewDetails(): void {
    this.viewDetails.emit(this.booking);
  }

  onConfirm(): void {
    this.confirm.emit(this.booking);
  }

  onCancel(): void {
    this.cancel.emit(this.booking);
  }

  onProcessPayment(): void {
    this.processPayment.emit(this.booking);
  }

  getDaysUntilTravel(): number {
    return this.bookingService.getDaysUntilTravel(this.booking);
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getStatusColor(): string {
    return this.bookingService.getBookingStatusColor(this.booking.status);
  }

  getStatusIcon(): string {
    return this.bookingService.getBookingStatusIcon(this.booking.status);
  }

  canConfirm(): boolean {
    return this.booking.status === BookingStatus.PENDING;
  }

  canCancel(): boolean {
    return this.booking.status === BookingStatus.PENDING ||
           this.booking.status === BookingStatus.CONFIRMED;
  }

  canProcessPayment(): boolean {
    return this.booking.status === BookingStatus.CONFIRMED &&
           !this.booking.paymentId;
  }
}
