import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ExportService } from '../../../core/services/export.service';
import { ManagerRanking, ManagerIncomeBreakdown, MonthlyIncome } from '../../../core/models/admin.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LineChartComponent, LineChartConfig } from '../../../shared/components/charts/line-chart.component';
import { StatsCardComponent } from '../../../shared/components/stats-card/stats-card.component';

@Component({
  selector: 'app-manager-rankings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingComponent,
    AlertComponent,
    LineChartComponent,
    StatsCardComponent
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-gray-900">Manager Rankings</h1>
          <p class="text-gray-600 mt-2">Performance-based rankings of travel managers</p>
        </div>
        <button routerLink="/admin/dashboard" class="btn-outline">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Dashboard
        </button>
      </div>

      <!-- Alert Messages -->
      <app-alert *ngIf="error()" [message]="error()!" type="error" class="mb-6"></app-alert>

      <app-loading *ngIf="loading()"></app-loading>

      @if (!loading() && rankings().length > 0) {
        <!-- Top 3 Highlight Cards -->
        @if (rankings().length >= 3) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            @for (manager of rankings().slice(0, 3); track manager.managerId) {
              <div class="card relative overflow-hidden hover:shadow-xl transition-shadow"
                   [class.border-t-4]="true"
                   [class.border-yellow-400]="manager.rank === 1"
                   [class.border-gray-400]="manager.rank === 2"
                   [class.border-orange-400]="manager.rank === 3">
                <!-- Rank Badge -->
                <div class="absolute top-4 right-4">
                  <span [class]="getRankBadge(manager.rank) + ' px-4 py-2 rounded-full text-lg font-bold shadow-lg'">
                    #{{ manager.rank }}
                  </span>
                </div>

                <!-- Manager Info -->
                <div class="flex items-center mb-6">
                  @if (manager.profileImage) {
                    <img [src]="manager.profileImage" [alt]="manager.managerName" class="w-16 h-16 rounded-full mr-4 border-2 border-gray-200">
                  } @else {
                    <div class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-xl mr-4">
                      {{ manager.managerName.charAt(0) }}
                    </div>
                  }
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-900">{{ manager.managerName }}</h3>
                    <p class="text-sm text-gray-600">{{ manager.email }}</p>
                  </div>
                </div>

                <!-- Performance Score -->
                <div class="mb-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
                  <p class="text-sm text-gray-600 mb-1">Performance Score</p>
                  <p class="text-3xl font-bold text-primary-600">{{ manager.performanceScore.toFixed(1) }}</p>
                </div>

                <!-- Stats Grid -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Total Income</span>
                    <span class="text-base font-bold text-gray-900">{{ formatCurrency(manager.totalIncome) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Last Month</span>
                    <span class="text-base font-semibold text-green-600">{{ formatCurrency(manager.lastMonthIncome) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Average Rating</span>
                    <div class="flex items-center">
                      <svg class="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span class="text-base font-bold text-gray-900">{{ manager.averageRating.toFixed(1) }}</span>
                      <span class="text-xs text-gray-500 ml-1">({{ formatNumber(manager.totalReviews) }})</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Travels Organized</span>
                    <span class="text-base font-semibold text-gray-900">{{ formatNumber(manager.totalTravelsOrganized) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Total Participants</span>
                    <span class="text-base font-semibold text-gray-900">{{ formatNumber(manager.totalParticipants) }}</span>
                  </div>
                  @if (manager.reportsReceived > 0) {
                    <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span class="text-sm text-red-600 font-medium">Reports Received</span>
                      <span class="text-base font-bold text-red-600">{{ manager.reportsReceived }}</span>
                    </div>
                  }
                </div>

                <!-- View Profile Button -->
                <button [routerLink]="['/managers', manager.managerId]" class="btn-primary w-full mt-6">
                  View Full Profile
                </button>
              </div>
            }
          </div>
        }

        <!-- Complete Rankings Table -->
        <div class="card overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold text-gray-900">Complete Rankings</h2>
              <p class="text-sm text-gray-600 mt-1">All managers sorted by performance score</p>
            </div>
            <div class="flex space-x-2">
              <button
                (click)="exportToCSV()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center text-sm"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export CSV
              </button>
              <button
                (click)="exportToPDF()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center text-sm"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                Export PDF
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travels</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (manager of rankings(); track manager.managerId) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <!-- Rank -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getRankBadge(manager.rank) + ' px-3 py-1 rounded-full text-sm font-bold'">
                        #{{ manager.rank }}
                      </span>
                    </td>

                    <!-- Manager Info -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        @if (manager.profileImage) {
                          <img [src]="manager.profileImage" [alt]="manager.managerName" class="h-10 w-10 rounded-full mr-3">
                        } @else {
                          <div class="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold mr-3">
                            {{ manager.managerName.charAt(0) }}
                          </div>
                        }
                        <div>
                          <div class="text-sm font-medium text-gray-900">{{ manager.managerName }}</div>
                          <div class="text-sm text-gray-500">{{ manager.email }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Performance Score -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getPerformanceBadge(manager.performanceScore) + ' px-3 py-1 rounded-full text-xs font-semibold'">
                        {{ manager.performanceScore.toFixed(1) }}
                      </span>
                    </td>

                    <!-- Travels -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ formatNumber(manager.totalTravelsOrganized) }} total</div>
                      <div class="text-xs text-gray-500">{{ formatNumber(manager.completedTravels) }} completed</div>
                    </td>

                    <!-- Revenue -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ formatCurrency(manager.totalIncome) }}</div>
                      <div class="text-xs text-gray-500">{{ formatCurrency(manager.lastMonthIncome) }} last mo.</div>
                    </td>

                    <!-- Rating -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span class="ml-1 text-sm text-gray-900 font-semibold">{{ manager.averageRating.toFixed(1) }}</span>
                        <span class="ml-1 text-xs text-gray-500">({{ formatNumber(manager.totalReviews) }})</span>
                      </div>
                    </td>

                    <!-- Participants -->
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ formatNumber(manager.totalParticipants) }}
                    </td>

                    <!-- Actions -->
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <button [routerLink]="['/managers', manager.managerId]" class="text-primary-600 hover:text-primary-900 font-medium">
                        View Profile →
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Income History Section -->
        <div class="card mt-8">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-900">Manager Income History</h2>
            <p class="text-sm text-gray-600 mt-1">12-month revenue trends and performance comparison</p>
          </div>

          <div class="p-6">
            <!-- Manager Selector -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Select Manager to View History
              </label>
              <select
                [(ngModel)]="selectedManagerId"
                (change)="onManagerSelect()"
                class="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- Select a manager --</option>
                @for (manager of rankings(); track manager.managerId) {
                  <option [value]="manager.managerId">
                    #{{ manager.rank }} - {{ manager.managerName }} ({{ formatCurrency(manager.totalIncome) }})
                  </option>
                }
              </select>
            </div>

            <!-- Income History Content -->
            @if (selectedManagerId()) {
              <app-loading *ngIf="historyLoading()"></app-loading>

              @if (!historyLoading() && selectedManagerHistory()) {
                <!-- Stats Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <app-stats-card
                    title="Total Revenue"
                    [value]="formatCurrency(selectedManagerHistory()!.totalIncome)"
                    icon="currency"
                    color="green"
                    subtitle="All-time earnings"
                  />
                  <app-stats-card
                    title="Monthly Average"
                    [value]="formatCurrency(monthlyAverage())"
                    icon="chart"
                    color="blue"
                    subtitle="Average per month"
                  />
                  <app-stats-card
                    title="This Month"
                    [value]="formatCurrency(selectedManagerHistory()!.thisMonthIncome)"
                    icon="trending-up"
                    color="purple"
                    subtitle="Current month"
                  />
                  <app-stats-card
                    title="Growth Rate"
                    [value]="formatPercentage(selectedManagerHistory()!.growthRate)"
                    icon="trending-up"
                    [color]="selectedManagerHistory()!.growthRate >= 0 ? 'green' : 'red'"
                    subtitle="Month-over-month"
                    [trend]="{
                      value: selectedManagerHistory()!.growthRate,
                      direction: selectedManagerHistory()!.growthRate >= 0 ? 'up' : 'down',
                      label: 'vs last month'
                    }"
                  />
                </div>

                <!-- Income History Chart -->
                <div class="mb-6">
                  <app-line-chart [config]="incomeHistoryChart()" />
                </div>

                <!-- Performance Comparison -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Manager Stats -->
                  <div class="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Manager Performance
                    </h3>
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Rank Position</span>
                        <span class="text-lg font-bold text-blue-600">#{{ getManagerRank(selectedManagerId()) }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Performance Score</span>
                        <span class="text-lg font-bold text-blue-600">{{ getManagerScore(selectedManagerId()).toFixed(1) }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Payment Count</span>
                        <span class="text-lg font-bold text-blue-600">{{ selectedManagerHistory()!.paymentCount }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Avg Payment</span>
                        <span class="text-lg font-bold text-blue-600">{{ formatCurrency(selectedManagerHistory()!.averagePayment) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Platform Comparison -->
                  <div class="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                      vs Platform Average
                    </h3>
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Revenue Comparison</span>
                        <span class="text-lg font-bold" [class.text-green-600]="isAbovePlatformAverage()" [class.text-red-600]="!isAbovePlatformAverage()">
                          {{ isAbovePlatformAverage() ? '+' : '' }}{{ ((selectedManagerHistory()!.totalIncome - platformAverageIncome()) / platformAverageIncome() * 100).toFixed(1) }}%
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Platform Avg</span>
                        <span class="text-lg font-bold text-gray-700">{{ formatCurrency(platformAverageIncome()) }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Status</span>
                        <span class="px-3 py-1 rounded-full text-sm font-semibold"
                              [class.bg-green-100]="isAbovePlatformAverage()"
                              [class.text-green-800]="isAbovePlatformAverage()"
                              [class.bg-red-100]="!isAbovePlatformAverage()"
                              [class.text-red-800]="!isAbovePlatformAverage()">
                          {{ isAbovePlatformAverage() ? 'Above Average' : 'Below Average' }}
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Rank Percentile</span>
                        <span class="text-lg font-bold text-green-600">{{ getRankPercentile(selectedManagerId()).toFixed(0) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <div class="text-center py-12 bg-gray-50 rounded-lg">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <p class="text-gray-600">Select a manager to view their income history</p>
              </div>
            }
          </div>
        </div>
      }

      @if (!loading() && rankings().length === 0) {
        <div class="card text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <p class="text-gray-600 text-lg">No manager rankings available yet</p>
          <p class="text-gray-500 text-sm mt-2">Rankings will appear once managers organize travels and receive feedback</p>
        </div>
      }
    </div>
  `
})
export class ManagerRankingsComponent implements OnInit {
  rankings = signal<ManagerRanking[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  limit = signal<number | undefined>(undefined);

  // Income History Section
  selectedManagerId = signal<number | string>('');
  selectedManagerHistory = signal<ManagerIncomeBreakdown | null>(null);
  historyLoading = signal(false);

  // Computed values
  monthlyAverage = computed(() => {
    const history = this.selectedManagerHistory();
    if (!history || !history.monthlyHistory || history.monthlyHistory.length === 0) return 0;
    return history.totalIncome / history.monthlyHistory.length;
  });

  platformAverageIncome = computed(() => {
    const allRankings = this.rankings();
    if (allRankings.length === 0) return 0;
    const total = allRankings.reduce((sum, r) => sum + r.totalIncome, 0);
    return total / allRankings.length;
  });

  isAbovePlatformAverage = computed(() => {
    const history = this.selectedManagerHistory();
    if (!history) return false;
    return history.totalIncome > this.platformAverageIncome();
  });

  incomeHistoryChart = computed<LineChartConfig>(() => {
    const history = this.selectedManagerHistory();
    if (!history || !history.monthlyHistory) {
      return { labels: [], datasets: [], title: 'Income History (Last 12 Months)' };
    }

    return {
      labels: history.monthlyHistory.map(m => m.month),
      datasets: [{
        label: 'Monthly Income',
        data: history.monthlyHistory.map(m => m.income),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }],
      title: 'Income History (Last 12 Months)',
      yAxisLabel: 'Income ($)',
      height: 300
    };
  });

  constructor(
    private adminService: AdminService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadRankings();
  }

  loadRankings(): void {
    this.loading.set(true);
    this.adminService.getManagerRankings(this.limit()).subscribe({
      next: (data) => {
        this.rankings.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load manager rankings. Please try again later.');
        this.loading.set(false);
        console.error('Error loading rankings:', err);
      }
    });
  }

  onManagerSelect(): void {
    const managerId = this.selectedManagerId();
    if (!managerId) {
      this.selectedManagerHistory.set(null);
      return;
    }

    this.historyLoading.set(true);
    this.adminService.getManagerIncomeHistory(Number(managerId)).subscribe({
      next: (history) => {
        this.selectedManagerHistory.set(history);
        this.historyLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading manager history:', err);
        this.historyLoading.set(false);
        this.error.set('Failed to load manager income history');
      }
    });
  }

  getManagerRank(managerId: number | string): number {
    const manager = this.rankings().find(r => r.managerId === Number(managerId));
    return manager?.rank || 0;
  }

  getManagerScore(managerId: number | string): number {
    const manager = this.rankings().find(r => r.managerId === Number(managerId));
    return manager?.performanceScore || 0;
  }

  getRankPercentile(managerId: number | string): number {
    const rank = this.getManagerRank(managerId);
    const totalManagers = this.rankings().length;
    if (totalManagers === 0) return 0;
    return ((totalManagers - rank + 1) / totalManagers) * 100;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  getPerformanceBadge(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getRankBadge(rank: number): string {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-gray-200 text-gray-700';
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  exportToCSV(): void {
    const exportData = this.rankings().map(r => ({
      rank: r.rank,
      managerName: r.managerName,
      email: r.email,
      performanceScore: r.performanceScore.toFixed(1),
      totalIncome: r.totalIncome,
      lastMonthIncome: r.lastMonthIncome,
      totalTravelsOrganized: r.totalTravelsOrganized,
      completedTravels: r.completedTravels,
      averageRating: r.averageRating.toFixed(1),
      totalReviews: r.totalReviews,
      totalParticipants: r.totalParticipants,
      reportsReceived: r.reportsReceived
    }));

    const columns = [
      { key: 'rank' as const, label: 'Rank' },
      { key: 'managerName' as const, label: 'Manager Name' },
      { key: 'email' as const, label: 'Email' },
      { key: 'performanceScore' as const, label: 'Performance Score' },
      { key: 'totalIncome' as const, label: 'Total Income' },
      { key: 'lastMonthIncome' as const, label: 'Last Month Income' },
      { key: 'totalTravelsOrganized' as const, label: 'Total Travels' },
      { key: 'completedTravels' as const, label: 'Completed Travels' },
      { key: 'averageRating' as const, label: 'Average Rating' },
      { key: 'totalReviews' as const, label: 'Total Reviews' },
      { key: 'totalParticipants' as const, label: 'Total Participants' },
      { key: 'reportsReceived' as const, label: 'Reports Received' }
    ];

    this.exportService.exportToCSV(
      exportData,
      `manager-rankings-${new Date().toISOString().split('T')[0]}`,
      columns
    );
  }

  exportToPDF(): void {
    const exportData = this.rankings().map(r => ({
      rank: r.rank,
      managerName: r.managerName,
      performanceScore: r.performanceScore.toFixed(1),
      totalIncome: this.formatCurrency(r.totalIncome),
      totalTravels: r.totalTravelsOrganized,
      averageRating: r.averageRating.toFixed(1),
      totalParticipants: r.totalParticipants
    }));

    const columns = [
      { key: 'rank' as const, label: 'Rank' },
      { key: 'managerName' as const, label: 'Manager Name' },
      { key: 'performanceScore' as const, label: 'Score' },
      { key: 'totalIncome' as const, label: 'Total Income' },
      { key: 'totalTravels' as const, label: 'Travels' },
      { key: 'averageRating' as const, label: 'Rating' },
      { key: 'totalParticipants' as const, label: 'Participants' }
    ];

    this.exportService.exportToPDF(
      exportData,
      `manager-rankings-${new Date().toISOString().split('T')[0]}`,
      'Manager Rankings Report',
      columns
    );
  }
}
