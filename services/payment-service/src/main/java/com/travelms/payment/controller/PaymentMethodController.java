package com.travelms.payment.controller;

import com.travelms.payment.dto.SavePaymentMethodRequest;
import com.travelms.payment.dto.SavedPaymentMethodDTO;
import com.travelms.payment.service.PaymentMethodService;
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

@RestController
@RequestMapping("/api/v1/payment-methods")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Methods", description = "Saved payment methods management")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Save a payment method", description = "Save a payment method for future use")
    public ResponseEntity<SavedPaymentMethodDTO> savePaymentMethod(@Valid @RequestBody SavePaymentMethodRequest request) {
        log.info("Saving payment method for user: {}", request.getUserId());
        SavedPaymentMethodDTO savedMethod = paymentMethodService.savePaymentMethod(request);
        return new ResponseEntity<>(savedMethod, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user's saved payment methods")
    public ResponseEntity<List<SavedPaymentMethodDTO>> getUserPaymentMethods(@PathVariable Long userId) {
        return ResponseEntity.ok(paymentMethodService.getUserPaymentMethods(userId));
    }

    @GetMapping("/user/{userId}/default")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user's default payment method")
    public ResponseEntity<SavedPaymentMethodDTO> getDefaultPaymentMethod(@PathVariable Long userId) {
        SavedPaymentMethodDTO method = paymentMethodService.getDefaultPaymentMethod(userId);
        if (method == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(method);
    }

    @PutMapping("/user/{userId}/{methodId}/default")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Set payment method as default")
    public ResponseEntity<SavedPaymentMethodDTO> setDefaultPaymentMethod(
            @PathVariable Long userId,
            @PathVariable Long methodId) {
        return ResponseEntity.ok(paymentMethodService.setDefaultPaymentMethod(userId, methodId));
    }

    @DeleteMapping("/user/{userId}/{methodId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete a saved payment method")
    public ResponseEntity<Void> deletePaymentMethod(
            @PathVariable Long userId,
            @PathVariable Long methodId) {
        paymentMethodService.deletePaymentMethod(userId, methodId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Cascade delete endpoint called by user-service when a user is deleted
     * Deletes all saved payment methods for the user
     */
    @DeleteMapping("/user/{userId}/cascade-delete")
    @Operation(summary = "Cascade delete all payment methods by user (Internal service call)", hidden = true)
    public ResponseEntity<Void> cascadeDeleteUserPaymentMethods(@PathVariable Long userId) {
        log.info("Cascade deleting all payment methods for user: {}", userId);
        paymentMethodService.deleteAllPaymentMethodsByUser(userId);
        return ResponseEntity.noContent().build();
    }

    // ========== Admin Endpoints ==========

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Get all payment methods", description = "Get all saved payment methods across all users")
    public ResponseEntity<List<SavedPaymentMethodDTO>> getAllPaymentMethods() {
        log.info("Admin fetching all payment methods");
        return ResponseEntity.ok(paymentMethodService.getAllPaymentMethods());
    }

    @GetMapping("/admin/{methodId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Get payment method by ID")
    public ResponseEntity<SavedPaymentMethodDTO> getPaymentMethodById(@PathVariable Long methodId) {
        log.info("Admin fetching payment method: {}", methodId);
        return ResponseEntity.ok(paymentMethodService.getPaymentMethodById(methodId));
    }

    @PutMapping("/admin/{methodId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Update payment method", description = "Update a payment method's details")
    public ResponseEntity<SavedPaymentMethodDTO> updatePaymentMethod(
            @PathVariable Long methodId,
            @Valid @RequestBody SavePaymentMethodRequest request) {
        log.info("Admin updating payment method: {}", methodId);
        return ResponseEntity.ok(paymentMethodService.updatePaymentMethod(methodId, request));
    }

    @DeleteMapping("/admin/{methodId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Delete payment method", description = "Delete any payment method by ID")
    public ResponseEntity<Void> deletePaymentMethodById(@PathVariable Long methodId) {
        log.info("Admin deleting payment method: {}", methodId);
        paymentMethodService.deletePaymentMethodById(methodId);
        return ResponseEntity.noContent().build();
    }
}
