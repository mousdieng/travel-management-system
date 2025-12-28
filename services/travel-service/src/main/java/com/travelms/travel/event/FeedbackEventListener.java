package com.travelms.travel.event;

import com.travelms.travel.service.TravelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Listens for feedback changed events and updates travel ratings
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FeedbackEventListener {

    private final TravelService travelService;

    @KafkaListener(
            topics = "${kafka.topics.feedback-changed}",
            containerFactory = "feedbackChangedListenerFactory"
    )
    public void handleFeedbackChanged(@Payload FeedbackChangedEvent event, Acknowledgment acknowledgment) {
        try {
            log.info("Received feedback changed event for travelId: {}, feedbackId: {}, type: {}",
                    event.getTravelId(), event.getFeedbackId(), event.getChangeType());

            // Travel rating will be recalculated by feedback-service
            // This event is just to trigger any additional processing if needed
            // For now, we'll just acknowledge it
            // The rating update is handled by FeedbackService calling updateTravelRating()

            log.info("Processed feedback changed event for travelId: {}", event.getTravelId());
            acknowledgment.acknowledge();

        } catch (Exception e) {
            log.error("Error processing feedback changed event for travelId: {}",
                    event.getTravelId(), e);
            // Don't acknowledge - message will be reprocessed
        }
    }
}
