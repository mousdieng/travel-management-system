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
public class ManagerRankingDTO {

    private Long managerId;
    private String managerName;
    private String email;
    private String profileImage;

    // Performance metrics
    private Long totalTravelsOrganized;
    private Long completedTravels;
    private Long activeTravels;
    private BigDecimal totalIncome;
    private BigDecimal lastMonthIncome;
    private BigDecimal last3MonthsIncome;

    // Feedback metrics
    private Double averageRating;
    private Long totalReviews;
    private Long totalParticipants;

    // Report metrics
    private Long reportsReceived;

    // Calculated performance score
    private Double performanceScore;
    private Integer rank;
}
