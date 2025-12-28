package com.travelms.payment.dto;

import com.travelms.payment.model.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Checkout request that initiates payment BEFORE creating subscription
 * This ensures payment is confirmed before booking is created
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    // User Information
    @NotNull(message = "User ID is required")
    private Long userId;

    // Travel Booking Information
    @NotNull(message = "Travel ID is required")
    private Long travelId;

    // For subscribe-first flow: ID of existing subscription to link payment to
    private Long subscriptionId;

    @NotNull(message = "Number of participants is required")
    @Min(value = 1, message = "At least one participant is required")
    private Integer numberOfParticipants;

    private List<PassengerDetail> passengerDetails;

    // Payment Information
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String currency = "USD";

    // For Stripe - new card
    private String stripePaymentMethodId;

    // For saved payment method
    private Long savedPaymentMethodId;

    // Option to save this payment method
    private Boolean savePaymentMethod = false;
    private String cardholderName;

    // For PayPal
    private String paypalOrderId;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassengerDetail {
        private String firstName;
        private String lastName;
        private String dateOfBirth;
        private String passportNumber;
        private String phoneNumber;
        private String email;
    }
}
