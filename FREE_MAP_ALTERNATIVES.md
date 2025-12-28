# Free Map API Alternatives for Travel Management System

## Option 1: OpenStreetMap + Leaflet (100% Free)

### Installation
```bash
npm install leaflet @asymmetrik/ngx-leaflet
npm install @types/leaflet --save-dev
```

### Configuration
```typescript
// app.config.ts
import { provideLeaflet } from '@asymmetrik/ngx-leaflet';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLeaflet(),
    // ... other providers
  ]
};
```

### Basic Map Component
```typescript
import { Component } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';

@Component({
  selector: 'app-osm-map',
  standalone: true,
  imports: [LeafletModule],
  template: `
    <div leaflet
         [leafletOptions]="options"
         [leafletLayers]="layers"
         (leafletMapReady)="onMapReady($event)"
         style="height: 500px;">
    </div>
  `
})
export class OsmMapComponent {
  options = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      })
    ],
    zoom: 13,
    center: L.latLng(48.8566, 2.3522) // Paris
  };

  layers: L.Layer[] = [];

  onMapReady(map: L.Map) {
    // Add markers, polylines, etc.
  }

  addMarker(lat: number, lng: number, title: string) {
    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'assets/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).bindPopup(title);

    this.layers.push(marker);
  }

  drawRoute(coordinates: [number, number][]) {
    const polyline = L.polyline(coordinates, {
      color: '#4285F4',
      weight: 5
    });

    this.layers.push(polyline);
  }
}
```

### Place Search with Nominatim
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: any;
}

@Injectable({ providedIn: 'root' })
export class NominatimService {
  private baseUrl = 'https://nominatim.openstreetmap.org';

  constructor(private http: HttpClient) {}

  search(query: string): Observable<any[]> {
    return this.http.get<NominatimResult[]>(`${this.baseUrl}/search`, {
      params: {
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5'
      },
      headers: {
        'User-Agent': 'TravelManagementSystem/1.0' // Required!
      }
    }).pipe(
      debounceTime(1000), // Rate limiting
      map(results => results.map(r => ({
        name: r.display_name,
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        address: r.display_name
      })))
    );
  }

  reverse(lat: number, lng: number): Observable<string> {
    return this.http.get<NominatimResult>(`${this.baseUrl}/reverse`, {
      params: {
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json'
      },
      headers: {
        'User-Agent': 'TravelManagementSystem/1.0'
      }
    }).pipe(
      map(result => result.display_name)
    );
  }
}
```

### Routing with OpenRouteService
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ORSRoute {
  features: Array<{
    properties: {
      summary: {
        distance: number; // meters
        duration: number; // seconds
      };
    };
    geometry: {
      coordinates: [number, number][]; // [lng, lat]
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class OpenRouteService {
  private apiKey = 'YOUR_FREE_ORS_API_KEY'; // Get from openrouteservice.org
  private baseUrl = 'https://api.openrouteservice.org/v2/directions';

  constructor(private http: HttpClient) {}

  calculateRoute(coordinates: { lat: number; lng: number }[]): Observable<any> {
    const body = {
      coordinates: coordinates.map(c => [c.lng, c.lat]) // ORS uses [lng, lat]
    };

    return this.http.post<ORSRoute>(`${this.baseUrl}/driving-car/json`, body, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(response => {
        const feature = response.features[0];
        return {
          totalDistance: feature.properties.summary.distance,
          totalDuration: Math.round(feature.properties.summary.duration / 60),
          coordinates: feature.geometry.coordinates.map(c => [c[1], c[0]]) // Convert to [lat, lng]
        };
      })
    );
  }
}
```

## Option 2: Mapbox (Generous Free Tier)

### Installation
```bash
npm install mapbox-gl @angular/google-maps
```

### Setup
```typescript
// environment.ts
export const environment = {
  mapboxToken: 'YOUR_MAPBOX_TOKEN', // Get from mapbox.com
};
```

