package com.travelms.feedback.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Event received when a user is deleted
 * Triggers cascade delete of user's feedbacks and reports
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeletedEvent {

    private Long userId;

    private String email;

    private String role;

    private LocalDateTime deletedAt;

    private Long deletedBy;
}
