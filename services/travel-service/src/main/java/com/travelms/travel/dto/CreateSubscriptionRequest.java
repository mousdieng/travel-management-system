package com.travelms.travel.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubscriptionRequest {

    @NotNull(message = "Travel ID is required")
    private Long travelId;

    @NotNull(message = "Number of participants is required")
    @Min(value = 1, message = "At least one participant is required")
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
