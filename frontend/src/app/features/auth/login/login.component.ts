import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, LoadingComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Animated background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500 opacity-10 rounded-full blur-3xl animate-float"></div>
        <div class="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500 opacity-10 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500 opacity-10 rounded-full blur-3xl animate-float" style="animation-delay: 4s;"></div>
      </div>

      <div class="max-w-md w-full space-y-8 relative z-10 animate-slide-up">
        <!-- Logo and Header -->
        <div class="text-center">
          <div class="inline-block mb-6">
            <h1 class="text-6xl font-display font-black gradient-text bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-white to-blue-200 drop-shadow-2xl">
              TravelMS
            </h1>
          </div>
          <h2 class="text-4xl font-display font-bold text-white mb-3">Welcome Back</h2>
          <p class="text-lg text-white/80">
            Sign in to manage your travel adventures
          </p>
        </div>

        <!-- Login Form -->
        <div class="glass backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl p-8 border border-white/20">
          <form class="space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            @if (!requiresTwoFactor()) {
              <!-- Standard Login Fields -->
              <!-- Email/Username Field -->
              <div class="relative">
                <label for="usernameOrEmail" class="label">
                  Email or Username
                </label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="usernameOrEmail"
                    type="text"
                    formControlName="usernameOrEmail"
                    required
                    class="input-field pl-12"
                    [class.border-red-500]="loginForm.get('usernameOrEmail')?.invalid && loginForm.get('usernameOrEmail')?.touched"
                    placeholder="Enter your email or username"
                  >
                </div>
                @if (loginForm.get('usernameOrEmail')?.invalid && loginForm.get('usernameOrEmail')?.touched) {
                  <p class="form-error">
                    <svg class="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    Email or username is required
                  </p>
                }
              </div>

              <!-- Password Field -->
              <div class="relative">
                <label for="password" class="label">
                  Password
                </label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    required
                    class="input-field pl-12 pr-12"
                    [class.border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                    placeholder="Enter your password"
                  >
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                    (click)="togglePasswordVisibility()"
                  >
                    @if (showPassword) {
                      <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                      </svg>
                    } @else {
                      <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                  <p class="form-error">
                    <svg class="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    Password is required
                  </p>
                }
              </div>

              <!-- Remember Me and Forgot Password -->
              <div class="flex items-center justify-between">
                <div class="flex items-center group cursor-pointer">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    formControlName="rememberMe"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer transition-all"
                  >
                  <label for="rememberMe" class="ml-2 block text-sm text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors font-medium">
                    Remember me
                  </label>
                </div>
                <div class="text-sm">
                  <a href="/forgot-password" class="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200">
                    Forgot password?
                  </a>
                </div>
              </div>
            } @else {
              <!-- Two-Factor Authentication Code Input -->
              <div class="text-center mb-6">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4 shadow-lg">
                  <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h3>
                <p class="text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div>
                <label for="twoFactorCode" class="label text-center">
                  Authentication Code
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  [value]="twoFactorCode()"
                  (input)="twoFactorCode.set($any($event.target).value)"
                  maxlength="6"
                  required
                  class="input-field text-center text-3xl tracking-widest font-mono font-bold"
                  placeholder="000000"
                  autofocus
                >
                <p class="mt-3 text-xs text-gray-500 text-center">
                  The code refreshes every 30 seconds
                </p>
              </div>
            }

            <!-- Error Message -->
            @if (error()) {
              <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-shake">
                <div class="flex items-start">
                  <svg class="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-red-800">{{ error() }}</p>
                  </div>
                </div>
              </div>
            }

            <!-- Submit Button -->
            <div>
              @if (!requiresTwoFactor()) {
                <button
                  type="submit"
                  [disabled]="loginForm.invalid || isLoading()"
                  class="w-full btn-primary text-lg py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl"
                >
                  @if (isLoading()) {
                    <div class="flex items-center justify-center gap-3">
                      <div class="spinner spinner-sm"></div>
                      Signing in...
                    </div>
                  } @else {
                    <span class="flex items-center justify-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                      </svg>
                      Sign In
                    </span>
                  }
                </button>
              } @else {
                <!-- 2FA Submit Buttons -->
                <div class="space-y-3">
                  <button
                    type="submit"
                    [disabled]="twoFactorCode().length !== 6 || isLoading()"
                    class="w-full btn-primary text-lg py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl"
                  >
                    @if (isLoading()) {
                      <div class="flex items-center justify-center gap-3">
                        <div class="spinner spinner-sm"></div>
                        Verifying...
                      </div>
                    } @else {
                      Verify Code
                    }
                  </button>
                  <button
                    type="button"
                    (click)="cancelTwoFactor()"
                    [disabled]="isLoading()"
                    class="w-full btn-outline text-lg py-4 font-bold"
                  >
                    Back to Login
                  </button>
                </div>
              }
            </div>

            @if (!requiresTwoFactor()) {
              <!-- Divider -->
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t-2 border-gray-200"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-4 bg-white text-gray-500 font-medium">Don't have an account?</span>
                </div>
              </div>

              <!-- Sign Up Link -->
              <div class="text-center">
                <a routerLink="/auth/register" class="btn-secondary w-full py-4 text-lg font-bold inline-block shadow-lg hover:shadow-xl">
                  Create New Account
                </a>
              </div>
            }
          </form>
        </div>

        <!-- Footer Links -->
        <div class="text-center space-y-2">
          <p class="text-sm text-white/70">
            By signing in, you agree to our
            <a href="#" class="text-white font-semibold hover:underline">Terms of Service</a>
            and
            <a href="#" class="text-white font-semibold hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  public loginForm: FormGroup;
  public showPassword = false;
  public isLoading = signal(false);
  public error = signal<string | null>(null);
  public requiresTwoFactor = signal(false);
  public twoFactorCode = signal('');
  private storedCredentials: LoginRequest | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public onSubmit(): void {
    if (this.loginForm.valid || this.requiresTwoFactor()) {
      this.isLoading.set(true);
      this.error.set(null);

      let credentials: LoginRequest;

      if (this.requiresTwoFactor()) {
        // Second step: submit with 2FA code
        if (!this.storedCredentials) {
          this.error.set('Session expired. Please try again.');
          this.isLoading.set(false);
          this.requiresTwoFactor.set(false);
          return;
        }
        credentials = {
          ...this.storedCredentials,
          twoFactorCode: this.twoFactorCode()
        } as any;
      } else {
        // First step: submit username/password
        credentials = {
          usernameOrEmail: this.loginForm.value.usernameOrEmail,
          password: this.loginForm.value.password
        };
      }

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading.set(false);

          // Check if 2FA is required
          if ((response as any).requiresTwoFactor) {
            // 2FA required - show code input
            this.storedCredentials = credentials;
            this.requiresTwoFactor.set(true);
            this.twoFactorCode.set('');
          } else if (response.token) {
            // Login successful
            this.requiresTwoFactor.set(false);
            this.storedCredentials = null;

            // Redirect based on role
            const user = response.user;
            if (user.role === 'ADMIN') {
              this.router.navigate(['/admin/dashboard']);
            } else if (user.role === 'MANAGER') {
              this.router.navigate(['/manager/dashboard']);
            } else {
              this.router.navigate(['/traveler/subscriptions']);
            }
          } else {
            this.error.set('Login failed');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.error.set(error?.error?.message || error?.message || 'Invalid username or password');
        }
      });
    }
  }

  public cancelTwoFactor(): void {
    this.requiresTwoFactor.set(false);
    this.twoFactorCode.set('');
    this.storedCredentials = null;
    this.error.set(null);
  }
}
