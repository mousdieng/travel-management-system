package com.travelms.payment.dto;

import com.travelms.payment.model.enums.PaymentMethod;
import com.travelms.payment.model.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {

    private Long id;
    private Long userId;
    private Long bookingId;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal netAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String transactionId;
    private String externalTransactionId;
    private String paymentIntentId;
    private String currency;
    private LocalDateTime paidAt;
    private LocalDateTime refundedAt;
    private LocalDateTime createdAt;
    private String failureReason;

    // Redirect URLs for payment completion
    private String checkoutUrl;       // For Stripe Checkout Session
    private String clientSecret;      // For Stripe Payment Intent (legacy)
    private String approvalUrl;       // For PayPal
}
