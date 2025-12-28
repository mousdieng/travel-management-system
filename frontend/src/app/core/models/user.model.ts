export enum UserRole {
  ADMIN = 'ADMIN',
  TRAVEL_MANAGER = 'TRAVEL_MANAGER',
  TRAVELER = 'TRAVELER'
}

export const UserRoleLabels = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.TRAVEL_MANAGER]: 'Travel Manager',
  [UserRole.TRAVELER]: 'Traveler'
};

export const UserRoleDescriptions = {
  [UserRole.TRAVEL_MANAGER]: 'Create and manage travel offerings, view analytics and subscriber lists',
  [UserRole.TRAVELER]: 'Browse travels, subscribe to trips, and provide feedback'
};

export interface User {
  id: string | number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole | string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  phone?: string;  // Alias for phoneNumber
  profileImage?: string;
  enabled?: boolean;
  isActive?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  requiresTwoFactor?: boolean;
  twoFactorQrCode?: string;
}
