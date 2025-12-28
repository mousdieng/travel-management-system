package com.travelms.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event published when a payment is refunded
 * Consumed by travel-service to cancel subscription
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRefundedEvent {

    private Long paymentId;

    private Long userId;

    private Long subscriptionId;

    private BigDecimal refundAmount;

    private String currency;

    private LocalDateTime refundedAt;

    private String reason;
}
