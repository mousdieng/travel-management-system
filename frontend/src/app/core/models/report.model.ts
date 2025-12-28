export interface Report {
  id: number;
  reporterId: number;
  reporterName: string;
  reportedUserId?: number;
  reportedTravelId?: number;
  reportType: ReportType;
  reason: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

export enum ReportType {
  TRAVEL_MANAGER = 'TRAVEL_MANAGER',
  TRAVELER = 'TRAVELER',
  TRAVEL = 'TRAVEL'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export interface CreateReportRequest {
  reportType: ReportType;
  reportedUserId?: number;
  reportedTravelId?: number;
  reason: string;
}
