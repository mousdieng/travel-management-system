import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { GoogleMapsModule, MapDirectionsService, GoogleMap } from '@angular/google-maps';
import { Subject, takeUntil } from 'rxjs';
import { ItineraryStop, RouteInfo } from '../../../core/models/travel.model';
import { ItineraryService } from '../../../core/services/itinerary.service';
import { NotificationService } from '../../../core/services/notification.service';

declare var google: any;

@Component({
  selector: 'app-itinerary-map',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GoogleMapsModule],
  templateUrl: './itinerary-map.component.html',
  styleUrls: ['./itinerary-map.component.css']
})
export class ItineraryMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() itineraryStops: ItineraryStop[] = [];
  @Input() readonly = false;
  @Output() stopsChange = new EventEmitter<ItineraryStop[]>();
  @Output() routeInfoChange = new EventEmitter<RouteInfo>();
  @ViewChild(GoogleMap) map!: GoogleMap;

  private destroy$ = new Subject<void>();

  // Map configuration
  mapCenter: google.maps.LatLngLiteral = { lat: 40.7128, lng: -74.0060 }; // Default: New York
  mapZoom = 6;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: true
  };

  // Markers
  markers: google.maps.LatLngLiteral[] = [];
  markerOptions: google.maps.MarkerOptions = {
    draggable: !this.readonly
  };

  // Route
  directionsResults?: google.maps.DirectionsResult;
  routeInfo?: RouteInfo;

  // Form
  stopsForm!: FormGroup;
  isValidating = false;
  showAddStopForm = false;
  searchQuery = '';

  // Autocomplete
  autocompleteService: any;
  placesService: any;
  searchResults: any[] = [];

  constructor(
    private fb: FormBuilder,
    private itineraryService: ItineraryService,
    private notificationService: NotificationService,
    private mapDirectionsService: MapDirectionsService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.initializeMap();

    if (this.itineraryStops.length > 0) {
      this.loadStops(this.itineraryStops);
    }
  }

  ngAfterViewInit() {
    this.initializeGoogleServices();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm() {
    this.stopsForm = this.fb.group({
      stops: this.fb.array([])
    });
  }

  get stops(): FormArray {
    return this.stopsForm.get('stops') as FormArray;
  }

  initializeMap() {
    // Set initial center if stops exist
    if (this.itineraryStops.length > 0) {
      const firstStop = this.itineraryStops[0];
      this.mapCenter = { lat: firstStop.latitude, lng: firstStop.longitude };
      this.mapZoom = 10;
    }
  }

  initializeGoogleServices() {
    if (typeof google !== 'undefined') {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      if (this.map && this.map.googleMap) {
        this.placesService = new google.maps.places.PlacesService(this.map.googleMap);
      }
    }
  }

  loadStops(stops: ItineraryStop[]) {
    // Clear existing
    while (this.stops.length > 0) {
      this.stops.removeAt(0);
    }

    // Add stops to form
    stops.forEach(stop => {
      this.stops.push(this.createStopForm(stop));
      this.markers.push({ lat: stop.latitude, lng: stop.longitude });
    });

    // Validate and draw route
    if (stops.length >= 2) {
      this.validateRoute();
    }
  }

  createStopForm(stop?: ItineraryStop): FormGroup {
    const orderNumber = this.stops.length;
    return this.fb.group({
      id: [stop?.id],
      name: [stop?.name || '', Validators.required],
      address: [stop?.address || '', Validators.required],
      latitude: [stop?.latitude || 0, Validators.required],
      longitude: [stop?.longitude || 0, Validators.required],
      order: [stop?.order ?? orderNumber],
      type: [stop?.type || (orderNumber === 0 ? 'START' : 'WAYPOINT')],
      description: [stop?.description || '']
    });
  }

  addStop() {
    this.showAddStopForm = true;
  }

  searchPlaces() {
    if (!this.searchQuery || this.searchQuery.length < 3) {
      this.searchResults = [];
      return;
    }

    if (!this.autocompleteService) {
      this.initializeGoogleServices();
    }

    this.autocompleteService.getPlacePredictions(
      { input: this.searchQuery },
      (predictions: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          this.searchResults = predictions;
        } else {
          this.searchResults = [];
        }
      }
    );
  }

  selectPlace(place: any) {
    if (!this.placesService) {
      this.initializeGoogleServices();
    }

    this.placesService.getDetails(
      { placeId: place.place_id },
      (placeDetails: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const location = placeDetails.geometry.location;
          const newStop: ItineraryStop = {
            name: placeDetails.name,
            address: placeDetails.formatted_address,
            latitude: location.lat(),
            longitude: location.lng(),
            order: this.stops.length,
            type: this.stops.length === 0 ? 'START' : 'WAYPOINT'
          };

          // Add to form
          this.stops.push(this.createStopForm(newStop));

          // Add marker
          this.markers.push({ lat: newStop.latitude, lng: newStop.longitude });

          // Center map on new point
          this.mapCenter = { lat: newStop.latitude, lng: newStop.longitude };
          this.mapZoom = 12;

          // Validate route if we have at least 2 stops
          if (this.stops.length >= 2) {
            // Update last stop type
            if (this.stops.length > 1) {
              this.stops.at(this.stops.length - 1).patchValue({ type: 'END' });
              if (this.stops.length > 2) {
                this.stops.at(this.stops.length - 2).patchValue({ type: 'WAYPOINT' });
              }
            }

            this.validateRoute();
          }

          // Reset search
          this.searchQuery = '';
          this.searchResults = [];
          this.showAddStopForm = false;
        }
      }
    );
  }

  removeStop(index: number) {
    this.stops.removeAt(index);
    this.markers.splice(index, 1);

    // Update order numbers
    this.stops.controls.forEach((control, i) => {
      control.patchValue({ order: i });

      // Update types
      if (i === 0) {
        control.patchValue({ type: 'START' });
      } else if (i === this.stops.length - 1) {
        control.patchValue({ type: 'END' });
      } else {
        control.patchValue({ type: 'WAYPOINT' });
      }
    });

    // Revalidate route
    if (this.stops.length >= 2) {
      this.validateRoute();
    } else {
      this.directionsResults = undefined;
      this.routeInfo = undefined;
    }

    this.emitChanges();
  }

  moveStopUp(index: number) {
    if (index === 0) return;

    const stop = this.stops.at(index);
    const prevStop = this.stops.at(index - 1);

    // Swap form controls
    this.stops.removeAt(index);
    this.stops.insert(index - 1, stop);

    // Swap markers
    [this.markers[index], this.markers[index - 1]] = [this.markers[index - 1], this.markers[index]];

    // Update orders and types
    this.updateStopOrdersAndTypes();

    // Revalidate
    this.validateRoute();
  }

  moveStopDown(index: number) {
    if (index === this.stops.length - 1) return;

    const stop = this.stops.at(index);

    // Swap form controls
    this.stops.removeAt(index);
    this.stops.insert(index + 1, stop);

    // Swap markers
    [this.markers[index], this.markers[index + 1]] = [this.markers[index + 1], this.markers[index]];

    // Update orders and types
    this.updateStopOrdersAndTypes();

    // Revalidate
    this.validateRoute();
  }

  updateStopOrdersAndTypes() {
    this.stops.controls.forEach((control, i) => {
      control.patchValue({ order: i });

      if (i === 0) {
        control.patchValue({ type: 'START' });
      } else if (i === this.stops.length - 1) {
        control.patchValue({ type: 'END' });
      } else {
        control.patchValue({ type: 'WAYPOINT' });
      }
    });
  }

  validateRoute() {
    if (this.stops.length < 2) {
      this.notificationService.showWarning('At least 2 stops are required to create a route');
      return;
    }

    this.isValidating = true;

    const stopsData: ItineraryStop[] = this.stops.value;

    this.itineraryService.validateRoute(stopsData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (routeInfo) => {
          this.routeInfo = routeInfo;
          this.isValidating = false;

          if (routeInfo.isValid) {
            // Draw route on map
            this.drawRoute(stopsData);
            this.notificationService.showSuccess('Route validated successfully!');

            // Emit route info
            this.routeInfoChange.emit(routeInfo);
          } else {
            this.notificationService.showError('Invalid route. Please check your stops.');
          }

          this.emitChanges();
        },
        error: (error) => {
          this.isValidating = false;
          this.notificationService.showError('Failed to validate route');
          console.error(error);
        }
      });
  }

  drawRoute(stops: ItineraryStop[]) {
    if (stops.length < 2) return;

    const origin = { lat: stops[0].latitude, lng: stops[0].longitude };
    const destination = {
      lat: stops[stops.length - 1].latitude,
      lng: stops[stops.length - 1].longitude
    };

    const waypoints = stops.slice(1, -1).map(stop => ({
      location: { lat: stop.latitude, lng: stop.longitude },
      stopover: true
    }));

    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.mapDirectionsService.route(request).subscribe({
      next: (response) => {
        this.directionsResults = response.result;
      },
      error: (error) => {
        console.error('Directions error:', error);
      }
    });
  }

  emitChanges() {
    const stopsData: ItineraryStop[] = this.stops.value;
    this.stopsChange.emit(stopsData);
  }

  cancelAdd() {
    this.showAddStopForm = false;
    this.searchQuery = '';
    this.searchResults = [];
  }

  getMarkerIcon(index: number): google.maps.Icon {
    const isStart = index === 0;
    const isEnd = index === this.stops.length - 1;

    return {
      url: isStart
        ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        : isEnd
        ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      scaledSize: new google.maps.Size(40, 40)
    };
  }
}
