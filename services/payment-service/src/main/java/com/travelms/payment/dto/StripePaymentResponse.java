package com.travelms.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StripePaymentResponse {
    // Checkout Session fields
    private String sessionId;
    private String checkoutUrl;

    // Payment Intent fields (legacy)
    private String clientSecret;
    private String paymentIntentId;

    // Common fields
    private String status;
    private Long amount;
    private String currency;
}
