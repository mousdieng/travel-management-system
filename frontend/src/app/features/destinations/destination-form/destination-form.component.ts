import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { Destination } from '../../../shared/models/destination.model';
import { DestinationService } from '../../../core/services/destination.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-destination-form',
  template: `
    <div class="destination-form-container">
      <h2 mat-dialog-title>
        {{ data.destination ? (data.readonly ? 'View Destination' : 'Edit Destination') : 'Create New Destination' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="destinationForm" class="destination-form">
          <!-- Basic Information -->
          <div class="form-section">
            <h3>Basic Information</h3>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Destination Name</mat-label>
                <input matInput formControlName="name" placeholder="Paris" [readonly]="data.readonly">
                <mat-error *ngIf="destinationForm.get('name')?.hasError('required')">
                  Destination name is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea
                  matInput
                  formControlName="description"
                  rows="3"
                  placeholder="A beautiful city known for..."
                  [readonly]="data.readonly">
                </textarea>
                <mat-error *ngIf="destinationForm.get('description')?.hasError('required')">
                  Description is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Image URL</mat-label>
                <input matInput formControlName="image" placeholder="https://..." [readonly]="data.readonly">
              </mat-form-field>

              <div class="image-preview" *ngIf="destinationForm.get('image')?.value">
                <img [src]="destinationForm.get('image')?.value" alt="Preview" class="preview-image">
              </div>
            </div>
          </div>

          <!-- Location Information -->
          <div class="form-section">
            <h3>Location Information</h3>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Country</mat-label>
                <input matInput formControlName="country" placeholder="France" [readonly]="data.readonly">
                <mat-error *ngIf="destinationForm.get('country')?.hasError('required')">
                  Country is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>City</mat-label>
                <input matInput formControlName="city" placeholder="Paris" [readonly]="data.readonly">
                <mat-error *ngIf="destinationForm.get('city')?.hasError('required')">
                  City is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>State/Region</mat-label>
                <input matInput formControlName="state" placeholder="Île-de-France" [readonly]="data.readonly">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Postal Code</mat-label>
                <input matInput formControlName="postalCode" placeholder="75001" [readonly]="data.readonly">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Latitude</mat-label>
                <input matInput formControlName="latitude" type="number" step="any" placeholder="48.8566" [readonly]="data.readonly">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Longitude</mat-label>
                <input matInput formControlName="longitude" type="number" step="any" placeholder="2.3522" [readonly]="data.readonly">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Time Zone</mat-label>
                <input matInput formControlName="timeZone" placeholder="Europe/Paris" [readonly]="data.readonly">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Currency</mat-label>
                <input matInput formControlName="currency" placeholder="EUR" [readonly]="data.readonly">
              </mat-form-field>
            </div>
          </div>

          <!-- Climate and Travel Information -->
          <div class="form-section">
            <h3>Climate and Travel Information</h3>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Climate</mat-label>
                <mat-select formControlName="climate" [disabled]="data.readonly">
                  <mat-option value="tropical">Tropical</mat-option>
                  <mat-option value="temperate">Temperate</mat-option>
                  <mat-option value="continental">Continental</mat-option>
                  <mat-option value="mediterranean">Mediterranean</mat-option>
                  <mat-option value="desert">Desert</mat-option>
                  <mat-option value="polar">Polar</mat-option>
                  <mat-option value="mountain">Mountain</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Best Time to Visit</mat-label>
                <input matInput formControlName="bestTimeToVisit" placeholder="April to October" [readonly]="data.readonly">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Average Temperature (°C)</mat-label>
                <input matInput formControlName="averageTemperature" type="number" placeholder="15" [readonly]="data.readonly">
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Safety Level</mat-label>
                <mat-select formControlName="safetyLevel" [disabled]="data.readonly">
                  <mat-option value="very_safe">Very Safe</mat-option>
                  <mat-option value="safe">Safe</mat-option>
                  <mat-option value="moderate">Moderate</mat-option>
                  <mat-option value="caution">Exercise Caution</mat-option>
                  <mat-option value="unsafe">Unsafe</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Languages -->
          <div class="form-section">
            <h3>Languages</h3>
            <div class="languages-container">
              <div formArrayName="languages">
                <div *ngFor="let language of languages.controls; let i = index" class="language-row">
                  <mat-form-field appearance="outline" class="language-field">
                    <mat-label>Language {{ i + 1 }}</mat-label>
                    <input matInput [formControlName]="i" placeholder="French" [readonly]="data.readonly">
                  </mat-form-field>
                  <button
                    *ngIf="!data.readonly"
                    mat-icon-button
                    type="button"
                    color="warn"
                    (click)="removeLanguage(i)"
                    [disabled]="languages.length <= 1">
                    <mat-icon>remove</mat-icon>
                  </button>
                </div>
              </div>
              <button
                *ngIf="!data.readonly"
                mat-button
                type="button"
                color="primary"
                (click)="addLanguage()">
                <mat-icon>add</mat-icon>
                Add Language
              </button>
            </div>
          </div>

          <!-- Points of Interest -->
          <div class="form-section">
            <h3>Points of Interest</h3>
            <div class="poi-container">
              <div formArrayName="pointsOfInterest">
                <div *ngFor="let poi of pointsOfInterest.controls; let i = index" class="poi-row">
                  <mat-form-field appearance="outline" class="poi-field">
                    <mat-label>Point of Interest {{ i + 1 }}</mat-label>
                    <input matInput [formControlName]="i" placeholder="Eiffel Tower" [readonly]="data.readonly">
                  </mat-form-field>
                  <button
                    *ngIf="!data.readonly"
                    mat-icon-button
                    type="button"
                    color="warn"
                    (click)="removePointOfInterest(i)">
                    <mat-icon>remove</mat-icon>
                  </button>
                </div>
              </div>
              <button
                *ngIf="!data.readonly"
                mat-button
                type="button"
                color="primary"
                (click)="addPointOfInterest()">
                <mat-icon>add</mat-icon>
                Add Point of Interest
              </button>
            </div>
          </div>

          <!-- Activities -->
          <div class="form-section">
            <h3>Activities</h3>
            <div class="activities-container">
              <div formArrayName="activities">
                <div *ngFor="let activity of activities.controls; let i = index" class="activity-row">
                  <mat-form-field appearance="outline" class="activity-field">
                    <mat-label>Activity {{ i + 1 }}</mat-label>
                    <input matInput [formControlName]="i" placeholder="Sightseeing" [readonly]="data.readonly">
                  </mat-form-field>
                  <button
                    *ngIf="!data.readonly"
                    mat-icon-button
                    type="button"
                    color="warn"
                    (click)="removeActivity(i)">
                    <mat-icon>remove</mat-icon>
                  </button>
                </div>
              </div>
              <button
                *ngIf="!data.readonly"
                mat-button
                type="button"
                color="primary"
                (click)="addActivity()">
                <mat-icon>add</mat-icon>
                Add Activity
              </button>
            </div>
          </div>

          <!-- Status -->
          <div class="form-section">
            <h3>Status</h3>
            <div class="form-row">
              <mat-checkbox formControlName="isActive" [disabled]="data.readonly">
                Active Destination
              </mat-checkbox>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.readonly ? 'Close' : 'Cancel' }}
        </button>
        <button
          *ngIf="!data.readonly"
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="destinationForm.invalid || isLoading">
          {{ data.destination ? 'Update' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./destination-form.component.scss']
})
export class DestinationFormComponent implements OnInit, OnDestroy {
  destinationForm: FormGroup;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private destinationService: DestinationService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private dialogRef: MatDialogRef<DestinationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { destination?: Destination; readonly?: boolean }
  ) {
    this.destinationForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data.destination) {
      this.populateForm(this.data.destination);
    }

    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isLoading = loading);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      image: [''],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: [''],
      postalCode: [''],
      latitude: [''],
      longitude: [''],
      timeZone: [''],
      currency: [''],
      climate: [''],
      bestTimeToVisit: [''],
      averageTemperature: [''],
      safetyLevel: [''],
      languages: this.fb.array([this.fb.control('')]),
      pointsOfInterest: this.fb.array([]),
      activities: this.fb.array([]),
      isActive: [true]
    });
  }

  get languages(): FormArray {
    return this.destinationForm.get('languages') as FormArray;
  }

  get pointsOfInterest(): FormArray {
    return this.destinationForm.get('pointsOfInterest') as FormArray;
  }

  get activities(): FormArray {
    return this.destinationForm.get('activities') as FormArray;
  }

  addLanguage(): void {
    this.languages.push(this.fb.control(''));
  }

  removeLanguage(index: number): void {
    if (this.languages.length > 1) {
      this.languages.removeAt(index);
    }
  }

  addPointOfInterest(): void {
    this.pointsOfInterest.push(this.fb.control(''));
  }

  removePointOfInterest(index: number): void {
    this.pointsOfInterest.removeAt(index);
  }

  addActivity(): void {
    this.activities.push(this.fb.control(''));
  }

  removeActivity(index: number): void {
    this.activities.removeAt(index);
  }

  private populateForm(destination: Destination): void {
    // Clear existing arrays
    while (this.languages.length !== 0) {
      this.languages.removeAt(0);
    }
    while (this.pointsOfInterest.length !== 0) {
      this.pointsOfInterest.removeAt(0);
    }
    while (this.activities.length !== 0) {
      this.activities.removeAt(0);
    }

    // Populate basic fields
    this.destinationForm.patchValue({
      name: destination.name,
      description: destination.description,
      image: destination.image,
      country: destination.country,
      city: destination.city,
      state: destination.state,
      postalCode: destination.postalCode,
      latitude: destination.latitude,
      longitude: destination.longitude,
      timeZone: destination.timeZone,
      currency: destination.currency,
      climate: destination.climate,
      bestTimeToVisit: destination.bestTimeToVisit,
      averageTemperature: destination.averageTemperature,
      safetyLevel: destination.safetyLevel,
      isActive: destination.isActive
    });

    // Populate languages
    if (destination.languages && destination.languages.length > 0) {
      destination.languages.forEach(language => {
        this.languages.push(this.fb.control(language));
      });
    } else {
      this.languages.push(this.fb.control(''));
    }

    // Populate points of interest
    if (destination.pointsOfInterest && destination.pointsOfInterest.length > 0) {
      destination.pointsOfInterest.forEach(poi => {
        this.pointsOfInterest.push(this.fb.control(poi));
      });
    }

    // Populate activities
    if (destination.activities && destination.activities.length > 0) {
      destination.activities.forEach(activity => {
        this.activities.push(this.fb.control(activity));
      });
    }
  }

  onSave(): void {
    if (this.destinationForm.valid) {
      this.loadingService.setLoading(true);

      const formValue = this.destinationForm.value;

      // Filter out empty values from arrays
      const destinationData = {
        ...formValue,
        languages: formValue.languages.filter((lang: string) => lang.trim()),
        pointsOfInterest: formValue.pointsOfInterest.filter((poi: string) => poi.trim()),
        activities: formValue.activities.filter((activity: string) => activity.trim())
      };

      const operation = this.data.destination
        ? this.destinationService.updateDestination(this.data.destination.id, destinationData)
        : this.destinationService.createDestination(destinationData);

      operation
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (destination) => {
            this.notificationService.showSuccess(
              `Destination ${this.data.destination ? 'updated' : 'created'} successfully`
            );
            this.dialogRef.close(destination);
          },
          error: (error) => {
            this.notificationService.showError(
              error.message || `Failed to ${this.data.destination ? 'update' : 'create'} destination`
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