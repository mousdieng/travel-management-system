package com.travelms.user.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Client for communication with travel-service
 * Handles cascading deletes for user-related data in travel-service
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TravelServiceClient {

    private final RestTemplate restTemplate;

    @Value("${travel-service.url:http://localhost:9083}")
    private String travelServiceUrl;

    /**
     * Delete all travels created by a user (as manager)
     * Also deletes all subscriptions for those travels due to JPA cascade
     */
    public void deleteUserTravels(Long userId) {
        try {
            String url = String.format("%s/api/v1/travels/manager/%d/cascade-delete", travelServiceUrl, userId);
            restTemplate.exchange(url, HttpMethod.DELETE, null, Void.class);
            log.info("Deleted all travels for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to delete travels for user {}: {}", userId, e.getMessage());
            // Continue with user deletion even if this fails
        }
    }

    /**
     * Delete all subscriptions by a user (as traveler)
     */
    public void deleteUserSubscriptions(Long userId) {
        try {
            String url = String.format("%s/api/v1/subscriptions/user/%d/cascade-delete", travelServiceUrl, userId);
            restTemplate.exchange(url, HttpMethod.DELETE, null, Void.class);
            log.info("Deleted all subscriptions for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to delete subscriptions for user {}: {}", userId, e.getMessage());
            // Continue with user deletion even if this fails
        }
    }
}
