import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { TravelPerformanceMetrics, UnderperformingTravel } from '../../../core/models/admin.model';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';
import { BarChartComponent, BarChartConfig } from '../../../shared/components/charts/bar-chart.component';
import { FilterPanelComponent, FilterConfig, FilterValues } from '../../../shared/components/filter-panel/filter-panel.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-travel-performance',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatsCardComponent,
    BarChartComponent,
    FilterPanelComponent,
    LoadingComponent
  ],
  templateUrl: './travel-performance.component.html'
})
export class TravelPerformanceComponent implements OnInit {
  // Data signals
  performances = signal<TravelPerformanceMetrics[]>([]);
  underperforming = signal<UnderperformingTravel[]>([]);

  // Loading states
  loading = signal(true);
  underperformingLoading = signal(true);

  // Active filters
  activeFilters = signal<any>({});

  // Filter configuration
  filterConfig = signal<FilterConfig>({
    showSearch: true,
    searchPlaceholder: 'Search travels...',
    showDateRange: true,
    dateRangeLabel: 'Travel Date Range',
    filters: [
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'ADVENTURE', label: 'Adventure' },
          { value: 'CULTURAL', label: 'Cultural' },
          { value: 'RELAXATION', label: 'Relaxation' },
          { value: 'WILDLIFE', label: 'Wildlife' },
          { value: 'BEACH', label: 'Beach' },
          { value: 'CITY', label: 'City Tours' }
        ],
        placeholder: 'All Categories'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'UPCOMING', label: 'Upcoming' },
          { value: 'ONGOING', label: 'Ongoing' },
          { value: 'COMPLETED', label: 'Completed' }
        ],
        placeholder: 'All Statuses'
      },
      {
        key: 'minRating',
        label: 'Minimum Rating',
        type: 'select',
        options: [
          { value: 5, label: '5 Stars' },
          { value: 4, label: '4+ Stars' },
          { value: 3, label: '3+ Stars' },
          { value: 2, label: '2+ Stars' }
        ],
        placeholder: 'Any Rating'
      }
    ]
  });

  // Computed metrics
  averageOccupancy = computed(() => {
    const data = this.performances();
    if (data.length === 0) return 0;

    const sum = data.reduce((acc, t) => acc + t.occupancyRate, 0);
    return sum / data.length;
  });

  averageRevenue = computed(() => {
    const data = this.performances();
    if (data.length === 0) return 0;

    const sum = data.reduce((acc, t) => acc + t.revenue, 0);
    return sum / data.length;
  });

  averageRating = computed(() => {
    const data = this.performances();
    if (data.length === 0) return 0;

    const sum = data.reduce((acc, t) => acc + t.averageRating, 0);
    return sum / data.length;
  });

  totalRevenue = computed(() => {
    return this.performances().reduce((acc, t) => acc + t.revenue, 0);
  });

  // Chart configurations
  topRevenueChart = computed<BarChartConfig>(() => {
    const data = [...this.performances()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      labels: data.map(t => t.title.substring(0, 20)),
      datasets: [{
        label: 'Revenue',
        data: data.map(t => t.revenue)
      }],
      title: 'Top 10 Travels by Revenue',
      yAxisLabel: 'Revenue ($)',
      horizontal: true
    };
  });

  topRatingChart = computed<BarChartConfig>(() => {
    const data = [...this.performances()]
      .filter(t => t.reviewCount > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10);

    return {
      labels: data.map(t => t.title.substring(0, 20)),
      datasets: [{
        label: 'Average Rating',
        data: data.map(t => t.averageRating),
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgb(251, 191, 36)'
      }],
      title: 'Top 10 Travels by Rating',
      yAxisLabel: 'Rating',
      horizontal: true
    };
  });

  occupancyChart = computed<BarChartConfig>(() => {
    const data = [...this.performances()]
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 10);

    return {
      labels: data.map(t => t.title.substring(0, 20)),
      datasets: [{
        label: 'Occupancy Rate (%)',
        data: data.map(t => t.occupancyRate),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)'
      }],
      title: 'Top 10 Travels by Occupancy',
      yAxisLabel: 'Occupancy (%)',
      horizontal: true
    };
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadPerformanceMetrics();
    this.loadUnderperformingTravels();
  }

  loadPerformanceMetrics(filters?: any): void {
    this.loading.set(true);
    this.adminService.getTravelPerformanceMetrics(filters).subscribe({
      next: (data) => {
        this.performances.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading performance metrics:', error);
        this.loading.set(false);
      }
    });
  }

  loadUnderperformingTravels(): void {
    this.underperformingLoading.set(true);
    this.adminService.getUnderperformingTravels(50).subscribe({
      next: (data) => {
        this.underperforming.set(data);
        this.underperformingLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading underperforming travels:', error);
        this.underperformingLoading.set(false);
      }
    });
  }

  onFilterChange(filters: FilterValues): void {
    this.activeFilters.set(filters);

    // Transform filter values to API format
    const apiFilters: any = {};

    if (filters['category']) apiFilters.category = filters['category'];
    if (filters['status']) apiFilters.status = filters['status'];
    if (filters['minRating']) apiFilters.minRating = filters['minRating'];

    if (filters['dateRange']) {
      const dateRange = filters['dateRange'] as { startDate?: string; endDate?: string };
      if (dateRange.startDate) apiFilters.dateFrom = dateRange.startDate;
      if (dateRange.endDate) apiFilters.dateTo = dateRange.endDate;
    }

    this.loadPerformanceMetrics(apiFilters);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      case 'ONGOING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPerformanceScoreBadge(score: number): { class: string; label: string } {
    if (score >= 80) return { class: 'bg-green-100 text-green-800', label: 'Excellent' };
    if (score >= 60) return { class: 'bg-blue-100 text-blue-800', label: 'Good' };
    if (score >= 40) return { class: 'bg-yellow-100 text-yellow-800', label: 'Fair' };
    return { class: 'bg-red-100 text-red-800', label: 'Needs Attention' };
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
    return `${value.toFixed(1)}%`;
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }
}
