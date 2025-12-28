import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="section-title">Payments</h1>
      <div class="card">
        <p class="text-gray-600">Payment history and management coming soon...</p>
      </div>
    </div>
  `
})
export class PaymentComponent {}
