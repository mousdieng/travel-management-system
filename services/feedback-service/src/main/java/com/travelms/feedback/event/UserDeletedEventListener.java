package com.travelms.feedback.event;

import com.travelms.feedback.service.FeedbackService;
import com.travelms.feedback.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Listens for user deleted events and cascades deletions
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserDeletedEventListener {

    private final FeedbackService feedbackService;
    private final ReportService reportService;

    @KafkaListener(topics = "${kafka.topics.user-deleted}", containerFactory = "kafkaListenerContainerFactory")
    public void handleUserDeleted(@Payload UserDeletedEvent event, Acknowledgment acknowledgment) {
        try {
            log.info("Received user deleted event for userId: {}", event.getUserId());

            // Delete user's feedbacks
            feedbackService.deleteAllFeedbacksByUser(event.getUserId());

            // Delete user's reports
            reportService.deleteAllReportsByUser(event.getUserId());

            log.info("Successfully processed user deleted event for userId: {}", event.getUserId());
            acknowledgment.acknowledge();

        } catch (Exception e) {
            log.error("Error processing user deleted event for userId: {}", event.getUserId(), e);
            // Don't acknowledge - message will be reprocessed
        }
    }
}
