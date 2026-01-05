package com.travelms.travel.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnderperformingTravelDTO {
    private Long travelId;
    private String title;
    private String category;
    private Long managerId;
    private String managerName;
    private Double averageRating;
    private Integer totalBookings;
    private Integer capacity;
    private Double bookingRate; // Percentage of capacity booked
    private String reason; // Why it's underperforming
}
