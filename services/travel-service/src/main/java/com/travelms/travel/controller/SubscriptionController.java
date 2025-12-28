package com.travelms.travel.controller;

import com.travelms.travel.dto.SubscriptionDTO;
import com.travelms.travel.security.JwtAuthenticationFilter;
import com.travelms.travel.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Subscription Controller with role-based access control
 * - All authenticated users can subscribe/unsubscribe (TRAVELER permission)
 * - ADMIN and TRAVEL_MANAGER can view and manage subscribers
 * - TRAVEL_MANAGER can only manage subscribers for their own travels
 */
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscription Management", description = "APIs for managing travel subscriptions")
@SecurityRequirement(name = "bearerAuth")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    /**
     * Extract user ID from SecurityContext
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getDetails() instanceof JwtAuthenticationFilter.UserAuthenticationDetails) {
            JwtAuthenticationFilter.UserAuthenticationDetails details =
                (JwtAuthenticationFilter.UserAuthenticationDetails) authentication.getDetails();
            return Long.parseLong(details.getUserId());
        }
        throw new RuntimeException("User not authenticated or user ID not found");
    }

    /**
     * Extract username from SecurityContext
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            return authentication.getName();
        }
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a new subscription (All authenticated users)")
    public ResponseEntity<SubscriptionDTO> createSubscription(@RequestBody com.travelms.travel.dto.CreateSubscriptionRequest request) {
        Long userId = getCurrentUserId();
        String userName = getCurrentUsername();
        SubscriptionDTO subscription = subscriptionService.createSubscription(request, userId, userName);
        return new ResponseEntity<>(subscription, HttpStatus.CREATED);
    }

    @PostMapping("/subscribe/{travelId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Subscribe to a travel (All authenticated users) - Simple version")
    public ResponseEntity<SubscriptionDTO> subscribe(@PathVariable Long travelId) {
        Long userId = getCurrentUserId();
        String userName = getCurrentUsername();
        SubscriptionDTO subscription = subscriptionService.subscribe(travelId, userId, userName);
        return new ResponseEntity<>(subscription, HttpStatus.CREATED);
    }

    @DeleteMapping("/{subscriptionId}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel a subscription (User can cancel their own subscription)")
    public ResponseEntity<Void> cancelSubscription(@PathVariable Long subscriptionId) {
        Long userId = getCurrentUserId();
        subscriptionService.cancelSubscription(subscriptionId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get subscription by ID")
    public ResponseEntity<SubscriptionDTO> getSubscriptionById(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id, userId));
    }

    @GetMapping("/my-subscriptions")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user's subscriptions")
    public ResponseEntity<List<SubscriptionDTO>> getMySubscriptions() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(subscriptionService.getUserSubscriptions(userId));
    }

    @GetMapping("/my-subscriptions/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user's active subscriptions")
    public ResponseEntity<List<SubscriptionDTO>> getMyActiveSubscriptions() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(subscriptionService.getUserActiveSubscriptions(userId));
    }

    @GetMapping("/travel/{travelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
    @Operation(summary = "Get subscriptions for a travel (ADMIN or TRAVEL_MANAGER only - manager can only view their own travels)")
    public ResponseEntity<List<SubscriptionDTO>> getTravelSubscriptions(@PathVariable Long travelId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(subscriptionService.getTravelSubscriptions(travelId, userId));
    }

    @DeleteMapping("/{subscriptionId}/manager-cancel/{travelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
    @Operation(summary = "Manager cancel a subscription (ADMIN or TRAVEL_MANAGER - manager can only cancel subscriptions for their own travels)")
    public ResponseEntity<Void> managerCancelSubscription(
            @PathVariable Long subscriptionId,
            @PathVariable Long travelId) {
        Long userId = getCurrentUserId();
        subscriptionService.managerCancelSubscription(subscriptionId, travelId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Cascade delete endpoint called by user-service when a traveler is deleted
     * Deletes all subscriptions created by the user
     */
    @DeleteMapping("/user/{userId}/cascade-delete")
    @Operation(summary = "Cascade delete all subscriptions by user (Internal service call)", hidden = true)
    public ResponseEntity<Void> cascadeDeleteUserSubscriptions(@PathVariable Long userId) {
        subscriptionService.deleteAllSubscriptionsByUser(userId);
        return ResponseEntity.noContent().build();
    }
}
