package com.travelms.travel.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateItineraryRequest {

    @NotEmpty(message = "At least one stop is required")
    @Size(min = 2, message = "At least 2 stops are required for route validation")
    @Valid
    private List<ItineraryStopDTO> stops;
}
