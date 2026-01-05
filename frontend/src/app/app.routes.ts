import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, managerGuard, travelerGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/traveler/browse-travels/browse-travels.component')
      .then(m => m.BrowseTravelsComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component')
          .then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component')
          .then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'travels',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/traveler/browse-travels/browse-travels.component')
          .then(m => m.BrowseTravelsComponent)
      },
      {
        path: 'search',
        loadComponent: () => import('./features/traveler/travel-list/travel-list.component')
          .then(m => m.TravelListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/traveler/travel-detail/travel-detail.component')
          .then(m => m.TravelDetailComponent)
      },
      {
        path: ':id/checkout',
        canActivate: [authGuard],
        loadComponent: () => import('./features/checkout/checkout.component')
          .then(m => m.CheckoutComponent)
      }
    ]
  },
  {
    path: 'managers/:id',
    loadComponent: () => import('./features/traveler/manager-profile/manager-profile.component')
      .then(m => m.ManagerProfileComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component')
          .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'travels',
        loadComponent: () => import('./features/admin/travel-management/travel-management.component')
          .then(m => m.TravelManagementComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/user-management/user-management.component')
          .then(m => m.UserManagementComponent)
      },
      {
        path: 'payment-methods',
        loadComponent: () => import('./features/admin/payment-method-management/payment-method-management.component')
          .then(m => m.PaymentMethodManagementComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/admin/analytics/admin-analytics.component')
          .then(m => m.AdminAnalyticsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/reports/admin-reports.component')
          .then(m => m.AdminReportsComponent)
      },
      {
        path: 'feedbacks',
        loadComponent: () => import('./features/admin/feedbacks/admin-feedbacks.component')
          .then(m => m.AdminFeedbacksComponent)
      },
      {
        path: 'manager-rankings',
        loadComponent: () => import('./features/admin/manager-rankings/manager-rankings.component')
          .then(m => m.ManagerRankingsComponent)
      },
      {
        path: 'travel-performance',
        loadComponent: () => import('./features/admin/travel-performance/travel-performance.component')
          .then(m => m.TravelPerformanceComponent)
      },
      {
        path: 'travel-history',
        loadComponent: () => import('./features/admin/travel-performance/travel-performance.component')
          .then(m => m.TravelPerformanceComponent)
      },
      {
        path: 'income-analytics',
        loadComponent: () => import('./features/admin/analytics/admin-analytics.component')
          .then(m => m.AdminAnalyticsComponent)
      }
    ]
  },
  {
    path: 'manager',
    canActivate: [authGuard, managerGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component')
          .then(m => m.ManagerDashboardComponent)
      },
      {
        path: 'travels',
        loadComponent: () => import('./features/manager/my-travels/my-travels.component')
          .then(m => m.MyTravelsComponent)
      },
      {
        path: 'travels/create',
        loadComponent: () => import('./features/manager/travels/travel-form.component')
          .then(m => m.TravelFormComponent)
      },
      {
        path: 'travels/:id',
        loadComponent: () => import('./features/manager/travels/travel-detail.component')
          .then(m => m.TravelDetailComponent)
      },
      {
        path: 'travels/:id/edit',
        loadComponent: () => import('./features/manager/travels/travel-form.component')
          .then(m => m.TravelFormComponent)
      },
      {
        path: 'travels/:id/subscribers',
        loadComponent: () => import('./features/manager/subscribers/subscribers.component')
          .then(m => m.SubscribersComponent)
      },
      {
        path: 'subscribers',
        loadComponent: () => import('./features/manager/subscribers/subscribers.component')
          .then(m => m.SubscribersComponent)
      },
      {
        path: 'feedbacks',
        loadComponent: () => import('./features/manager/feedbacks/manager-feedbacks.component')
          .then(m => m.ManagerFeedbacksComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/manager/analytics/manager-analytics.component')
          .then(m => m.ManagerAnalyticsComponent)
      }
    ]
  },
  {
    path: 'traveler',
    canActivate: [authGuard, travelerGuard],
    children: [
      {
        path: '',
        redirectTo: 'subscriptions',
        pathMatch: 'full'
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./features/traveler/subscriptions/my-subscriptions.component')
          .then(m => m.MySubscriptionsComponent)
      },
      {
        path: 'statistics',
        loadComponent: () => import('./features/traveler/statistics/statistics.component')
          .then(m => m.StatisticsComponent)
      },
      {
        path: 'feedbacks',
        loadComponent: () => import('./features/traveler/feedbacks/my-feedbacks.component')
          .then(m => m.MyFeedbacksComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/traveler/profile/profile.component')
          .then(m => m.ProfileComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/traveler/payments/payment.component')
          .then(m => m.PaymentComponent)
      },
      {
        path: 'recommendations',
        loadComponent: () => import('./features/traveler/recommendations/recommendations.component')
          .then(m => m.RecommendationsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/traveler/reports/my-reports.component')
          .then(m => m.MyReportsComponent)
      }
    ]
  },
  {
    path: 'payment',
    children: [
      {
        path: 'success',
        loadComponent: () => import('./features/payment-success/payment-success.component')
          .then(m => m.PaymentSuccessComponent)
      },
      {
        path: 'pending',
        loadComponent: () => import('./features/payment-success/payment-success.component')
          .then(m => m.PaymentSuccessComponent)
      },
      {
        path: 'cancel',
        loadComponent: () => import('./features/payment/payment-cancel/payment-cancel.component')
          .then(m => m.PaymentCancelComponent)
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component')
      .then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];
