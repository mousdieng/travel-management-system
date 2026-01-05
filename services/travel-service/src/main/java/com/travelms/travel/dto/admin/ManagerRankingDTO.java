package com.travelms.travel.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerRankingDTO {
    private Long managerId;
    private String managerName;
    private String managerEmail;
    private Integer totalTravels;
    private Integer activeTravels;
    private Double averageRating;
    private Long totalBookings;
    private Double totalRevenue;
    private Double performanceScore;
    private Integer rank;
}
