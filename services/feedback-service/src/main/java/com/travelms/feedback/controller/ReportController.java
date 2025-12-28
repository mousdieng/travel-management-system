package com.travelms.feedback.controller;

import com.travelms.feedback.dto.CreateReportRequest;
import com.travelms.feedback.dto.ReportDTO;
import com.travelms.feedback.model.enums.ReportStatus;
import com.travelms.feedback.security.JwtAuthenticationFilter;
import com.travelms.feedback.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Report", description = "Report management APIs")
public class ReportController {

    private final ReportService reportService;

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
    @Operation(summary = "Create a report (All authenticated users)")
    public ResponseEntity<ReportDTO> createReport(
            @Valid @RequestBody CreateReportRequest request) {
        Long userId = getCurrentUserId();
        ReportDTO report = reportService.createReport(request, userId);
        return new ResponseEntity<>(report, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Review a report (ADMIN only)")
    public ResponseEntity<ReportDTO> reviewReport(
            @PathVariable Long id,
            @RequestBody ReviewReportRequest request) {
        Long adminId = getCurrentUserId();
        ReportDTO report = reportService.reviewReport(
                id, adminId, request.getStatus(), request.getAdminNotes());
        return ResponseEntity.ok(report);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get report by ID (ADMIN or reporter)")
    public ResponseEntity<ReportDTO> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportDTOById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all reports (ADMIN only)")
    public ResponseEntity<List<ReportDTO>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get pending reports (ADMIN only)")
    public ResponseEntity<List<ReportDTO>> getPendingReports() {
        return ResponseEntity.ok(reportService.getPendingReports());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get reports by a user (User themselves or ADMIN)")
    public ResponseEntity<List<ReportDTO>> getUserReports(@PathVariable Long userId) {
        return ResponseEntity.ok(reportService.getUserReports(userId));
    }

    @GetMapping("/against-user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get reports against a user (ADMIN only)")
    public ResponseEntity<List<ReportDTO>> getReportsAgainstUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reportService.getReportsAgainstUser(userId));
    }

    /**
     * Cascade delete endpoint called by user-service when a user is deleted
     * Deletes all reports created by the user
     */
    @DeleteMapping("/user/{userId}/cascade-delete")
    @Operation(summary = "Cascade delete all reports by user (Internal service call)", hidden = true)
    public ResponseEntity<Void> cascadeDeleteUserReports(@PathVariable Long userId) {
        reportService.deleteAllReportsByUser(userId);
        return ResponseEntity.noContent().build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewReportRequest {
        private ReportStatus status;
        private String adminNotes;
    }
}
