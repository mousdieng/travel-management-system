import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ManagerService } from '../../../core/services/manager.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { TravelDetailedStats, SubscriberProfile } from '../../../core/models/manager.model';

@Component({
  selector: 'app-travel-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './travel-detail.component.html'
})
export class TravelDetailComponent implements OnInit {
  private managerService = inject(ManagerService);
  private route = inject(ActivatedRoute);
  private confirmDialog = inject(ConfirmDialogService);

  travelId = signal<number>(0);
  stats = signal<TravelDetailedStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  selectedTab = signal<'overview' | 'subscribers' | 'feedbacks'>('overview');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.travelId.set(+id);
      this.loadTravelStats();
    }
  }

  loadTravelStats() {
    this.loading.set(true);
    this.managerService.getTravelStats(this.travelId()).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load travel statistics');
        this.loading.set(false);
        console.error('Error loading travel stats:', err);
      }
    });
  }

  removeSubscriber(subscriptionId: number) {
    this.confirmDialog.confirmDelete('this subscriber').subscribe(confirmed => {
      if (confirmed) {
        this.managerService.removeSubscriber(this.travelId(), subscriptionId).subscribe({
          next: () => {
            this.loadTravelStats();
          },
          error: (err) => {
            this.confirmDialog.error('Remove Failed', 'Failed to remove subscriber. Please try again.');
            console.error('Error removing subscriber:', err);
          }
        });
      }
    });
  }

  setTab(tab: 'overview' | 'subscribers' | 'feedbacks') {
    this.selectedTab.set(tab);
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPaymentBadge(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStarPercentage(count: number, total: number): number {
    return total > 0 ? (count / total) * 100 : 0;
  }

  getRatingStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }
}
