export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  profilePicture?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  roles: Role[];
  role?: string; // Primary role for form compatibility
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive?: boolean;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  roleIds: number[];
  sendWelcomeEmail?: boolean;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roleIds?: number[];
  isActive?: boolean;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emailVerified?: boolean;
  role?: string;
}

export interface UserSearchParams {
  search?: string;
  status?: string;
  roleId?: number;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}