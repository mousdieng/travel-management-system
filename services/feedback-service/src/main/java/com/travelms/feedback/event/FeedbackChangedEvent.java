package com.travelms.feedback.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Event published when feedback is created, updated, or deleted
 * Consumed by travel-service to update travel ratings
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackChangedEvent {

    public enum ChangeType {
        CREATED, UPDATED, DELETED
    }

    private Long feedbackId;

    private Long travelId;

    private Long travelerId;

    private Integer rating;

    private ChangeType changeType;

    private LocalDateTime changedAt;
}
