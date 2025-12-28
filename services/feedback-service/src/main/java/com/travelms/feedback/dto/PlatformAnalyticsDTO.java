package com.travelms.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformAnalyticsDTO {

    // User statistics
    private Long totalUsers;
    private Long totalManagers;
    private Long totalTravelers;
    private Long totalAdmins;
    private Long newUsersThisMonth;

    // Travel statistics
    private Long totalTravels;
    private Long activeTravels;
    private Long upcomingTravels;
    private Long ongoingTravels;
    private Long completedTravels;

    // Financial statistics
    private BigDecimal totalPlatformIncome;
    private BigDecimal thisMonthIncome;
    private BigDecimal lastMonthIncome;
    private BigDecimal last3MonthsIncome;
    private BigDecimal last6MonthsIncome;
    private BigDecimal last12MonthsIncome;

    // Payment statistics
    private Long totalPayments;
    private Long completedPayments;
    private Long pendingPayments;
    private Long failedPayments;

    // Feedback statistics
    private Long totalFeedbacks;
    private Double averagePlatformRating;

    // Report statistics
    private Long totalReports;
    private Long pendingReports;
    private Long resolvedReports;
    private Long rejectedReports;

    // Monthly breakdown
    private List<MonthlyIncomeDTO> monthlyIncomeBreakdown;

    // Category statistics
    private Map<String, Long> travelsByCategory;
    private Map<String, BigDecimal> incomeByCategory;
}
