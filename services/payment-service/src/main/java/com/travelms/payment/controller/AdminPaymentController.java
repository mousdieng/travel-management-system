package com.travelms.payment.controller;

import com.travelms.payment.dto.admin.*;
import com.travelms.payment.service.AdminPaymentService;
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
@Tag(name = "Admin Payment Analytics", description = "Admin payment and income analytics endpoints")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    @GetMapping("/analytics/income/managers")
    @Operation(summary = "Get income breakdown by manager")
    public ResponseEntity<List<ManagerIncomeBreakdownDTO>> getIncomeByManager(
            @RequestParam(required = false) String period) {
        log.info("Getting income by manager with period: {}", period);
        return ResponseEntity.ok(adminPaymentService.getIncomeByManager(period));
    }

    @GetMapping("/analytics/income/categories")
    @Operation(summary = "Get income breakdown by category")
    public ResponseEntity<List<CategoryIncomeBreakdownDTO>> getIncomeByCategory() {
        log.info("Getting income by category");
        return ResponseEntity.ok(adminPaymentService.getIncomeByCategory());
    }

    @GetMapping("/analytics/payments")
    @Operation(summary = "Get payment statistics")
    public ResponseEntity<PaymentStatisticsDTO> getPaymentStatistics() {
        log.info("Getting payment statistics");
        return ResponseEntity.ok(adminPaymentService.getPaymentStatistics());
    }

    @GetMapping("/analytics/income/manager/history")
    @Operation(summary = "Get manager income history")
    public ResponseEntity<ManagerIncomeHistoryDTO> getManagerIncomeHistory(
            @RequestParam Long managerId,
            @RequestParam(defaultValue = "12") Integer months) {
        log.info("Getting income history for manager: {} for {} months", managerId, months);
        return ResponseEntity.ok(adminPaymentService.getManagerIncomeHistory(managerId, months));
    }
}
