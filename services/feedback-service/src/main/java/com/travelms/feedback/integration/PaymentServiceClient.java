package com.travelms.feedback.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceClient {

    private final RestTemplate restTemplate;

    @Value("${payment-service.url:http://localhost:9084}")
    private String paymentServiceUrl;

    /**
     * Get payment statistics for admin dashboard
     */
    public PaymentStatsResponse getPaymentStats() {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(paymentServiceUrl)
                    .path("/api/v1/payments/stats")
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            var response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    PaymentStatsResponse.class
            );

            return response.getBody() != null ? response.getBody() : new PaymentStatsResponse();
        } catch (Exception e) {
            log.warn("Failed to fetch payment stats: {}", e.getMessage());
            return new PaymentStatsResponse();
        }
    }

    /**
     * DTO for payment statistics
     */
    @lombok.Data
    public static class PaymentStatsResponse {
        private BigDecimal platformIncome = BigDecimal.ZERO;
        private BigDecimal lastMonthIncome = BigDecimal.ZERO;
        private Long totalPayments = 0L;
    }
}
