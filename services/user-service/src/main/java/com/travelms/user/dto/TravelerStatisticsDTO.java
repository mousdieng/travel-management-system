package com.travelms.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Statistics for a traveler including past travel participation,
 * report counts, subscription cancellations, and payment preferences
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelerStatisticsDTO {
    // Basic Info
    private Long userId;
    private String username;
    private String email;

    // Travel Participation Stats
    private Long totalSubscriptions;
    private Long activeSubscriptions;
    private Long completedTravels;
    private Long upcomingTravels;
    private Long cancelledSubscriptions;

    // Financial Stats
    private BigDecimal totalSpent;
    private String preferredPaymentMethod;

    // Feedback Stats
    private Long feedbacksGiven;
    private Double averageRatingGiven;

    // Report Stats
    private Long reportsFiledByUser;
    private Long reportsAgainstUser;

    // Engagement Stats
    private Long wishlistCount;
    private String memberSince;
    private String lastActivityDate;
}
