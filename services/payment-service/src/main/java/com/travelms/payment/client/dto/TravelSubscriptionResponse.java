package com.travelms.payment.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for subscription response from travel service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelSubscriptionResponse {

    private Long id;
    private Long travelerId;
    private String travelerName;
    private Long travelId;
    private String travelTitle;
    private String status;
    private Integer numberOfParticipants;
    private BigDecimal totalAmount;
    private Boolean canBeCancelled;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
}
