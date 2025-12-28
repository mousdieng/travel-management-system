import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminActionsService } from '../../../core/services/admin-actions.service';
import { UserService } from '../../../core/services/user.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { CreateTravelRequest, User } from '../../../core/models';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-create-travel-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" (click)="close()"></div>

        <!-- Modal panel -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900">Create Travel for Manager</h3>
              </div>
              <button (click)="close()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Alert Messages -->
            @if (errorMessage()) {
              <app-alert [message]="errorMessage()!" type="error" class="mb-4"></app-alert>
            }
            @if (successMessage()) {
              <app-alert [message]="successMessage()!" type="success" class="mb-4"></app-alert>
            }

            <!-- Form -->
            <form [formGroup]="travelForm" (ngSubmit)="onSubmit()">
              <div class="space-y-6">
                <!-- Manager Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Select Manager *
                  </label>
                  <input
                    type="text"
                    formControlName="managerSearch"
                    (input)="onManagerSearch()"
                    placeholder="Search manager by name or email..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  <!-- Manager search results -->
                  @if (showManagerResults() && managerResults().length > 0) {
                    <div class="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      @for (manager of managerResults(); track manager.id) {
                        <button
                          type="button"
                          (click)="selectManager(manager)"
                          class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                        >
                          <div class="font-medium text-gray-900">{{ manager.firstName }} {{ manager.lastName }}</div>
                          <div class="text-sm text-gray-600">{{ manager.email }}</div>
                        </button>
                      }
                    </div>
                  }

                  <!-- Selected manager -->
                  @if (selectedManager()) {
                    <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ selectedManager()!.firstName }} {{ selectedManager()!.lastName }}
                        </div>
                        <div class="text-sm text-gray-600">{{ selectedManager()!.email }}</div>
                      </div>
                      <button
                        type="button"
                        (click)="clearManager()"
                        class="text-red-600 hover:text-red-800"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>

                <!-- Travel Title -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Travel Title *</label>
                  <input
                    type="text"
                    formControlName="title"
                    placeholder="E.g., Safari Adventure in Kenya"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- Destination -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                  <input
                    type="text"
                    formControlName="destination"
                    placeholder="E.g., Nairobi, Kenya"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    formControlName="category"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="ADVENTURE">Adventure</option>
                    <option value="CULTURAL">Cultural</option>
                    <option value="RELAXATION">Relaxation</option>
                    <option value="WILDLIFE">Wildlife</option>
                    <option value="BEACH">Beach</option>
                    <option value="CITY">City Tours</option>
                  </select>
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    formControlName="description"
                    rows="4"
                    placeholder="Describe the travel experience..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <!-- Dates Grid -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="date"
                      formControlName="startDate"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input
                      type="date"
                      formControlName="endDate"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <!-- Price and Capacity Grid -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Price (USD) *</label>
                    <input
                      type="number"
                      formControlName="price"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Max Participants *</label>
                    <input
                      type="number"
                      formControlName="maxParticipants"
                      min="1"
                      placeholder="20"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    (click)="close()"
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    [disabled]="!travelForm.valid || !selectedManager() || submitting()"
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    @if (submitting()) {
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    } @else {
                      Create Travel
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class CreateTravelModalComponent implements OnInit {
  @Input() isOpen = signal(false);
  @Output() closeModal = new EventEmitter<void>();
  @Output() travelCreated = new EventEmitter<void>();

  travelForm!: FormGroup;
  selectedManager = signal<User | null>(null);
  managerResults = signal<User[]>([]);
  showManagerResults = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private adminActionsService: AdminActionsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.travelForm = this.fb.group({
      managerSearch: [''],
      title: ['', Validators.required],
      destination: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      maxParticipants: ['', [Validators.required, Validators.min(1)]]
    });
  }

  onManagerSearch() {
    const query = this.travelForm.get('managerSearch')?.value;
    if (!query || query.length < 2) {
      this.showManagerResults.set(false);
      return;
    }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        const managers = users.filter(u =>
          u.role === 'MANAGER' &&
          (u.firstName?.toLowerCase().includes(query.toLowerCase()) ||
           u.lastName?.toLowerCase().includes(query.toLowerCase()) ||
           u.email?.toLowerCase().includes(query.toLowerCase()))
        );
        this.managerResults.set(managers);
        this.showManagerResults.set(true);
      },
      error: () => {
        this.errorMessage.set('Failed to search managers');
      }
    });
  }

  selectManager(manager: User) {
    this.selectedManager.set(manager);
    this.showManagerResults.set(false);
    this.travelForm.patchValue({ managerSearch: `${manager.firstName} ${manager.lastName}` });
  }

  clearManager() {
    this.selectedManager.set(null);
    this.travelForm.patchValue({ managerSearch: '' });
  }

  onSubmit() {
    if (!this.travelForm.valid || !this.selectedManager()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const travelData: CreateTravelRequest = {
      title: this.travelForm.value.title,
      destination: this.travelForm.value.destination,
      category: this.travelForm.value.category,
      description: this.travelForm.value.description,
      startDate: new Date(this.travelForm.value.startDate),
      endDate: new Date(this.travelForm.value.endDate),
      price: parseFloat(this.travelForm.value.price),
      maxParticipants: parseInt(this.travelForm.value.maxParticipants)
    };

    this.adminActionsService.createTravelForManager(this.selectedManager()!.id, travelData).subscribe({
      next: () => {
        this.successMessage.set('Travel created successfully!');
        this.submitting.set(false);
        this.travelCreated.emit();
        setTimeout(() => this.close(), 1500);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to create travel');
        this.submitting.set(false);
      }
    });
  }

  close() {
    this.isOpen.set(false);
    this.travelForm.reset();
    this.selectedManager.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.closeModal.emit();
  }
}
