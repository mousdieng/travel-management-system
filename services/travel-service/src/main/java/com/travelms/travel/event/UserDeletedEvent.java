package com.travelms.travel.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Event received when a user is deleted
 * Triggers cascade delete of user's travels and subscriptions
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

    private Long deletedBy;
}