### Map Component
```typescript
import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-mapbox-map',
  standalone: true,
  template: `<div id="map" style="height: 500px;"></div>`
})
export class MapboxMapComponent implements OnInit {
  map!: mapboxgl.Map;

  ngOnInit() {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [2.3522, 48.8566], // [lng, lat]
      zoom: 13
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl());
  }

  addMarker(lng: number, lat: number, title: string) {
    new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<h3>${title}</h3>`))
      .addTo(this.map);
  }

  drawRoute(coordinates: [number, number][]) {
    this.map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });

    this.map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#4285F4',
        'line-width': 5
      }
    });
  }
}
```

### Mapbox Geocoding Service
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MapboxGeocodingService {
  private accessToken = environment.mapboxToken;
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(private http: HttpClient) {}

  search(query: string): Observable<any[]> {
    return this.http.get(`${this.baseUrl}/${encodeURIComponent(query)}.json`, {
      params: {
        access_token: this.accessToken,
        limit: '5',
        types: 'place,poi'
      }
    }).pipe(
      map((response: any) => response.features.map((f: any) => ({
        name: f.text,
        address: f.place_name,
        longitude: f.center[0],
        latitude: f.center[1]
      })))
    );
  }

  reverse(lng: number, lat: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/${lng},${lat}.json`, {
      params: {
        access_token: this.accessToken
      }
    }).pipe(
      map((response: any) => response.features[0]?.place_name || '')
    );
  }
}
```

## Option 3: Hybrid Approach (Best of Both Worlds)

### Use Your Backend for Distance
```typescript
// Already implemented!
// services/travel-service/.../TravelService.java:520
private double calculateHaversineDistance(...)
```

### Frontend Service
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HybridMapService {
  constructor(private http: HttpClient) {}

  // Use backend for validation (FREE)
  validateRoute(stops: ItineraryStop[]): Observable<RouteInfo> {
    return this.http.post<RouteInfo>(
      '/api/v1/travels/validate-itinerary',
      { stops }
    );
  }

  // Use Leaflet for display (FREE)
  // Use Nominatim for geocoding (FREE with rate limits)
  // Use Google Places ONLY for autocomplete (minimal cost)
}
```

## Cost Comparison

| Solution | Setup Cost | Monthly Cost | Map Quality | Search Quality |
|----------|-----------|--------------|-------------|----------------|
| **Google Maps** (current) | ✅ Done | $0-5 (under $200 credit) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **OSM + Leaflet** | Medium | $0 | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Mapbox** | Easy | $0 (under limits) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Hybrid** | Hard | $0-2 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## Migration Strategy

If you decide to migrate later:

### Phase 1: Abstract map service
```typescript
export interface IMapService {
  loadMap(container: HTMLElement, center: LatLng): void;
  addMarker(lat: number, lng: number, title: string): void;
  drawRoute(coordinates: LatLng[]): void;
  search(query: string): Observable<SearchResult[]>;
}
```

### Phase 2: Implement providers
```typescript
export class GoogleMapService implements IMapService { ... }
export class LeafletMapService implements IMapService { ... }
export class MapboxMapService implements IMapService { ... }
```

### Phase 3: Configuration-based switching
```typescript
providers: [
  {
    provide: IMapService,
    useClass: environment.mapProvider === 'google'
      ? GoogleMapService
      : LeafletMapService
  }
]
```

## Recommendation

**Keep Google Maps for now**, because:

1. ✅ Already integrated and working
2. ✅ Your usage is well under free tier ($3-10/month vs $200 credit)
3. ✅ Best user experience
4. ✅ Most reliable
5. ✅ Abstract the service interface for future flexibility

**When to migrate:**
- When you exceed $200/month credit consistently (likely > 100K users)
- When you need more customization (Mapbox/Leaflet better)
- When you want zero vendor lock-in (OSM/Leaflet)

## Free Tier Monitoring

Set up billing alerts in Google Cloud Console:
1. Go to Billing → Budgets & Alerts
2. Set alert at $50, $100, $150
3. Monitor usage monthly
4. Project usage trends

You'll have plenty of warning before hitting limits!
