import { Component, OnInit, AfterViewInit, OnDestroy, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ManagerService } from '../../../core/services/manager.service';
import { TravelService } from '../../../core/services/travel.service';
import { LocationService } from '../../../core/services/location.service';
import { CategoryService } from '../../../core/services/category.service';
import { CreateTravelRequest } from '../../../core/models/travel.model';
import type { ICountry, IState, ICity } from 'country-state-city';
import flatpickr from 'flatpickr';

@Component({
  selector: 'app-travel-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './travel-form.component.html'
})
export class TravelFormComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private managerService = inject(ManagerService);
  private travelService = inject(TravelService);
  private locationService = inject(LocationService);
  private categoryService = inject(CategoryService);

  @ViewChild('startDateInput') startDateInput!: ElementRef;
  @ViewChild('endDateInput') endDateInput!: ElementRef;
  @ViewChild('destinationInput') destinationInput!: ElementRef;

  travelForm!: FormGroup;
  isEditMode = signal(false);
  travelId = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  submitting = signal(false);
  uploadingImages = signal(false); // Track image upload phase

  categories: string[] = [];
  countries: ICountry[] = [];
  states: IState[] = [];
  cities: ICity[] = [];
  uploadedImages: { key: string; url: string; }[] = [];
  pendingImageFiles: File[] = []; // Store files locally until travel is created
  originalImageKeys: string[] = []; // Store original image keys for update

  private startDatePicker: any;
  private endDatePicker: any;
  suggestions: any[] = [];
  showSuggestions = false;

  ngOnInit() {
    this.initForm();
    this.loadCategories();
    this.loadCountries();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'create') {
      this.isEditMode.set(true);
      this.travelId.set(id);
      this.loadTravel(id);
    }
  }

  ngAfterViewInit() {
    this.initDatePickers();
    this.initAutocomplete();
  }

  ngOnDestroy() {
    if (this.startDatePicker) {
      this.startDatePicker.destroy();
    }
    if (this.endDatePicker) {
      this.endDatePicker.destroy();
    }
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        // Fallback to default categories if API fails
        this.categories = ['Adventure', 'Beach & Coastal', 'City Tour', 'Cultural & Heritage'];
      }
    });
  }

  loadCountries() {
    this.locationService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
      },
      error: (err) => {
        console.error('Error loading countries:', err);
      }
    });
  }

  onCountryChange(countryCode: string) {
    const stateControl = this.travelForm.get('state');
    const cityControl = this.travelForm.get('city');

    // Reset dependent fields when country changes
    this.states = [];
    this.cities = [];
    this.travelForm.patchValue({ state: '', city: '' });
    stateControl?.disable();
    cityControl?.disable();

    if (!countryCode) {
      return;
    }

    console.log('Country changed to:', countryCode);

    // Load states for selected country
    this.locationService.getStatesByCountry(countryCode).subscribe({
      next: (states) => {
        this.states = states;
        if (states.length > 0) {
          stateControl?.enable();
        } else {
          // If no states, load cities directly
          this.loadCitiesForCountry(countryCode);
        }
      },
      error: (err) => {
        console.error('Error loading states:', err);
        this.states = [];
      }
    });
  }

  onStateChange(stateCode: string) {
    const cityControl = this.travelForm.get('city');
    const countryCode = this.travelForm.get('country')?.value;

    // Reset city when state changes
    this.cities = [];
    this.travelForm.patchValue({ city: '' });
    cityControl?.disable();

    if (!stateCode || !countryCode) {
      return;
    }

    console.log('=== STATE CHANGE DEBUG ===');
    console.log('State changed to:', stateCode, 'for country:', countryCode);

    this.locationService.getCitiesByState(countryCode, stateCode).subscribe({
      next: (cities) => {
        this.cities = cities;
        console.log('Loaded cities for state:', cities.length, 'cities');
        console.log('Cities list:', cities.map(c => c.name));
        console.log('===========================');
        if (cities.length > 0) {
          cityControl?.enable();
        }
      },
      error: (err) => {
        console.error('Error loading cities:', err);
        this.cities = [];
      }
    });
  }

  /**
   * Validate that the selected city belongs to the selected state/country
   */
  onCityChange(cityName: string) {
    if (!cityName) return;

    const countryCode = this.travelForm.get('country')?.value;
    const stateCode = this.travelForm.get('state')?.value;

    console.log('=== CITY CHANGE DEBUG ===');
    console.log('City changed to:', cityName);
    console.log('Current country:', countryCode);
    console.log('Current state:', stateCode);
    console.log('Available cities in dropdown:', this.cities.map(c => c.name));

    // Verify the city exists in the current list of available cities
    const cityExists = this.cities.some(c => c.name === cityName);

    console.log('City exists in current list?', cityExists);

    if (!cityExists && this.cities.length > 0) {
      console.error('❌ INVALID: Selected city does not belong to the current state/region!');
      console.log('===========================');
      // Block the invalid selection
      this.error.set('❌ Invalid selection: ' + cityName + ' is not in ' + stateCode);
      this.travelForm.patchValue({ city: '' });
      setTimeout(() => this.error.set(null), 5000);
    } else {
      console.log('✅ VALID: City selection is correct');
      console.log('===========================');
    }
  }

  private loadCitiesForCountry(countryCode: string) {
    const cityControl = this.travelForm.get('city');

    this.locationService.getCitiesByCountry(countryCode).subscribe({
      next: (cities) => {
        this.cities = cities;
        if (cities.length > 0) {
          cityControl?.enable();
        }
      },
      error: (err) => {
        console.error('Error loading cities:', err);
        this.cities = [];
      }
    });
  }

  initDatePickers() {
    if (this.startDateInput && this.endDateInput) {
      const today = new Date();

      this.startDatePicker = flatpickr(this.startDateInput.nativeElement, {
        minDate: today,
        dateFormat: 'Y-m-d',
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            const date = selectedDates[0].toISOString().split('T')[0];
            this.travelForm.patchValue({ startDate: date });

            // Update end date minimum
            if (this.endDatePicker) {
              this.endDatePicker.set('minDate', selectedDates[0]);
            }
          }
        }
      });

      this.endDatePicker = flatpickr(this.endDateInput.nativeElement, {
        minDate: today,
        dateFormat: 'Y-m-d',
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            const date = selectedDates[0].toISOString().split('T')[0];
            this.travelForm.patchValue({ endDate: date });
          }
        }
      });
    }
  }

  initAutocomplete() {
    if (!this.destinationInput) return;

    const input = this.destinationInput.nativeElement;
    let debounceTimer: any;

    // Listen to input changes
    input.addEventListener('input', (e: any) => {
      const query = e.target.value;

      if (query.length < 3) {
        this.suggestions = [];
        this.showSuggestions = false;
        return;
      }

      // Debounce API calls
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchLocation(query);
      }, 200);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e: any) => {
      if (!input.contains(e.target)) {
        this.showSuggestions = false;
      }
    });
  }

  searchLocation(query: string) {
    // Use Nominatim API (OpenStreetMap) - completely free!
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.suggestions = data.map((item: any) => ({
          display_name: item.display_name,
          address: item.address,
          lat: item.lat,
          lon: item.lon
        }));
        this.showSuggestions = this.suggestions.length > 0;
      })
      .catch(error => {
        console.error('Error fetching locations:', error);
        this.suggestions = [];
        this.showSuggestions = false;
      });
  }

  selectSuggestion(suggestion: any) {
    const address = suggestion.address;

    // Update destination field
    this.travelForm.patchValue({
      destination: suggestion.display_name
    });

    // Extract location details from Nominatim response
    // Handle cases where city/town/village might be in different fields
    const city = address.city || address.town || address.village ||
                 address.municipality || address.county || '';
    const state = address.state || address.region || '';
    const countryCode = address.country_code ? address.country_code.toUpperCase() : '';

    console.log('Selected location:', { city, state, countryCode, address });

    // Auto-select country
    if (countryCode) {
      const selectedCountry = this.countries.find(c => c.isoCode === countryCode);
      if (selectedCountry) {
        this.travelForm.patchValue({ country: selectedCountry.isoCode });
        this.onCountryChange(selectedCountry.isoCode);

        // Wait for states to load, then select state
        setTimeout(() => {
          if (state && this.states.length > 0) {
            // Try exact match first, then partial match
            let selectedState = this.states.find(s =>
              s.name.toLowerCase() === state.toLowerCase()
            );

            // If no exact match, try partial match (e.g., "Dakar Region" matches "Dakar")
            if (!selectedState) {
              selectedState = this.states.find(s =>
                s.name.toLowerCase().includes(state.toLowerCase()) ||
                state.toLowerCase().includes(s.name.toLowerCase())
              );
            }

            if (selectedState) {
              this.travelForm.patchValue({ state: selectedState.isoCode });
              this.onStateChange(selectedState.isoCode);

              // Wait for cities to load, then select city
              setTimeout(() => {
                if (city && this.cities.length > 0) {
                  // Try to find exact match
                  let selectedCity = this.cities.find(c =>
                    c.name.toLowerCase() === city.toLowerCase()
                  );

                  // If no exact match, try partial match
                  if (!selectedCity) {
                    selectedCity = this.cities.find(c =>
                      c.name.toLowerCase().includes(city.toLowerCase()) ||
                      city.toLowerCase().includes(c.name.toLowerCase())
                    );
                  }

                  if (selectedCity) {
                    this.travelForm.patchValue({ city: selectedCity.name });
                  } else {
                    console.log('City not found in list:', city, 'Available:', this.cities.map(c => c.name));
                  }
                }
              }, 500);
            } else {
              // If no state found, try to load cities directly for the country
              // and match the city name
              console.log('State not found, loading cities for country');
              this.loadCitiesForCountry(countryCode);

              setTimeout(() => {
                if (city && this.cities.length > 0) {
                  const selectedCity = this.cities.find(c =>
                    c.name.toLowerCase() === city.toLowerCase() ||
                    c.name.toLowerCase().includes(city.toLowerCase())
                  );

                  if (selectedCity) {
                    this.travelForm.patchValue({ city: selectedCity.name });
                  }
                }
              }, 500);
            }
          } else if (city) {
            // No state but we have a city - load cities for country
            this.loadCitiesForCountry(countryCode);

            setTimeout(() => {
              if (this.cities.length > 0) {
                const selectedCity = this.cities.find(c =>
                  c.name.toLowerCase() === city.toLowerCase() ||
                  c.name.toLowerCase().includes(city.toLowerCase())
                );

                if (selectedCity) {
                  this.travelForm.patchValue({ city: selectedCity.name });
                }
              }
            }, 500);
          }
        }, 500);
      }
    }

    // Hide suggestions
    this.showSuggestions = false;
  }

  initForm() {
    this.travelForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      destination: ['', [Validators.required, Validators.maxLength(200)]],
      country: [''],
      state: [{ value: '', disabled: true }],
      city: [{ value: '', disabled: true }],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      maxParticipants: [1, [Validators.required, Validators.min(1)]],
      category: ['', Validators.required],
      itinerary: [''],
      highlights: this.fb.array([]),
      images: this.fb.array([])
    });
  }

  get highlights(): FormArray {
    return this.travelForm.get('highlights') as FormArray;
  }

  get images(): FormArray {
    return this.travelForm.get('images') as FormArray;
  }

  addHighlight() {
    this.highlights.push(this.fb.control('', [Validators.required, Validators.maxLength(200)]));
  }

  removeHighlight(index: number) {
    this.highlights.removeAt(index);
  }

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error.set('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('Image size must be less than 5MB');
        return;
      }

      // Store file locally for later upload (after travel creation)
      this.pendingImageFiles.push(file);

      // Create preview URL for display
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImages.push({
          key: '', // Empty key for pending images
          url: e.target.result
        });
      };
      reader.readAsDataURL(file);

      input.value = ''; // Reset input
    }
  }

  removeImage(index: number) {
    // Check if this is an already uploaded image (has key) or a pending one
    const image = this.uploadedImages[index];
    const numExistingImages = this.images.length;

    if (image.key) {
      // Already uploaded image - find its index in the form array
      const formIndex = this.uploadedImages.slice(0, index).filter(img => img.key).length;

      // In edit mode, we can delete from MinIO immediately
      if (this.isEditMode()) {
        const imageKey = this.images.at(formIndex).value;
        this.travelService.deleteTravelImage(imageKey).subscribe({
          next: () => console.log('Image deleted from MinIO'),
          error: (err) => console.error('Error deleting image:', err)
        });
      }

      this.images.removeAt(formIndex);
    } else {
      // Pending image - find its index in pendingImageFiles
      const pendingIndex = this.uploadedImages.slice(0, index).filter(img => !img.key).length;
      this.pendingImageFiles.splice(pendingIndex, 1);
    }

    // Remove from preview array
    this.uploadedImages.splice(index, 1);
  }

  loadTravel(id: string) {
    this.loading.set(true);
    this.travelService.getTravelById(id).subscribe({
      next: (travel) => {
        // Format dates for input[type="date"]
        const startDate = travel.startDate ? new Date(travel.startDate).toISOString().split('T')[0] : '';
        const endDate = travel.endDate ? new Date(travel.endDate).toISOString().split('T')[0] : '';

        this.travelForm.patchValue({
          title: travel.title,
          description: travel.description,
          destination: travel.destination,
          country: travel.country || '',
          state: travel.state || '',
          city: travel.city || '',
          startDate: startDate,
          endDate: endDate,
          price: travel.price,
          maxParticipants: travel.maxParticipants,
          category: travel.category || '',
          itinerary: travel.itinerary || ''
        });

        // Load location dependencies if country is set
        if (travel.country) {
          this.onCountryChange(travel.country);
          // If state exists, load its cities
          if (travel.state) {
            setTimeout(() => this.onStateChange(travel.state!), 100);
          }
        }

        // Set highlights
        if (travel.highlights && travel.highlights.length > 0) {
          travel.highlights.forEach((highlight: string) => {
            this.highlights.push(this.fb.control(highlight, [Validators.required, Validators.maxLength(200)]));
          });
        }

        // Set images - populate both form array and uploaded images for preview
        // Use imageKeys for form (update), images for display
        if (travel.imageKeys && travel.imageKeys.length > 0) {
          travel.imageKeys.forEach((imageKey: string, index: number) => {
            this.images.push(this.fb.control(imageKey));
            this.originalImageKeys.push(imageKey);
            // Use presigned URL for display
            this.uploadedImages.push({
              key: imageKey,
              url: travel.images && travel.images[index] ? travel.images[index] : imageKey
            });
          });
        } else if (travel.images && travel.images.length > 0) {
          // Fallback if imageKeys not present (backward compatibility)
          travel.images.forEach((imageKey: string) => {
            this.images.push(this.fb.control(imageKey));
            this.originalImageKeys.push(imageKey);
            this.uploadedImages.push({
              key: imageKey,
              url: imageKey
            });
          });
        }

        // Update date pickers with loaded values
        if (this.startDatePicker && startDate) {
          this.startDatePicker.setDate(startDate, false);
        }
        if (this.endDatePicker && endDate) {
          this.endDatePicker.setDate(endDate, false);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load travel data');
        this.loading.set(false);
        console.error('Error loading travel:', err);
      }
    });
  }

  onSubmit() {
    if (this.travelForm.invalid) {
      Object.keys(this.travelForm.controls).forEach(key => {
        this.travelForm.get(key)?.markAsTouched();
      });
      this.highlights.controls.forEach(control => control.markAsTouched());
      return;
    }

    // Validate cover image for new travel
    if (!this.isEditMode() && this.pendingImageFiles.length === 0) {
      this.error.set('❌ Cover image is required. Please add at least one image.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.travelForm.value;

    // Ensure highlights is an array of strings, filtering out empty values
    const highlights = this.highlights.value.filter((h: string) => h && h.trim());
    const existingImages = this.images.value.filter((img: string) => img && img.trim());

    // Get disabled field values
    const stateValue = this.travelForm.get('state')?.value;
    const cityValue = this.travelForm.get('city')?.value;

    // Convert dates to ISO DateTime format (YYYY-MM-DDTHH:mm:ss)
    const startDateTime = formValue.startDate ? `${formValue.startDate}T00:00:00` : formValue.startDate;
    const endDateTime = formValue.endDate ? `${formValue.endDate}T23:59:59` : formValue.endDate;

    const request: CreateTravelRequest = {
      title: formValue.title,
      description: formValue.description,
      destination: formValue.destination,
      country: formValue.country || undefined,
      state: stateValue || undefined,
      city: cityValue || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      price: formValue.price,
      maxParticipants: formValue.maxParticipants,
      category: formValue.category || undefined,
      itinerary: formValue.itinerary || undefined,
      highlights: highlights,
      images: existingImages.length > 0 ? existingImages : undefined
    };

    console.log('Creating/Updating travel with request:', request);

    const operation = this.isEditMode()
      ? this.managerService.updateTravel(this.travelId()!, request)
      : this.managerService.createTravel(request, this.pendingImageFiles[0]); // Cover is first image

    operation.subscribe({
      next: (createdTravel) => {
        console.log('Travel created/updated:', createdTravel);

        // Check if there are pending images to upload
        const imagesToUpload = this.isEditMode()
          ? this.pendingImageFiles  // In edit mode, upload all pending images
          : this.pendingImageFiles.slice(1);  // In create mode, skip cover (already uploaded)

        if (imagesToUpload.length > 0) {
          console.log('Uploading', imagesToUpload.length, 'additional images...');
          this.uploadingImages.set(true);
          this.uploadAdditionalImages(createdTravel.id, imagesToUpload);
        } else {
          // No additional images, we're done
          this.submitting.set(false);
          this.router.navigate(['/manager/travels']);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.message || 'Failed to save travel');
        console.error('Error saving travel:', err);
      }
    });
  }

  /**
   * Upload additional images after travel creation (cover already uploaded)
   */
  private uploadAdditionalImages(travelId: string | number, additionalFiles: File[]) {
    const uploadPromises = additionalFiles.map(file =>
      this.travelService.uploadTravelImage(file).toPromise()
    );

    Promise.all(uploadPromises)
      .then(responses => {
        console.log('All additional images uploaded:', responses);

        // Extract image keys from responses
        const imageKeys = responses.map(r => r!.imageKey);

        // Get current image keys from the created travel (includes cover)
        // We need to fetch the travel to get its current image keys
        return this.travelService.getTravelById(travelId.toString()).toPromise()
          .then(travel => {
            const currentImageKeys = travel!.imageKeys || travel!.images || [];
            const allImages = [...currentImageKeys, ...imageKeys];

            console.log('Updating travel with additional images:', allImages);

            // Build complete update request
            const formValue = this.travelForm.value;
            const highlights = this.highlights.value.filter((h: string) => h && h.trim());
            const stateValue = this.travelForm.get('state')?.value;
            const cityValue = this.travelForm.get('city')?.value;
            const startDateTime = formValue.startDate ? `${formValue.startDate}T00:00:00` : formValue.startDate;
            const endDateTime = formValue.endDate ? `${formValue.endDate}T23:59:59` : formValue.endDate;

            const updateRequest: CreateTravelRequest = {
              title: formValue.title,
              description: formValue.description,
              destination: formValue.destination,
              country: formValue.country || undefined,
              state: stateValue || undefined,
              city: cityValue || undefined,
              startDate: startDateTime,
              endDate: endDateTime,
              price: formValue.price,
              maxParticipants: formValue.maxParticipants,
              category: formValue.category || undefined,
              itinerary: formValue.itinerary || undefined,
              highlights: highlights,
              images: allImages
            };

            // Update the travel with new images
            return this.managerService.updateTravel(travelId.toString(), updateRequest).toPromise();
          });
      })
      .then(() => {
        console.log('Travel updated with additional images successfully');
        this.uploadingImages.set(false);
        this.submitting.set(false);
        this.router.navigate(['/manager/travels']);
      })
      .catch(err => {
        console.error('Error uploading additional images:', err);
        this.uploadingImages.set(false);
        this.submitting.set(false);
        this.error.set('Travel created but failed to upload additional images: ' + (err.error?.error || err.message));
      });
  }

  cancel() {
    this.router.navigate(['/manager/travels']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.travelForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.travelForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
    if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength}`;
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;

    return 'Invalid value';
  }
}
