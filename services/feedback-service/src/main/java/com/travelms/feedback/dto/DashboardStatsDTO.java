package com.travelms.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {

    // Common stats
    private Long totalTravels;
    private Long activeTravels;
    private Long completedTravels;

    // Traveler stats
    private Long totalSubscriptions;
    private Long reportsFiled;

    // Manager stats
    private BigDecimal totalIncome;
    private BigDecimal lastMonthIncome;
    private Long totalParticipants;
    private Double averageRating;
    private Long totalReviews;
    private Long reportsReceived;

    // Admin stats
    private Long totalUsers;
    private Long totalManagers;
    private Long totalTravelers;
    private BigDecimal platformIncome;
    private Long pendingReports;
    private Long totalFeedbacks;
    private Double averagePlatformRating;
}
