package com.travelms.payment.controller;

import com.travelms.payment.dto.CheckoutRequest;
import com.travelms.payment.dto.CreatePaymentRequest;
import com.travelms.payment.dto.ManagerIncomeStatsDTO;
import com.travelms.payment.dto.PaymentDTO;
import com.travelms.payment.dto.RefundRequest;
import com.travelms.payment.service.CheckoutService;
import com.travelms.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment", description = "Payment management APIs")
public class PaymentController {

    private final PaymentService paymentService;
    private final CheckoutService checkoutService;

    /**
     * Extract JWT token from request
     */
    private String getJwtToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getCredentials() != null) {
            return authentication.getCredentials().toString();
        }
        return null;
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

    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Initiate payment-first checkout",
            description = "Create payment intent/session BEFORE creating subscription. " +
                    "Payment must be confirmed before subscription is created. (All authenticated users)"
    )
    public ResponseEntity<PaymentDTO> initiateCheckout(
            @Valid @RequestBody CheckoutRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Initiating checkout for user {} and travel {}", request.getUserId(), request.getTravelId());
        String userName = getCurrentUsername();
        String jwtToken = authHeader; // Full "Bearer ..." token
        PaymentDTO payment = checkoutService.initiateCheckout(request, userName, jwtToken);
        return new ResponseEntity<>(payment, HttpStatus.CREATED);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Process a payment (Legacy)", description = "Process a new payment for an existing booking (All authenticated users)")
    public ResponseEntity<PaymentDTO> processPayment(@Valid @RequestBody CreatePaymentRequest request) {
        log.info("Processing payment request for booking: {}", request.getBookingId());
        PaymentDTO payment = paymentService.processPayment(request);
        return new ResponseEntity<>(payment, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get payment by ID", description = "Retrieve payment details by ID (Users can view their own, ADMIN can view all)")
    public ResponseEntity<PaymentDTO> getPaymentById(@PathVariable Long id) {
        log.info("Fetching payment with id: {}", id);
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user payments", description = "Get all payments for a specific user (Users can view their own, ADMIN can view all)")
    public ResponseEntity<List<PaymentDTO>> getUserPayments(@PathVariable Long userId) {
        log.info("Fetching payments for user: {}", userId);
        return ResponseEntity.ok(paymentService.getUserPayments(userId));
    }

    @GetMapping("/user/{userId}/completed")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user completed payments", description = "Get all completed payments for a specific user (Users can view their own, ADMIN can view all)")
    public ResponseEntity<List<PaymentDTO>> getUserCompletedPayments(@PathVariable Long userId) {
        log.info("Fetching completed payments for user: {}", userId);
        return ResponseEntity.ok(paymentService.getUserCompletedPayments(userId));
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get payment by booking ID", description = "Retrieve payment details by booking ID (Users can view their own, ADMIN can view all)")
    public ResponseEntity<PaymentDTO> getPaymentByBookingId(@PathVariable Long bookingId) {
        log.info("Fetching payment for booking: {}", bookingId);
        return ResponseEntity.ok(paymentService.getPaymentByBookingId(bookingId));
    }

    @PostMapping("/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Refund payment", description = "Process a refund for a completed payment (ADMIN only)")
    public ResponseEntity<PaymentDTO> refundPayment(
            @PathVariable Long id,
            @Valid @RequestBody RefundRequest refundRequest) {
        log.info("Processing refund for payment: {}", id);
        refundRequest.setPaymentId(id);
        return ResponseEntity.ok(paymentService.refundPayment(id, refundRequest));
    }

    @PostMapping("/stripe/confirm")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Confirm Stripe payment",
            description = "Confirm a Stripe payment using session ID or payment intent ID. " +
                    "If payment was created via /checkout endpoint, this will also create the subscription. " +
                    "(All authenticated users)"
    )
    public ResponseEntity<PaymentDTO> confirmStripePayment(
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String paymentIntentId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String id = sessionId != null ? sessionId : paymentIntentId;
        log.info("Confirming Stripe payment: {}", id);
        String jwtToken = authHeader;
        return ResponseEntity.ok(paymentService.confirmStripePayment(id, jwtToken));
    }

    @PostMapping("/paypal/confirm")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Confirm PayPal payment",
            description = "Confirm a PayPal payment after user approval. " +
                    "If payment was created via /checkout endpoint, this will also create the subscription. " +
                    "(All authenticated users)"
    )
    public ResponseEntity<PaymentDTO> confirmPayPalPayment(
            @RequestParam String paymentId,
            @RequestParam String payerId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Confirming PayPal payment: {}", paymentId);
        String jwtToken = authHeader;
        return ResponseEntity.ok(paymentService.confirmPayPalPayment(paymentId, payerId, jwtToken));
    }

    // ============= Manager Income Endpoints =============

    @GetMapping("/manager/{managerId}/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get manager income statistics", description = "Get comprehensive income statistics for a manager (Manager themselves or ADMIN)")
    public ResponseEntity<ManagerIncomeStatsDTO> getManagerIncomeStats(@PathVariable Long managerId) {
        log.info("Fetching income stats for manager: {}", managerId);
        return ResponseEntity.ok(paymentService.getManagerIncomeStats(managerId));
    }

    @GetMapping("/manager/{managerId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get manager payments", description = "Get all payments for a manager's travels (Manager themselves or ADMIN)")
    public ResponseEntity<List<PaymentDTO>> getManagerPayments(@PathVariable Long managerId) {
        log.info("Fetching payments for manager: {}", managerId);
        return ResponseEntity.ok(paymentService.getManagerPayments(managerId));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get payment statistics for admin dashboard")
    public ResponseEntity<java.util.Map<String, Object>> getPaymentStats() {
        log.info("Fetching payment statistics for admin dashboard");

        java.math.BigDecimal platformIncome = paymentService.calculateTotalPlatformIncome();
        java.math.BigDecimal lastMonthIncome = paymentService.calculateLastMonthIncome();
        Long totalPayments = paymentService.countTotalPayments();

        return ResponseEntity.ok(java.util.Map.of(
                "platformIncome", platformIncome != null ? platformIncome : java.math.BigDecimal.ZERO,
                "lastMonthIncome", lastMonthIncome != null ? lastMonthIncome : java.math.BigDecimal.ZERO,
                "totalPayments", totalPayments != null ? totalPayments : 0L
        ));
    }

    /**
     * Cascade delete endpoint called by user-service when a user is deleted
     * Deletes all payments created by the user
     */
    @DeleteMapping("/user/{userId}/cascade-delete")
    @Operation(summary = "Cascade delete all payments by user (Internal service call)", hidden = true)
    public ResponseEntity<Void> cascadeDeleteUserPayments(@PathVariable Long userId) {
        log.info("Cascade deleting all payments for user: {}", userId);
        paymentService.deleteAllPaymentsByUser(userId);
        return ResponseEntity.noContent().build();
    }
}
