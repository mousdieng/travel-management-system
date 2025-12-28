import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { RegisterRequest, UserRole, UserRoleLabels, UserRoleDescriptions } from '../../../core/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  public registerForm: FormGroup;
  public showPassword = false;
  public showConfirmPassword = false;
  public isLoading = signal(false);
  public error = signal<string | null>(null);
  public success = signal<string | null>(null);
  public selectedProfilePicture: File | null = null;
  public profilePicturePreview = signal<string | null>(null);

  // Role selection properties
  public readonly UserRole = UserRole;
  public readonly availableRoles = [
    UserRole.TRAVELER,
    UserRole.TRAVEL_MANAGER
  ];
  public readonly roleLabels = UserRoleLabels;
  public readonly roleDescriptions = UserRoleDescriptions;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      role: [UserRole.TRAVELER, [Validators.required]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      agreeToTerms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator for password strength
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const errors: ValidationErrors = {};

    if (!hasUpperCase) errors['missingUpperCase'] = true;
    if (!hasLowerCase) errors['missingLowerCase'] = true;
    if (!hasNumber) errors['missingNumber'] = true;
    if (!hasSpecialChar) errors['missingSpecialChar'] = true;

    return Object.keys(errors).length ? errors : null;
  }

  // Custom validator for password confirmation
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  public getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;

    switch (fieldName) {
      case 'username':
        if (errors['required']) return 'Username is required';
        if (errors['minlength']) return 'Username must be at least 3 characters';
        if (errors['maxlength']) return 'Username must not exceed 20 characters';
        if (errors['pattern']) return 'Username can only contain letters, numbers, and underscores';
        break;

      case 'email':
        if (errors['required']) return 'Email is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;

      case 'firstName':
        if (errors['required']) return 'First name is required';
        if (errors['minlength']) return 'First name must be at least 2 characters';
        if (errors['maxlength']) return 'First name must not exceed 50 characters';
        break;

      case 'lastName':
        if (errors['required']) return 'Last name is required';
        if (errors['minlength']) return 'Last name must be at least 2 characters';
        if (errors['maxlength']) return 'Last name must not exceed 50 characters';
        break;

      case 'password':
        if (errors['required']) return 'Password is required';
        if (errors['minlength']) return 'Password must be at least 8 characters';
        if (errors['missingUpperCase']) return 'Password must contain at least one uppercase letter';
        if (errors['missingLowerCase']) return 'Password must contain at least one lowercase letter';
        if (errors['missingNumber']) return 'Password must contain at least one number';
        if (errors['missingSpecialChar']) return 'Password must contain at least one special character';
        break;

      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        break;

      case 'agreeToTerms':
        if (errors['required']) return 'You must agree to the terms and conditions';
        break;
    }

    return null;
  }

  public getFormError(): string | null {
    if (this.registerForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    return null;
  }

  public getPasswordStrength(): { level: string; percentage: number; color: string } {
    const password = this.registerForm.get('password')?.value || '';

    if (!password) {
      return { level: 'Very Weak', color: 'text-gray-400', percentage: 0 };
    }

    // Check all required criteria
    const hasLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Count how many criteria are met
    let score = 0;
    if (hasLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;

    const levels = [
      { level: 'Very Weak', color: 'text-red-500', percentage: 20 },
      { level: 'Weak', color: 'text-red-400', percentage: 40 },
      { level: 'Fair', color: 'text-yellow-500', percentage: 60 },
      { level: 'Good', color: 'text-blue-500', percentage: 80 },
      { level: 'Strong', color: 'text-green-500', percentage: 100 }
    ];

    // If password doesn't meet all requirements, cap it at "Fair" (60%)
    // This ensures consistency with validation errors
    const meetsAllRequirements = hasLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    let levelIndex = Math.min(score, levels.length - 1);

    // Cap strength at "Fair" if not all requirements are met
    if (!meetsAllRequirements && levelIndex > 2) {
      levelIndex = 2; // Fair (60%)
    }

    return levels[levelIndex];
  }

  public onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error.set('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('Profile picture must be less than 5MB');
        return;
      }

      this.selectedProfilePicture = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePicturePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  public removeProfilePicture(): void {
    this.selectedProfilePicture = null;
    this.profilePicturePreview.set(null);
  }

  public onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);
      this.success.set(null);

      const registerData: RegisterRequest = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        password: this.registerForm.value.password,
        role: this.registerForm.value.role
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          if (response.token) {
            // Registration successful - redirect based on role
            this.isLoading.set(false);
            this.success.set('Registration successful! Redirecting...');

            setTimeout(() => {
              const user = response.user;
              if (user.role === UserRole.ADMIN) {
                this.router.navigate(['/admin/dashboard']);
              } else if (user.role === UserRole.TRAVEL_MANAGER) {
                this.router.navigate(['/manager/travels']);
              } else {
                this.router.navigate(['/travels']);
              }
            }, 2000);
          } else {
            this.isLoading.set(false);
            this.error.set('Registration failed');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.error.set(error?.error?.message || error?.message || 'An error occurred during registration');
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Get the description for the currently selected role
   * Type-safe accessor for roleDescriptions
   */
  public getCurrentRoleDescription(): string | undefined {
    const roleValue = this.registerForm.get('role')?.value as UserRole;
    if (roleValue && (roleValue === UserRole.TRAVELER || roleValue === UserRole.TRAVEL_MANAGER)) {
      return this.roleDescriptions[roleValue as UserRole.TRAVELER | UserRole.TRAVEL_MANAGER];
    }
    return undefined;
  }
}