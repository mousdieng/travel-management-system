package com.travelms.payment.integration.stripe;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import com.travelms.payment.dto.StripePaymentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class StripeService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.success.url}")
    private String successUrl;

    @Value("${stripe.cancel.url}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    /**
     * Create Stripe Checkout Session (recommended for redirect-based payments)
     */
    public StripePaymentResponse createCheckoutSession(BigDecimal amount, String currency, Map<String, String> metadata, String description) {
        try {
            // Stripe expects amount in cents
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(cancelUrl)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(currency.toLowerCase())
                                                    .setUnitAmount(amountInCents)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName(description != null ? description : "Travel Booking Payment")
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .setQuantity(1L)
                                    .build()
                    );

            // Add metadata
            if (metadata != null && !metadata.isEmpty()) {
                paramsBuilder.putAllMetadata(metadata);
            }

            Session session = Session.create(paramsBuilder.build());

            log.info("Created Stripe Checkout Session: {}", session.getId());

            return StripePaymentResponse.builder()
                    .sessionId(session.getId())
                    .checkoutUrl(session.getUrl())
                    .paymentIntentId(session.getPaymentIntent())
                    .status(session.getStatus())
                    .amount(session.getAmountTotal())
                    .currency(session.getCurrency())
                    .build();

        } catch (StripeException e) {
            log.error("Error creating Stripe Checkout Session: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create checkout session: " + e.getMessage());
        }
    }

    /**
     * Retrieve Checkout Session
     */
    public Session retrieveCheckoutSession(String sessionId) {
        try {
            return Session.retrieve(sessionId);
        } catch (StripeException e) {
            log.error("Error retrieving Stripe Checkout Session: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve checkout session: " + e.getMessage());
        }
    }

    /**
     * Create Payment Intent with specific payment method (for immediate payment with saved cards or Stripe Elements)
     */
    public StripePaymentResponse createPaymentIntentWithPaymentMethod(BigDecimal amount, String currency, Map<String, String> metadata, String paymentMethodId) {
        try {
            // Stripe expects amount in cents
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(currency.toLowerCase())
                    .setPaymentMethod(paymentMethodId)
                    .setConfirm(true) // Automatically confirm the payment
                    .putAllMetadata(metadata != null ? metadata : new HashMap<>())
                    .setReturnUrl(successUrl) // Required for certain payment methods
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            log.info("Created and confirmed Stripe Payment Intent: {}", paymentIntent.getId());

            return StripePaymentResponse.builder()
                    .clientSecret(paymentIntent.getClientSecret())
                    .paymentIntentId(paymentIntent.getId())
                    .status(paymentIntent.getStatus())
                    .amount(paymentIntent.getAmount())
                    .currency(paymentIntent.getCurrency())
                    .build();

        } catch (StripeException e) {
            log.error("Error creating Stripe Payment Intent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create payment intent: " + e.getMessage());
        }
    }

    /**
     * Create Payment Intent (legacy method, kept for compatibility)
     */
    public StripePaymentResponse createPaymentIntent(BigDecimal amount, String currency, Map<String, String> metadata) {
        try {
            // Stripe expects amount in cents
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(currency.toLowerCase())
                    .putAllMetadata(metadata != null ? metadata : new HashMap<>())
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            log.info("Created Stripe Payment Intent: {}", paymentIntent.getId());

            return StripePaymentResponse.builder()
                    .clientSecret(paymentIntent.getClientSecret())
                    .paymentIntentId(paymentIntent.getId())
                    .status(paymentIntent.getStatus())
                    .amount(paymentIntent.getAmount())
                    .currency(paymentIntent.getCurrency())
                    .build();

        } catch (StripeException e) {
            log.error("Error creating Stripe Payment Intent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create payment intent: " + e.getMessage());
        }
    }

    public PaymentIntent retrievePaymentIntent(String paymentIntentId) {
        try {
            return PaymentIntent.retrieve(paymentIntentId);
        } catch (StripeException e) {
            log.error("Error retrieving Stripe Payment Intent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve payment intent: " + e.getMessage());
        }
    }

    public PaymentIntent confirmPaymentIntent(String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            return paymentIntent.confirm();
        } catch (StripeException e) {
            log.error("Error confirming Stripe Payment Intent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage());
        }
    }

    public Refund createRefund(String paymentIntentId, BigDecimal amount) {
        try {
            RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId);

            if (amount != null) {
                long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();
                paramsBuilder.setAmount(amountInCents);
            }

            Refund refund = Refund.create(paramsBuilder.build());
            log.info("Created Stripe Refund: {}", refund.getId());
            return refund;

        } catch (StripeException e) {
            log.error("Error creating Stripe Refund: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create refund: " + e.getMessage());
        }
    }

    public boolean validateWebhookSignature(String payload, String sigHeader, String webhookSecret) {
        try {
            com.stripe.model.Event event = Webhook.constructEvent(
                    payload, sigHeader, webhookSecret
            );
            return event != null;
        } catch (Exception e) {
            log.error("Webhook signature validation failed: {}", e.getMessage());
            return false;
        }
    }
}
