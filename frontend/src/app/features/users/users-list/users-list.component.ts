import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';

import { User, UpdateUserRequest, UserStatus } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';
import { UserFormComponent } from '../user-form/user-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-list',
  template: `
    <div class="users-list-container">
      <div class="page-header">
        <div class="header-content">
          <h1>User Management</h1>
          <p>Manage users, roles, and permissions</p>
        </div>
        <div class="header-actions">
          <button
            mat-raised-button
            color="primary"
            (click)="createUser()"
            *appPermission="['users:create']">
            <mat-icon>add</mat-icon>
            Add User
          </button>
        </div>
      </div>

      <mat-card class="users-card">
        <mat-card-header>
          <mat-card-title>All Users</mat-card-title>
          <mat-card-subtitle>{{ dataSource.data.length }} users found</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Search and filters -->
          <div class="filters-section">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search users</mat-label>
              <input
                matInput
                placeholder="Search by name, email, or phone"
                (keyup)="applyFilter($event)"
                #searchInput>
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Filter by status</mat-label>
              <mat-select (selectionChange)="filterByStatus($event.value)">
                <mat-option value="">All</mat-option>
                <mat-option value="ACTIVE">Active</mat-option>
                <mat-option value="INACTIVE">Inactive</mat-option>
                <mat-option value="SUSPENDED">Suspended</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Filter by role</mat-label>
              <mat-select (selectionChange)="filterByRole($event.value)">
                <mat-option value="">All</mat-option>
                <mat-option value="ADMIN">Admin</mat-option>
                <mat-option value="MANAGER">Manager</mat-option>
                <mat-option value="TRAVEL_AGENT">Travel Agent</mat-option>
                <mat-option value="USER">User</mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-stroked-button
              color="warn"
              [disabled]="selection.isEmpty()"
              (click)="bulkDelete()"
              *appPermission="['users:delete']">
              <mat-icon>delete</mat-icon>
              Delete Selected ({{ selection.selected.length }})
            </button>
          </div>

          <!-- Users table -->
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="users-table">
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

              <!-- Avatar Column -->
              <ng-container matColumnDef="avatar">
                <th mat-header-cell *matHeaderCellDef>Avatar</th>
                <td mat-cell *matCellDef="let user">
                  <app-avatar
                    [src]="user.profilePicture"
                    [name]="user.firstName + ' ' + user.lastName"
                    size="small">
                  </app-avatar>
                </td>
              </ng-container>

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-name-cell">
                    <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Phone Column -->
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Phone</th>
                <td mat-cell *matCellDef="let user">{{ user.phoneNumber || '-' }}</td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip-set>
                    <mat-chip *ngFor="let role of user.roles" [color]="getRoleColor(role.name)">
                      {{ role.name }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [color]="getStatusColor(user.status)">
                    {{ user.status }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Created Date Column -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.createdAt | date:'mediumDate' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button
                    mat-icon-button
                    [matMenuTriggerFor]="userMenu"
                    [matMenuTriggerData]="{user: user}">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: displayedColumns;"
                class="user-row"
                (click)="viewUser(row)">
              </tr>
            </table>

            <!-- Loading state -->
            <div *ngIf="isLoading$ | async" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading users...</p>
            </div>

            <!-- Empty state -->
            <div *ngIf="dataSource.data.length === 0 && !(isLoading$ | async)" class="empty-state">
              <mat-icon class="empty-icon">people_outline</mat-icon>
              <h3>No users found</h3>
              <p>Get started by adding your first user.</p>
              <button
                mat-raised-button
                color="primary"
                (click)="createUser()"
                *appPermission="['users:create']">
                <mat-icon>add</mat-icon>
                Add User
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

      <!-- User actions menu -->
      <mat-menu #userMenu="matMenu">
        <ng-template matMenuContent let-user="user">
          <button mat-menu-item (click)="viewUser(user)">
            <mat-icon>visibility</mat-icon>
            <span>View Details</span>
          </button>
          <button
            mat-menu-item
            (click)="editUser(user)"
            *appPermission="['users:update']">
            <mat-icon>edit</mat-icon>
            <span>Edit User</span>
          </button>
          <button
            mat-menu-item
            (click)="toggleUserStatus(user)"
            *appPermission="['users:update']">
            <mat-icon>{{ user.status === 'ACTIVE' ? 'block' : 'check_circle' }}</mat-icon>
            <span>{{ user.status === 'ACTIVE' ? 'Suspend' : 'Activate' }}</span>
          </button>
          <mat-divider></mat-divider>
          <button
            mat-menu-item
            class="danger-item"
            (click)="deleteUser(user)"
            *appPermission="['users:delete']">
            <mat-icon>delete</mat-icon>
            <span>Delete User</span>
          </button>
        </ng-template>
      </mat-menu>
    </div>
  `,
  styles: [`
    .users-list-container {
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

    .users-card {
      margin-bottom: 24px;
    }

    .filters-section {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-field {
      flex: 1;
      min-width: 300px;
    }

    .filter-field {
      min-width: 150px;
    }

    .table-container {
      overflow-x: auto;
      min-height: 400px;
      position: relative;
    }

    .users-table {
      width: 100%;
      min-width: 800px;
    }

    .user-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .user-row:hover {
      background-color: #f5f5f5;
    }

    .user-name-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 12px;
      color: #666;
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

    :host-context(.dark-theme) .user-name {
      color: #fff;
    }

    :host-context(.dark-theme) .user-email {
      color: #ccc;
    }

    :host-context(.dark-theme) .user-row:hover {
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
      .users-list-container {
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

      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field,
      .filter-field {
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
export class UsersListComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'select',
    'avatar',
    'name',
    'phone',
    'role',
    'status',
    'createdAt',
    'actions'
  ];

  dataSource = new MatTableDataSource<User>([]);
  selection = new SelectionModel<User>(true, []);
  isLoading$ = this.loadingService.isLoading$;

  constructor(
    private userService: UserService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.loadingService.setLoading(true);

    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.dataSource.data = users;
          this.loadingService.setLoading(false);
        },
        error: (error) => {
          this.loadingService.setLoading(false);
          this.notificationService.showError('Failed to load users');
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filterByStatus(status: string): void {
    // Implement status filtering
    console.log('Filter by status:', status);
  }

  filterByRole(role: string): void {
    // Implement role filtering
    console.log('Filter by role:', role);
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

  createUser(): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { user: null }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadUsers();
          this.notificationService.showSuccess('User created successfully');
        }
      });
  }

  viewUser(user: User): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { user, readonly: true }
    });
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { user }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadUsers();
          this.notificationService.showSuccess('User updated successfully');
        }
      });
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.loadingService.setLoading(true);
          this.userService.deleteUser(user.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadUsers();
                this.notificationService.showSuccess('User deleted successfully');
              },
              error: (error) => {
                this.loadingService.setLoading(false);
                this.notificationService.showError('Failed to delete user');
              }
            });
        }
      });
  }

  bulkDelete(): void {
    const selectedUsers = this.selection.selected;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Multiple Users',
        message: `Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`,
        confirmText: 'Delete All',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.loadingService.setLoading(true);
          const deletePromises = selectedUsers.map(user =>
            this.userService.deleteUser(user.id).toPromise()
          );

          Promise.all(deletePromises)
            .then(() => {
              this.selection.clear();
              this.loadUsers();
              this.notificationService.showSuccess(`${selectedUsers.length} users deleted successfully`);
            })
            .catch(() => {
              this.loadingService.setLoading(false);
              this.notificationService.showError('Failed to delete some users');
            });
        }
      });
  }

  toggleUserStatus(user: User): void {
    const isActive = user.status === UserStatus.ACTIVE;
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    const action = isActive ? 'suspend' : 'activate';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        message: `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.loadingService.setLoading(true);
          this.userService.updateUserStatus(user.id, newStatus as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadUsers();
                this.notificationService.showSuccess(`User ${action}d successfully`);
              },
              error: () => {
                this.loadingService.setLoading(false);
                this.notificationService.showError(`Failed to ${action} user`);
              }
            });
        }
      });
  }

  getRoleColor(roleName: string): string {
    switch (roleName) {
      case 'ADMIN': return 'warn';
      case 'MANAGER': return 'accent';
      case 'TRAVEL_AGENT': return 'primary';
      default: return '';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'primary';
      case 'INACTIVE': return '';
      case 'SUSPENDED': return 'warn';
      default: return '';
    }
  }
}