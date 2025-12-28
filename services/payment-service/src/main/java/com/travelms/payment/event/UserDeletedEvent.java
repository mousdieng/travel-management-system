package com.travelms.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Event received when a user is deleted
 * Triggers cascade delete of user's payments and payment methods
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
