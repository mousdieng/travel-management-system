package com.travelms.feedback.service;

import com.travelms.feedback.dto.CreateFeedbackRequest;
import com.travelms.feedback.dto.FeedbackDTO;
import com.travelms.feedback.event.FeedbackChangedEvent;
import com.travelms.feedback.model.entity.Feedback;
import com.travelms.feedback.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final com.travelms.feedback.integration.TravelServiceClient travelServiceClient;
    private final com.travelms.feedback.integration.UserServiceClient userServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.feedback-changed}")
    private String feedbackChangedTopic;

    @Transactional
    public FeedbackDTO submitFeedback(CreateFeedbackRequest request, Long travelerId) {
        // Check if already submitted feedback
        if (feedbackRepository.existsByTravelerIdAndTravelId(travelerId, request.getTravelId())) {
            throw new RuntimeException("You have already submitted feedback for this travel");
        }

        // Create feedback
        Feedback feedback = Feedback.builder()
                .travelerId(travelerId)
                .travelId(request.getTravelId())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        feedback = feedbackRepository.save(feedback);

        // Publish feedback created event
        publishFeedbackChangedEvent(feedback, FeedbackChangedEvent.ChangeType.CREATED);

        return convertToDTO(feedback);
    }

    @Transactional
    public FeedbackDTO updateFeedback(Long id, CreateFeedbackRequest request, Long travelerId) {
        Feedback feedback = getFeedbackById(id);

        // Verify ownership
        if (!feedback.getTravelerId().equals(travelerId)) {
            throw new RuntimeException("You can only update your own feedback");
        }

        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment());

        feedback = feedbackRepository.save(feedback);

        // Publish feedback updated event
        publishFeedbackChangedEvent(feedback, FeedbackChangedEvent.ChangeType.UPDATED);

        // Update travel rating in travel-service
        updateTravelRating(request.getTravelId());

        return convertToDTO(feedback);
    }

    @Transactional
    public void deleteFeedback(Long id, Long travelerId) {
        Feedback feedback = getFeedbackById(id);

        // Verify ownership
        if (!feedback.getTravelerId().equals(travelerId)) {
            throw new RuntimeException("You can only delete your own feedback");
        }

        feedbackRepository.delete(feedback);

        // Publish feedback deleted event
        publishFeedbackChangedEvent(feedback, FeedbackChangedEvent.ChangeType.DELETED);

        // Update travel rating in travel-service after deletion
        updateTravelRating(feedback.getTravelId());
    }

    public FeedbackDTO getFeedbackDTOById(Long id) {
        Feedback feedback = getFeedbackById(id);
        return convertToDTO(feedback);
    }

    public Feedback getFeedbackById(Long id) {
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found with id: " + id));
    }

    public List<FeedbackDTO> getTravelFeedbacks(Long travelId) {
        return feedbackRepository.findByTravelId(travelId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<FeedbackDTO> getUserFeedbacks(Long travelerId) {
        return feedbackRepository.findByTravelerId(travelerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<FeedbackDTO> getAllFeedbacks() {
        return feedbackRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<FeedbackDTO> getManagerTravelsFeedbacks(Long managerId) {
        // Get all travel IDs for this manager from travel service
        List<Long> travelIds = travelServiceClient.getManagerTravelIds(managerId);

        if (travelIds.isEmpty()) {
            return List.of();
        }

        // Get all feedbacks for those travels
        return feedbackRepository.findByTravelIdIn(travelIds).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Double getAverageRatingByTravelId(Long travelId) {
        Double average = feedbackRepository.getAverageRatingByTravelId(travelId);
        return average != null ? average : 0.0;
    }

    public Long getFeedbackCountByTravelId(Long travelId) {
        return feedbackRepository.countByTravelId(travelId);
    }

    private FeedbackDTO convertToDTO(Feedback feedback) {
        // Fetch traveler name from user service
        String travelerName = userServiceClient.getUserName(feedback.getTravelerId());

        // Fetch travel title from travel service
        String travelTitle = travelServiceClient.getTravelTitle(feedback.getTravelId());

        return FeedbackDTO.builder()
                .id(feedback.getId())
                .travelerId(feedback.getTravelerId())
                .travelerName(travelerName)
                .travelId(feedback.getTravelId())
                .travelTitle(travelTitle)
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .createdAt(feedback.getCreatedAt())
                .build();
    }

    /**
     * Calculate and update travel rating in travel-service
     */
    private void updateTravelRating(Long travelId) {
        Double averageRating = feedbackRepository.getAverageRatingByTravelId(travelId);
        Long feedbackCount = feedbackRepository.countByTravelId(travelId);

        if (averageRating != null && feedbackCount != null) {
            travelServiceClient.updateTravelRating(
                    travelId,
                    averageRating,
                    feedbackCount.intValue()
            );
        }
    }

    /**
     * Cascade delete all feedbacks created by a user
     * Called by user-service when deleting a user
     * Updates travel ratings after deletion
     */
    @Transactional
    public void deleteAllFeedbacksByUser(Long userId) {
        List<Feedback> feedbacks = feedbackRepository.findByTravelerId(userId);

        log.info("Cascade deleting {} feedbacks for user: {}", feedbacks.size(), userId);

        // Group feedbacks by travel ID to update ratings after deletion
        java.util.Set<Long> affectedTravelIds = feedbacks.stream()
                .map(Feedback::getTravelId)
                .collect(java.util.stream.Collectors.toSet());

        // Delete all feedbacks
        for (Feedback feedback : feedbacks) {
            feedbackRepository.delete(feedback);
        }

        // Update ratings for affected travels
        for (Long travelId : affectedTravelIds) {
            try {
                updateTravelRating(travelId);
            } catch (Exception e) {
                log.warn("Failed to update travel rating for travel {}: {}", travelId, e.getMessage());
            }
        }

        log.info("Successfully cascade deleted {} feedbacks for user: {}", feedbacks.size(), userId);
    }

    /**
     * Publish FeedbackChangedEvent to Kafka
     * Called when feedback is created, updated, or deleted
     */
    private void publishFeedbackChangedEvent(Feedback feedback, FeedbackChangedEvent.ChangeType changeType) {
        try {
            FeedbackChangedEvent event = FeedbackChangedEvent.builder()
                    .feedbackId(feedback.getId())
                    .travelId(feedback.getTravelId())
                    .travelerId(feedback.getTravelerId())
                    .rating(feedback.getRating())
                    .changeType(changeType)
                    .changedAt(LocalDateTime.now())
                    .build();

            kafkaTemplate.send(feedbackChangedTopic, feedback.getId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish FeedbackChangedEvent for feedbackId: {}, changeType: {}",
                                    feedback.getId(), changeType, ex);
                        } else {
                            log.info("Successfully published FeedbackChangedEvent for feedbackId: {}, changeType: {} to topic: {}",
                                    feedback.getId(), changeType, feedbackChangedTopic);
                        }
                    });
        } catch (Exception e) {
            log.error("Error creating FeedbackChangedEvent for feedbackId: {}, changeType: {}",
                    feedback.getId(), changeType, e);
        }
    }
}
