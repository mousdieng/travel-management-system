import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Country, State, City } from 'country-state-city';
import type { ICountry, IState, ICity } from 'country-state-city';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  /**
   * Get all countries
   */
  getCountries(): Observable<ICountry[]> {
    const countries = Country.getAllCountries();
    return of(countries.sort((a, b) => a.name.localeCompare(b.name)));
  }

  /**
   * Get states/provinces for a specific country
   */
  getStatesByCountry(countryCode: string): Observable<IState[]> {
    const states = State.getStatesOfCountry(countryCode);
    return of(states.sort((a, b) => a.name.localeCompare(b.name)));
  }

  /**
   * Get cities for a specific state
   */
  getCitiesByState(countryCode: string, stateCode: string): Observable<ICity[]> {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    return of(cities.sort((a, b) => a.name.localeCompare(b.name)));
  }

  /**
   * Get all cities for a country (if no state selected)
   */
  getCitiesByCountry(countryCode: string): Observable<ICity[]> {
    const cities = City.getCitiesOfCountry(countryCode) || [];
    return of(cities.sort((a, b) => a.name.localeCompare(b.name)));
  }
}
