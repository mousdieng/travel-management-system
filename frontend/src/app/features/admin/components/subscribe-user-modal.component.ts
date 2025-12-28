import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminActionsService } from '../../../core/services/admin-actions.service';
import { UserService } from '../../../core/services/user.service';
import { TravelService } from '../../../core/services/travel.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { CreateSubscriptionRequest, User, Travel } from '../../../core/models';

@Component({
  selector: 'app-subscribe-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" (click)="close()"></div>

        <!-- Modal panel -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900">Subscribe User to Travel</h3>
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
            <form [formGroup]="subscriptionForm" (ngSubmit)="onSubmit()">
              <div class="space-y-6">
                <!-- User Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Select User *
                  </label>
                  <input
                    type="text"
                    formControlName="userSearch"
                    (input)="onUserSearch()"
                    placeholder="Search user by name or email..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />

                  <!-- User search results -->
                  @if (showUserResults() && userResults().length > 0) {
                    <div class="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      @for (user of userResults(); track user.id) {
                        <button
                          type="button"
                          (click)="selectUser(user)"
                          class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                        >
                          <div class="font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</div>
                          <div class="text-sm text-gray-600">{{ user.email }}</div>
                          <div class="text-xs text-gray-500">Role: {{ user.role }}</div>
                        </button>
                      }
                    </div>
                  }

                  <!-- Selected user -->
                  @if (selectedUser()) {
                    <div class="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ selectedUser()!.firstName }} {{ selectedUser()!.lastName }}
                        </div>
                        <div class="text-sm text-gray-600">{{ selectedUser()!.email }}</div>
                      </div>
                      <button
                        type="button"
                        (click)="clearUser()"
                        class="text-red-600 hover:text-red-800"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>

                <!-- Travel Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Select Travel *
                  </label>
                  <input
                    type="text"
                    formControlName="travelSearch"
                    (input)="onTravelSearch()"
                    placeholder="Search travel by title or destination..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />

                  <!-- Travel search results -->
                  @if (showTravelResults() && travelResults().length > 0) {
                    <div class="mt-2 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      @for (travel of travelResults(); track travel.id) {
                        <button
                          type="button"
                          (click)="selectTravel(travel)"
                          class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                        >
                          <div class="font-medium text-gray-900">{{ travel.title }}</div>
                          <div class="text-sm text-gray-600">{{ travel.destination }}</div>
                          <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>{{ formatDate(travel.startDate) }} - {{ formatDate(travel.endDate) }}</span>
                            <span>\${{ travel.price }}</span>
                            <span>{{ travel.currentParticipants }}/{{ travel.maxParticipants }} participants</span>
                          </div>
                        </button>
                      }
                    </div>
                  }

                  <!-- Selected travel -->
                  @if (selectedTravel()) {
                    <div class="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="font-medium text-gray-900">{{ selectedTravel()!.title }}</div>
                          <div class="text-sm text-gray-600 mt-1">{{ selectedTravel()!.destination }}</div>
                          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{{ formatDate(selectedTravel()!.startDate) }} - {{ formatDate(selectedTravel()!.endDate) }}</span>
                            <span class="font-semibold text-green-700">\${{ selectedTravel()!.price }} per person</span>
                          </div>
                          <div class="mt-2 text-xs text-gray-500">
                            Available: {{ selectedTravel()!.maxParticipants - selectedTravel()!.currentParticipants }} spots
                          </div>
                        </div>
                        <button
                          type="button"
                          (click)="clearTravel()"
                          class="text-red-600 hover:text-red-800 ml-4"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <!-- Number of Participants -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Number of Participants *
                  </label>
                  <input
                    type="number"
                    formControlName="numberOfParticipants"
                    min="1"
                    [max]="selectedTravel() ? (selectedTravel()!.maxParticipants - selectedTravel()!.currentParticipants) : 99"
                    placeholder="1"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Total cost: {{ formatCurrency(calculateTotalCost()) }}
                  </p>
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
                    [disabled]="!subscriptionForm.valid || !selectedUser() || !selectedTravel() || submitting()"
                    class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    @if (submitting()) {
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subscribing...
                    } @else {
                      Subscribe User
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
export class SubscribeUserModalComponent implements OnInit {
  @Input() isOpen = signal(false);
  @Output() closeModal = new EventEmitter<void>();
  @Output() subscriptionCreated = new EventEmitter<void>();

  subscriptionForm!: FormGroup;
  selectedUser = signal<User | null>(null);
  selectedTravel = signal<Travel | null>(null);
  userResults = signal<User[]>([]);
  travelResults = signal<Travel[]>([]);
  showUserResults = signal(false);
  showTravelResults = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private adminActionsService: AdminActionsService,
    private userService: UserService,
    private travelService: TravelService
  ) {}

  ngOnInit() {
    this.subscriptionForm = this.fb.group({
      userSearch: [''],
      travelSearch: [''],
      numberOfParticipants: [1, [Validators.required, Validators.min(1)]]
    });
  }

  onUserSearch() {
    const query = this.subscriptionForm.get('userSearch')?.value;
    if (!query || query.length < 2) {
      this.showUserResults.set(false);
      return;
    }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        const filtered = users.filter(u =>
          u.firstName?.toLowerCase().includes(query.toLowerCase()) ||
          u.lastName?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase())
        );
        this.userResults.set(filtered);
        this.showUserResults.set(true);
      },
      error: () => {
        this.errorMessage.set('Failed to search users');
      }
    });
  }

  onTravelSearch() {
    const query = this.subscriptionForm.get('travelSearch')?.value;
    if (!query || query.length < 2) {
      this.showTravelResults.set(false);
      return;
    }

    this.travelService.getAllTravels().subscribe({
      next: (travels) => {
        const filtered = travels.filter(t =>
          t.status === 'ACTIVE' &&
          (t.title?.toLowerCase().includes(query.toLowerCase()) ||
           t.destination?.toLowerCase().includes(query.toLowerCase()))
        );
        this.travelResults.set(filtered);
        this.showTravelResults.set(true);
      },
      error: () => {
        this.errorMessage.set('Failed to search travels');
      }
    });
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
    this.showUserResults.set(false);
    this.subscriptionForm.patchValue({ userSearch: `${user.firstName} ${user.lastName}` });
  }

  selectTravel(travel: Travel) {
    this.selectedTravel.set(travel);
    this.showTravelResults.set(false);
    this.subscriptionForm.patchValue({ travelSearch: travel.title });
  }

  clearUser() {
    this.selectedUser.set(null);
    this.subscriptionForm.patchValue({ userSearch: '' });
  }

  clearTravel() {
    this.selectedTravel.set(null);
    this.subscriptionForm.patchValue({ travelSearch: '' });
  }

  calculateTotalCost(): number {
    const participants = this.subscriptionForm.value.numberOfParticipants || 0;
    const price = this.selectedTravel()?.price || 0;
    return participants * price;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  onSubmit() {
    if (!this.subscriptionForm.valid || !this.selectedUser() || !this.selectedTravel()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const subscriptionData: CreateSubscriptionRequest = {
      travelId: this.selectedTravel()!.id.toString(),
      numberOfParticipants: parseInt(this.subscriptionForm.value.numberOfParticipants)
    };

    this.adminActionsService.subscribeUserToTravel(
      this.selectedUser()!.id,
      this.selectedTravel()!.id.toString(),
      subscriptionData
    ).subscribe({
      next: () => {
        this.successMessage.set('User subscribed successfully!');
        this.submitting.set(false);
        this.subscriptionCreated.emit();
        setTimeout(() => this.close(), 1500);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to subscribe user');
        this.submitting.set(false);
      }
    });
  }

  close() {
    this.isOpen.set(false);
    this.subscriptionForm.reset({ numberOfParticipants: 1 });
    this.selectedUser.set(null);
    this.selectedTravel.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.closeModal.emit();
  }
}
