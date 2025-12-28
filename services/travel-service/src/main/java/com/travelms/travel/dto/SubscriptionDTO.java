package com.travelms.travel.dto;

import com.travelms.travel.model.enums.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDTO {

    private Long id;
    private Long travelerId;
    private String travelerName;
    private Long travelId;
    private String travelTitle;
    private SubscriptionStatus status;
    private Integer numberOfParticipants;
    private java.math.BigDecimal totalAmount;
    private Boolean canBeCancelled;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
}
