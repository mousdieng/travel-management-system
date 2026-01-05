package com.travelms.feedback.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelFeedbackGroupDTO {
    private Long travelId;
    private String travelTitle;
    private String category;
    private Long managerId;
    private String managerName;
    private Integer totalFeedbacks;
    private Double averageRating;
    private Integer rating1Count;
    private Integer rating2Count;
    private Integer rating3Count;
    private Integer rating4Count;
    private Integer rating5Count;
    private List<FeedbackSummaryDTO> recentFeedbacks;
}
