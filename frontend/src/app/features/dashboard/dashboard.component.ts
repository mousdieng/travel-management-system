import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/user.model';
import { DashboardStats } from '../../core/models/dashboard.model';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      @if (loading()) {
        <app-loading />
      } @else if (stats()) {
        <!-- Welcome Section -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <h2 class="text-2xl font-bold mb-2">Welcome back, {{ currentUser()?.firstName }}!</h2>
          <p class="text-indigo-100">Here's what's happening with your account</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          @if (isTraveler()) {
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Total Subscriptions</div>
              <div class="text-3xl font-bold text-gray-900">{{ stats()!.totalSubscriptions || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Active Subscriptions</div>
              <div class="text-3xl font-bold text-green-600">{{ stats()!.activeSubscriptions || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Completed Payments</div>
              <div class="text-3xl font-bold text-indigo-600">{{ stats()!.completedPayments || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Reports Filed</div>
              <div class="text-3xl font-bold text-gray-900">{{ stats()!.reportsFiled || 0 }}</div>
            </div>
          }

          @if (isManager()) {
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Total Travels</div>
              <div class="text-3xl font-bold text-gray-900">{{ stats()!.totalTravels || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Active Travels</div>
              <div class="text-3xl font-bold text-green-600">{{ stats()!.activeTravels || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Total Income</div>
              <div class="text-3xl font-bold text-indigo-600">\${{ stats()!.totalIncome || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Average Rating</div>
              <div class="text-3xl font-bold text-yellow-500">{{ (stats()!.averageRating || 0).toFixed(1) }}⭐</div>
            </div>
          }

          @if (isAdmin()) {
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Total Users</div>
              <div class="text-3xl font-bold text-gray-900">{{ stats()!.totalUsers || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Total Travels</div>
              <div class="text-3xl font-bold text-indigo-600">{{ stats()!.totalTravels || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Platform Income</div>
              <div class="text-3xl font-bold text-green-600">\${{ stats()!.platformIncome || 0 }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-sm font-medium text-gray-500 mb-1">Pending Reports</div>
              <div class="text-3xl font-bold text-red-600">{{ stats()!.pendingReports || 0 }}</div>
            </div>
          }
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @if (isTraveler()) {
              <a routerLink="/travels" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <svg class="h-8 w-8 text-indigo-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span class="font-medium">Browse Travels</span>
              </a>
              <a routerLink="/traveler/subscriptions" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <svg class="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span class="font-medium">My Subscriptions</span>
              </a>
            }
            @if (isManager()) {
              <a routerLink="/manager/travels/create" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <svg class="h-8 w-8 text-indigo-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span class="font-medium">Create Travel</span>
              </a>
              <a routerLink="/manager/travels" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <svg class="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span class="font-medium">Manage Travels</span>
              </a>
            }
            <a routerLink="/traveler/profile" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <svg class="h-8 w-8 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="font-medium">My Profile</span>
            </a>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  currentUser = this.authService.currentUser;

  isTraveler = computed(() => this.currentUser()?.role === Role.TRAVELER);
  isManager = computed(() => this.currentUser()?.role === Role.TRAVEL_MANAGER);
  isAdmin = computed(() => this.currentUser()?.role === Role.ADMIN);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    const role = this.currentUser()?.role;

    let statsObservable;
    if (role === Role.ADMIN) {
      statsObservable = this.dashboardService.getAdminStats();
    } else if (role === Role.TRAVEL_MANAGER) {
      statsObservable = this.dashboardService.getManagerStats();
    } else {
      statsObservable = this.dashboardService.getTravelerStats();
    }

    statsObservable.subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
