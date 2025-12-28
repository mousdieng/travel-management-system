package com.travelms.payment.client;

import com.travelms.payment.client.dto.TravelSubscriptionRequest;
import com.travelms.payment.client.dto.TravelSubscriptionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Client for communicating with the Travel Service
 * Uses Eureka service discovery for load balancing
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TravelServiceClient {

    private final RestTemplate restTemplate;
    private static final String TRAVEL_SERVICE_URL = "http://travel-service";

    /**
     * Create a subscription in the travel service after payment is confirmed
     *
     * @param request Subscription details
     * @param userId User ID making the booking
     * @param userName User name
     * @param jwtToken JWT token for authentication
     * @return Created subscription
     */
    public TravelSubscriptionResponse createSubscription(
            TravelSubscriptionRequest request,
            Long userId,
            String userName,
            String jwtToken) {

        String url = TRAVEL_SERVICE_URL + "/api/v1/subscriptions";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (jwtToken != null && !jwtToken.isEmpty()) {
                headers.set("Authorization", jwtToken.startsWith("Bearer ") ? jwtToken : "Bearer " + jwtToken);
            }

            HttpEntity<TravelSubscriptionRequest> entity = new HttpEntity<>(request, headers);

            log.info("Creating subscription in travel service for user {} and travel {}",
                    userId, request.getTravelId());

            ResponseEntity<TravelSubscriptionResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    TravelSubscriptionResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Successfully created subscription with ID: {}", response.getBody().getId());
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to create subscription in travel service");
            }

        } catch (RestClientException e) {
            log.error("Error calling travel service to create subscription: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create subscription: " + e.getMessage(), e);
        }
    }

    /**
     * Cancel a subscription in the travel service (for refund scenarios)
     *
     * @param subscriptionId Subscription ID to cancel
     * @param jwtToken JWT token for authentication
     */
    public void cancelSubscription(Long subscriptionId, String jwtToken) {
        String url = TRAVEL_SERVICE_URL + "/api/v1/subscriptions/" + subscriptionId + "/cancel";

        try {
            HttpHeaders headers = new HttpHeaders();
            if (jwtToken != null && !jwtToken.isEmpty()) {
                headers.set("Authorization", jwtToken.startsWith("Bearer ") ? jwtToken : "Bearer " + jwtToken);
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            log.info("Cancelling subscription {} in travel service", subscriptionId);

            restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    Void.class
            );

            log.info("Successfully cancelled subscription {}", subscriptionId);

        } catch (RestClientException e) {
            log.error("Error calling travel service to cancel subscription: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to cancel subscription: " + e.getMessage(), e);
        }
    }
}
