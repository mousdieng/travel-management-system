package com.travelms.travel.dto;

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
public class ManagerTravelStatsDTO {

    private Long managerId;

    // Travel counts
    private Long totalTravels;
    private Long activeTravels;
    private Long completedTravels;
    private Long upcomingTravels;

    // Participant stats
    private Long totalParticipants;
    private Long activeSubscribers;
    private Long cancelledSubscribers;
    private Long completedSubscribers;

    // Rating stats
    private Double averageRating;
    private Long totalReviews;

    // Revenue potential (price * participants for completed/active travels)
    private BigDecimal totalRevenuePotential;

    // Category breakdown
    private Map<String, Long> travelsByCategory;

    // Top performing travels
    private List<TravelPerformanceDTO> topPerformingTravels;

    // Monthly stats
    private List<MonthlyTravelStatsDTO> monthlyStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TravelPerformanceDTO {
        private Long travelId;
        private String title;
        private String destination;
        private Integer participants;
        private Integer maxParticipants;
        private Double occupancyRate;
        private Double averageRating;
        private Integer totalReviews;
        private BigDecimal price;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTravelStatsDTO {
        private String month;
        private Integer year;
        private Long travelsCreated;
        private Long subscribersGained;
        private BigDecimal revenueGenerated;
    }
}
