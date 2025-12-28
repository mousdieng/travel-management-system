package com.travelms.user.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Client for communication with feedback-service
 * Handles cascading deletes for user-related data in feedback-service
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FeedbackServiceClient {

    private final RestTemplate restTemplate;

    @Value("${feedback-service.url:http://localhost:9085}")
    private String feedbackServiceUrl;

    /**
     * Delete all feedbacks created by a user
     */
    public void deleteUserFeedbacks(Long userId) {
        try {
            String url = String.format("%s/api/v1/feedbacks/user/%d/cascade-delete", feedbackServiceUrl, userId);
            restTemplate.exchange(url, HttpMethod.DELETE, null, Void.class);
            log.info("Deleted all feedbacks for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to delete feedbacks for user {}: {}", userId, e.getMessage());
            // Continue with user deletion even if this fails
        }
    }

    /**
     * Delete all reports created by a user
     */
    public void deleteUserReports(Long userId) {
        try {
            String url = String.format("%s/api/v1/reports/user/%d/cascade-delete", feedbackServiceUrl, userId);
            restTemplate.exchange(url, HttpMethod.DELETE, null, Void.class);
            log.info("Deleted all reports for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to delete reports for user {}: {}", userId, e.getMessage());
            // Continue with user deletion even if this fails
        }
    }
}
