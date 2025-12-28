# Google Maps Itinerary Integration Guide

## 🗺️ Overview

This guide covers the complete implementation of Google Maps integration for travel itinerary planning and validation in the Travel Management System. The feature prevents users from creating invalid travel routes by validating locations, calculating distances, and displaying routes on an interactive map.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Setup Instructions](#setup-instructions)
6. [User Flow](#user-flow)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Map Integration
✅ Interactive Google Maps display
✅ Drag-and-drop markers
✅ Real-time route visualization
✅ Place search with autocomplete
✅ Custom marker icons (start, waypoint, end)

### Route Validation
✅ Validates stop sequence and order
✅ Calculates total distance and duration
✅ Uses Google Directions API
✅ Prevents invalid coordinates
✅ Backend validation with Haversine formula

### User Experience
✅ Search locations by name
✅ Add/remove/reorder stops
✅ Visual route summary
✅ Mobile responsive design
✅ Loading states and error handling

---

## 🏗️ Architecture

### Frontend (Angular)
```
frontend/src/app/
├── core/
│   ├── models/
│   │   └── travel.model.ts           # ItineraryStop, RouteInfo interfaces
│   └── services/
│       └── itinerary.service.ts      # Google Maps API integration
└── shared/
    └── components/
        └── itinerary-map/
            ├── itinerary-map.component.ts
            ├── itinerary-map.component.html
            └── itinerary-map.component.css
```

### Backend (Spring Boot)
```
services/travel-service/src/main/java/com/travelms/travel/
├── controller/
│   └── TravelController.java          # /validate-itinerary endpoint
├── service/
│   └── TravelService.java             # Validation logic
├── dto/
│   ├── ItineraryStopDTO.java
│   ├── RouteInfoDTO.java
│   └── ValidateItineraryRequest.java
└── model/entity/
    └── Travel.java                    # itineraryStopsJson, routeInfoJson fields
```

---

## 🎨 Frontend Implementation

### 1. Dependencies

**Package**: `@angular/google-maps@17.3.0`

```bash
npm install @angular/google-maps@17.3.0 --legacy-peer-deps
```

**Module Import** (in component):
```typescript
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  imports: [CommonModule, ReactiveFormsModule, GoogleMapsModule],
  // ...
})
```

### 2. Environment Configuration

**File**: `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9080',
  googleMapsApiKey: 'AIzaSy...',  // Your API key
  // ...
};
```

### 3. Load Google Maps Script

**File**: `frontend/src/index.html`

```html
<head>
  <!-- Add before closing head tag -->
  <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSy...&libraries=places"></script>
</head>
```

### 4. Data Models

**File**: `frontend/src/app/core/models/travel.model.ts`

```typescript
export interface ItineraryStop {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  order: number;
  arrivalTime?: Date;
  departureTime?: Date;
  durationMinutes?: number;
  description?: string;
  type: 'START' | 'WAYPOINT' | 'END';
}

export interface RouteInfo {
  totalDistance: number;      // in meters
  totalDuration: number;       // in minutes
  isValid: boolean;
  waypoints: ItineraryStop[];
  encodedPolyline?: string;
}
```

### 5. Itinerary Service

**File**: `frontend/src/app/core/services/itinerary.service.ts`

**Key Methods**:

```typescript
// Validate complete route
validateRoute(stops: ItineraryStop[]): Observable<RouteInfo>

// Calculate route using Google Directions API
private calculateRoute(stops: ItineraryStop[]): Observable<RouteInfo>

// Convert address to coordinates
geocodeAddress(address: string): Observable<{ lat: number; lng: number }>

// Convert coordinates to address
reverseGeocode(lat: number, lng: number): Observable<string>

// Calculate distance between two points
calculateDistance(lat1, lon1, lat2, lon2): number

// Format utilities
formatDistance(meters: number): string
formatDuration(minutes: number): string
```

### 6. Map Component Usage

**In Travel Form Component**:

```typescript
import { ItineraryMapComponent } from '@shared/components/itinerary-map/itinerary-map.component';

@Component({
  imports: [ItineraryMapComponent],
  // ...
})
export class TravelFormComponent {
  itineraryStops: ItineraryStop[] = [];
  routeInfo?: RouteInfo;

  onStopsChange(stops: ItineraryStop[]) {
    this.itineraryStops = stops;
    // Update form or state
  }

  onRouteInfoChange(info: RouteInfo) {
    this.routeInfo = info;
    // Store route info for submission
  }
}
```

**In Template**:

```html
<app-itinerary-map
  [itineraryStops]="itineraryStops"
  [readonly]="false"
  (stopsChange)="onStopsChange($event)"
  (routeInfoChange)="onRouteInfoChange($event)">
</app-itinerary-map>
```

---

## 🔧 Backend Implementation

### 1. DTOs

#### ItineraryStopDTO.java
```java
@Data
@Builder
public class ItineraryStopDTO {
    private Long id;
    @NotBlank private String name;
    @NotBlank private String address;
    @NotNull private Double latitude;
    @NotNull private Double longitude;
    @NotNull private Integer order;
    private LocalDateTime arrivalTime;
    private LocalDateTime departureTime;
    private Integer durationMinutes;
    private String description;
    @NotNull private StopType type;

    public enum StopType {
        START, WAYPOINT, END
    }
}
```

#### RouteInfoDTO.java
```java
@Data
@Builder
public class RouteInfoDTO {
    @NotNull private Long totalDistance;       // meters
    @NotNull private Integer totalDuration;    // minutes
    @NotNull private Boolean isValid;
    private List<ItineraryStopDTO> waypoints;
    private String encodedPolyline;

    public String getFormattedDistance() {
        return totalDistance < 1000
            ? totalDistance + " m"
            : String.format("%.2f km", totalDistance / 1000.0);
    }

    public String getFormattedDuration() {
        if (totalDuration < 60) return totalDuration + " min";
        int hours = totalDuration / 60;
        int minutes = totalDuration % 60;
        return minutes > 0 ? hours + "h " + minutes + "min" : hours + "h";
    }
}
```

### 2. Travel Entity Updates

**File**: `Travel.java`

```java
@Entity
@Table(name = "travels")
public class Travel {
    // ... existing fields

    @Column(columnDefinition = "TEXT")
    private String itineraryStopsJson;

    @Column(columnDefinition = "TEXT")
    private String routeInfoJson;

    // ... rest of entity
}
```

### 3. Validation Endpoint

**File**: `TravelController.java`

```java
@PostMapping("/validate-itinerary")
@PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
@Operation(summary = "Validate travel itinerary")
public ResponseEntity<?> validateItinerary(
    @Valid @RequestBody ValidateItineraryRequest request) {
    try {
        RouteInfoDTO routeInfo = travelService.validateItinerary(request.getStops());
        return ResponseEntity.ok(routeInfo);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", "Failed to validate itinerary: " + e.getMessage()));
    }
}
```

### 4. Validation Logic

**File**: `TravelService.java`

```java
public RouteInfoDTO validateItinerary(List<ItineraryStopDTO> stops) {
    // 1. Validate minimum stops
    if (stops == null || stops.size() < 2) {
        throw new BadRequestException("At least 2 stops required");
    }

    // 2. Sort by order
    stops.sort((a, b) -> Integer.compare(a.getOrder(), b.getOrder()));

    // 3. Validate stop types
    if (stops.get(0).getType() != StopType.START) {
        throw new BadRequestException("First stop must be START");
    }
    if (stops.get(stops.size() - 1).getType() != StopType.END) {
        throw new BadRequestException("Last stop must be END");
    }

    // 4. Validate order sequence (0, 1, 2, ...)
    for (int i = 0; i < stops.size(); i++) {
        if (stops.get(i).getOrder() != i) {
            throw new BadRequestException("Stop order must be sequential");
        }
    }

    // 5. Validate coordinates
    for (ItineraryStopDTO stop : stops) {
        if (stop.getLatitude() < -90 || stop.getLatitude() > 90) {
            throw new BadRequestException("Invalid latitude: " + stop.getName());
        }
        if (stop.getLongitude() < -180 || stop.getLongitude() > 180) {
            throw new BadRequestException("Invalid longitude: " + stop.getName());
        }
    }

    // 6. Calculate distance using Haversine
    long totalDistance = 0;
    int totalDuration = 0;

    for (int i = 0; i < stops.size() - 1; i++) {
        double distance = calculateHaversineDistance(
            stops.get(i).getLatitude(), stops.get(i).getLongitude(),
            stops.get(i + 1).getLatitude(), stops.get(i + 1).getLongitude()
        );
        totalDistance += (long) distance;
        totalDuration += (int) (distance / 1000 / 60 * 60); // 60 km/h average
    }

    return RouteInfoDTO.builder()
        .totalDistance(totalDistance)
        .totalDuration(totalDuration)
        .isValid(true)
        .waypoints(stops)
        .build();
}
```

---

## 🚀 Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
4. Create API key (Credentials > Create Credentials > API Key)
5. Restrict API key (optional but recommended)

### 2. Configure Frontend

**Update environment.ts**:
```typescript
export const environment = {
  googleMapsApiKey: 'YOUR_API_KEY_HERE'
};
```

**Update index.html**:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"></script>
```

### 3. Install Dependencies

```bash
cd frontend
npm install @angular/google-maps@17.3.0 --legacy-peer-deps
```

### 4. Build & Run

**Backend**:
```bash
cd services/travel-service
mvn clean install
mvn spring-boot:run
```

**Frontend**:
```bash
cd frontend
npm start
```

---

## 🎯 User Flow

### Creating Travel with Itinerary

1. **Navigate to Create Travel**
   - Travel Manager logs in
   - Goes to "Create Travel" page

2. **Fill Basic Information**
   - Title, description, dates, price, etc.

3. **Add Itinerary Stops**
   - Scroll to "Itinerary" section
   - See interactive map component
   - Click "Add Stop" button

4. **Search for Location**
   - Type location name in search box
   - See autocomplete suggestions
   - Click on desired location

5. **View on Map**
   - Location added as marker
   - Map centers on new location
   - Marker color indicates type (green=start, blue=waypoint, red=end)

6. **Add More Stops**
   - Repeat search process
   - Each stop automatically numbered
   - Types updated automatically (START → WAYPOINT → END)

7. **Validate Route**
   - Frontend calls Google Directions API
   - Draws route line on map
   - Shows distance and duration
   - Backend validates data integrity

8. **Reorder Stops (Optional)**
   - Click ↑ or ↓ buttons to reorder
   - Route updates automatically
   - Order numbers update

9. **Remove Stops (Optional)**
   - Click × button to remove
   - Remaining stops renumber
   - Route recalculates

10. **Submit Travel**
    - itineraryStopsJson stored in database
    - routeInfoJson stored in database
    - Travel created successfully

### Viewing Travel Itinerary

1. **Open Travel Details**
   - Any user can view published travels

2. **See Itinerary Tab**
   - Map shows complete route
   - All stops marked
   - Route line displayed
   - Distance/duration summary

3. **Interactive Viewing**
   - Map is readonly (no editing)
   - Can zoom and pan
   - Can click markers for details

---

## 📡 API Reference

### POST /api/v1/travels/validate-itinerary

Validates a travel itinerary and returns route information.

**Authentication**: Required (ADMIN or TRAVEL_MANAGER)

**Request Body**:
```json
{
  "stops": [
    {
      "name": "Eiffel Tower",
      "address": "Champ de Mars, Paris, France",
      "latitude": 48.8584,
      "longitude": 2.2945,
      "order": 0,
      "type": "START",
      "description": "Starting point"
    },
    {
      "name": "Louvre Museum",
      "address": "Rue de Rivoli, Paris, France",
      "latitude": 48.8606,
      "longitude": 2.3376,
      "order": 1,
      "type": "END"
    }
  ]
}
```

**Success Response** (200 OK):
```json
{
  "totalDistance": 3500,
  "totalDuration": 45,
  "isValid": true,
  "waypoints": [
    {
      "id": null,
      "name": "Eiffel Tower",
      "address": "Champ de Mars, Paris, France",
      "latitude": 48.8584,
      "longitude": 2.2945,
      "order": 0,
      "durationMinutes": 45,
      "type": "START"
    },
    {
      "id": null,
      "name": "Louvre Museum",
      "address": "Rue de Rivoli, Paris, France",
      "latitude": 48.8606,
      "longitude": 2.3376,
      "order": 1,
      "type": "END"
    }
  ],
  "formattedDistance": "3.50 km",
  "formattedDuration": "45 min"
}
```

**Error Responses**:

- **400 Bad Request** - Invalid stops data
  ```json
  {
    "error": "At least 2 stops are required for route validation"
  }
  ```

- **400 Bad Request** - Invalid stop type
  ```json
  {
    "error": "First stop must be of type START"
  }
  ```

- **401 Unauthorized** - Missing or invalid JWT token

- **403 Forbidden** - User not authorized (not ADMIN or TRAVEL_MANAGER)

---

## 🔍 Troubleshooting

### Issue: "Google is not defined"

**Cause**: Google Maps script not loaded

**Solution**:
1. Check `index.html` has script tag
2. Verify API key is valid
3. Check browser console for loading errors
4. Ensure script loads before Angular app initializes

```html
<!-- Correct placement in index.html -->
<head>
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places"></script>
</head>
```

### Issue: Map not displaying

**Cause**: Missing GoogleMapsModule import

**Solution**:
```typescript
@Component({
  imports: [GoogleMapsModule], // Add this
  // ...
})
```

### Issue: "This API project is not authorized to use this API"

**Cause**: Required APIs not enabled

**Solution**:
1. Go to Google Cloud Console
2. Enable: Maps JavaScript API, Places API, Directions API
3. Wait a few minutes for propagation

### Issue: Autocomplete not working

**Cause**: Places library not loaded

**Solution**:
```html
<!-- Add libraries=places parameter -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places"></script>
```

### Issue: Backend validation fails

**Cause**: Stops not in correct order or invalid types

**Solution**: Ensure:
- First stop has `type: "START"`
- Last stop has `type: "END"`
- Middle stops have `type: "WAYPOINT"`
- Order field is sequential: 0, 1, 2, ...
- Latitude between -90 and 90
- Longitude between -180 and 180

### Issue: Route line not showing

**Cause**: Less than 2 stops

**Solution**: Add at least 2 stops before route can be drawn

### Issue: "Cannot read property 'googleMap' of undefined"

**Cause**: Accessing map before ViewInit

**Solution**:
```typescript
ngAfterViewInit() {
  // Initialize Google services here
  this.initializeGoogleServices();
}
```

---

## 📊 Database Schema

### Travels Table Updates

```sql
ALTER TABLE travels
ADD COLUMN itinerary_stops_json TEXT,
ADD COLUMN route_info_json TEXT;
```

**itinerary_stops_json** example:
```json
[
  {
    "id": 1,
    "name": "Eiffel Tower",
    "address": "Champ de Mars, Paris, France",
    "latitude": 48.8584,
    "longitude": 2.2945,
    "order": 0,
    "type": "START"
  },
  {
    "id": 2,
    "name": "Louvre Museum",
    "address": "Rue de Rivoli, Paris, France",
    "latitude": 48.8606,
    "longitude": 2.3376,
    "order": 1,
    "type": "END"
  }
]
```

**route_info_json** example:
```json
{
  "totalDistance": 3500,
  "totalDuration": 45,
  "isValid": true,
  "encodedPolyline": "..."
}
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Search for location by name
- [ ] Select location from autocomplete
- [ ] Location appears on map
- [ ] Marker shows with correct color
- [ ] Add second location
- [ ] Route line appears
- [ ] Distance/duration calculated
- [ ] Reorder stops with ↑↓ buttons
- [ ] Route updates after reorder
- [ ] Remove stop
- [ ] Remaining stops renumber
- [ ] Validate route button works
- [ ] Backend validation passes
- [ ] Submit travel with itinerary
- [ ] View travel shows itinerary map
- [ ] Readonly mode works (no editing)
- [ ] Mobile responsive layout

### Test Data

**Valid Test Route** (Paris):
```typescript
[
  {
    name: "Eiffel Tower",
    address: "Champ de Mars, 5 Avenue Anatole France, Paris",
    latitude: 48.8584,
    longitude: 2.2945,
    order: 0,
    type: "START"
  },
  {
    name: "Arc de Triomphe",
    address: "Place Charles de Gaulle, Paris",
    latitude: 48.8738,
    longitude: 2.2950,
    order: 1,
    type: "WAYPOINT"
  },
  {
    name: "Louvre Museum",
    address: "Rue de Rivoli, Paris",
    latitude: 48.8606,
    longitude: 2.3376,
    order: 2,
    type: "END"
  }
]
```

---

## 🎓 Best Practices

### Frontend

1. **Always initialize Google services after view init**
   ```typescript
   ngAfterViewInit() {
     this.initializeGoogleServices();
   }
   ```

2. **Handle null checks for Google objects**
   ```typescript
   if (typeof google !== 'undefined') {
     // Use Google API
   }
   ```

3. **Debounce search input**
   ```typescript
   searchQuery$.pipe(
     debounceTime(300),
     switchMap(query => this.search(query))
   )
   ```

4. **Clean up subscriptions**
   ```typescript
   ngOnDestroy() {
     this.destroy$.next();
     this.destroy$.complete();
   }
   ```

### Backend

1. **Validate all input data**
   - Check stop count
   - Validate coordinates
   - Verify order sequence
   - Check stop types

2. **Store as JSON for flexibility**
   - Easier to update schema
   - No extra tables needed
   - Queryable with JSON functions

3. **Provide both validation methods**
   - Frontend: Google Directions API (accurate)
   - Backend: Haversine formula (fast, offline)

4. **Return helpful error messages**
   ```java
   throw new BadRequestException(
     "Invalid latitude for stop: " + stop.getName()
   );
   ```

---

## 📚 Additional Resources

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Angular Google Maps](https://github.com/angular/components/tree/main/src/google-maps)
- [Places Autocomplete](https://developers.google.com/maps/documentation/javascript/places-autocomplete)
- [Directions Service](https://developers.google.com/maps/documentation/javascript/directions)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

---

## ✅ Summary

You now have a complete Google Maps integration that:

- **Validates** travel itineraries
- **Prevents** invalid routes
- **Calculates** distances and durations
- **Displays** routes interactively
- **Provides** great user experience

**Frontend**: Interactive map component with search and validation
**Backend**: Validation endpoint with coordinate checking
**Integration**: Complete end-to-end itinerary planning

The feature is production-ready and fully integrated into your Travel Management System! 🎉
