package com.travelms.feedback.controller;

import com.travelms.feedback.dto.FeedbackDTO;
import com.travelms.feedback.dto.admin.*;
import com.travelms.feedback.service.FeedbackService;
import com.travelms.feedback.service.AdminFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Feedback", description = "Admin feedback management endpoints")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeedbackController {

    private final FeedbackService feedbackService;
    private final AdminFeedbackService adminFeedbackService;

    @GetMapping("/feedbacks")
    @Operation(summary = "Get all feedbacks (ADMIN only)")
    public ResponseEntity<List<FeedbackDTO>> getAllFeedbacks() {
        log.info("Admin requesting all feedbacks");
        return ResponseEntity.ok(feedbackService.getAllFeedbacks());
    }

    @GetMapping("/feedbacks/grouped/travel")
    @Operation(summary = "Get feedbacks grouped by travel")
    public ResponseEntity<List<TravelFeedbackGroupDTO>> getFeedbacksGroupedByTravel(
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.info("Getting feedbacks grouped by travel with filters");
        return ResponseEntity.ok(adminFeedbackService.getFeedbacksGroupedByTravel(rating, category, dateFrom, dateTo));
    }

    @GetMapping("/feedbacks/grouped/manager")
    @Operation(summary = "Get feedbacks grouped by manager")
    public ResponseEntity<List<ManagerFeedbackGroupDTO>> getFeedbacksGroupedByManager(
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.info("Getting feedbacks grouped by manager with filters");
        return ResponseEntity.ok(adminFeedbackService.getFeedbacksGroupedByManager(rating, dateFrom, dateTo));
    }

    @GetMapping("/analytics/feedbacks")
    @Operation(summary = "Get feedback statistics")
    public ResponseEntity<FeedbackStatisticsDTO> getFeedbackStatistics() {
        log.info("Getting feedback statistics");
        return ResponseEntity.ok(adminFeedbackService.getFeedbackStatistics());
    }

    @PostMapping("/feedbacks")
    @Operation(summary = "Create feedback on behalf of a user (ADMIN only)")
    public ResponseEntity<FeedbackDTO> createFeedbackForUser(
            @RequestParam Long userId,
            @RequestParam Long travelId,
            @RequestParam Integer rating,
            @RequestParam(required = false) String comment) {
        log.info("Admin creating feedback for user: {} on travel: {}", userId, travelId);
        FeedbackDTO feedback = adminFeedbackService.createFeedbackForUser(userId, travelId, rating, comment);
        return ResponseEntity.ok(feedback);
    }

    @PutMapping("/feedbacks/{feedbackId}")
    @Operation(summary = "Update any feedback without ownership check (ADMIN only)")
    public ResponseEntity<FeedbackDTO> updateFeedbackForUser(
            @PathVariable Long feedbackId,
            @RequestParam Integer rating,
            @RequestParam(required = false) String comment) {
        log.info("Admin updating feedback: {}", feedbackId);
        FeedbackDTO feedback = adminFeedbackService.updateFeedbackForUser(feedbackId, rating, comment);
        return ResponseEntity.ok(feedback);
    }

    @DeleteMapping("/feedbacks/{feedbackId}")
    @Operation(summary = "Delete any feedback without ownership check (ADMIN only)")
    public ResponseEntity<Void> deleteFeedbackAsAdmin(@PathVariable Long feedbackId) {
        log.info("Admin deleting feedback: {}", feedbackId);
        adminFeedbackService.deleteFeedbackAsAdmin(feedbackId);
        return ResponseEntity.noContent().build();
    }
}
