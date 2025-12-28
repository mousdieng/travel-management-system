import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, TravelerStatistics } from '../models';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.users.base}`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    const url = `${environment.apiUrl}${environment.endpoints.users.profile}`;
    return this.http.get<User>(url);
  }

  updateProfile(user: Partial<User>): Observable<User> {
    const url = `${environment.apiUrl}${environment.endpoints.users.update}`;
    return this.http.put<User>(url, user);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  uploadProfilePicture(file: File): Observable<{success: boolean; message: string; profileImageUrl?: string}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{success: boolean; message: string; profileImageUrl?: string}>(`${this.baseUrl}/profile/upload-picture`, formData);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/profile/change-password`, {
      currentPassword,
      newPassword
    });
  }

  getMyStatistics(): Observable<TravelerStatistics> {
    return this.http.get<TravelerStatistics>(`${this.baseUrl}/me/statistics`);
  }

  getUserStatistics(userId: number): Observable<TravelerStatistics> {
    return this.http.get<TravelerStatistics>(`${this.baseUrl}/${userId}/statistics`);
  }

  // Admin methods
  getAllUsersPaginated(page: number = 0, size: number = 20, search?: string, sortBy: string = 'createdAt', sortDir: string = 'DESC'): Observable<PagedResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PagedResponse<User>>(this.baseUrl, { params });
  }

  updateUser(userId: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${userId}`, request);
  }

  toggleUserStatus(userId: number, enabled: boolean): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${userId}/status`, null, {
      params: { enabled: enabled.toString() }
    });
  }

  deleteUserById(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}`);
  }

  // 2FA methods
  enable2FA(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${this.baseUrl}/me/enable-2fa`, {});
  }

  disable2FA(twoFactorCode: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/me/disable-2fa`, null, {
      params: { twoFactorCode }
    });
  }
}
