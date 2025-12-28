import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import {
  MonthlyIncome,
  ManagerIncomeBreakdown,
  CategoryIncomeBreakdown,
  PaymentStatistics
} from '../../../core/models/admin.model';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { LineChartComponent, LineChartConfig } from '../../../shared/components/charts/line-chart.component';
import { PieChartComponent, PieChartConfig } from '../../../shared/components/charts/pie-chart.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

type SortColumn = 'rank' | 'totalIncome' | 'thisMonthIncome' | 'growthRate';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-income-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatsCardComponent,
    LineChartComponent,
    PieChartComponent,
    LoadingComponent
  ],
  templateUrl: './income-analytics.component.html'
})
export class IncomeAnalyticsComponent implements OnInit {
  // Data signals
  monthlyData = signal<MonthlyIncome[]>([]);
  managerBreakdown = signal<ManagerIncomeBreakdown[]>([]);
  categoryBreakdown = signal<CategoryIncomeBreakdown[]>([]);
  paymentStats = signal<PaymentStatistics | null>(null);

  // Loading states
  loading = signal(true);
  managersLoading = signal(true);
  categoriesLoading = signal(true);
  statsLoading = signal(true);

  // Table sorting
  sortColumn = signal<SortColumn>('totalIncome');
  sortDirection = signal<SortDirection>('desc');

  // Computed values for stats cards
  totalIncome = computed(() => {
    const data = this.monthlyData();
    return data.reduce((sum, month) => sum + month.totalIncome, 0);
  });

  monthlyAverage = computed(() => {
    const data = this.monthlyData();
    return data.length > 0 ? this.totalIncome() / data.length : 0;
  });

  totalPayments = computed(() => {
    const data = this.monthlyData();
    return data.reduce((sum, month) => sum + month.numberOfPayments, 0);
  });

  growthRate = computed(() => {
    const data = this.monthlyData();
    if (data.length < 2) return 0;

    const thisMonth = data[0]?.totalIncome || 0;
    const lastMonth = data[1]?.totalIncome || 0;

    if (lastMonth === 0) return 0;
    return ((thisMonth - lastMonth) / lastMonth) * 100;
  });

  // Chart configurations
  monthlyTrendChart = computed<LineChartConfig>(() => {
    const data = this.monthlyData().slice().reverse(); // Oldest to newest
    return {
      labels: data.map(m => `${m.monthName.substring(0, 3)} ${m.year}`),
      datasets: [
        {
          label: 'Income',
          data: data.map(m => m.totalIncome),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        },
        {
          label: 'Payments',
          data: data.map(m => m.numberOfPayments * 100), // Scale for visibility
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false
        }
      ],
      title: 'Monthly Income Trend',
      yAxisLabel: 'Amount ($)',
      height: 350
    };
  });

  categoryIncomeChart = computed<PieChartConfig>(() => {
    const data = this.categoryBreakdown();
    if (data.length === 0) return { labels: [], data: [], title: 'Income by Category' };

    return {
      labels: data.map(c => c.category),
      data: data.map(c => c.totalIncome),
      title: 'Income by Travel Category',
      type: 'pie',
      showPercentage: true
    };
  });

  paymentMethodChart = computed<PieChartConfig>(() => {
    const stats = this.paymentStats();
    if (!stats || !stats.paymentMethodDistribution) {
      return { labels: [], data: [], title: 'Payment Methods' };
    }

    const distribution = stats.paymentMethodDistribution;
    return {
      labels: Object.keys(distribution),
      data: Object.values(distribution),
      title: 'Payment Method Distribution',
      type: 'doughnut',
      showPercentage: true
    };
  });

  // Sorted managers
  sortedManagers = computed(() => {
    const managers = [...this.managerBreakdown()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    managers.sort((a, b) => {
      let aVal: number, bVal: number;

      switch (column) {
        case 'rank':
          aVal = a.rank;
          bVal = b.rank;
          break;
        case 'totalIncome':
          aVal = a.totalIncome;
          bVal = b.totalIncome;
          break;
        case 'thisMonthIncome':
          aVal = a.thisMonthIncome;
          bVal = b.thisMonthIncome;
          break;
        case 'growthRate':
          aVal = a.growthRate;
          bVal = b.growthRate;
          break;
        default:
          return 0;
      }

      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return managers;
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData(): void {
    // Load monthly income
    this.adminService.getMonthlyIncomeBreakdown(12).subscribe({
      next: (data) => {
        this.monthlyData.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Load manager breakdown
    this.adminService.getIncomeByManager().subscribe({
      next: (data) => {
        this.managerBreakdown.set(data);
        this.managersLoading.set(false);
      },
      error: () => this.managersLoading.set(false)
    });

    // Load category breakdown
    this.adminService.getIncomeByCategory().subscribe({
      next: (data) => {
        this.categoryBreakdown.set(data);
        this.categoriesLoading.set(false);
      },
      error: () => this.categoriesLoading.set(false)
    });

    // Load payment statistics
    this.adminService.getPaymentStatistics().subscribe({
      next: (data) => {
        this.paymentStats.set(data);
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false)
    });
  }

  setSortColumn(column: SortColumn): void {
    if (this.sortColumn() === column) {
      // Toggle direction if same column
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with desc as default
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }

  getSortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) return '';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  getRankBadgeClass(rank: number): string {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }
}
