package com.travelms.feedback.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
@Slf4j
public class TravelServiceClient {

    private final RestTemplate restTemplate;

    @Value("${travel-service.url:http://localhost:9083}")
    private String travelServiceUrl;

    /**
     * Update travel rating and review count in travel-service
     */
    public void updateTravelRating(Long travelId, Double averageRating, Integer totalReviews) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(travelServiceUrl)
                    .path("/api/v1/travels/{id}/rating")
                    .queryParam("averageRating", averageRating)
                    .queryParam("totalReviews", totalReviews)
                    .buildAndExpand(travelId)
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    new HttpEntity<>(headers),
                    Void.class
            );

            log.info("Successfully updated travel {} rating to {} with {} reviews",
                    travelId, averageRating, totalReviews);
        } catch (Exception e) {
            log.error("Failed to update travel {} rating: {}", travelId, e.getMessage(), e);
            // Don't throw exception - feedback is still saved, rating update is best-effort
        }
    }

    /**
     * Get travel title by ID
     */
    public String getTravelTitle(Long travelId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(travelServiceUrl)
                    .path("/api/v1/travels/{id}")
                    .buildAndExpand(travelId)
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            var response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    TravelResponse.class
            );

            if (response.getBody() != null && response.getBody().getTitle() != null) {
                return response.getBody().getTitle();
            }
            return "Travel " + travelId;
        } catch (Exception e) {
            log.warn("Failed to fetch travel {} title: {}", travelId, e.getMessage());
            return "Travel " + travelId;
        }
    }

    /**
     * Get all travel IDs for a manager
     */
    public java.util.List<Long> getManagerTravelIds(Long managerId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(travelServiceUrl)
                    .path("/api/v1/travels/manager/{managerId}")
                    .buildAndExpand(managerId)
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            var response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    TravelResponse[].class
            );

            if (response.getBody() != null && response.getBody().length > 0) {
                return java.util.Arrays.stream(response.getBody())
                        .map(TravelResponse::getId)
                        .collect(java.util.stream.Collectors.toList());
            }
            return java.util.Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to fetch manager {} travel IDs: {}", managerId, e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Get travel statistics for admin dashboard
     */
    public TravelStatsResponse getTravelStats() {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(travelServiceUrl)
                    .path("/api/v1/travels/stats")
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            var response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    TravelStatsResponse.class
            );

            return response.getBody() != null ? response.getBody() : new TravelStatsResponse();
        } catch (Exception e) {
            log.warn("Failed to fetch travel stats: {}", e.getMessage());
            return new TravelStatsResponse();
        }
    }

    /**
     * Simple DTO for travel response
     */
    @lombok.Data
    public static class TravelResponse {
        private Long id;
        private String title;
    }

    /**
     * DTO for travel statistics
     */
    @lombok.Data
    public static class TravelStatsResponse {
        private Long totalTravels = 0L;
        private Long activeTravels = 0L;
        private Long completedTravels = 0L;
    }
}
