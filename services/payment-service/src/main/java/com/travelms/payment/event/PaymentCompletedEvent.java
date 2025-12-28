package com.travelms.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event published when a payment is successfully completed
 * Consumed by travel-service to create subscription
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {

    private Long paymentId;

    private Long userId;

    private String userName;

    private Long travelId;

    private Integer numberOfParticipants;

    private BigDecimal amount;

    private String currency;

    private LocalDateTime completedAt;

    private String transactionId;

    /**
     * Booking details stored during payment-first flow
     * JSON string containing: travelId, numberOfParticipants, userName, passengerDetails
     */
    private String bookingDetailsJson;
}
