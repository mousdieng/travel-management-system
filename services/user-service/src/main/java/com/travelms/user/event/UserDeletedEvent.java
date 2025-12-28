package com.travelms.user.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Event published when a user is deleted
 * Consumed by other services to cascade delete related data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeletedEvent {

    private Long userId;

    private String email;

    private String role; // TRAVELER, TRAVEL_MANAGER, ADMIN

    private LocalDateTime deletedAt;

    /**
     * The user ID of the admin who performed the deletion
     * Null if user deleted themselves
     */
    private Long deletedBy;
}
