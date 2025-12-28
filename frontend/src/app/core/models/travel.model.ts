export enum TravelStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface Travel {
  id: string;
  title: string;
  description: string;
  destination: string;
  country: string;
  state: string;
  city: string;
  startDate: string;
  endDate: string;
  departureDate: string;
  returnDate: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  travelManagerId: number;
  travelManagerName: string;
  managerId: string;
  managerName: string;
  category: string;
  highlights: string[];
  included: string[];
  excluded: string[];
  averageRating: number;
  totalReviews: number;
  totalFeedbacks: number;
  active: boolean;
  createdAt: string;
  status: TravelStatus;
  images: string[];
  imageKeys: string[];
  itinerary: any; // Or a more specific type if you have it
}

export interface CreateTravelRequest {
  title: string;
  description: string;
  destination: string;
  country?: string;
  state?: string;
  city?: string;
  startDate: string;
  endDate: string;
  price: number;
  maxParticipants: number;
  category?: string;
  itinerary?: string;
  highlights?: string[];
  images?: string[];
}

export interface ManagerStats {
  totalTravels: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  activeTravels: number;
  totalSubscribers: number;
  recentSubscriptions: number;
  totalFeedbacks: number;
  upcomingTravels: number;
}

export interface TravelSubscriber {
  id: string;
  userId: string;
  travelId: string;
  bookingDate: string;
  travelerAvatar: string;
  travelerName: string;
  travelerEmail: string;
  numberOfParticipants: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  subscribedAt: string;
  travelerPhone: string;
}

export interface TravelFeedback {
  id: string;
  travelId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  travelerAvatar: string;
  travelerName: string;
  travelTitle: string;
}

export interface TravelSearchCriteria {
  query?: string;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface TravelDocument {
  id: string;
  title: string;
  description: string;
  destination: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  travelManagerId: number;
  travelManagerName: string;
  category: string;
  highlights: string[];
  averageRating: number;
  totalReviews: number;
  active: boolean;
  createdAt: string;
}