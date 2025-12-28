import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService, UpdateUserRequest } from '../../../core/services/user.service';
import { User } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingComponent, AlertComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-display font-bold text-gray-900">User Management</h1>
          <p class="text-gray-600 mt-2">Manage all platform users</p>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="card mb-6">
        <div class="flex items-center space-x-4">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Search users by name, email, or username..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
          </div>
          <button (click)="loadUsers()" class="btn-outline">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Alert Messages -->
      <app-alert *ngIf="successMessage()" [message]="successMessage()!" type="success" class="mb-6"></app-alert>
      <app-alert *ngIf="errorMessage()" [message]="errorMessage()!" type="error" class="mb-6"></app-alert>

      <app-loading *ngIf="loading()"></app-loading>

      @if (!loading()) {
        <!-- Users Table -->
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (user of users(); track user.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span class="text-primary-600 font-semibold">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</div>
                          <div class="text-sm text-gray-500">&#64;{{ user.username }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ user.email }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getRoleBadgeClass(user.role)">{{ user.role }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button
                        (click)="toggleStatus(user)"
                        [class]="user.enabled ? 'badge badge-success cursor-pointer hover:bg-green-600' : 'badge badge-danger cursor-pointer hover:bg-red-600'"
                      >
                        {{ user.enabled ? 'Active' : 'Inactive' }}
                      </button>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ user.createdAt | date:'mediumDate' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        (click)="openEditModal(user)"
                        class="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        (click)="confirmDelete(user)"
                        class="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div class="flex-1 flex justify-between items-center">
                <div class="text-sm text-gray-700">
                  Showing <span class="font-medium">{{ (currentPage() * pageSize()) + 1 }}</span> to
                  <span class="font-medium">{{ Math.min((currentPage() + 1) * pageSize(), totalElements()) }}</span> of
                  <span class="font-medium">{{ totalElements() }}</span> results
                </div>
                <div class="flex space-x-2">
                  <button
                    (click)="previousPage()"
                    [disabled]="currentPage() === 0"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    (click)="nextPage()"
                    [disabled]="currentPage() >= totalPages() - 1"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Edit Modal -->
    @if (editingUser()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" (click)="closeEditModal()">
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-heading font-bold text-gray-900">Edit User</h3>
              <button (click)="closeEditModal()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Form -->
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    [(ngModel)]="editForm.firstName"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    [(ngModel)]="editForm.lastName"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  [(ngModel)]="editForm.email"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  [(ngModel)]="editForm.phone"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  [(ngModel)]="editForm.role"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="TRAVELER">Traveler</option>
                  <option value="TRAVEL_MANAGER">Travel Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 mt-6">
              <button
                (click)="closeEditModal()"
                class="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                (click)="saveUser()"
                class="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                [disabled]="saving()"
              >
                @if (saving()) {
                  <span class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                } @else {
                  Save Changes
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deletingUser()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" (click)="closeDeleteModal()">
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" (click)="$event.stopPropagation()">
            <!-- Icon -->
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>

            <!-- Content -->
            <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">Delete User</h3>
            <p class="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to delete <strong>{{ deletingUser()!.firstName }} {{ deletingUser()!.lastName }}</strong>? This action cannot be undone.
            </p>

            <!-- Actions -->
            <div class="flex space-x-3">
              <button
                (click)="closeDeleteModal()"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                (click)="deleteUser()"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                [disabled]="saving()"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class UserManagementComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  searchQuery = '';
  currentPage = signal(0);
  pageSize = signal(20);
  totalPages = signal(0);
  totalElements = signal(0);
  editingUser = signal<User | null>(null);
  deletingUser = signal<User | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  Math = Math;

  editForm: UpdateUserRequest = {};

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getAllUsersPaginated(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery || undefined
    ).subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage.set('Failed to load users');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(): void {
    this.currentPage.set(0);
    this.loadUsers();
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadUsers();
    }
  }

  getRoleBadgeClass(role: string): string {
    const baseClass = 'px-3 py-1 text-xs font-semibold rounded-full';
    switch (role) {
      case 'ADMIN':
        return `${baseClass} bg-red-100 text-red-700`;
      case 'TRAVEL_MANAGER':
        return `${baseClass} bg-purple-100 text-purple-700`;
      case 'TRAVELER':
        return `${baseClass} bg-blue-100 text-blue-700`;
      default:
        return `${baseClass} bg-gray-100 text-gray-700`;
    }
  }

  toggleStatus(user: User): void {
    this.userService.toggleUserStatus(Number(user.id), !user.enabled).subscribe({
      next: (updatedUser) => {
        const users = this.users();
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          users[index] = updatedUser;
          this.users.set([...users]);
        }
        this.successMessage.set(`User ${updatedUser.enabled ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        this.errorMessage.set('Failed to update user status');
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.editForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    };
  }

  closeEditModal(): void {
    this.editingUser.set(null);
    this.editForm = {};
  }

  saveUser(): void {
    const user = this.editingUser();
    if (!user) return;

    this.saving.set(true);
    this.userService.updateUser(Number(user.id), this.editForm).subscribe({
      next: (updatedUser) => {
        const users = this.users();
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          users[index] = updatedUser;
          this.users.set([...users]);
        }
        this.successMessage.set('User updated successfully');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.closeEditModal();
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.errorMessage.set('Failed to update user');
        setTimeout(() => this.errorMessage.set(null), 3000);
        this.saving.set(false);
      }
    });
  }

  confirmDelete(user: User): void {
    this.deletingUser.set(user);
  }

  closeDeleteModal(): void {
    this.deletingUser.set(null);
  }

  deleteUser(): void {
    const user = this.deletingUser();
    if (!user) return;

    this.saving.set(true);
    this.userService.deleteUserById(Number(user.id)).subscribe({
      next: () => {
        this.users.set(this.users().filter(u => u.id !== user.id));
        this.successMessage.set('User deleted successfully');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.closeDeleteModal();
        this.saving.set(false);
        this.loadUsers(); // Reload to update pagination
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.errorMessage.set('Failed to delete user');
        setTimeout(() => this.errorMessage.set(null), 3000);
        this.saving.set(false);
      }
    });
  }
}
