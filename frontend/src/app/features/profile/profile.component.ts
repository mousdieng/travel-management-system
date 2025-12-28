import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService, TwoFactorSetupResponse } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingComponent, ErrorMessageComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      @if (loading()) {
        <app-loading />
      } @else {
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <!-- Profile Header -->
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
            <div class="flex items-center">
              <div class="h-24 w-24 rounded-full bg-white flex items-center justify-center text-indigo-600 text-3xl font-bold">
                {{ currentUser()?.firstName?.charAt(0) }}{{ currentUser()?.lastName?.charAt(0) }}
              </div>
              <div class="ml-6 text-white">
                <h2 class="text-2xl font-bold">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</h2>
                <p class="text-indigo-100">{{ currentUser()?.email }}</p>
                <span class="inline-block mt-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {{ formatRole(currentUser()?.role) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Profile Form -->
          <div class="px-6 py-6">
            @if (successMessage()) {
              <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-green-700">{{ successMessage() }}</p>
                  </div>
                </div>
              </div>
            }

            @if (errorMessage()) {
              <app-error-message [message]="errorMessage()!" />
            }

            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    formControlName="firstName"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    formControlName="lastName"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    id="username"
                    type="text"
                    formControlName="username"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    readonly
                    class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    formControlName="phoneNumber"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  (click)="resetForm()"
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="updating() || profileForm.invalid || !profileForm.dirty"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ updating() ? 'Updating...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Account Stats -->
        <div class="mt-8 bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">Account Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Member Since</p>
              <p class="font-medium">{{ formatDate(currentUser()?.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Account Status</p>
              <p class="font-medium">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Security Settings - 2FA -->
        <div class="mt-8 bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">Security Settings</h3>
          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-base font-medium text-gray-900">Two-Factor Authentication (2FA)</h4>
                <p class="text-sm text-gray-500 mt-1">
                  Add an extra layer of security to your account
                </p>
                <div class="mt-2">
                  @if (currentUser()?.twoFactorEnabled) {
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg class="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      Enabled
                    </span>
                  } @else {
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <svg class="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      Disabled
                    </span>
                  }
                </div>
              </div>
              <div>
                @if (currentUser()?.twoFactorEnabled) {
                  <button
                    type="button"
                    (click)="onDisable2FA()"
                    [disabled]="disabling2FA()"
                    class="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ disabling2FA() ? 'Disabling...' : 'Disable 2FA' }}
                  </button>
                } @else {
                  <button
                    type="button"
                    (click)="onEnable2FA()"
                    [disabled]="enabling2FA()"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ enabling2FA() ? 'Enabling...' : 'Enable 2FA' }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- 2FA Setup Modal -->
      @if (show2FAModal() && twoFactorSetup()) {
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg max-w-md w-full p-6">
            <h3 class="text-lg font-semibold mb-4">Set Up Two-Factor Authentication</h3>

            <div class="space-y-4">
              <p class="text-sm text-gray-600">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>

              <div class="flex justify-center p-4 bg-gray-50 rounded-lg">
                <img [src]="twoFactorSetup()!.qrCode" alt="2FA QR Code" class="w-64 h-64" />
              </div>

              <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p class="text-sm text-blue-700 font-medium mb-2">Manual Entry Code:</p>
                <code class="text-xs bg-white px-2 py-1 rounded border border-blue-200 break-all">{{ twoFactorSetup()!.secret }}</code>
                <p class="text-xs text-blue-600 mt-2">
                  Save this code securely. You'll need it if you lose access to your authenticator app.
                </p>
              </div>

              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p class="text-sm text-yellow-700">
                  <strong>Important:</strong> Make sure to save the recovery code above before closing this window.
                  You won't be able to see it again.
                </p>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                (click)="close2FAModal()"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 2FA Disable Modal -->
      @if (show2FADisableModal()) {
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg max-w-md w-full p-6">
            <h3 class="text-lg font-semibold mb-4">Disable Two-Factor Authentication</h3>

            <div class="space-y-4">
              <p class="text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app to confirm disabling 2FA.
              </p>

              <div>
                <label for="verificationCode" class="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  maxlength="6"
                  [value]="verificationCode()"
                  (input)="verificationCode.set($any($event.target).value)"
                  placeholder="000000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest"
                />
              </div>

              @if (errorMessage()) {
                <div class="bg-red-50 border-l-4 border-red-400 p-4">
                  <p class="text-sm text-red-700">{{ errorMessage() }}</p>
                </div>
              }
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                (click)="close2FADisableModal()"
                [disabled]="disabling2FA()"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmDisable2FA()"
                [disabled]="disabling2FA() || !verificationCode()"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ disabling2FA() ? 'Disabling...' : 'Disable 2FA' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  loading = signal(false);
  updating = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // 2FA related
  show2FAModal = signal(false);
  show2FADisableModal = signal(false);
  twoFactorSetup = signal<TwoFactorSetupResponse | null>(null);
  enabling2FA = signal(false);
  disabling2FA = signal(false);
  verificationCode = signal('');

  profileForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: [{ value: '', disabled: true }],
    phoneNumber: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.profileForm.dirty) {
      this.updating.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.userService.updateProfile(this.profileForm.value).subscribe({
        next: (user) => {
          this.updating.set(false);
          this.successMessage.set('Profile updated successfully!');
          this.profileForm.markAsPristine();
          // Update auth service user data
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error) => {
          this.updating.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to update profile');
        }
      });
    }
  }

  resetForm(): void {
    this.loadProfile();
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  formatRole(role?: string): string {
    if (!role) return '';
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(date?: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // 2FA Methods
  onEnable2FA(): void {
    this.enabling2FA.set(true);
    this.errorMessage.set(null);

    this.userService.enable2FA().subscribe({
      next: (response) => {
        this.enabling2FA.set(false);
        this.twoFactorSetup.set(response);
        this.show2FAModal.set(true);
      },
      error: (error) => {
        this.enabling2FA.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to enable 2FA');
      }
    });
  }

  onDisable2FA(): void {
    this.show2FADisableModal.set(true);
    this.verificationCode.set('');
  }

  confirmDisable2FA(): void {
    if (!this.verificationCode()) {
      this.errorMessage.set('Please enter the verification code');
      return;
    }

    this.disabling2FA.set(true);
    this.errorMessage.set(null);

    this.userService.disable2FA(this.verificationCode()).subscribe({
      next: () => {
        this.disabling2FA.set(false);
        this.show2FADisableModal.set(false);
        this.successMessage.set('2FA disabled successfully');
        // Update current user
        const user = this.currentUser();
        if (user) {
          this.authService.updateUser({ ...user, twoFactorEnabled: false });
        }
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.disabling2FA.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to disable 2FA. Please check your code.');
      }
    });
  }

  close2FAModal(): void {
    this.show2FAModal.set(false);
    this.twoFactorSetup.set(null);
    // Reload profile to get updated 2FA status
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.authService.updateUser(user);
        if (user.twoFactorEnabled) {
          this.successMessage.set('2FA enabled successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
        }
      }
    });
  }

  close2FADisableModal(): void {
    this.show2FADisableModal.set(false);
    this.verificationCode.set('');
    this.errorMessage.set(null);
  }
}
