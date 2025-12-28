import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ItineraryStop, RouteInfo } from '../models/travel.model';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {
  private baseUrl = `${environment.apiUrl}/travels`;
  private directionsService: any;
  private geocoder: any;

  constructor(private http: HttpClient) {
    this.initializeGoogleServices();
  }

  private initializeGoogleServices() {
    if (typeof google !== 'undefined') {
      this.directionsService = new google.maps.DirectionsService();
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Validate a complete itinerary route
   */
  validateRoute(stops: ItineraryStop[]): Observable<RouteInfo> {
    if (stops.length < 2) {
      return of({
        totalDistance: 0,
        totalDuration: 0,
        isValid: false,
        waypoints: stops
      });
    }

    // Use Google Maps Directions API to validate and calculate route
    return this.calculateRoute(stops);
  }

  /**
   * Calculate route using Google Maps Directions API
   */
  private calculateRoute(stops: ItineraryStop[]): Observable<RouteInfo> {
    if (!this.directionsService) {
      this.initializeGoogleServices();
    }

    const origin = { lat: stops[0].latitude, lng: stops[0].longitude };
    const destination = {
      lat: stops[stops.length - 1].latitude,
      lng: stops[stops.length - 1].longitude
    };

    const waypoints = stops.slice(1, -1).map(stop => ({
      location: { lat: stop.latitude, lng: stop.longitude },
      stopover: true
    }));

    const request = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    };

    return from(
      new Promise<RouteInfo>((resolve, reject) => {
        this.directionsService.route(request, (result: any, status: any) => {
          if (status === google.maps.DirectionsStatus.OK) {
            const route = result.routes[0];
            let totalDistance = 0;
            let totalDuration = 0;

            route.legs.forEach((leg: any) => {
              totalDistance += leg.distance.value;
              totalDuration += leg.duration.value;
            });

            // Update stops with calculated durations
            const updatedStops = stops.map((stop, index) => {
              if (index < route.legs.length) {
                return {
                  ...stop,
                  durationMinutes: Math.round(route.legs[index].duration.value / 60)
                };
              }
              return stop;
            });

            resolve({
              totalDistance,
              totalDuration: Math.round(totalDuration / 60),
              isValid: true,
              waypoints: updatedStops,
              encodedPolyline: route.overview_polyline
            });
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      })
    ).pipe(
      catchError(error => {
        console.error('Route calculation error:', error);
        return of({
          totalDistance: 0,
          totalDuration: 0,
          isValid: false,
          waypoints: stops
        });
      })
    );
  }

  /**
   * Geocode an address to get coordinates
   */
  geocodeAddress(address: string): Observable<{ lat: number; lng: number }> {
    if (!this.geocoder) {
      this.initializeGoogleServices();
    }

    return from(
      new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        this.geocoder.geocode({ address }, (results: any, status: any) => {
          if (status === google.maps.GeocoderStatus.OK && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      })
    ).pipe(
      catchError(error => {
        console.error('Geocoding error:', error);
        throw error;
      })
    );
  }

  /**
   * Reverse geocode coordinates to get address
   */
  reverseGeocode(lat: number, lng: number): Observable<string> {
    if (!this.geocoder) {
      this.initializeGoogleServices();
    }

    return from(
      new Promise<string>((resolve, reject) => {
        this.geocoder.geocode(
          { location: { lat, lng } },
          (results: any, status: any) => {
            if (status === google.maps.GeocoderStatus.OK && results[0]) {
              resolve(results[0].formatted_address);
            } else {
              reject(new Error(`Reverse geocoding failed: ${status}`));
            }
          }
        );
      })
    ).pipe(
      catchError(error => {
        console.error('Reverse geocoding error:', error);
        return of('Unknown location');
      })
    );
  }

  /**
   * Validate itinerary with backend
   */
  validateItineraryWithBackend(stops: ItineraryStop[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/validate-itinerary`, { stops });
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
  }

  /**
   * Format duration for display
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
  }
}
