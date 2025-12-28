import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LoadingState {
  [key: string]: boolean;
}

/**
 * Loading service that manages loading states for different parts of the application.
 * Supports global loading state and individual loading states for specific operations.
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingStates$ = new BehaviorSubject<LoadingState>({});

  // Public observables
  public readonly isLoading$ = this.loadingStates$.pipe(
    map(states => Object.values(states).some(loading => loading))
  );

  /**
   * Set loading state for a specific key
   */
  setLoading(loading: boolean, key: string = 'default'): void {
    const currentStates = this.loadingStates$.value;

    if (loading) {
      this.loadingStates$.next({
        ...currentStates,
        [key]: true
      });
    } else {
      const newStates = { ...currentStates };
      delete newStates[key];
      this.loadingStates$.next(newStates);
    }
  }

  /**
   * Get loading state for a specific key
   */
  isLoading(key: string): Observable<boolean> {
    return this.loadingStates$.pipe(
      map(states => states[key] || false)
    );
  }

  /**
   * Check if any loading state is active
   */
  isAnyLoading(): Observable<boolean> {
    return this.isLoading$;
  }

  /**
   * Get all loading states
   */
  getAllLoadingStates(): Observable<LoadingState> {
    return this.loadingStates$.asObservable();
  }

  /**
   * Clear all loading states
   */
  clearAllLoading(): void {
    this.loadingStates$.next({});
  }

  /**
   * Clear loading state for a specific key
   */
  clearLoading(key: string): void {
    this.setLoading(false, key);
  }

  /**
   * Start loading for a specific operation
   */
  startLoading(key: string): void {
    this.setLoading(true, key);
  }

  /**
   * Stop loading for a specific operation
   */
  stopLoading(key: string): void {
    this.setLoading(false, key);
  }

  /**
   * Execute an operation with loading state management
   */
  async withLoading<T>(key: string, operation: () => Promise<T>): Promise<T> {
    try {
      this.startLoading(key);
      return await operation();
    } finally {
      this.stopLoading(key);
    }
  }

  /**
   * Show global loading state (convenience method)
   */
  show(): void {
    this.startLoading(LoadingService.KEYS.GLOBAL);
  }

  /**
   * Hide global loading state (convenience method)
   */
  hide(): void {
    this.stopLoading(LoadingService.KEYS.GLOBAL);
  }

  /**
   * Common loading keys for different operations
   */
  static readonly KEYS = {
    GLOBAL: 'global',
    AUTH: 'auth',
    LOGIN: 'login',
    LOGOUT: 'logout',
    REGISTER: 'register',
    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password',
    CHANGE_PASSWORD: 'change-password',
    VERIFY_EMAIL: 'verify-email',
    REFRESH_TOKEN: 'refresh-token',

    // User operations
    LOAD_USERS: 'load-users',
    CREATE_USER: 'create-user',
    UPDATE_USER: 'update-user',
    DELETE_USER: 'delete-user',
    LOAD_USER_PROFILE: 'load-user-profile',
    UPDATE_USER_PROFILE: 'update-user-profile',

    // Travel operations
    LOAD_TRAVELS: 'load-travels',
    CREATE_TRAVEL: 'create-travel',
    UPDATE_TRAVEL: 'update-travel',
    DELETE_TRAVEL: 'delete-travel',
    LOAD_TRAVEL_DETAILS: 'load-travel-details',

    // Payment operations
    LOAD_PAYMENTS: 'load-payments',
    CREATE_PAYMENT: 'create-payment',
    PROCESS_PAYMENT: 'process-payment',
    CANCEL_PAYMENT: 'cancel-payment',
    REFUND_PAYMENT: 'refund-payment',
    CAPTURE_PAYMENT: 'capture-payment',
    VOID_PAYMENT: 'void-payment',
    LOAD_PAYMENT_METHODS: 'load-payment-methods',

    // Dashboard operations
    LOAD_DASHBOARD_DATA: 'load-dashboard-data',
    LOAD_ANALYTICS: 'load-analytics',
    LOAD_STATISTICS: 'load-statistics',

    // File operations
    UPLOAD_FILE: 'upload-file',
    DOWNLOAD_FILE: 'download-file',
    DELETE_FILE: 'delete-file',

    // Settings operations
    LOAD_SETTINGS: 'load-settings',
    SAVE_SETTINGS: 'save-settings',

    // Export operations
    EXPORT_DATA: 'export-data',
    IMPORT_DATA: 'import-data'
  } as const;
}