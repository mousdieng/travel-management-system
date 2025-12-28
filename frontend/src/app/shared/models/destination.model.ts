export interface Destination {
  id: string;
  name: string;
  description: string;
  image?: string;

  // Location
  country: string;
  city: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timeZone?: string;

  // Travel Information
  currency?: string;
  climate?: string;
  bestTimeToVisit?: string;
  averageTemperature?: number;
  safetyLevel?: 'very_safe' | 'safe' | 'moderate' | 'caution' | 'unsafe';

  // Culture and Activities
  languages?: string[];
  pointsOfInterest?: string[];
  activities?: string[];

  // Status
  isActive: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface DestinationCreateRequest {
  name: string;
  description: string;
  image?: string;
  country: string;
  city: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timeZone?: string;
  currency?: string;
  climate?: string;
  bestTimeToVisit?: string;
  averageTemperature?: number;
  safetyLevel?: string;
  languages?: string[];
  pointsOfInterest?: string[];
  activities?: string[];
  isActive?: boolean;
}

export interface DestinationUpdateRequest extends Partial<DestinationCreateRequest> {}

export interface DestinationSearchCriteria {
  query?: string;
  country?: string;
  climate?: string;
  safetyLevel?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface DestinationListResponse {
  destinations: Destination[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}