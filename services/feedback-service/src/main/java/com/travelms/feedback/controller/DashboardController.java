package com.travelms.feedback.controller;

import com.travelms.feedback.dto.DashboardStatsDTO;
import com.travelms.feedback.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics APIs")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/traveler/{travelerId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get traveler statistics (Traveler themselves or ADMIN)")
    public ResponseEntity<DashboardStatsDTO> getTravelerStats(@PathVariable Long travelerId) {
        return ResponseEntity.ok(dashboardService.getTravelerStats(travelerId));
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get manager statistics (Manager themselves or ADMIN)")
    public ResponseEntity<DashboardStatsDTO> getManagerStats(@PathVariable Long managerId) {
        return ResponseEntity.ok(dashboardService.getManagerStats(managerId));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin statistics (ADMIN only)")
    public ResponseEntity<DashboardStatsDTO> getAdminStats() {
        return ResponseEntity.ok(dashboardService.getAdminStats());
    }
}
