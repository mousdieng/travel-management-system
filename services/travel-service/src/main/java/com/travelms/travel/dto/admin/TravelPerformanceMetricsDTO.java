package com.travelms.travel.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelPerformanceMetricsDTO {
    private Long travelId;
    private String title;
    private String category;
    private String status;
    private Long managerId;
    private String managerName;
    private Double averageRating;
    private Integer totalBookings;
    private Double totalRevenue;
    private Integer capacity;
    private Double bookingRate; // Percentage of capacity booked
    private Integer totalReviews;
}
