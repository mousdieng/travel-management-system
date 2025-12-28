package com.travelms.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelms.payment.client.TravelServiceClient;
import com.travelms.payment.client.dto.TravelSubscriptionRequest;
import com.travelms.payment.client.dto.TravelSubscriptionResponse;
import com.travelms.payment.dto.CheckoutRequest;
import com.travelms.payment.dto.CreatePaymentRequest;
import com.travelms.payment.dto.PaymentDTO;
import com.travelms.payment.model.entity.Payment;
import com.travelms.payment.model.enums.PaymentStatus;
import com.travelms.payment.repository.PaymentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for handling payment-first checkout flow
 * Flow: Create Payment -> User Pays -> Confirm Payment -> Create Subscription
 */
@Service
@Slf4j
public class CheckoutService {

    private final PaymentService paymentService;
    private final TravelServiceClient travelServiceClient;
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;

    /**
     * Constructor with @Lazy injection for PaymentService to break circular dependency
     */
    @Autowired
    public CheckoutService(@Lazy PaymentService paymentService,
                          TravelServiceClient travelServiceClient,
                          PaymentRepository paymentRepository,
                          ObjectMapper objectMapper) {
        this.paymentService = paymentService;
        this.travelServiceClient = travelServiceClient;
        this.paymentRepository = paymentRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Initialize checkout by creating payment intent/session BEFORE subscription
     * @param request Checkout request with travel booking and payment info
     * @param userName User's name
     * @param jwtToken JWT token for authenticating to travel service
     * @return Payment DTO with redirect URL or client secret
     */
    @Transactional
    public PaymentDTO initiateCheckout(CheckoutRequest request, String userName, String jwtToken) {
        log.info("Initiating checkout for user {} and travel {}. SubscriptionId: {}",
                request.getUserId(), request.getTravelId(), request.getSubscriptionId());

        // Determine bookingId based on flow
        Long bookingId;
        String pendingBookingDetailsJson = null;

        if (request.getSubscriptionId() != null) {
            // Subscribe-first flow: use existing subscription ID
            log.info("Using existing subscription {} for payment", request.getSubscriptionId());
            bookingId = request.getSubscriptionId();
        } else {
            // Payment-first flow: store booking details to create subscription after payment
            log.info("Payment-first flow: storing booking details for later subscription creation");
            bookingId = null;

            Map<String, Object> bookingDetails = new HashMap<>();
            bookingDetails.put("travelId", request.getTravelId());
            bookingDetails.put("numberOfParticipants", request.getNumberOfParticipants());
            bookingDetails.put("userName", userName);
            if (request.getPassengerDetails() != null) {
                bookingDetails.put("passengerDetails", request.getPassengerDetails());
            }

            try {
                pendingBookingDetailsJson = objectMapper.writeValueAsString(bookingDetails);
            } catch (Exception e) {
                log.error("Failed to serialize booking details: {}", e.getMessage());
                throw new RuntimeException("Failed to process checkout request");
            }
        }

        // Create payment request
        CreatePaymentRequest paymentRequest = CreatePaymentRequest.builder()
                .userId(request.getUserId())
                .bookingId(bookingId) // Set to subscription ID if subscribe-first, null if payment-first
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .currency(request.getCurrency())
                .stripePaymentMethodId(request.getStripePaymentMethodId())
                .savedPaymentMethodId(request.getSavedPaymentMethodId())
                .savePaymentMethod(request.getSavePaymentMethod())
                .cardholderName(request.getCardholderName())
                .paypalOrderId(request.getPaypalOrderId())
                .build();

        // Process payment (creates payment intent/session)
        PaymentDTO paymentDTO = paymentService.processPayment(paymentRequest);

        // Update payment with pending booking details (only for payment-first flow)
        Payment payment = paymentRepository.findById(paymentDTO.getId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (pendingBookingDetailsJson != null) {
            payment.setPendingBookingDetails(pendingBookingDetailsJson);
        }
        payment.setTravelId(request.getTravelId());
        payment = paymentRepository.save(payment);

        // If payment was completed immediately (e.g., card payment with confirm:true), create subscription now
        if (payment.getStatus() == PaymentStatus.COMPLETED && payment.getBookingId() == null) {
            log.info("Payment completed immediately. Creating subscription for payment {}", payment.getId());
            try {
                completeCheckoutAfterPayment(payment, jwtToken);
                // Reload payment to get updated bookingId
                payment = paymentRepository.findById(payment.getId())
                        .orElseThrow(() -> new RuntimeException("Payment not found after subscription creation"));
                paymentDTO.setBookingId(payment.getBookingId());
            } catch (Exception e) {
                log.error("Failed to create subscription after immediate payment: {}", e.getMessage(), e);
                // Don't fail the entire checkout - payment succeeded
                payment.setFailureReason("Payment completed but subscription creation failed: " + e.getMessage());
                paymentRepository.save(payment);
            }
        }

        log.info("Checkout initiated. Payment ID: {}, Status: {}", paymentDTO.getId(), paymentDTO.getStatus());

        return paymentDTO;
    }

    /**
     * Complete checkout by creating subscription after payment is confirmed
     * This is called from the payment confirmation flow
     *
     * @param payment Confirmed payment
     * @param jwtToken JWT token for authentication to travel service
     * @return Created subscription ID
     */
    @Transactional
    public Long completeCheckoutAfterPayment(Payment payment, String jwtToken) {
        // Check if booking was already created
        if (payment.getBookingId() != null) {
            log.info("Subscription already created for payment {}", payment.getId());
            return payment.getBookingId();
        }

        // Check if there are pending booking details
        if (payment.getPendingBookingDetails() == null || payment.getPendingBookingDetails().isEmpty()) {
            log.warn("No pending booking details found for payment {}. Skipping subscription creation.", payment.getId());
            return null;
        }

        log.info("Creating subscription after payment confirmation for payment {}", payment.getId());

        try {
            // Parse pending booking details
            Map<String, Object> bookingDetails = objectMapper.readValue(
                    payment.getPendingBookingDetails(),
                    Map.class
            );

            Long travelId = ((Number) bookingDetails.get("travelId")).longValue();
            Integer numberOfParticipants = ((Number) bookingDetails.get("numberOfParticipants")).intValue();
            String userName = (String) bookingDetails.get("userName");

            // Build subscription request
            TravelSubscriptionRequest.TravelSubscriptionRequestBuilder requestBuilder =
                    TravelSubscriptionRequest.builder()
                            .travelId(travelId)
                            .numberOfParticipants(numberOfParticipants);

            // Add passenger details if present
            if (bookingDetails.containsKey("passengerDetails")) {
                requestBuilder.passengerDetails(
                        ((java.util.List<Map<String, String>>) bookingDetails.get("passengerDetails")).stream()
                                .map(pd -> TravelSubscriptionRequest.PassengerDetail.builder()
                                        .firstName(pd.get("firstName"))
                                        .lastName(pd.get("lastName"))
                                        .dateOfBirth(pd.get("dateOfBirth"))
                                        .passportNumber(pd.get("passportNumber"))
                                        .phoneNumber(pd.get("phoneNumber"))
                                        .email(pd.get("email"))
                                        .build())
                                .collect(Collectors.toList())
                );
            }

            TravelSubscriptionRequest subscriptionRequest = requestBuilder.build();

            // Call travel service to create subscription
            TravelSubscriptionResponse subscription = travelServiceClient.createSubscription(
                    subscriptionRequest,
                    payment.getUserId(),
                    userName,
                    jwtToken
            );

            // Update payment with booking ID
            payment.setBookingId(subscription.getId());
            payment.setPendingBookingDetails(null); // Clear pending details
            paymentRepository.save(payment);

            log.info("Successfully created subscription {} for payment {}", subscription.getId(), payment.getId());

            return subscription.getId();

        } catch (Exception e) {
            log.error("Failed to create subscription after payment: {}", e.getMessage(), e);
            // Mark payment as completed but note the subscription creation failure
            payment.setFailureReason("Payment completed but subscription creation failed: " + e.getMessage());
            paymentRepository.save(payment);
            throw new RuntimeException("Payment completed but failed to create booking: " + e.getMessage(), e);
        }
    }

    /**
     * Handle subscription creation failure by refunding the payment
     */
    @Transactional
    public void handleSubscriptionCreationFailure(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.COMPLETED && payment.getBookingId() == null) {
            log.warn("Subscription creation failed for payment {}. Consider initiating refund.", paymentId);
            // Optionally trigger automatic refund here
            // paymentService.refundPayment(paymentId, new RefundRequest());
        }
    }
}
