package com.travelms.payment.dto;

import com.travelms.payment.model.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    // BookingId is optional for payment-first checkout flow
    // In traditional flow, this is required
    private Long bookingId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String currency = "USD";

    private String paymentDetails;

    // For Stripe - new card
    private String stripeToken;
    private String stripePaymentMethodId;

    // For saved payment method
    private Long savedPaymentMethodId;

    // Option to save this payment method
    private Boolean savePaymentMethod = false;
    private String cardholderName;

    // For PayPal
    private String paypalOrderId;
}
