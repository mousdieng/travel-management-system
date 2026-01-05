package com.travelms.feedback.service;

import com.travelms.feedback.dto.FeedbackDTO;
import com.travelms.feedback.dto.admin.*;
import com.travelms.feedback.model.entity.Feedback;
import com.travelms.feedback.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminFeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackService feedbackService;

    @Transactional(readOnly = true)
    public List<TravelFeedbackGroupDTO> getFeedbacksGroupedByTravel(
            Integer rating, String category, String dateFrom, String dateTo) {
        log.info("Fetching feedbacks grouped by travel");

        List<Feedback> feedbacks = feedbackRepository.findAll();

        // Apply filters
        if (rating != null) {
            feedbacks = feedbacks.stream()
                    .filter(f -> f.getRating().equals(rating))
                    .collect(Collectors.toList());
        }

        if (dateFrom != null) {
            LocalDateTime fromDate = LocalDateTime.parse(dateFrom);
            feedbacks = feedbacks.stream()
                    .filter(f -> f.getCreatedAt().isAfter(fromDate))
                    .collect(Collectors.toList());
        }

        if (dateTo != null) {
            LocalDateTime toDate = LocalDateTime.parse(dateTo);
            feedbacks = feedbacks.stream()
                    .filter(f -> f.getCreatedAt().isBefore(toDate))
                    .collect(Collectors.toList());
        }

        // Group by travel ID
        Map<Long, List<Feedback>> feedbacksByTravel = feedbacks.stream()
                .collect(Collectors.groupingBy(Feedback::getTravelId));

        // Build grouped DTOs
        List<TravelFeedbackGroupDTO> groups = feedbacksByTravel.entrySet().stream()
                .map(entry -> {
                    Long travelId = entry.getKey();
                    List<Feedback> travelFeedbacks = entry.getValue();

                    // Calculate statistics
                    double avgRating = travelFeedbacks.stream()
                            .mapToInt(Feedback::getRating)
                            .average()
                            .orElse(0.0);

                    Map<Integer, Long> ratingCounts = travelFeedbacks.stream()
                            .collect(Collectors.groupingBy(Feedback::getRating, Collectors.counting()));

                    // Get recent feedbacks (limit to 5)
                    List<FeedbackSummaryDTO> recentFeedbacks = travelFeedbacks.stream()
                            .sorted(Comparator.comparing(Feedback::getCreatedAt).reversed())
                            .limit(5)
                            .map(f -> FeedbackSummaryDTO.builder()
                                    .feedbackId(f.getId())
                                    .userId(f.getTravelerId())
                                    .userName("User " + f.getTravelerId()) // TODO: Fetch from user service
                                    .rating(f.getRating())
                                    .comment(f.getComment())
                                    .createdAt(f.getCreatedAt())
                                    .build())
                            .collect(Collectors.toList());

                    return TravelFeedbackGroupDTO.builder()
                            .travelId(travelId)
                            .travelTitle("Travel " + travelId) // TODO: Fetch from travel service
                            .category(category) // TODO: Fetch from travel service
                            .managerId(null) // TODO: Fetch from travel service
                            .managerName(null) // TODO: Fetch from user service
                            .totalFeedbacks(travelFeedbacks.size())
                            .averageRating(Math.round(avgRating * 10.0) / 10.0)
                            .rating1Count(ratingCounts.getOrDefault(1, 0L).intValue())
                            .rating2Count(ratingCounts.getOrDefault(2, 0L).intValue())
                            .rating3Count(ratingCounts.getOrDefault(3, 0L).intValue())
                            .rating4Count(ratingCounts.getOrDefault(4, 0L).intValue())
                            .rating5Count(ratingCounts.getOrDefault(5, 0L).intValue())
                            .recentFeedbacks(recentFeedbacks)
                            .build();
                })
                .sorted(Comparator.comparing(TravelFeedbackGroupDTO::getAverageRating).reversed())
                .collect(Collectors.toList());

        log.info("Found {} travel groups with feedbacks", groups.size());
        return groups;
    }

    @Transactional(readOnly = true)
    public List<ManagerFeedbackGroupDTO> getFeedbacksGroupedByManager(
            Integer rating, String dateFrom, String dateTo) {
        log.info("Fetching feedbacks grouped by manager");

        List<Feedback> feedbacks = feedbackRepository.findAll();

        // Apply filters
        if (rating != null) {
            feedbacks = feedbacks.stream()
                    .filter(f -> f.getRating().equals(rating))
                    .collect(Collectors.toList());
        }

        if (dateFrom != null) {
            LocalDateTime fromDate = LocalDateTime.parse(dateFrom);
            feedbacks = feedbacks.stream()
                    .filter(f -> f.getCreatedAt().isAfter(fromDate))
                    .collect(Collectors.toList());
        }

        if (dateTo != null) {
            LocalDateTime toDate = LocalDateTime.parse(dateTo);
            feedbacks = feedbacks.stream()
                    .filter(f -> f.getCreatedAt().isBefore(toDate))
                    .collect(Collectors.toList());
        }

        // TODO: Fetch travel details to get manager IDs
        // For now, we'll use a mock implementation
        Map<Long, Long> travelToManagerMap = new HashMap<>();

        // Group feedbacks by manager (through travel)
        Map<Long, List<Feedback>> feedbacksByManager = new HashMap<>();

        for (Feedback feedback : feedbacks) {
            Long managerId = travelToManagerMap.getOrDefault(feedback.getTravelId(), 1L); // Mock manager ID
            feedbacksByManager.computeIfAbsent(managerId, k -> new ArrayList<>()).add(feedback);
        }

        // Build grouped DTOs
        List<ManagerFeedbackGroupDTO> groups = feedbacksByManager.entrySet().stream()
                .map(entry -> {
                    Long managerId = entry.getKey();
                    List<Feedback> managerFeedbacks = entry.getValue();

                    // Calculate statistics
                    double avgRating = managerFeedbacks.stream()
                            .mapToInt(Feedback::getRating)
                            .average()
                            .orElse(0.0);

                    Map<Integer, Long> ratingCounts = managerFeedbacks.stream()
                            .collect(Collectors.groupingBy(Feedback::getRating, Collectors.counting()));

                    // Group by travel for summary
                    Map<Long, List<Feedback>> byTravel = managerFeedbacks.stream()
                            .collect(Collectors.groupingBy(Feedback::getTravelId));

                    List<TravelFeedbackSummaryDTO> travelSummaries = byTravel.entrySet().stream()
                            .map(travelEntry -> {
                                Long travelId = travelEntry.getKey();
                                List<Feedback> travelFeedbacks = travelEntry.getValue();

                                double travelAvgRating = travelFeedbacks.stream()
                                        .mapToInt(Feedback::getRating)
                                        .average()
                                        .orElse(0.0);

                                return TravelFeedbackSummaryDTO.builder()
                                        .travelId(travelId)
                                        .travelTitle("Travel " + travelId) // TODO: Fetch from travel service
                                        .category("Category") // TODO: Fetch from travel service
                                        .feedbackCount(travelFeedbacks.size())
                                        .averageRating(Math.round(travelAvgRating * 10.0) / 10.0)
                                        .build();
                            })
                            .collect(Collectors.toList());

                    return ManagerFeedbackGroupDTO.builder()
                            .managerId(managerId)
                            .managerName("Manager " + managerId) // TODO: Fetch from user service
                            .managerEmail("manager" + managerId + "@example.com") // TODO: Fetch from user service
                            .totalTravels(byTravel.size())
                            .totalFeedbacks(managerFeedbacks.size())
                            .averageRating(Math.round(avgRating * 10.0) / 10.0)
                            .rating1Count(ratingCounts.getOrDefault(1, 0L).intValue())
                            .rating2Count(ratingCounts.getOrDefault(2, 0L).intValue())
                            .rating3Count(ratingCounts.getOrDefault(3, 0L).intValue())
                            .rating4Count(ratingCounts.getOrDefault(4, 0L).intValue())
                            .rating5Count(ratingCounts.getOrDefault(5, 0L).intValue())
                            .travelFeedbacks(travelSummaries)
                            .build();
                })
                .sorted(Comparator.comparing(ManagerFeedbackGroupDTO::getAverageRating).reversed())
                .collect(Collectors.toList());

        log.info("Found {} manager groups with feedbacks", groups.size());
        return groups;
    }

    @Transactional(readOnly = true)
    public FeedbackStatisticsDTO getFeedbackStatistics() {
        log.info("Calculating feedback statistics");

        List<Feedback> allFeedbacks = feedbackRepository.findAll();

        if (allFeedbacks.isEmpty()) {
            return FeedbackStatisticsDTO.builder()
                    .totalFeedbacks(0L)
                    .averageRating(0.0)
                    .rating1Count(0)
                    .rating2Count(0)
                    .rating3Count(0)
                    .rating4Count(0)
                    .rating5Count(0)
                    .totalTravelsWithFeedback(0L)
                    .totalManagers(0L)
                    .rating1Percentage(0.0)
                    .rating2Percentage(0.0)
                    .rating3Percentage(0.0)
                    .rating4Percentage(0.0)
                    .rating5Percentage(0.0)
                    .build();
        }

        // Calculate average rating
        double avgRating = allFeedbacks.stream()
                .mapToInt(Feedback::getRating)
                .average()
                .orElse(0.0);

        // Count by rating
        Map<Integer, Long> ratingCounts = allFeedbacks.stream()
                .collect(Collectors.groupingBy(Feedback::getRating, Collectors.counting()));

        long totalFeedbacks = allFeedbacks.size();
        int rating1Count = ratingCounts.getOrDefault(1, 0L).intValue();
        int rating2Count = ratingCounts.getOrDefault(2, 0L).intValue();
        int rating3Count = ratingCounts.getOrDefault(3, 0L).intValue();
        int rating4Count = ratingCounts.getOrDefault(4, 0L).intValue();
        int rating5Count = ratingCounts.getOrDefault(5, 0L).intValue();

        // Calculate percentages
        double rating1Pct = (rating1Count * 100.0) / totalFeedbacks;
        double rating2Pct = (rating2Count * 100.0) / totalFeedbacks;
        double rating3Pct = (rating3Count * 100.0) / totalFeedbacks;
        double rating4Pct = (rating4Count * 100.0) / totalFeedbacks;
        double rating5Pct = (rating5Count * 100.0) / totalFeedbacks;

        // Count unique travels with feedback
        long uniqueTravels = allFeedbacks.stream()
                .map(Feedback::getTravelId)
                .distinct()
                .count();

        return FeedbackStatisticsDTO.builder()
                .totalFeedbacks(totalFeedbacks)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .rating1Count(rating1Count)
                .rating2Count(rating2Count)
                .rating3Count(rating3Count)
                .rating4Count(rating4Count)
                .rating5Count(rating5Count)
                .totalTravelsWithFeedback(uniqueTravels)
                .totalManagers(0L) // TODO: Fetch from travel service
                .rating1Percentage(Math.round(rating1Pct * 10.0) / 10.0)
                .rating2Percentage(Math.round(rating2Pct * 10.0) / 10.0)
                .rating3Percentage(Math.round(rating3Pct * 10.0) / 10.0)
                .rating4Percentage(Math.round(rating4Pct * 10.0) / 10.0)
                .rating5Percentage(Math.round(rating5Pct * 10.0) / 10.0)
                .build();
    }

    /**
     * Create feedback on behalf of a user (ADMIN only)
     * Bypasses ownership checks
     */
    @Transactional
    public FeedbackDTO createFeedbackForUser(Long userId, Long travelId, Integer rating, String comment) {
        log.info("Admin creating feedback for user: {} on travel: {}", userId, travelId);

        // Check if user already has feedback for this travel
        if (feedbackRepository.existsByTravelerIdAndTravelId(userId, travelId)) {
            log.warn("User {} already has feedback for travel {}", userId, travelId);
            throw new RuntimeException("User has already submitted feedback for this travel");
        }

        Feedback feedback = Feedback.builder()
                .travelerId(userId)
                .travelId(travelId)
                .rating(rating)
                .comment(comment)
                .build();

        feedback = feedbackRepository.save(feedback);
        log.info("Admin successfully created feedback {} for user: {}", feedback.getId(), userId);

        return feedbackService.getFeedbackDTOById(feedback.getId());
    }

    /**
     * Update any feedback without ownership check (ADMIN only)
     */
    @Transactional
    public FeedbackDTO updateFeedbackForUser(Long feedbackId, Integer rating, String comment) {
        log.info("Admin updating feedback: {}", feedbackId);

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found with id: " + feedbackId));

        feedback.setRating(rating);
        feedback.setComment(comment);

        feedback = feedbackRepository.save(feedback);
        log.info("Admin successfully updated feedback: {}", feedbackId);

        return feedbackService.getFeedbackDTOById(feedbackId);
    }

    /**
     * Delete any feedback without ownership check (ADMIN only)
     */
    @Transactional
    public void deleteFeedbackAsAdmin(Long feedbackId) {
        log.info("Admin deleting feedback: {}", feedbackId);

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found with id: " + feedbackId));

        feedbackRepository.delete(feedback);
        log.info("Admin successfully deleted feedback: {}", feedbackId);
    }
}
