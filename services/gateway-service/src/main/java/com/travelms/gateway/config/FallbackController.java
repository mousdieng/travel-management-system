package com.travelms.gateway.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Fallback controller for circuit breaker responses
 */
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/user-service")
    public ResponseEntity<Map<String, Object>> userServiceFallback() {
        Map<String, Object> response = createFallbackResponse(
                "User Service is temporarily unavailable",
                "Please try again later or contact support if the problem persists"
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/travel-service")
    public ResponseEntity<Map<String, Object>> travelServiceFallback() {
        Map<String, Object> response = createFallbackResponse(
                "Travel Service is temporarily unavailable",
                "Travel information is currently not accessible. Please try again later."
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/feedback-service")
    public ResponseEntity<Map<String, Object>> feedbackServiceFallback() {
        Map<String, Object> response = createFallbackResponse(
                "FeedBack Service is temporarily unavailable",
                "FeedBack functionality is currently not accessible. Please try again later."
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/payment-service")
    public ResponseEntity<Map<String, Object>> paymentServiceFallback() {
        Map<String, Object> response = createFallbackResponse(
                "Payment Service is temporarily unavailable",
                "Personalized payments are currently not available. Please browse our popular movies instead."
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    private Map<String, Object> createFallbackResponse(String error, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", error);
        response.put("message", message);
        response.put("timestamp", LocalDateTime.now());
        response.put("fallback", true);
        return response;
    }
}