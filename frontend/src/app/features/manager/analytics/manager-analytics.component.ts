import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ManagerService } from '../../../core/services/manager.service';
import { ManagerAnalytics, TravelPerformance, MonthlyIncome, CategoryStats } from '../../../core/models/manager.model';

@Component({
  selector: 'app-manager-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Analytics Dashboard</h1>
        <p class="page-subtitle">Comprehensive overview of your travel management performance</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading analytics...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <p class="text-red-500">{{ error }}</p>
        <button (click)="loadAnalytics()" class="btn btn-primary mt-4">Retry</button>
      </div>

      <!-- Analytics Content -->
      <div *ngIf="!loading && !error && analytics" class="analytics-content">

        <!-- Performance Score Card -->
        <div class="performance-card">
          <div class="performance-header">
            <h2>Performance Score</h2>
            <span class="trend-badge" [ngClass]="{
              'trend-up': analytics.performanceTrend === 'IMPROVING',
              'trend-down': analytics.performanceTrend === 'DECLINING',
              'trend-stable': analytics.performanceTrend === 'STABLE'
            }">
              <span *ngIf="analytics.performanceTrend === 'IMPROVING'">+</span>
              <span *ngIf="analytics.performanceTrend === 'DECLINING'">-</span>
              {{ analytics.trendPercentage | number:'1.1-1' }}%
            </span>
          </div>
          <div class="performance-score">
            <div class="score-circle" [style.--score]="analytics.performanceScore">
              <span class="score-value">{{ analytics.performanceScore | number:'1.0-0' }}</span>
              <span class="score-label">/ 100</span>
            </div>
            <div class="score-breakdown">
              <p class="breakdown-item">
                <span class="label">Rating Impact:</span>
                <span class="value">{{ (analytics.averageRating * 15) | number:'1.1-1' }} pts</span>
              </p>
              <p class="breakdown-item">
                <span class="label">Participants:</span>
                <span class="value">+{{ (analytics.totalParticipants * 0.3) | number:'1.1-1' }} pts</span>
              </p>
              <p class="breakdown-item">
                <span class="label">Completed:</span>
                <span class="value">+{{ analytics.completedTravels * 5 }} pts</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Key Metrics Grid -->
        <div class="metrics-grid">
          <!-- Travel Stats -->
          <div class="metric-card">
            <div class="metric-icon travels">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64" />
              </svg>
            </div>
            <div class="metric-content">
              <p class="metric-label">Total Travels</p>
              <p class="metric-value">{{ analytics.totalTravels }}</p>
              <div class="metric-breakdown">
                <span class="active">{{ analytics.activeTravels }} Active</span>
                <span class="separator">|</span>
                <span class="completed">{{ analytics.completedTravels }} Completed</span>
              </div>
            </div>
          </div>

          <!-- Income Stats -->
          <div class="metric-card">
            <div class="metric-icon income">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="metric-content">
              <p class="metric-label">Total Income</p>
              <p class="metric-value">\${{ analytics.totalIncome | number:'1.2-2' }}</p>
              <div class="metric-breakdown">
                <span [class.positive]="analytics.thisMonthIncome >= analytics.lastMonthIncome"
                      [class.negative]="analytics.thisMonthIncome < analytics.lastMonthIncome">
                  This month: \${{ analytics.thisMonthIncome | number:'1.0-0' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Participants Stats -->
          <div class="metric-card">
            <div class="metric-icon participants">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div class="metric-content">
              <p class="metric-label">Total Participants</p>
              <p class="metric-value">{{ analytics.totalParticipants }}</p>
              <div class="metric-breakdown">
                <span>{{ analytics.activeSubscribers }} Active subscribers</span>
              </div>
            </div>
          </div>

          <!-- Rating Stats -->
          <div class="metric-card">
            <div class="metric-icon rating">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div class="metric-content">
              <p class="metric-label">Average Rating</p>
              <p class="metric-value">{{ analytics.averageRating | number:'1.1-1' }} <span class="metric-suffix">/5</span></p>
              <div class="metric-breakdown">
                <span>{{ analytics.totalFeedbacks }} Reviews</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Monthly Income Chart -->
          <div class="chart-card">
            <h3 class="chart-title">Monthly Income</h3>
            <div class="bar-chart">
              <div *ngFor="let month of analytics.monthlyIncomeBreakdown; let i = index"
                   class="bar-container"
                   [style.--bar-height]="getBarHeight(month.income)">
                <div class="bar" [title]="'\$' + month.income"></div>
                <span class="bar-label">{{ month.month.substring(0, 3) }}</span>
              </div>
            </div>
            <div class="chart-legend">
              <p>Last 12 months income trend</p>
            </div>
          </div>

          <!-- Rating Distribution -->
          <div class="chart-card">
            <h3 class="chart-title">Rating Distribution</h3>
            <div class="rating-distribution">
              <div class="rating-row">
                <span class="rating-label">5 stars</span>
                <div class="rating-bar-container">
                  <div class="rating-bar" [style.width]="getRatingPercentage(analytics.fiveStarCount) + '%'"></div>
                </div>
                <span class="rating-count">{{ analytics.fiveStarCount }}</span>
              </div>
              <div class="rating-row">
                <span class="rating-label">4 stars</span>
                <div class="rating-bar-container">
                  <div class="rating-bar" [style.width]="getRatingPercentage(analytics.fourStarCount) + '%'"></div>
                </div>
                <span class="rating-count">{{ analytics.fourStarCount }}</span>
              </div>
              <div class="rating-row">
                <span class="rating-label">3 stars</span>
                <div class="rating-bar-container">
                  <div class="rating-bar" [style.width]="getRatingPercentage(analytics.threeStarCount) + '%'"></div>
                </div>
                <span class="rating-count">{{ analytics.threeStarCount }}</span>
              </div>
              <div class="rating-row">
                <span class="rating-label">2 stars</span>
                <div class="rating-bar-container">
                  <div class="rating-bar warning" [style.width]="getRatingPercentage(analytics.twoStarCount) + '%'"></div>
                </div>
                <span class="rating-count">{{ analytics.twoStarCount }}</span>
              </div>
              <div class="rating-row">
                <span class="rating-label">1 star</span>
                <div class="rating-bar-container">
                  <div class="rating-bar danger" [style.width]="getRatingPercentage(analytics.oneStarCount) + '%'"></div>
                </div>
                <span class="rating-count">{{ analytics.oneStarCount }}</span>
              </div>
            </div>
          </div>

          <!-- Category Breakdown -->
          <div class="chart-card">
            <h3 class="chart-title">Travels by Category</h3>
            <div class="category-breakdown">
              <div *ngFor="let cat of analytics.categoryBreakdown" class="category-item">
                <div class="category-info">
                  <span class="category-name">{{ cat.category }}</span>
                  <span class="category-count">{{ cat.travelCount }} travels</span>
                </div>
                <div class="category-bar-container">
                  <div class="category-bar" [style.width]="getCategoryPercentage(cat.travelCount) + '%'"></div>
                </div>
              </div>
              <div *ngIf="analytics.categoryBreakdown.length === 0" class="no-data">
                <p>No category data available</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Performing Travels -->
        <div class="top-travels-section">
          <h3 class="section-title">Top Performing Travels</h3>
          <div class="travels-table">
            <table>
              <thead>
                <tr>
                  <th>Travel</th>
                  <th>Destination</th>
                  <th>Revenue</th>
                  <th>Participants</th>
                  <th>Rating</th>
                  <th>Occupancy</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let travel of analytics.topTravels">
                  <td>
                    <a [routerLink]="['/manager/travels', travel.travelId]" class="travel-link">
                      {{ travel.title }}
                    </a>
                  </td>
                  <td>{{ travel.destination }}</td>
                  <td class="revenue">\${{ travel.totalRevenue | number:'1.0-0' }}</td>
                  <td>{{ travel.participantCount }}</td>
                  <td>
                    <span class="rating-badge">
                      {{ travel.averageRating | number:'1.1-1' }}
                    </span>
                  </td>
                  <td>
                    <div class="occupancy-bar">
                      <div class="occupancy-fill" [style.width]="travel.occupancyRate + '%'"
                           [ngClass]="{
                             'high': travel.occupancyRate >= 80,
                             'medium': travel.occupancyRate >= 50 && travel.occupancyRate < 80,
                             'low': travel.occupancyRate < 50
                           }"></div>
                      <span class="occupancy-text">{{ travel.occupancyRate | number:'1.0-0' }}%</span>
                    </div>
                  </td>
                  <td>
                    <span class="score-badge" [ngClass]="{
                      'excellent': travel.performanceScore >= 80,
                      'good': travel.performanceScore >= 60 && travel.performanceScore < 80,
                      'average': travel.performanceScore < 60
                    }">
                      {{ travel.performanceScore | number:'1.0-0' }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="analytics.topTravels.length === 0">
                  <td colspan="7" class="no-data">No travel data available yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="additional-stats">
          <div class="stat-card">
            <h4>Average Income per Travel</h4>
            <p class="stat-value">\${{ analytics.averageIncomePerTravel | number:'1.0-0' }}</p>
          </div>
          <div class="stat-card">
            <h4>Average Participants per Travel</h4>
            <p class="stat-value">{{ analytics.averageParticipantsPerTravel | number:'1.1-1' }}</p>
          </div>
          <div class="stat-card">
            <h4>Average Occupancy Rate</h4>
            <p class="stat-value">{{ analytics.averageOccupancyRate | number:'1.0-0' }}%</p>
          </div>
          <div class="stat-card">
            <h4>Upcoming Travels</h4>
            <p class="stat-value">{{ analytics.upcomingTravels }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1f2937;
    }

    .page-subtitle {
      color: #6b7280;
      margin-top: 0.5rem;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .analytics-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Performance Card */
    .performance-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 1rem;
      padding: 1.5rem;
      color: white;
    }

    .performance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .performance-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .trend-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .trend-up { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .trend-down { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .trend-stable { background: rgba(255, 255, 255, 0.2); }

    .performance-score {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 4px solid rgba(255, 255, 255, 0.3);
    }

    .score-value {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .score-label {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .score-breakdown {
      flex: 1;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon svg {
      width: 24px;
      height: 24px;
    }

    .metric-icon.travels { background: #dbeafe; color: #2563eb; }
    .metric-icon.income { background: #d1fae5; color: #059669; }
    .metric-icon.participants { background: #fef3c7; color: #d97706; }
    .metric-icon.rating { background: #fce7f3; color: #db2777; }

    .metric-content { flex: 1; }
    .metric-label { font-size: 0.875rem; color: #6b7280; }
    .metric-value { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
    .metric-suffix { font-size: 1rem; color: #9ca3af; }
    .metric-breakdown { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }
    .metric-breakdown .positive { color: #10b981; }
    .metric-breakdown .negative { color: #ef4444; }
    .separator { margin: 0 0.5rem; }

    /* Charts Row */
    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .chart-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .chart-title {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
    }

    /* Bar Chart */
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 150px;
      padding-bottom: 1.5rem;
    }

    .bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .bar {
      width: 100%;
      max-width: 30px;
      background: linear-gradient(to top, #3b82f6, #60a5fa);
      border-radius: 0.25rem 0.25rem 0 0;
      height: var(--bar-height, 0%);
      min-height: 4px;
      transition: height 0.3s ease;
    }

    .bar-label {
      font-size: 0.625rem;
      color: #9ca3af;
      margin-top: 0.5rem;
    }

    .chart-legend {
      text-align: center;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Rating Distribution */
    .rating-distribution {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .rating-label {
      width: 60px;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .rating-bar-container {
      flex: 1;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .rating-bar {
      height: 100%;
      background: #10b981;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .rating-bar.warning { background: #f59e0b; }
    .rating-bar.danger { background: #ef4444; }

    .rating-count {
      width: 30px;
      text-align: right;
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Category Breakdown */
    .category-breakdown {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .category-info {
      display: flex;
      justify-content: space-between;
    }

    .category-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .category-count {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .category-bar-container {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .category-bar {
      height: 100%;
      background: linear-gradient(to right, #8b5cf6, #a78bfa);
      border-radius: 4px;
    }

    /* Top Travels Section */
    .top-travels-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
    }

    .travels-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    td {
      font-size: 0.875rem;
      color: #374151;
    }

    .travel-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .travel-link:hover {
      text-decoration: underline;
    }

    .revenue {
      color: #059669;
      font-weight: 500;
    }

    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: #fef3c7;
      color: #d97706;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .occupancy-bar {
      position: relative;
      height: 20px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      min-width: 80px;
    }

    .occupancy-fill {
      height: 100%;
      border-radius: 4px;
    }

    .occupancy-fill.high { background: #10b981; }
    .occupancy-fill.medium { background: #f59e0b; }
    .occupancy-fill.low { background: #ef4444; }

    .occupancy-text {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
    }

    .score-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .score-badge.excellent { background: #d1fae5; color: #059669; }
    .score-badge.good { background: #dbeafe; color: #2563eb; }
    .score-badge.average { background: #fef3c7; color: #d97706; }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;
    }

    /* Additional Stats */
    .additional-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-card h4 {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .stat-card .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 1rem;
      }

      .performance-score {
        flex-direction: column;
        text-align: center;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .charts-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ManagerAnalyticsComponent implements OnInit {
  private managerService = inject(ManagerService);

  analytics: ManagerAnalytics | null = null;
  loading = true;
  error: string | null = null;

  private maxIncome = 0;
  private totalRatings = 0;
  private maxCategoryCount = 0;

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;

    this.managerService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.calculateMaxValues();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load analytics:', err);
        this.error = 'Failed to load analytics. Please try again.';
        this.loading = false;
      }
    });
  }

  private calculateMaxValues(): void {
    if (!this.analytics) return;

    // Calculate max income for bar chart
    this.maxIncome = Math.max(
      ...this.analytics.monthlyIncomeBreakdown.map(m => m.income),
      1
    );

    // Calculate total ratings
    this.totalRatings =
      this.analytics.fiveStarCount +
      this.analytics.fourStarCount +
      this.analytics.threeStarCount +
      this.analytics.twoStarCount +
      this.analytics.oneStarCount;

    // Calculate max category count
    this.maxCategoryCount = Math.max(
      ...this.analytics.categoryBreakdown.map(c => c.travelCount),
      1
    );
  }

  getBarHeight(income: number): string {
    const percentage = this.maxIncome > 0 ? (income / this.maxIncome) * 100 : 0;
    return `${Math.max(percentage, 2)}%`;
  }

  getRatingPercentage(count: number): number {
    return this.totalRatings > 0 ? (count / this.totalRatings) * 100 : 0;
  }

  getCategoryPercentage(count: number): number {
    return this.maxCategoryCount > 0 ? (count / this.maxCategoryCount) * 100 : 0;
  }
}
