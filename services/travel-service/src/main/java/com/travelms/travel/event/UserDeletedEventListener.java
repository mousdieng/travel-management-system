package com.travelms.travel.event;

import com.travelms.travel.service.SubscriptionService;
import com.travelms.travel.service.TravelService;
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

    private final TravelService travelService;
    private final SubscriptionService subscriptionService;

    @KafkaListener(topics = "${kafka.topics.user-deleted}", containerFactory = "kafkaListenerContainerFactory")
    public void handleUserDeleted(@Payload UserDeletedEvent event, Acknowledgment acknowledgment) {
        try {
            log.info("Received user deleted event for userId: {}, role: {}", event.getUserId(), event.getRole());

            // Delete user's subscriptions (if traveler)
            subscriptionService.deleteAllSubscriptionsByUser(event.getUserId());

            // Delete user's travels (if travel manager)
            if ("TRAVEL_MANAGER".equals(event.getRole()) || "ADMIN".equals(event.getRole())) {
                travelService.deleteAllTravelsByManager(event.getUserId());
            }

            log.info("Successfully processed user deleted event for userId: {}", event.getUserId());
            acknowledgment.acknowledge();

        } catch (Exception e) {
            log.error("Error processing user deleted event for userId: {}", event.getUserId(), e);
            // Don't acknowledge - message will be reprocessed
        }
    }
}
