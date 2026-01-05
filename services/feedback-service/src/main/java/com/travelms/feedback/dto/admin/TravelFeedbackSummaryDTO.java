package com.travelms.feedback.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelFeedbackSummaryDTO {
    private Long travelId;
    private String travelTitle;
    private String category;
    private Integer feedbackCount;
    private Double averageRating;
}
