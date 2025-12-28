package com.travelms.travel.dto;

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
public class RouteInfoDTO {

    @NotNull(message = "Total distance is required")
    private Long totalDistance; // in meters

    @NotNull(message = "Total duration is required")
    private Integer totalDuration; // in minutes

    @NotNull(message = "Validity status is required")
    private Boolean isValid;

    private List<ItineraryStopDTO> waypoints;

    private String encodedPolyline;

    /**
     * Format distance for display
     */
    public String getFormattedDistance() {
        if (totalDistance < 1000) {
            return totalDistance + " m";
        } else {
            return String.format("%.2f km", totalDistance / 1000.0);
        }
    }

    /**
     * Format duration for display
     */
    public String getFormattedDuration() {
        if (totalDuration < 60) {
            return totalDuration + " min";
        } else {
            int hours = totalDuration / 60;
            int minutes = totalDuration % 60;
            return minutes > 0 ? hours + "h " + minutes + "min" : hours + "h";
        }
    }
}
