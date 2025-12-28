import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Travel,
  CreateTravelRequest,
  Subscription,
  CreateSubscriptionRequest,
  Feedback,
  CreateFeedbackRequest,
  User
} from '../models';

/**
 * AdminActionsService
 *
 * Provides admin with full power to perform actions on behalf of managers and travelers.
 * This service enables admins to:
 * - Create travels for managers
 * - Subscribe users to travels
 * - Create feedback as users
 * - Manage subscriptions
 * - Update user profiles
 */
@Injectable({
  providedIn: 'root'
})
export class AdminActionsService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============================================
  // TRAVEL MANAGEMENT (AS MANAGER)
  // ============================================

  /**
   * Create a travel package on behalf of a manager
   *
   * @param managerId - The ID of the manager who will own this travel
   * @param travelData - The travel package details
   * @returns Observable of the created Travel
   */
  createTravelForManager(managerId: number, travelData: CreateTravelRequest): Observable<Travel> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/travels/manager/${managerId}`;
    return this.http.post<Travel>(url, travelData);
  }

  /**
   * Update a travel package on behalf of a manager
   *
   * @param travelId - The travel ID to update
   * @param managerId - The manager ID (for authorization check)
   * @param updates - Partial travel data to update
   * @returns Observable of the updated Travel
   */
  updateTravelForManager(travelId: string, managerId: number, updates: Partial<Travel>): Observable<Travel> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/travels/${travelId}/manager/${managerId}`;
    return this.http.put<Travel>(url, updates);
  }

  /**
   * Delete a travel package (admin override)
   *
   * @param travelId - The travel ID to delete
   * @returns Observable of void
   */
  deleteTravelAsAdmin(travelId: string): Observable<void> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/travels/${travelId}`;
    return this.http.delete<void>(url);
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT (AS TRAVELER)
  // ============================================

  /**
   * Subscribe a user to a travel package
   *
   * @param userId - The ID of the user to subscribe
   * @param travelId - The ID of the travel package
   * @param subscriptionData - Subscription details (participants count, etc.)
   * @returns Observable of the created Subscription
   */
  subscribeUserToTravel(
    userId: number,
    travelId: string,
    subscriptionData: CreateSubscriptionRequest
  ): Observable<Subscription> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/subscriptions/user/${userId}/travel/${travelId}`;
    return this.http.post<Subscription>(url, subscriptionData);
  }

  /**
   * Cancel a subscription on behalf of a user
   *
   * @param subscriptionId - The subscription ID to cancel
   * @param userId - The user ID (for authorization check)
   * @returns Observable of void
   */
  cancelSubscriptionForUser(subscriptionId: string, userId: number): Observable<void> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/subscriptions/${subscriptionId}/user/${userId}`;
    return this.http.delete<void>(url);
  }

  /**
   * Get all subscriptions for a specific user
   *
   * @param userId - The user ID
   * @returns Observable of Subscription array
   */
  getUserSubscriptions(userId: number): Observable<Subscription[]> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/subscriptions/user/${userId}`;
    return this.http.get<Subscription[]>(url);
  }

  // ============================================
  // FEEDBACK MANAGEMENT (AS TRAVELER)
  // ============================================

  /**
   * Create feedback on behalf of a user
   *
   * @param userId - The ID of the user who will own this feedback
   * @param travelId - The travel ID to review
   * @param feedbackData - The feedback content and rating
   * @returns Observable of the created Feedback
   */
  createFeedbackForUser(
    userId: number,
    travelId: string,
    feedbackData: CreateFeedbackRequest
  ): Observable<Feedback> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/feedbacks/user/${userId}/travel/${travelId}`;
    return this.http.post<Feedback>(url, feedbackData);
  }

  /**
   * Update feedback on behalf of a user
   *
   * @param feedbackId - The feedback ID to update
   * @param userId - The user ID (for authorization check)
   * @param updates - Partial feedback data to update
   * @returns Observable of the updated Feedback
   */
  updateFeedbackForUser(
    feedbackId: string,
    userId: number,
    updates: Partial<Feedback>
  ): Observable<Feedback> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/feedbacks/${feedbackId}/user/${userId}`;
    return this.http.put<Feedback>(url, updates);
  }

  /**
   * Delete feedback (admin override)
   *
   * @param feedbackId - The feedback ID to delete
   * @returns Observable of void
   */
  deleteFeedbackAsAdmin(feedbackId: string): Observable<void> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/feedbacks/${feedbackId}`;
    return this.http.delete<void>(url);
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Update any user's profile (admin override)
   *
   * @param userId - The user ID to update
   * @param updates - Partial user data to update
   * @returns Observable of the updated User
   */
  updateUserProfile(userId: number, updates: Partial<User>): Observable<User> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/users/${userId}`;
    return this.http.put<User>(url, updates);
  }

  /**
   * Change user's role (admin only)
   *
   * @param userId - The user ID
   * @param newRole - The new role ('TRAVELER', 'MANAGER', 'ADMIN')
   * @returns Observable of the updated User
   */
  changeUserRole(userId: number, newRole: string): Observable<User> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/users/${userId}/role`;
    return this.http.patch<User>(url, { role: newRole });
  }

  /**
   * Activate or deactivate a user account
   *
   * @param userId - The user ID
   * @param active - Whether to activate (true) or deactivate (false)
   * @returns Observable of the updated User
   */
  setUserActiveStatus(userId: number, active: boolean): Observable<User> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/users/${userId}/status`;
    return this.http.patch<User>(url, { active });
  }

  /**
   * Reset user's password (admin override)
   *
   * @param userId - The user ID
   * @param newPassword - The new password
   * @returns Observable of success response
   */
  resetUserPassword(userId: number, newPassword: string): Observable<{ message: string }> {
    const url = `${this.baseUrl}${environment.endpoints.admin.base}/users/${userId}/password`;
    return this.http.patch<{ message: string }>(url, { password: newPassword });
  }
}
