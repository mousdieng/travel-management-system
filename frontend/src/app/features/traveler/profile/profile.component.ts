import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService, TwoFactorSetupResponse } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AlertComponent],
  template: `
    <div class="page-container max-w-4xl">
      <h1 class="section-title">My Profile</h1>

      <app-alert *ngIf="successMessage" [message]="successMessage" type="success"></app-alert>
      <app-alert *ngIf="errorMessage" [message]="errorMessage" type="error"></app-alert>

      <!-- Profile Form Card -->
      <div class="card mb-8">
        <h2 class="text-xl font-semibold mb-6">Personal Information</h2>
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label">First Name</label>
              <input type="text" formControlName="firstName" class="input-field">
            </div>

            <div>
              <label class="label">Last Name</label>
              <input type="text" formControlName="lastName" class="input-field">
            </div>

            <div>
              <label class="label">Email</label>
              <input type="email" formControlName="email" class="input-field">
            </div>

            <div>
              <label class="label">Phone Number</label>
              <input type="tel" formControlName="phoneNumber" class="input-field">
            </div>
          </div>

          <div class="flex justify-end">
            <button type="submit" [disabled]="profileForm.invalid || loading"
                    class="btn-primary">
              {{ loading ? 'Updating...' : 'Update Profile' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Security Settings - 2FA Card -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-6">Security Settings</h2>
        <div class="border-t border-gray-200 pt-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Two-Factor Authentication (2FA)</h3>
              <p class="text-sm text-gray-500 mt-1">
                Add an extra layer of security to your account using an authenticator app
              </p>
              <div class="mt-3">
                <span *ngIf="currentUser?.twoFactorEnabled"
                      class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg class="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Enabled
                </span>
                <span *ngIf="!currentUser?.twoFactorEnabled"
                      class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <svg class="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Disabled
                </span>
              </div>
            </div>
            <div>
              <button *ngIf="currentUser?.twoFactorEnabled"
                type="button"
                (click)="onDisable2FA()"
                [disabled]="disabling2FA"
                class="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {{ disabling2FA ? 'Disabling...' : 'Disable 2FA' }}
              </button>
              <button *ngIf="!currentUser?.twoFactorEnabled"
                type="button"
                (click)="onEnable2FA()"
                [disabled]="enabling2FA"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {{ enabling2FA ? 'Enabling...' : 'Enable 2FA' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2FA Setup Modal -->
      <div *ngIf="show2FAModal && twoFactorSetup"
           class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">Set Up Two-Factor Authentication</h3>

          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
            </p>

            <div class="flex justify-center p-4 bg-gray-50 rounded-lg">
              <img [src]="twoFactorSetup.qrCode" alt="2FA QR Code" class="w-64 h-64" />
            </div>

            <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p class="text-sm text-blue-700 font-medium mb-2">Manual Entry Code:</p>
              <code class="text-xs bg-white px-2 py-1 rounded border border-blue-200 break-all block">{{ twoFactorSetup.secret }}</code>
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
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>

      <!-- 2FA Disable Modal -->
      <div *ngIf="show2FADisableModal"
           class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
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
                [(ngModel)]="verificationCode"
                placeholder="000000"
                [ngModelOptions]="{standalone: true}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest"
              />
            </div>

            <app-alert *ngIf="disable2FAError" [message]="disable2FAError" type="error"></app-alert>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              (click)="close2FADisableModal()"
              [disabled]="disabling2FA"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmDisable2FA()"
              [disabled]="disabling2FA || !verificationCode"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {{ disabling2FA ? 'Disabling...' : 'Disable 2FA' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  currentUser: User | null = null;

  // 2FA properties
  show2FAModal = false;
  show2FADisableModal = false;
  twoFactorSetup: TwoFactorSetupResponse | null = null;
  enabling2FA = false;
  disabling2FA = false;
  verificationCode = '';
  disable2FAError = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['']
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber
        });
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.userService.updateProfile(this.profileForm.value).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Failed to update profile.';
        }
      });
    }
  }

  // 2FA Methods
  onEnable2FA(): void {
    this.enabling2FA = true;
    this.errorMessage = '';

    this.userService.enable2FA().subscribe({
      next: (response) => {
        this.enabling2FA = false;
        this.twoFactorSetup = response;
        this.show2FAModal = true;
      },
      error: (error) => {
        this.enabling2FA = false;
        this.errorMessage = error.error?.message || 'Failed to enable 2FA. Please try again.';
      }
    });
  }

  onDisable2FA(): void {
    this.show2FADisableModal = true;
    this.verificationCode = '';
    this.disable2FAError = '';
  }

  confirmDisable2FA(): void {
    if (!this.verificationCode) {
      this.disable2FAError = 'Please enter the verification code';
      return;
    }

    this.disabling2FA = true;
    this.disable2FAError = '';

    this.userService.disable2FA(this.verificationCode).subscribe({
      next: () => {
        this.disabling2FA = false;
        this.show2FADisableModal = false;
        this.successMessage = '2FA disabled successfully!';
        // Refresh user profile
        this.userService.getProfile().subscribe(user => {
          this.currentUser = user;
          this.authService.updateUser(user);
        });
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.disabling2FA = false;
        this.disable2FAError = error.error?.message || 'Failed to disable 2FA. Please check your code and try again.';
      }
    });
  }

  close2FAModal(): void {
    this.show2FAModal = false;
    this.twoFactorSetup = null;
    // Refresh profile to get updated 2FA status
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.authService.updateUser(user);
        if (user.twoFactorEnabled) {
          this.successMessage = '2FA enabled successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        }
      }
    });
  }

  close2FADisableModal(): void {
    this.show2FADisableModal = false;
    this.verificationCode = '';
    this.disable2FAError = '';
  }
}
