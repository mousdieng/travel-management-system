import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Subject, takeUntil } from 'rxjs';

import { BookingService } from '../../../core/services/booking.service';
import { TravelService } from '../../../core/services/travel.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PassengerType, CreateBookingRequest, Passenger } from '../../../core/models/booking.model';
import { Travel, TravelStatus } from '../../../core/models/travel.model';

@Component({
  selector: 'app-booking-create',
  templateUrl: './booking-create.component.html',
  styleUrls: ['./booking-create.component.scss']
})
export class BookingCreateComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild('stepper') stepper!: MatStepper;

  // Form groups
  travelFormGroup!: FormGroup;
  passengersFormGroup!: FormGroup;
  reviewFormGroup!: FormGroup;

  // Data
  selectedTravel: Travel | null = null;
  travels: Travel[] = [];
  isLoadingTravels = false;
  isSubmitting = false;

  // Passenger types
  passengerTypes = [
    { value: PassengerType.ADULT, label: 'Adult', icon: 'person', minAge: 18 },
    { value: PassengerType.CHILD, label: 'Child', icon: 'child_care', minAge: 2, maxAge: 17 },
    { value: PassengerType.INFANT, label: 'Infant', icon: 'baby_changing_station', minAge: 0, maxAge: 1 },
    { value: PassengerType.SENIOR, label: 'Senior', icon: 'elderly', minAge: 65 }
  ];

  // Pricing calculation
  calculatedPricing: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private travelService: TravelService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadTravels();
    this.checkPreselectedTravel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    // Step 1: Select Travel
    this.travelFormGroup = this.fb.group({
      travelId: ['', Validators.required],
      numberOfPassengers: [1, [Validators.required, Validators.min(1), Validators.max(20)]]
    });

    // Step 2: Passenger Details
    this.passengersFormGroup = this.fb.group({
      passengers: this.fb.array([]),
      specialRequests: ['']
    });

    // Step 3: Review
    this.reviewFormGroup = this.fb.group({
      agreedToTerms: [false, Validators.requiredTrue],
      notes: ['']
    });

    // Watch for travel selection changes
    this.travelFormGroup.get('travelId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(travelId => {
        if (travelId) {
          this.onTravelSelected(travelId);
        }
      });

    // Watch for passenger count changes
    this.travelFormGroup.get('numberOfPassengers')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.updatePassengerForms(count);
      });
  }

  loadTravels(): void {
    this.isLoadingTravels = true;

    this.travelService.getAllTravels({ status: [TravelStatus.PUBLISHED] })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.travels = response.travels || [];
          this.isLoadingTravels = false;
        },
        error: (error) => {
          this.isLoadingTravels = false;
          this.notificationService.showError('Failed to load available travels');
        }
      });
  }

  checkPreselectedTravel(): void {
    const travelId = this.route.snapshot.queryParamMap.get('travelId');
    if (travelId) {
      this.travelFormGroup.patchValue({ travelId });
    }
  }

  onTravelSelected(travelId: string): void {
    const travel = this.travels.find(t => t.id === travelId);
    if (travel) {
      this.selectedTravel = travel;
      this.checkAvailability();
    }
  }

  checkAvailability(): void {
    if (!this.selectedTravel) return;

    const numberOfPassengers = this.travelFormGroup.get('numberOfPassengers')?.value || 1;

    this.bookingService.checkAvailability(this.selectedTravel.id, numberOfPassengers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (availability) => {
          if (!availability.isAvailable) {
            this.notificationService.showWarning(
              `Only ${availability.availableSeats} seats available for this travel`
            );
          }
        },
        error: (error) => {
          this.notificationService.showError('Failed to check availability');
        }
      });
  }

  updatePassengerForms(count: number): void {
    const passengersArray = this.passengers;
    const currentCount = passengersArray.length;

    if (count > currentCount) {
      // Add new passenger forms
      for (let i = currentCount; i < count; i++) {
        passengersArray.push(this.createPassengerForm());
      }
    } else if (count < currentCount) {
      // Remove excess passenger forms
      for (let i = currentCount - 1; i >= count; i--) {
        passengersArray.removeAt(i);
      }
    }

    this.calculatePricing();
  }

  createPassengerForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      passportNumber: [''],
      nationality: [''],
      type: [PassengerType.ADULT, Validators.required],
      specialRequirements: ['']
    });
  }

  get passengers(): FormArray {
    return this.passengersFormGroup.get('passengers') as FormArray;
  }

  getPassengerFormGroup(index: number): FormGroup {
    return this.passengers.at(index) as FormGroup;
  }

  addPassenger(): void {
    const currentCount = this.travelFormGroup.get('numberOfPassengers')?.value || 0;
    this.travelFormGroup.patchValue({ numberOfPassengers: currentCount + 1 });
  }

  removePassenger(index: number): void {
    if (this.passengers.length > 1) {
      const currentCount = this.travelFormGroup.get('numberOfPassengers')?.value || 0;
      this.travelFormGroup.patchValue({ numberOfPassengers: currentCount - 1 });
    }
  }

  calculatePricing(): void {
    if (!this.selectedTravel) return;

    const numberOfPassengers = this.travelFormGroup.get('numberOfPassengers')?.value || 1;
    const basePrice = this.selectedTravel.price || 0;

    // Simple pricing calculation (can be enhanced with backend call)
    const subtotal = basePrice * numberOfPassengers;
    const taxes = subtotal * 0.1; // 10% tax
    const fees = 25; // Flat service fee
    const total = subtotal + taxes + fees;

    this.calculatedPricing = {
      basePrice: basePrice,
      numberOfPassengers: numberOfPassengers,
      subtotal: subtotal,
      taxes: taxes,
      fees: fees,
      totalAmount: total,
      currency: this.selectedTravel.currency || 'USD'
    };
  }

  goToNextStep(): void {
    if (this.stepper.selectedIndex === 0 && this.travelFormGroup.valid) {
      this.calculatePricing();
      this.stepper.next();
    } else if (this.stepper.selectedIndex === 1 && this.passengersFormGroup.valid) {
      this.stepper.next();
    }
  }

  goToPreviousStep(): void {
    this.stepper.previous();
  }

  submitBooking(): void {
    if (!this.travelFormGroup.valid || !this.passengersFormGroup.valid || !this.reviewFormGroup.valid) {
      this.notificationService.showError('Please complete all required fields');
      return;
    }

    this.isSubmitting = true;

    const bookingRequest: CreateBookingRequest = {
      travelId: this.travelFormGroup.get('travelId')?.value,
      passengers: this.passengers.value,
      specialRequests: this.passengersFormGroup.get('specialRequests')?.value,
      notes: this.reviewFormGroup.get('notes')?.value
    };

    this.bookingService.createBooking(bookingRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (booking) => {
          this.isSubmitting = false;
          this.notificationService.showSuccess('Booking created successfully!');
          this.router.navigate(['/bookings', booking.id]);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.notificationService.showError(
            error.error?.message || 'Failed to create booking. Please try again.'
          );
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/bookings']);
  }

  // Utility methods

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getTravelDuration(travel: Travel): number {
    if (!travel.startDate || !travel.endDate) return 0;
    const start = new Date(travel.startDate);
    const end = new Date(travel.endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isStepValid(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0:
        return this.travelFormGroup.valid;
      case 1:
        return this.passengersFormGroup.valid;
      case 2:
        return this.reviewFormGroup.valid;
      default:
        return false;
    }
  }

  getPassengerTypeLabel(type: PassengerType): string {
    const passengerType = this.passengerTypes.find(pt => pt.value === type);
    return passengerType?.label || type;
  }
}
