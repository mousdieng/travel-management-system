import { Component, Input } from '@angular/core';
import { BookingStatus } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-booking-status-chip',
  templateUrl: './booking-status-chip.component.html',
  styleUrls: ['./booking-status-chip.component.scss']
})
export class BookingStatusChipComponent {
  @Input() status!: BookingStatus;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  constructor(private bookingService: BookingService) {}

  getStatusColor(): string {
    return this.bookingService.getBookingStatusColor(this.status);
  }

  getStatusIcon(): string {
    return this.bookingService.getBookingStatusIcon(this.status);
  }

  getStatusLabel(): string {
    const labels: { [key: string]: string } = {
      'DRAFT': 'Draft',
      'PENDING': 'Pending',
      'CONFIRMED': 'Confirmed',
      'PAID': 'Paid',
      'CANCELLED': 'Cancelled',
      'COMPLETED': 'Completed',
      'REFUNDED': 'Refunded'
    };
    return labels[this.status] || this.status;
  }
}
