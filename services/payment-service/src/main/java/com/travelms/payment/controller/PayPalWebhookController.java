package com.travelms.payment.controller;

import com.travelms.payment.model.entity.Payment;
import com.travelms.payment.model.enums.PaymentStatus;
import com.travelms.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks/paypal")
@RequiredArgsConstructor
@Slf4j
public class PayPalWebhookController {

    private final PaymentRepository paymentRepository;

    @PostMapping
    public ResponseEntity<String> handlePayPalWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Received PayPal webhook");

        try {
            String eventType = (String) payload.get("event_type");
            log.info("Processing PayPal event: {}", eventType);

            switch (eventType) {
                case "PAYMENT.CAPTURE.COMPLETED":
                    handlePaymentCaptureCompleted(payload);
                    break;
                case "PAYMENT.CAPTURE.DENIED":
                    handlePaymentCaptureDenied(payload);
                    break;
                case "PAYMENT.CAPTURE.REFUNDED":
                    handlePaymentCaptureRefunded(payload);
                    break;
                default:
                    log.info("Unhandled PayPal event type: {}", eventType);
            }

            return ResponseEntity.ok("Webhook processed successfully");

        } catch (Exception e) {
            log.error("Error processing PayPal webhook: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Webhook processing failed");
        }
    }

    @SuppressWarnings("unchecked")
    private void handlePaymentCaptureCompleted(Map<String, Object> payload) {
        try {
            Map<String, Object> resource = (Map<String, Object>) payload.get("resource");
            String captureId = (String) resource.get("id");

            log.info("Payment capture completed: {}", captureId);

            paymentRepository.findByExternalTransactionId(captureId)
                    .ifPresent(payment -> {
                        payment.setStatus(PaymentStatus.COMPLETED);
                        payment.setPaidAt(LocalDateTime.now());
                        paymentRepository.save(payment);
                        log.info("Payment {} marked as completed", payment.getId());
                    });

        } catch (Exception e) {
            log.error("Error handling payment capture completed: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private void handlePaymentCaptureDenied(Map<String, Object> payload) {
        try {
            Map<String, Object> resource = (Map<String, Object>) payload.get("resource");
            String captureId = (String) resource.get("id");

            log.info("Payment capture denied: {}", captureId);

            paymentRepository.findByExternalTransactionId(captureId)
                    .ifPresent(payment -> {
                        payment.setStatus(PaymentStatus.FAILED);
                        payment.setFailureReason("Payment capture denied by PayPal");
                        paymentRepository.save(payment);
                        log.info("Payment {} marked as failed", payment.getId());
                    });

        } catch (Exception e) {
            log.error("Error handling payment capture denied: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private void handlePaymentCaptureRefunded(Map<String, Object> payload) {
        try {
            Map<String, Object> resource = (Map<String, Object>) payload.get("resource");
            String captureId = (String) resource.get("id");

            log.info("Payment capture refunded: {}", captureId);

            paymentRepository.findByExternalTransactionId(captureId)
                    .ifPresent(payment -> {
                        payment.setStatus(PaymentStatus.REFUNDED);
                        payment.setRefundedAt(LocalDateTime.now());
                        paymentRepository.save(payment);
                        log.info("Payment {} marked as refunded", payment.getId());
                    });

        } catch (Exception e) {
            log.error("Error handling payment capture refunded: {}", e.getMessage(), e);
        }
    }
}
