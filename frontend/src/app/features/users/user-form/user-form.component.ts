import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { User, UserRole } from '../../../shared/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-user-form',
  template: `
    <div class="user-form-container">
      <h2 mat-dialog-title>
        {{ data.user ? 'Edit User' : 'Create New User' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="userForm" class="user-form">
          <!-- Personal Information -->
          <div class="form-section">
            <h3>Personal Information</h3>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" placeholder="John">
                <mat-error *ngIf="userForm.get('firstName')?.hasError('required')">
                  First name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" placeholder="Doe">
                <mat-error *ngIf="userForm.get('lastName')?.hasError('required')">
                  Last name is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="john.doe@example.com">
                <mat-error *ngIf="userForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="userForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" placeholder="+1 (555) 123-4567">
                <mat-error *ngIf="userForm.get('phone')?.hasError('pattern')">
                  Please enter a valid phone number
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Date of Birth</mat-label>
                <input matInput [matDatepicker]="dobPicker" formControlName="dateOfBirth">
                <mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle>
                <mat-datepicker #dobPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Gender</mat-label>
                <mat-select formControlName="gender">
                  <mat-option value="male">Male</mat-option>
                  <mat-option value="female">Female</mat-option>
                  <mat-option value="other">Other</mat-option>
                  <mat-option value="prefer_not_to_say">Prefer not to say</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Account Information -->
          <div class="form-section">
            <h3>Account Information</h3>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="USER">User</mat-option>
                  <mat-option value="MANAGER">Manager</mat-option>
                  <mat-option value="ADMIN">Admin</mat-option>
                </mat-select>
                <mat-error *ngIf="userForm.get('role')?.hasError('required')">
                  Role is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Nationality</mat-label>
                <input matInput formControlName="nationality" placeholder="United States">
              </mat-form-field>
            </div>

            <div class="form-row" *ngIf="!data.user">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" type="password" placeholder="Enter password">
                <mat-error *ngIf="userForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
                <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
                  Password must be at least 8 characters long
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-checkbox formControlName="isActive">Account Active</mat-checkbox>
              <mat-checkbox formControlName="emailVerified">Email Verified</mat-checkbox>
            </div>
          </div>

          <!-- Travel Information -->
          <div class="form-section">
            <h3>Travel Information</h3>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Passport Number</mat-label>
                <input matInput formControlName="passportNumber" placeholder="A12345678">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Passport Expiry</mat-label>
                <input matInput [matDatepicker]="passportExpiryPicker" formControlName="passportExpiry">
                <mat-datepicker-toggle matSuffix [for]="passportExpiryPicker"></mat-datepicker-toggle>
                <mat-datepicker #passportExpiryPicker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>

          <!-- Emergency Contact -->
          <div class="form-section">
            <h3>Emergency Contact</h3>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Emergency Contact Name</mat-label>
                <input matInput formControlName="emergencyContactName" placeholder="Jane Doe">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Emergency Contact Phone</mat-label>
                <input matInput formControlName="emergencyContactPhone" placeholder="+1 (555) 987-6543">
              </mat-form-field>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="userForm.invalid || isLoading">
          {{ data.user ? 'Update' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user?: User }
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data.user) {
      this.populateForm(this.data.user);
    }

    this.loadingService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => this.isLoading = loading);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[+]?[0-9]{10,15}$/)]],
      role: ['USER', Validators.required],
      password: ['', this.data.user ? [] : [Validators.required, Validators.minLength(8)]],
      dateOfBirth: [''],
      gender: [''],
      nationality: [''],
      passportNumber: [''],
      passportExpiry: [''],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      isActive: [true],
      emailVerified: [false]
    });
  }

  private populateForm(user: User): void {
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      nationality: user.nationality,
      passportNumber: user.passportNumber,
      passportExpiry: user.passportExpiry,
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
      isActive: user.isActive,
      emailVerified: user.emailVerified
    });
  }

  onSave(): void {
    if (this.userForm.valid) {
      this.loadingService.setLoading(true);

      const userData = this.userForm.value;
      const operation = this.data.user
        ? this.userService.updateUser(this.data.user.id, userData)
        : this.userService.createUser(userData);

      operation
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            this.notificationService.showSuccess(
              `User ${this.data.user ? 'updated' : 'created'} successfully`
            );
            this.dialogRef.close(user);
          },
          error: (error) => {
            this.notificationService.showError(
              error.message || `Failed to ${this.data.user ? 'update' : 'create'} user`
            );
          },
          complete: () => {
            this.loadingService.setLoading(false);
          }
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}