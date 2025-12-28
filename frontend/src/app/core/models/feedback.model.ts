export interface Feedback {
  id: string;
  travelId: string;
  travelTitle: string;
  userId: string;
  userName: string;
  travelerName?: string;  // Alias for userName, used in admin views
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeedbackRequest {
  travelId: string;
  rating: number;
  comment: string;
}
