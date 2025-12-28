import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse, UserRole, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.auth.login}`.replace('/login', '');
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenKey = 'travelms_token';
  private refreshTokenKey = 'travelms_refresh_token';
  private userKey = 'travelms_user';

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userJson = localStorage.getItem(this.userKey);

    console.log('[AuthService] Loading user from storage');
    console.log('[AuthService] Token exists:', !!token);
    console.log('[AuthService] User JSON exists:', !!userJson);

    if (token && this.isTokenValid(token)) {
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          console.log('[AuthService] User data loaded from storage:', userData);
          this.currentUserSubject.next(userData);
          this.isAuthenticated.set(true);
        } catch (error) {
          console.error('[AuthService] Error parsing user JSON:', error);
          // If parsing fails, fall back to extracting from token
          const userData = this.extractUserFromToken(token);
          if (userData) {
            console.log('[AuthService] User data extracted from token:', userData);
            this.currentUserSubject.next(userData);
            this.isAuthenticated.set(true);
          }
        }
      } else {
        // No user JSON, try to extract from token
        const userData = this.extractUserFromToken(token);
        if (userData) {
          console.log('[AuthService] User data extracted from token (no stored user):', userData);
          this.currentUserSubject.next(userData);
          this.isAuthenticated.set(true);
        }
      }
    } else {
      console.log('[AuthService] No valid token found');
    }
  }

  initializeUserProfile(): void {
    // Fetch fresh user data from API to get updated profile info
    if (this.isAuthenticated()) {
      this.fetchCurrentUserProfile().subscribe({
        next: () => {
          // User data updated successfully
        },
        error: () => {
          // Keep using cached data if API call fails
        }
      });
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  private extractUserFromToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || payload.userId,
        username: payload.username,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        phoneNumber: payload.phoneNumber,
        profileImage: payload.profileImage,
        enabled: payload.enabled !== false,
        isActive: payload.enabled !== false,
        createdAt: payload.iat ? new Date(payload.iat * 1000) : undefined,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const url = `${environment.apiUrl}${environment.endpoints.auth.login}`;
    return this.http.post<ApiResponse<AuthResponse>>(url, credentials)
      .pipe(
        tap(response => {
          const requiresTwoFactor = response.data.requiresTwoFactor;
          if (!requiresTwoFactor && response.data.token) {
            this.setAuthData(response.data.token, response.data.refreshToken || '', response.data.user);
          }
        }),
        map(response => response.data),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    const url = `${environment.apiUrl}${environment.endpoints.auth.register}`;
    return this.http.post<ApiResponse<AuthResponse>>(url, userData)
      .pipe(
        tap(response => {
          console.log('Register response:', response.data);
          if (response.data.token) {
            this.setAuthData(response.data.token, response.data.refreshToken || '', response.data.user);
          }
        }),
        map(response => response.data),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    // this.router.navigate(['/auth/login']);
  }

  private setAuthData(token: string, refreshToken: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticated.set(true);

  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string | number | undefined {
    return this.getCurrentUser()?.id;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    // Handle both enum and string role types
    return user.role === role || user.role === role.toString();
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isManager(): boolean {
    return this.hasRole(UserRole.TRAVEL_MANAGER);
  }

  isTraveler(): boolean {
    return this.hasRole(UserRole.TRAVELER);
  }

  fetchCurrentUserProfile(): Observable<User> {
    const url = `${environment.apiUrl}${environment.endpoints.users.profile}`;
    return this.http.get<User>(url)
      .pipe(
        tap(user => {
          // Update the stored user data with fresh profile info
          const currentToken = this.getToken();
          const currentRefreshToken = this.getRefreshToken();
          if (currentToken && currentRefreshToken) {
            this.setAuthData(currentToken, currentRefreshToken, user);
          }
        }),
        catchError(error => {
          console.error('Error fetching current user profile:', error);
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    const url = `${environment.apiUrl}${environment.endpoints.auth.refresh}`;
    return this.http.post<ApiResponse<AuthResponse>>(url, { refreshToken })
      .pipe(
        tap(response => {
          if (response.data.token) {
            this.setAuthData(response.data.token, response.data.refreshToken || '', response.data.user);
          }
        }),
        map(response => response.data),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  updateUser(user: User): void {
    const currentToken = this.getToken();
    const currentRefreshToken = this.getRefreshToken();
    if (currentToken && currentRefreshToken) {
      this.setAuthData(currentToken, currentRefreshToken, user);
    }
  }
}
