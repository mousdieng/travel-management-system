package com.travelms.payment.controller;

import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.ApiResource;
import com.travelms.payment.integration.stripe.StripeService;
import com.travelms.payment.model.entity.Payment;
import com.travelms.payment.model.enums.PaymentStatus;
import com.travelms.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/webhooks/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final StripeService stripeService;
    private final PaymentRepository paymentRepository;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        log.info("Received Stripe webhook");

        // Validate webhook signature
        if (!stripeService.validateWebhookSignature(payload, sigHeader, webhookSecret)) {
            log.error("Invalid webhook signature");
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        try {
            Event event = ApiResource.GSON.fromJson(payload, Event.class);
            log.info("Processing Stripe event: {}", event.getType());

            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentIntentSucceeded(event);
                    break;
                case "payment_intent.payment_failed":
                    handlePaymentIntentFailed(event);
                    break;
                case "payment_intent.canceled":
                    handlePaymentIntentCanceled(event);
                    break;
                case "charge.refunded":
                    handleChargeRefunded(event);
                    break;
                default:
                    log.info("Unhandled event type: {}", event.getType());
            }

            return ResponseEntity.ok("Webhook processed successfully");

        } catch (Exception e) {
            log.error("Error processing webhook: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Webhook processing failed");
        }
    }

    private void handlePaymentIntentSucceeded(Event event) {
        try {
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));

            String paymentIntentId = paymentIntent.getId();
            log.info("Payment intent succeeded: {}", paymentIntentId);

            paymentRepository.findByPaymentIntentId(paymentIntentId)
                    .ifPresent(payment -> {
                        payment.setStatus(PaymentStatus.COMPLETED);
                        payment.setPaidAt(LocalDateTime.now());
                        paymentRepository.save(payment);
                        log.info("Payment {} marked as completed", payment.getId());
                    });

        } catch (Exception e) {
            log.error("Error handling payment intent succeeded: {}", e.getMessage(), e);
        }
    }

    private void handlePaymentIntentFailed(Event event) {
        try {
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));

            String paymentIntentId = paymentIntent.getId();
            log.info("Payment intent failed: {}", paymentIntentId);

            paymentRepository.findByPaymentIntentId(paymentIntentId)
                    .ifPresent(payment -> {
                        payment.setStatus(PaymentStatus.FAILED);
                        payment.setFailureReason(paymentIntent.getLastPaymentError() != null ?
                                paymentIntent.getLastPaymentError().getMessage() : "Payment failed");
                        paymentRepository.save(payment);
                        log.info("Payment {} marked as failed", payment.getId());
                    });

        } catch (Exception e) {
            log.error("Error handling payment intent failed: {}", e.getMessage(), e);
        }
    }

    private void handlePaymentIntentCanceled(Event event) {
        try {
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));

            String paymentIntentId = paymentIntent.getId();
            log.info("Payment intent canceled: {}", paymentIntentId);

            paymentRepository.findByPaymentIntentId(paymentIntentId)
                    .ifPresent(payment -> {
                        payment.setStatus(PaymentStatus.CANCELLED);
                        paymentRepository.save(payment);
                        log.info("Payment {} marked as cancelled", payment.getId());
                    });

        } catch (Exception e) {
            log.error("Error handling payment intent canceled: {}", e.getMessage(), e);
        }
    }

    private void handleChargeRefunded(Event event) {
        try {
            log.info("Charge refunded event received");
            // Additional refund handling logic can be added here
        } catch (Exception e) {
            log.error("Error handling charge refunded: {}", e.getMessage(), e);
        }
    }
}
