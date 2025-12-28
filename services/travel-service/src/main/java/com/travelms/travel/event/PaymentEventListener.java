package com.travelms.travel.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelms.travel.dto.CreateSubscriptionRequest;
import com.travelms.travel.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Listens for payment-related events and manages subscriptions
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {

    private final SubscriptionService subscriptionService;
    private final ObjectMapper objectMapper;

    /**
     * Handles payment completed event by creating subscription
     */
    @KafkaListener(
            topics = "${kafka.topics.payment-completed}",
            containerFactory = "paymentCompletedListenerFactory"
    )
    public void handlePaymentCompleted(@Payload PaymentCompletedEvent event, Acknowledgment acknowledgment) {
        try {
            log.info("Received payment completed event for paymentId: {}, userId: {}, travelId: {}",
                    event.getPaymentId(), event.getUserId(), event.getTravelId());

            // Parse booking details from JSON
            Long travelId = event.getTravelId();
            Integer numberOfParticipants = event.getNumberOfParticipants();
            String userName = event.getUserName();

            // If booking details JSON is provided (payment-first flow), extract from there
            if (event.getBookingDetailsJson() != null && !event.getBookingDetailsJson().isEmpty()) {
                try {
                    Map<String, Object> bookingDetails = objectMapper.readValue(
                            event.getBookingDetailsJson(),
                            Map.class
                    );
                    travelId = ((Number) bookingDetails.get("travelId")).longValue();
                    numberOfParticipants = (Integer) bookingDetails.get("numberOfParticipants");
                    userName = (String) bookingDetails.get("userName");
                } catch (Exception e) {
                    log.warn("Failed to parse booking details JSON: {}", e.getMessage());
                    // Fall back to event fields
                }
            }

            // Create subscription request
            CreateSubscriptionRequest request = CreateSubscriptionRequest.builder()
                    .travelId(travelId)
                    .numberOfParticipants(numberOfParticipants)
                    .build();

            // Create subscription
            subscriptionService.createSubscription(request, event.getUserId(), userName);

            log.info("Successfully created subscription for paymentId: {}", event.getPaymentId());
            acknowledgment.acknowledge();

        } catch (Exception e) {
            log.error("Error processing payment completed event for paymentId: {}",
                    event.getPaymentId(), e);
            // Don't acknowledge - message will be reprocessed
        }
    }

    /**
     * Handles payment refunded event by canceling subscription
     */
    @KafkaListener(
            topics = "${kafka.topics.payment-refunded}",
            containerFactory = "paymentRefundedListenerFactory"
    )
    public void handlePaymentRefunded(@Payload PaymentRefundedEvent event, Acknowledgment acknowledgment) {
        try {
            log.info("Received payment refunded event for paymentId: {}, subscriptionId: {}",
                    event.getPaymentId(), event.getSubscriptionId());

            if (event.getSubscriptionId() != null) {
                // Cancel the subscription
                subscriptionService.cancelSubscription(event.getSubscriptionId(), event.getUserId());
                log.info("Successfully cancelled subscription {} due to payment refund",
                        event.getSubscriptionId());
            } else {
                log.warn("No subscriptionId provided in payment refunded event for paymentId: {}",
                        event.getPaymentId());
            }

            acknowledgment.acknowledge();

        } catch (Exception e) {
            log.error("Error processing payment refunded event for paymentId: {}",
                    event.getPaymentId(), e);
            // Don't acknowledge - message will be reprocessed
        }
    }
}
