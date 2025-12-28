package com.travelms.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDTO {

    private Long id;
    private Long travelerId;
    private String travelerName;
    private Long travelId;
    private String travelTitle;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
