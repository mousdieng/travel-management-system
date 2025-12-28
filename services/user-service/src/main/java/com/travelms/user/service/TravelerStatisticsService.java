package com.travelms.user.service;

import com.travelms.user.dto.TravelerStatisticsDTO;
import com.travelms.user.model.entity.User;
import com.travelms.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Service to calculate and retrieve traveler statistics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TravelerStatisticsService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    // Service URLs - these should be configured in application.yml
    private static final String SUBSCRIPTION_SERVICE_URL = "http://travel-service/api/v1/subscriptions";
    private static final String FEEDBACK_SERVICE_URL = "http://feedback-service/api/v1/feedbacks";
    private static final String REPORT_SERVICE_URL = "http://feedback-service/api/v1/reports";

    public TravelerStatisticsDTO getTravelerStatistics(Long userId) {
        log.info("Fetching statistics for traveler: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TravelerStatisticsDTO stats = TravelerStatisticsDTO.builder()
                .userId(userId)
                .username(user.getUsername())
                .email(user.getEmail())
                .memberSince(user.getCreatedAt() != null
                        ? user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE)
                        : null)
                .build();

        // Fetch subscription statistics
        try {
            stats = fetchSubscriptionStats(stats, userId);
        } catch (Exception e) {
            log.error("Error fetching subscription stats for user {}: {}", userId, e.getMessage());
            // Set default values
            stats.setTotalSubscriptions(0L);
            stats.setActiveSubscriptions(0L);
            stats.setCompletedTravels(0L);
            stats.setUpcomingTravels(0L);
            stats.setCancelledSubscriptions(0L);
            stats.setTotalSpent(BigDecimal.ZERO);
        }

        // Fetch feedback statistics
        try {
            stats = fetchFeedbackStats(stats, userId);
        } catch (Exception e) {
            log.error("Error fetching feedback stats for user {}: {}", userId, e.getMessage());
            stats.setFeedbacksGiven(0L);
            stats.setAverageRatingGiven(0.0);
        }

        // Fetch report statistics
        try {
            stats = fetchReportStats(stats, userId);
        } catch (Exception e) {
            log.error("Error fetching report stats for user {}: {}", userId, e.getMessage());
            stats.setReportsFiledByUser(0L);
            stats.setReportsAgainstUser(0L);
        }

        return stats;
    }

    private TravelerStatisticsDTO fetchSubscriptionStats(TravelerStatisticsDTO stats, Long userId) {
        // In a real implementation, you would call the subscription service
        // For now, returning default values
        // TODO: Implement actual REST calls to subscription service
        stats.setTotalSubscriptions(0L);
        stats.setActiveSubscriptions(0L);
        stats.setCompletedTravels(0L);
        stats.setUpcomingTravels(0L);
        stats.setCancelledSubscriptions(0L);
        stats.setTotalSpent(BigDecimal.ZERO);
        stats.setPreferredPaymentMethod("Not set");
        return stats;
    }

    private TravelerStatisticsDTO fetchFeedbackStats(TravelerStatisticsDTO stats, Long userId) {
        // TODO: Implement actual REST calls to feedback service
        stats.setFeedbacksGiven(0L);
        stats.setAverageRatingGiven(0.0);
        return stats;
    }

    private TravelerStatisticsDTO fetchReportStats(TravelerStatisticsDTO stats, Long userId) {
        // TODO: Implement actual REST calls to report service
        stats.setReportsFiledByUser(0L);
        stats.setReportsAgainstUser(0L);
        return stats;
    }
}
