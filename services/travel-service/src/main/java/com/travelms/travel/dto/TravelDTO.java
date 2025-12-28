package com.travelms.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelDTO {

    private Long id;
    private String title;
    private String description;
    private String destination;
    private String country;
    private String city;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal price;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private Long travelManagerId;
    private String travelManagerName;
    private List<String> images;  // Presigned URLs for display
    private List<String> imageKeys;  // Original MinIO keys for updates
    private List<String> highlights;
    private Boolean active;
    private String category;
    private String itinerary;
    private Double averageRating;
    private Integer totalReviews;
    private LocalDateTime createdAt;
}
