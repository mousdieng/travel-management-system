package com.travelms.travel.controller;

import com.travelms.travel.dto.CreateTravelRequest;
import com.travelms.travel.dto.SubscriptionDTO;
import com.travelms.travel.dto.TravelDTO;
import com.travelms.travel.dto.admin.*;
import com.travelms.travel.service.AdminAnalyticsService;
import com.travelms.travel.service.AdminTravelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin management endpoints")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final AdminTravelService adminTravelService;

    @GetMapping("/rankings/managers")
    @Operation(summary = "Get manager rankings by performance")
    public ResponseEntity<List<ManagerRankingDTO>> getManagerRankings(
            @RequestParam(required = false) Integer limit) {
        log.info("Getting manager rankings with limit: {}", limit);
        return ResponseEntity.ok(adminAnalyticsService.getManagerRankings(limit));
    }

    @GetMapping("/analytics/travels/performance")
    @Operation(summary = "Get travel performance metrics")
    public ResponseEntity<List<TravelPerformanceMetricsDTO>> getTravelPerformanceMetrics(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.info("Getting travel performance metrics");
        return ResponseEntity.ok(adminAnalyticsService.getTravelPerformanceMetrics(
                category, status, minRating, dateFrom, dateTo));
    }

    @GetMapping("/analytics/travels/underperforming")
    @Operation(summary = "Get underperforming travels")
    public ResponseEntity<List<UnderperformingTravelDTO>> getUnderperformingTravels(
            @RequestParam(defaultValue = "50") Integer threshold) {
        log.info("Getting underperforming travels with threshold: {}", threshold);
        return ResponseEntity.ok(adminAnalyticsService.getUnderperformingTravels(threshold));
    }

    @GetMapping("/rankings/travels")
    @Operation(summary = "Get top performing travels by revenue")
    public ResponseEntity<List<TravelPerformanceMetricsDTO>> getTopPerformingTravels(
            @RequestParam(defaultValue = "10") Integer limit) {
        log.info("Getting top performing travels with limit: {}", limit);
        return ResponseEntity.ok(adminAnalyticsService.getTopPerformingTravels(limit));
    }

    @GetMapping("/travels/history")
    @Operation(summary = "Get all travels history")
    public ResponseEntity<List<TravelPerformanceMetricsDTO>> getTravelHistory() {
        log.info("Getting all travels history");
        return ResponseEntity.ok(adminAnalyticsService.getAllTravelsHistory());
    }

    @GetMapping("/travels/{travelId}/stats")
    @Operation(summary = "Get detailed stats for a specific travel")
    public ResponseEntity<TravelPerformanceMetricsDTO> getTravelDetailedStats(@PathVariable Long travelId) {
        log.info("Getting detailed stats for travel: {}", travelId);
        return ResponseEntity.ok(adminAnalyticsService.getTravelDetailedStats(travelId));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all travel categories")
    public ResponseEntity<List<String>> getTravelCategories() {
        log.info("Getting all travel categories");
        return ResponseEntity.ok(adminAnalyticsService.getAllCategories());
    }

    // ==================== TRAVEL MANAGEMENT ====================

    @PostMapping("/travels")
    @Operation(summary = "Create travel on behalf of a manager (ADMIN only)")
    public ResponseEntity<TravelDTO> createTravelForManager(
            @Valid @RequestBody CreateTravelRequest request,
            @RequestParam Long managerId,
            @RequestParam String managerName) {
        log.info("Admin creating travel for manager: {}", managerId);
        TravelDTO travel = adminTravelService.createTravelForManager(request, managerId, managerName);
        return ResponseEntity.status(HttpStatus.CREATED).body(travel);
    }

    @PutMapping("/travels/{travelId}")
    @Operation(summary = "Update any travel without manager ownership check (ADMIN only)")
    public ResponseEntity<TravelDTO> updateTravelForManager(
            @PathVariable Long travelId,
            @Valid @RequestBody CreateTravelRequest request) {
        log.info("Admin updating travel: {}", travelId);
        TravelDTO travel = adminTravelService.updateTravelForManager(travelId, request);
        return ResponseEntity.ok(travel);
    }

    @DeleteMapping("/travels/{travelId}")
    @Operation(summary = "Delete any travel without manager ownership check (ADMIN only)")
    public ResponseEntity<Void> deleteTravelAsAdmin(@PathVariable Long travelId) {
        log.info("Admin deleting travel: {}", travelId);
        adminTravelService.deleteTravelAsAdmin(travelId);
        return ResponseEntity.noContent().build();
    }

    // ==================== SUBSCRIPTION MANAGEMENT ====================

    @PostMapping("/subscriptions")
    @Operation(summary = "Subscribe a user to a travel (ADMIN only)")
    public ResponseEntity<SubscriptionDTO> subscribeUserToTravel(
            @RequestParam Long userId,
            @RequestParam String userName,
            @RequestParam Long travelId) {
        log.info("Admin subscribing user {} to travel: {}", userId, travelId);
        SubscriptionDTO subscription = adminTravelService.subscribeUserToTravel(userId, userName, travelId);
        return ResponseEntity.status(HttpStatus.CREATED).body(subscription);
    }

    @DeleteMapping("/subscriptions/{subscriptionId}")
    @Operation(summary = "Cancel any subscription without user ownership check (ADMIN only)")
    public ResponseEntity<Void> cancelSubscriptionForUser(@PathVariable Long subscriptionId) {
        log.info("Admin cancelling subscription: {}", subscriptionId);
        adminTravelService.cancelSubscriptionForUser(subscriptionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/subscriptions")
    @Operation(summary = "Get all subscriptions for a user (ADMIN only)")
    public ResponseEntity<List<SubscriptionDTO>> getUserSubscriptionsAsAdmin(@PathVariable Long userId) {
        log.info("Admin getting subscriptions for user: {}", userId);
        List<SubscriptionDTO> subscriptions = adminTravelService.getUserSubscriptionsAsAdmin(userId);
        return ResponseEntity.ok(subscriptions);
    }
}
