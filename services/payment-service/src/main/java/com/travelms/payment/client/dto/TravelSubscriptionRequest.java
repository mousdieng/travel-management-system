package com.travelms.payment.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for creating subscription in travel service from payment service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelSubscriptionRequest {

    private Long travelId;
    private Integer numberOfParticipants;
    private List<PassengerDetail> passengerDetails;

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
