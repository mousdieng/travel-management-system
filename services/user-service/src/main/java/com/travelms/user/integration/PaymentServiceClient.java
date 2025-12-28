package com.travelms.user.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Client for communication with payment-service
 * Handles cascading deletes for user-related data in payment-service
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceClient {

    private final RestTemplate restTemplate;

    @Value("${payment-service.url:http://localhost:9084}")
    private String paymentServiceUrl;

    /**
     * Delete all payments and payment methods for a user
     */
    public void deleteUserPayments(Long userId) {
        try {
            String url = String.format("%s/api/v1/payments/user/%d/cascade-delete", paymentServiceUrl, userId);
            restTemplate.exchange(url, HttpMethod.DELETE, null, Void.class);
            log.info("Deleted all payments for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to delete payments for user {}: {}", userId, e.getMessage());
            // Continue with user deletion even if this fails
        }
    }

    /**
     * Delete all saved payment methods for a user
     */
    public void deleteUserPaymentMethods(Long userId) {
        try {
            String url = String.format("%s/api/v1/payment-methods/user/%d/cascade-delete", paymentServiceUrl, userId);
            restTemplate.exchange(url, HttpMethod.DELETE, null, Void.class);
            log.info("Deleted all payment methods for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to delete payment methods for user {}: {}", userId, e.getMessage());
            // Continue with user deletion even if this fails
        }
    }
}
