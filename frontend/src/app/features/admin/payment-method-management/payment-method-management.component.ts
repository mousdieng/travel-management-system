import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentMethodService } from '../../../core/services/payment-method.service';
import { SavedPaymentMethod, SavePaymentMethodRequest } from '../../../core/models';

@Component({
  selector: 'app-payment-method-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Payment Method Management</h1>
            <p class="text-gray-600 mt-2">Manage all saved payment methods across users</p>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p class="font-medium">Error loading payment methods</p>
          <p class="text-sm mt-1">{{ error() }}</p>
        </div>

        <!-- Payment Methods Table -->
        <div *ngIf="!loading() && !error()" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Info</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cardholder</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let method of paymentMethods()" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ method.id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ method.userId }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                        [ngClass]="{
                          'bg-purple-100 text-purple-800': method.paymentMethod === 'STRIPE',
                          'bg-blue-100 text-blue-800': method.paymentMethod === 'PAYPAL'
                        }">
                    {{ method.paymentMethod }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div *ngIf="method.last4">
                    <span class="font-medium">{{ method.cardBrand || 'Card' }}</span> •••• {{ method.last4 }}
                    <div class="text-xs text-gray-500" *ngIf="method.expiryMonth && method.expiryYear">
                      Exp: {{ method.expiryMonth }}/{{ method.expiryYear }}
                    </div>
                  </div>
                  <span *ngIf="!method.last4" class="text-gray-400">N/A</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ method.cardholderName || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span *ngIf="method.isDefault"
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Default
                  </span>
                  <span *ngIf="!method.isDefault" class="text-gray-400 text-sm">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ method.createdAt | date: 'short' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button (click)="openEditModal(method)"
                          class="text-blue-600 hover:text-blue-900 transition-colors">
                    Edit
                  </button>
                  <button (click)="openDeleteModal(method)"
                          class="text-red-600 hover:text-red-900 transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div *ngIf="paymentMethods().length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
            <p class="mt-1 text-sm text-gray-500">No saved payment methods found in the system.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div *ngIf="showEditModal()" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Payment Method</h3>
          <form (ngSubmit)="updatePaymentMethod()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
              <input type="text"
                     [(ngModel)]="editForm.cardholderName"
                     name="cardholderName"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter cardholder name">
            </div>
            <div class="flex items-center">
              <input type="checkbox"
                     [(ngModel)]="editForm.setAsDefault"
                     name="setAsDefault"
                     id="setAsDefault"
                     class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
              <label for="setAsDefault" class="ml-2 block text-sm text-gray-900">
                Set as default payment method
              </label>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button"
                      (click)="closeEditModal()"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit"
                      [disabled]="updating()"
                      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                {{ updating() ? 'Updating...' : 'Update' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div *ngIf="showDeleteModal()" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 class="text-lg font-medium leading-6 text-gray-900 text-center mb-4">Delete Payment Method</h3>
          <p class="text-sm text-gray-500 text-center mb-6">
            Are you sure you want to delete this payment method? This action cannot be undone.
          </p>
          <div class="flex justify-center space-x-3">
            <button type="button"
                    (click)="closeDeleteModal()"
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button type="button"
                    (click)="confirmDelete()"
                    [disabled]="deleting()"
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50">
              {{ deleting() ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PaymentMethodManagementComponent implements OnInit {
  paymentMethods = signal<SavedPaymentMethod[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedMethod = signal<SavedPaymentMethod | null>(null);

  updating = signal(false);
  deleting = signal(false);

  editForm: SavePaymentMethodRequest = {
    cardholderName: '',
    setAsDefault: false
  };

  constructor(private paymentMethodService: PaymentMethodService) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.loading.set(true);
    this.error.set(null);

    this.paymentMethodService.getAllPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods.set(methods);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load payment methods');
        this.loading.set(false);
        console.error('Error loading payment methods:', err);
      }
    });
  }

  openEditModal(method: SavedPaymentMethod): void {
    this.selectedMethod.set(method);
    this.editForm = {
      cardholderName: method.cardholderName || '',
      setAsDefault: method.isDefault
    };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedMethod.set(null);
    this.editForm = { cardholderName: '', setAsDefault: false };
  }

  updatePaymentMethod(): void {
    const method = this.selectedMethod();
    if (!method) return;

    this.updating.set(true);

    this.paymentMethodService.updatePaymentMethod(method.id, this.editForm).subscribe({
      next: (updatedMethod) => {
        // Update the method in the list
        const methods = this.paymentMethods();
        const index = methods.findIndex(m => m.id === updatedMethod.id);
        if (index !== -1) {
          methods[index] = updatedMethod;
          this.paymentMethods.set([...methods]);
        }
        this.updating.set(false);
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error updating payment method:', err);
        alert(err.error?.message || 'Failed to update payment method');
        this.updating.set(false);
      }
    });
  }

  openDeleteModal(method: SavedPaymentMethod): void {
    this.selectedMethod.set(method);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedMethod.set(null);
  }

  confirmDelete(): void {
    const method = this.selectedMethod();
    if (!method) return;

    this.deleting.set(true);

    this.paymentMethodService.deletePaymentMethodById(method.id).subscribe({
      next: () => {
        // Remove the method from the list
        const methods = this.paymentMethods().filter(m => m.id !== method.id);
        this.paymentMethods.set(methods);
        this.deleting.set(false);
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error deleting payment method:', err);
        alert(err.error?.message || 'Failed to delete payment method');
        this.deleting.set(false);
      }
    });
  }
}
