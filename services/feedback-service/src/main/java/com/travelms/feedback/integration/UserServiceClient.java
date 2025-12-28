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
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${user-service.url:http://localhost:9081}")
    private String userServiceUrl;

    /**
     * Get user name by ID
     */
    public String getUserName(Long userId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(userServiceUrl)
                    .path("/api/v1/users/{userId}")
                    .buildAndExpand(userId)
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            var response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    UserResponse.class
            );

            if (response.getBody() != null) {
                // Prefer firstName + lastName, fallback to username
                UserResponse user = response.getBody();
                if (user.getFirstName() != null && user.getLastName() != null) {
                    return user.getFirstName() + " " + user.getLastName();
                } else if (user.getUsername() != null) {
                    return user.getUsername();
                }
            }
            return "User " + userId;
        } catch (Exception e) {
            log.warn("Failed to fetch user {} name: {}", userId, e.getMessage());
            return "User " + userId;
        }
    }

    /**
     * Get user statistics for admin dashboard
     */
    public UserStatsResponse getUserStats() {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(userServiceUrl)
                    .path("/api/v1/users/stats")
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            var response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    UserStatsResponse.class
            );

            return response.getBody() != null ? response.getBody() : new UserStatsResponse();
        } catch (Exception e) {
            log.warn("Failed to fetch user stats: {}", e.getMessage());
            return new UserStatsResponse();
        }
    }

    /**
     * Simple DTO for user response
     */
    @lombok.Data
    public static class UserResponse {
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
    }

    /**
     * DTO for user statistics
     */
    @lombok.Data
    public static class UserStatsResponse {
        private Long totalUsers = 0L;
        private Long totalManagers = 0L;
        private Long totalTravelers = 0L;
    }
}
