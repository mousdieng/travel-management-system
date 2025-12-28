import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ManagerService } from '../../../core/services/manager.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { Travel } from '../../../core/models/travel.model';

@Component({
  selector: 'app-manager-travels',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manager-travels.component.html'
})
export class ManagerTravelsComponent implements OnInit {
  private managerService = inject(ManagerService);
  private confirmDialog = inject(ConfirmDialogService);

  travels = signal<Travel[]>([]);
  filteredTravels = signal<Travel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  selectedFilter = signal<'all' | 'active' | 'upcoming' | 'completed'>('all');

  ngOnInit() {
    this.loadTravels();
  }

  loadTravels() {
    this.loading.set(true);
    this.managerService.getMyTravels().subscribe({
      next: (data) => {
        this.travels.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load travels');
        this.loading.set(false);
        console.error('Error loading travels:', err);
      }
    });
  }

  applyFilter() {
    const filter = this.selectedFilter();
    const travels = this.travels();

    if (filter === 'all') {
      this.filteredTravels.set(travels);
    } else if (filter === 'active') {
      this.filteredTravels.set(travels.filter(t => t.active));
    } else if (filter === 'upcoming') {
      this.filteredTravels.set(travels.filter(t => this.isUpcoming(t)));
    } else if (filter === 'completed') {
      this.filteredTravels.set(travels.filter(t => this.isCompleted(t)));
    }
  }

  setFilter(filter: 'all' | 'active' | 'upcoming' | 'completed') {
    this.selectedFilter.set(filter);
    this.applyFilter();
  }

  isUpcoming(travel: Travel): boolean {
    return new Date(travel.startDate) > new Date();
  }

  isCompleted(travel: Travel): boolean {
    return new Date(travel.endDate) < new Date();
  }

  deleteTravel(id: number) {
    this.confirmDialog.confirmDelete('this travel').subscribe(confirmed => {
      if (confirmed) {
        this.managerService.deleteTravel(id).subscribe({
          next: () => {
            this.loadTravels();
          },
          error: (err) => {
            this.confirmDialog.error('Delete Failed', 'Failed to delete travel. Please try again.');
            console.error('Error deleting travel:', err);
          }
        });
      }
    });
  }

  getStatusBadge(travel: Travel): string {
    if (!travel.active) return 'bg-gray-100 text-gray-800';
    if (this.isCompleted(travel)) return 'bg-blue-100 text-blue-800';
    if (this.isUpcoming(travel)) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  getStatusText(travel: Travel): string {
    if (!travel.active) return 'Inactive';
    if (this.isCompleted(travel)) return 'Completed';
    if (this.isUpcoming(travel)) return 'Upcoming';
    return 'Ongoing';
  }

  getOccupancyClass(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }
}
