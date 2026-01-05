package com.travelms.feedback.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackStatisticsDTO {
    private Long totalFeedbacks;
    private Double averageRating;
    private Integer rating1Count;
    private Integer rating2Count;
    private Integer rating3Count;
    private Integer rating4Count;
    private Integer rating5Count;
    private Long totalTravelsWithFeedback;
    private Long totalManagers;
    private Double rating1Percentage;
    private Double rating2Percentage;
    private Double rating3Percentage;
    private Double rating4Percentage;
    private Double rating5Percentage;
}
