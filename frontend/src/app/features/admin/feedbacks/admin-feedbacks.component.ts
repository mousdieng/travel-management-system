import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { TravelFeedbackGroup, ManagerFeedbackGroup, FeedbackStatistics } from '../../../core/models/admin.model';
import { Feedback } from '../../../core/models/feedback.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PieChartComponent, PieChartConfig } from '../../../shared/components/charts/pie-chart.component';
import { BarChartComponent, BarChartConfig } from '../../../shared/components/charts/bar-chart.component';
import { LineChartComponent, LineChartConfig } from '../../../shared/components/charts/line-chart.component';

@Component({
  selector: 'app-admin-feedbacks',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingComponent,
    PieChartComponent,
    BarChartComponent,
    LineChartComponent
  ],
  templateUrl: './admin-feedbacks.component.html'
})
export class AdminFeedbacksComponent implements OnInit {
  // Active tab management
  activeTab = signal<'all' | 'byTravel' | 'byManager' | 'analytics'>('all');

  // All feedbacks tab
  allFeedbacks = signal<Feedback[]>([]);
  allFeedbacksLoading = signal(true);
  filterRating = signal(0);
  searchQuery = '';

  // By Travel tab
  travelGroups = signal<TravelFeedbackGroup[]>([]);
  travelGroupsLoading = signal(false);
  expandedTravelId = signal<number | null>(null);

  // By Manager tab
  managerGroups = signal<ManagerFeedbackGroup[]>([]);
  managerGroupsLoading = signal(false);
  expandedManagerId = signal<number | null>(null);

  // Analytics tab
  stats = signal<FeedbackStatistics | null>(null);
  statsLoading = signal(false);

  // Chart configurations
  ratingDistributionChart = computed<PieChartConfig>(() => {
    const statsData = this.stats();
    if (!statsData) return { labels: [], data: [], title: 'Rating Distribution' };

    const distribution = statsData.ratingDistribution || {};
    return {
      labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
      data: [
        distribution[5] || 0,
        distribution[4] || 0,
        distribution[3] || 0,
        distribution[2] || 0,
        distribution[1] || 0
      ],
      title: 'Rating Distribution',
      type: 'doughnut',
      showPercentage: true
    };
  });

  topRatedTravelsChart = computed<BarChartConfig>(() => {
    const statsData = this.stats();
    if (!statsData || !statsData.topRatedTravels) {
      return { labels: [], datasets: [], title: 'Top Rated Travels' };
    }

    return {
      labels: statsData.topRatedTravels.map(t => t.travelTitle.substring(0, 20)),
      datasets: [{
        label: 'Average Rating',
        data: statsData.topRatedTravels.map(t => t.rating)
      }],
      title: 'Top Rated Travels',
      yAxisLabel: 'Rating',
      horizontal: true
    };
  });

  Math = Math;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadAllFeedbacks();
  }

  setActiveTab(tab: 'all' | 'byTravel' | 'byManager' | 'analytics') {
    this.activeTab.set(tab);

    // Load data for the active tab if not already loaded
    if (tab === 'byTravel' && this.travelGroups().length === 0) {
      this.loadTravelGroups();
    } else if (tab === 'byManager' && this.managerGroups().length === 0) {
      this.loadManagerGroups();
    } else if (tab === 'analytics' && !this.stats()) {
      this.loadStatistics();
    }
  }

  // All Feedbacks Tab
  loadAllFeedbacks(): void {
    this.allFeedbacksLoading.set(true);
    this.adminService.getAllFeedbacks().subscribe({
      next: (data) => {
        this.allFeedbacks.set(data);
        this.allFeedbacksLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading feedbacks:', error);
        this.allFeedbacksLoading.set(false);
      }
    });
  }

  filteredFeedbacks(): Feedback[] {
    let filtered = this.allFeedbacks();

    if (this.filterRating() > 0) {
      filtered = filtered.filter(f => f.rating === this.filterRating());
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.travelerName?.toLowerCase().includes(query) ||
        f.travelTitle?.toLowerCase().includes(query) ||
        f.comment?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  getAverageRating(): number {
    const feedbacks = this.allFeedbacks();
    if (feedbacks.length === 0) return 0;

    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return sum / feedbacks.length;
  }

  getRatingCount(rating: number): number {
    return this.allFeedbacks().filter(f => f.rating === rating).length;
  }

  getRatingTabClasses(rating: number): string {
    const isActive = this.filterRating() === rating;
    return `px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'text-indigo-600 border-b-2 border-indigo-600'
        : 'text-gray-600 hover:text-gray-900'
    }`;
  }

  // By Travel Tab
  loadTravelGroups(): void {
    this.travelGroupsLoading.set(true);
    this.adminService.getFeedbacksGroupedByTravel().subscribe({
      next: (data) => {
        this.travelGroups.set(data);
        this.travelGroupsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading travel groups:', error);
        this.travelGroupsLoading.set(false);
      }
    });
  }

  toggleTravelExpand(travelId: number): void {
    if (this.expandedTravelId() === travelId) {
      this.expandedTravelId.set(null);
    } else {
      this.expandedTravelId.set(travelId);
    }
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getRatingPercentage(count: number, total: number): number {
    return total > 0 ? (count / total) * 100 : 0;
  }

  // By Manager Tab
  loadManagerGroups(): void {
    this.managerGroupsLoading.set(true);
    this.adminService.getFeedbacksGroupedByManager().subscribe({
      next: (data) => {
        this.managerGroups.set(data);
        this.managerGroupsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading manager groups:', error);
        this.managerGroupsLoading.set(false);
      }
    });
  }

  toggleManagerExpand(managerId: number): void {
    if (this.expandedManagerId() === managerId) {
      this.expandedManagerId.set(null);
    } else {
      this.expandedManagerId.set(managerId);
    }
  }

  // Analytics Tab
  loadStatistics(): void {
    this.statsLoading.set(true);
    this.adminService.getFeedbackStatistics().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.statsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.statsLoading.set(false);
      }
    });
  }

  // Utility methods
  getMainTabClasses(tab: 'all' | 'byTravel' | 'byManager' | 'analytics'): string {
    const isActive = this.activeTab() === tab;
    return `px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
      isActive
        ? 'text-indigo-600 border-indigo-600'
        : 'text-gray-600 hover:text-gray-900 border-transparent'
    }`;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
