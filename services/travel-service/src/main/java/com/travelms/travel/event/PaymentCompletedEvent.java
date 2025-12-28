package com.travelms.travel.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Event received when a payment is successfully completed
 * Triggers subscription creation
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

    private String bookingDetailsJson;
}
