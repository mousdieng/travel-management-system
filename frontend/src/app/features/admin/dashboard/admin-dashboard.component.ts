import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardStats } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  analytics = signal<DashboardStats | null>(null);

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getAdminStats().subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading admin dashboard stats:', error);
        this.error.set('Failed to load dashboard statistics. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  formatNumber(value: number): string {
    if (!value && value !== 0) return '0';
    return value.toLocaleString('en-US');
  }

  formatCurrency(value: number): string {
    if (!value && value !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  calculateGrowth(currentValue: number, previousValue: number): string {
    if (!previousValue || previousValue === 0) {
      return currentValue > 0 ? '+100%' : '0%';
    }
    const growth = ((currentValue - previousValue) / previousValue) * 100;
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  }

  getCategoryList(categoryData: { [category: string]: number }): Array<{ key: string; value: number }> {
    if (!categoryData) return [];
    return Object.entries(categoryData).map(([key, value]) => ({ key, value }));
  }
}
