import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';

import { Destination } from '../../../shared/models/destination.model';
import { DestinationService } from '../../../core/services/destination.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';
import { DestinationFormComponent } from '../destination-form/destination-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-destination-list',
  template: `
    <div class="destinations-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Destination Management</h1>
          <p>Manage travel destinations, locations, and points of interest</p>
        </div>
        <div class="header-actions">
          <button
            mat-raised-button
            color="primary"
            (click)="createDestination()"
            [disabled]="isLoading">
            <mat-icon>add_location</mat-icon>
            Add Destination
          </button>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search destinations</mat-label>
              <input
                matInput
                [formControl]="searchControl"
                placeholder="Name, country, city...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Country</mat-label>
              <mat-select [formControl]="countryControl">
                <mat-option value="">All Countries</mat-option>
                <mat-option *ngFor="let country of countries" [value]="country">
                  {{ country }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusControl">
                <mat-option value="">All Status</mat-option>
                <mat-option value="active">Active</mat-option>
                <mat-option value="inactive">Inactive</mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-stroked-button
              color="warn"
              [disabled]="selection.isEmpty()"
              (click)="bulkDelete()">
              <mat-icon>delete</mat-icon>
              Delete Selected ({{ selection.selected.length }})
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Destinations Table -->
      <mat-card class="destinations-card">
        <mat-card-header>
          <mat-card-title>All Destinations</mat-card-title>
          <mat-card-subtitle>{{ dataSource.data.length }} destinations found</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="destinations-table">
              <!-- Checkbox Column -->
              <ng-container matColumnDef="select">
                <th mat-header-cell *matHeaderCellDef>
                  <mat-checkbox
                    (change)="$event ? toggleAllRows() : null"
                    [checked]="selection.hasValue() && isAllSelected()"
                    [indeterminate]="selection.hasValue() && !isAllSelected()">
                  </mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let row">
                  <mat-checkbox
                    (click)="$event.stopPropagation()"
                    (change)="$event ? selection.toggle(row) : null"
                    [checked]="selection.isSelected(row)">
                  </mat-checkbox>
                </td>
              </ng-container>

              <!-- Image Column -->
              <ng-container matColumnDef="image">
                <th mat-header-cell *matHeaderCellDef>Image</th>
                <td mat-cell *matCellDef="let destination">
                  <div class="destination-image">
                    <img
                      [src]="destination.image || '/assets/placeholder-destination.jpg'"
                      [alt]="destination.name"
                      class="dest-image">
                  </div>
                </td>
              </ng-container>

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                <td mat-cell *matCellDef="let destination">
                  <div class="destination-info">
                    <div class="destination-name">{{ destination.name }}</div>
                    <div class="destination-location">
                      {{ destination.city }}, {{ destination.country }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Location Column -->
              <ng-container matColumnDef="location">
                <th mat-header-cell *matHeaderCellDef>Location</th>
                <td mat-cell *matCellDef="let destination">
                  <div class="location-info">
                    <div>{{ destination.region || destination.state }}</div>
                    <div class="coordinates" *ngIf="destination.latitude && destination.longitude">
                      {{ destination.latitude | number:'1.4-4' }},
                      {{ destination.longitude | number:'1.4-4' }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Climate Column -->
              <ng-container matColumnDef="climate">
                <th mat-header-cell *matHeaderCellDef>Climate</th>
                <td mat-cell *matCellDef="let destination">
                  <mat-chip-set>
                    <mat-chip class="climate-chip">{{ destination.climate | titlecase }}</mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Best Season Column -->
              <ng-container matColumnDef="bestSeason">
                <th mat-header-cell *matHeaderCellDef>Best Season</th>
                <td mat-cell *matCellDef="let destination">
                  {{ destination.bestTimeToVisit || 'Year round' }}
                </td>
              </ng-container>

              <!-- Language Column -->
              <ng-container matColumnDef="language">
                <th mat-header-cell *matHeaderCellDef>Languages</th>
                <td mat-cell *matCellDef="let destination">
                  <mat-chip-set>
                    <mat-chip *ngFor="let lang of (destination.languages || []).slice(0, 2)">
                      {{ lang }}
                    </mat-chip>
                    <mat-chip *ngIf="(destination.languages || []).length > 2">
                      +{{ (destination.languages || []).length - 2 }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                <td mat-cell *matCellDef="let destination">
                  <mat-chip [color]="destination.isActive ? 'primary' : ''">
                    {{ destination.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Created Date Column -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                <td mat-cell *matCellDef="let destination">
                  {{ destination.createdAt | date:'mediumDate' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let destination">
                  <button
                    mat-icon-button
                    [matMenuTriggerFor]="destinationMenu"
                    [matMenuTriggerData]="{destination: destination}">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: displayedColumns;"
                class="destination-row"
                (click)="viewDestination(row)">
              </tr>
            </table>

            <!-- Loading state -->
            <div *ngIf="isLoading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading destinations...</p>
            </div>

            <!-- Empty state -->
            <div *ngIf="dataSource.data.length === 0 && !isLoading" class="empty-state">
              <mat-icon class="empty-icon">location_on</mat-icon>
              <h3>No destinations found</h3>
              <p>Get started by adding your first destination.</p>
              <button
                mat-raised-button
                color="primary"
                (click)="createDestination()">
                <mat-icon>add_location</mat-icon>
                Add Destination
              </button>
            </div>
          </div>

          <mat-paginator
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageSize]="25"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>

      <!-- Destination actions menu -->
      <mat-menu #destinationMenu="matMenu">
        <ng-template matMenuContent let-destination="destination">
          <button mat-menu-item (click)="viewDestination(destination)">
            <mat-icon>visibility</mat-icon>
            <span>View Details</span>
          </button>
          <button mat-menu-item (click)="editDestination(destination)">
            <mat-icon>edit</mat-icon>
            <span>Edit Destination</span>
          </button>
          <button mat-menu-item (click)="toggleDestinationStatus(destination)">
            <mat-icon>{{ destination.isActive ? 'block' : 'check_circle' }}</mat-icon>
            <span>{{ destination.isActive ? 'Deactivate' : 'Activate' }}</span>
          </button>
          <mat-divider></mat-divider>
          <button
            mat-menu-item
            class="danger-item"
            (click)="deleteDestination(destination)">
            <mat-icon>delete</mat-icon>
            <span>Delete Destination</span>
          </button>
        </ng-template>
      </mat-menu>
    </div>
  `,
  styles: [`
    .destinations-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 500;
      color: #333;
    }

    .header-content p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 300px;
    }

    .destinations-card {
      margin-bottom: 24px;
    }

    .table-container {
      overflow-x: auto;
      min-height: 400px;
      position: relative;
    }

    .destinations-table {
      width: 100%;
      min-width: 1000px;
    }

    .destination-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .destination-row:hover {
      background-color: #f5f5f5;
    }

    .destination-image {
      width: 60px;
      height: 40px;
      border-radius: 4px;
      overflow: hidden;
    }

    .dest-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .destination-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .destination-name {
      font-weight: 500;
      color: #333;
    }

    .destination-location {
      font-size: 12px;
      color: #666;
    }

    .location-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .coordinates {
      font-size: 11px;
      color: #999;
      font-family: monospace;
    }

    .climate-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .loading-container,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: #666;
    }

    .danger-item {
      color: #f44336;
    }

    /* Dark theme support */
    :host-context(.dark-theme) .header-content h1 {
      color: #fff;
    }

    :host-context(.dark-theme) .header-content p {
      color: #ccc;
    }

    :host-context(.dark-theme) .destination-name {
      color: #fff;
    }

    :host-context(.dark-theme) .destination-location {
      color: #ccc;
    }

    :host-context(.dark-theme) .destination-row:hover {
      background-color: #333;
    }

    :host-context(.dark-theme) .empty-state h3 {
      color: #fff;
    }

    :host-context(.dark-theme) .empty-state p {
      color: #ccc;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .destinations-container {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-content h1 {
        font-size: 24px;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field {
        min-width: auto;
        width: 100%;
      }

      .table-container {
        margin-left: -16px;
        margin-right: -16px;
        padding: 0 16px;
      }
    }
  `]
})
export class DestinationListComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'select',
    'image',
    'name',
    'location',
    'climate',
    'bestSeason',
    'language',
    'status',
    'createdAt',
    'actions'
  ];

  dataSource = new MatTableDataSource<Destination>([]);
  selection = new SelectionModel<Destination>(true, []);
  isLoading = false;

  // Filter controls
  searchControl = new FormControl('');
  countryControl = new FormControl('');
  statusControl = new FormControl('');

  countries: string[] = [];

  constructor(
    private destinationService: DestinationService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDestinations();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());

    this.countryControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());

    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());
  }

  loadDestinations(): void {
    this.isLoading = true;

    this.destinationService.getDestinations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (destinations) => {
          this.dataSource.data = destinations;
          this.countries = [...new Set(destinations.map(d => d.country))].sort();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.showError('Failed to load destinations');
        }
      });
  }

  applyFilter(): void {
    const searchValue = this.searchControl.value?.toLowerCase() || '';
    const countryValue = this.countryControl.value || '';
    const statusValue = this.statusControl.value || '';

    this.dataSource.filterPredicate = (destination: Destination) => {
      const matchesSearch = !searchValue ||
        destination.name.toLowerCase().includes(searchValue) ||
        destination.city.toLowerCase().includes(searchValue) ||
        destination.country.toLowerCase().includes(searchValue) ||
        (destination.description || '').toLowerCase().includes(searchValue);

      const matchesCountry = !countryValue || destination.country === countryValue;

      const matchesStatus = !statusValue ||
        (statusValue === 'active' && destination.isActive) ||
        (statusValue === 'inactive' && !destination.isActive);

      return matchesSearch && matchesCountry && matchesStatus;
    };

    this.dataSource.filter = 'trigger';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  createDestination(): void {
    const dialogRef = this.dialog.open(DestinationFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { destination: null }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadDestinations();
          this.notificationService.showSuccess('Destination created successfully');
        }
      });
  }

  viewDestination(destination: Destination): void {
    const dialogRef = this.dialog.open(DestinationFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { destination, readonly: true }
    });
  }

  editDestination(destination: Destination): void {
    const dialogRef = this.dialog.open(DestinationFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { destination }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadDestinations();
          this.notificationService.showSuccess('Destination updated successfully');
        }
      });
  }

  deleteDestination(destination: Destination): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Destination',
        message: `Are you sure you want to delete "${destination.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.destinationService.deleteDestination(destination.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadDestinations();
                this.notificationService.showSuccess('Destination deleted successfully');
              },
              error: (error) => {
                this.notificationService.showError('Failed to delete destination');
              }
            });
        }
      });
  }

  bulkDelete(): void {
    const selectedDestinations = this.selection.selected;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Multiple Destinations',
        message: `Are you sure you want to delete ${selectedDestinations.length} selected destinations? This action cannot be undone.`,
        confirmText: 'Delete All',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          const deletePromises = selectedDestinations.map(destination =>
            this.destinationService.deleteDestination(destination.id).toPromise()
          );

          Promise.all(deletePromises)
            .then(() => {
              this.selection.clear();
              this.loadDestinations();
              this.notificationService.showSuccess(`${selectedDestinations.length} destinations deleted successfully`);
            })
            .catch(() => {
              this.notificationService.showError('Failed to delete some destinations');
            });
        }
      });
  }

  toggleDestinationStatus(destination: Destination): void {
    const action = destination.isActive ? 'deactivate' : 'activate';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} Destination`,
        message: `Are you sure you want to ${action} "${destination.name}"?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.destinationService.updateDestination(destination.id, { isActive: !destination.isActive })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadDestinations();
                this.notificationService.showSuccess(`Destination ${action}d successfully`);
              },
              error: () => {
                this.notificationService.showError(`Failed to ${action} destination`);
              }
            });
        }
      });
  }
}