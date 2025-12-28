import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';

// Shared
import { SharedModule } from '../../shared/shared.module';

// Components
import { PaymentListComponent } from './payment-list/payment-list.component';
import { PaymentCreateComponent } from './payment-create/payment-create.component';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';
import { PaymentReceiptComponent } from './payment-receipt/payment-receipt.component';
import { StripeCardFormComponent } from './stripe-card-form/stripe-card-form.component';
import { PayPalButtonComponent } from './paypal-button/paypal-button.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentListComponent,
    data: {
      title: 'Payments',
      breadcrumb: 'Payments'
    }
  },
  {
    path: 'create',
    component: PaymentCreateComponent,
    data: {
      title: 'Make Payment',
      breadcrumb: 'Create Payment'
    }
  },
  {
    path: 'confirmation',
    component: PaymentConfirmationComponent,
    data: {
      title: 'Payment Confirmation',
      breadcrumb: 'Confirmation'
    }
  },
  {
    path: 'receipt/:id',
    component: PaymentReceiptComponent,
    data: {
      title: 'Payment Receipt',
      breadcrumb: 'Receipt'
    }
  }
];

@NgModule({
  declarations: [
    PaymentListComponent,
    PaymentCreateComponent,
    PaymentConfirmationComponent,
    PaymentReceiptComponent,
    StripeCardFormComponent,
    PayPalButtonComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    // Angular Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatDividerModule,

    // Shared
    SharedModule
  ]
})
export class PaymentModule { }