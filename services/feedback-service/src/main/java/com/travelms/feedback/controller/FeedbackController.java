package com.travelms.feedback.controller;

import com.travelms.feedback.dto.CreateFeedbackRequest;
import com.travelms.feedback.dto.FeedbackDTO;
import com.travelms.feedback.security.JwtAuthenticationFilter;
import com.travelms.feedback.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedbacks")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "Feedback management APIs")
public class FeedbackController {

    private final FeedbackService feedbackService;

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

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit feedback for a travel (All authenticated users)")
    public ResponseEntity<FeedbackDTO> submitFeedback(
            @Valid @RequestBody CreateFeedbackRequest request) {
        Long userId = getCurrentUserId();
        FeedbackDTO feedback = feedbackService.submitFeedback(request, userId);
        return new ResponseEntity<>(feedback, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update feedback (Owner or ADMIN)")
    public ResponseEntity<FeedbackDTO> updateFeedback(
            @PathVariable Long id,
            @Valid @RequestBody CreateFeedbackRequest request) {
        Long userId = getCurrentUserId();
        FeedbackDTO feedback = feedbackService.updateFeedback(id, request, userId);
        return ResponseEntity.ok(feedback);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete feedback (Owner or ADMIN)")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        feedbackService.deleteFeedback(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get feedback by ID")
    public ResponseEntity<FeedbackDTO> getFeedbackById(@PathVariable Long id) {
        return ResponseEntity.ok(feedbackService.getFeedbackDTOById(id));
    }

    @GetMapping("/travel/{travelId}")
    @Operation(summary = "Get all feedbacks for a travel")
    public ResponseEntity<List<FeedbackDTO>> getTravelFeedbacks(@PathVariable Long travelId) {
        return ResponseEntity.ok(feedbackService.getTravelFeedbacks(travelId));
    }

    @GetMapping("/my-feedbacks")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my feedbacks", description = "Retrieve all feedbacks submitted by authenticated user")
    public ResponseEntity<List<FeedbackDTO>> getMyFeedbacks() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(feedbackService.getUserFeedbacks(userId));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all feedbacks by a user (Authenticated users)")
    public ResponseEntity<List<FeedbackDTO>> getUserFeedbacks(@PathVariable Long userId) {
        return ResponseEntity.ok(feedbackService.getUserFeedbacks(userId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all feedbacks (ADMIN only)")
    public ResponseEntity<List<FeedbackDTO>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackService.getAllFeedbacks());
    }

    @GetMapping("/travel/{travelId}/average-rating")
    @Operation(summary = "Get average rating for a travel")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long travelId) {
        return ResponseEntity.ok(feedbackService.getAverageRatingByTravelId(travelId));
    }

    @GetMapping("/travel/{travelId}/count")
    @Operation(summary = "Get feedback count for a travel")
    public ResponseEntity<Long> getFeedbackCount(@PathVariable Long travelId) {
        return ResponseEntity.ok(feedbackService.getFeedbackCountByTravelId(travelId));
    }

    @GetMapping("/manager/travels")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all feedbacks for current manager's travels")
    public ResponseEntity<List<FeedbackDTO>> getManagerTravelsFeedbacks() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(feedbackService.getManagerTravelsFeedbacks(userId));
    }

    /**
     * Cascade delete endpoint called by user-service when a user is deleted
     * Deletes all feedbacks created by the user
     */
    @DeleteMapping("/user/{userId}/cascade-delete")
    @Operation(summary = "Cascade delete all feedbacks by user (Internal service call)", hidden = true)
    public ResponseEntity<Void> cascadeDeleteUserFeedbacks(@PathVariable Long userId) {
        feedbackService.deleteAllFeedbacksByUser(userId);
        return ResponseEntity.noContent().build();
    }
}
