import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

import { BookingListComponent } from './booking-list/booking-list.component';
import { BookingDetailComponent } from './booking-detail/booking-detail.component';
import { BookingCreateComponent } from './booking-create/booking-create.component';
import { BookingCalendarComponent } from './booking-calendar/booking-calendar.component';

const routes: Routes = [
  {
    path: '',
    component: BookingListComponent,
    canActivate: [AuthGuard],
    data: { title: 'Bookings' }
  },
  {
    path: 'create',
    component: BookingCreateComponent,
    canActivate: [AuthGuard],
    data: { title: 'Create Booking' }
  },
  {
    path: 'calendar',
    component: BookingCalendarComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      title: 'Booking Calendar',
      roles: ['ADMIN', 'MANAGER']
    }
  },
  {
    path: ':id',
    component: BookingDetailComponent,
    canActivate: [AuthGuard],
    data: { title: 'Booking Details' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingsRoutingModule { }
