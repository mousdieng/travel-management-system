package com.travelms.payment.service;

import com.stripe.model.PaymentIntent;
import com.travelms.payment.dto.*;
import com.travelms.payment.event.PaymentCompletedEvent;
import com.travelms.payment.event.PaymentRefundedEvent;
import com.travelms.payment.integration.paypal.PayPalService;
import com.travelms.payment.integration.stripe.StripeService;
import com.travelms.payment.model.entity.Payment;
import com.travelms.payment.model.enums.PaymentMethod;
import com.travelms.payment.model.enums.PaymentStatus;
import com.travelms.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final StripeService stripeService;
    private final PayPalService payPalService;
    private final PaymentMethodService paymentMethodService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private CheckoutService checkoutService; // Lazy injection to avoid circular dependency

    @Value("${kafka.topics.payment-completed}")
    private String paymentCompletedTopic;

    @Value("${kafka.topics.payment-refunded}")
    private String paymentRefundedTopic;

    private static final BigDecimal STRIPE_FEE_PERCENTAGE = new BigDecimal("0.029"); // 2.9%
    private static final BigDecimal STRIPE_FIXED_FEE = new BigDecimal("0.30");
    private static final BigDecimal PAYPAL_FEE_PERCENTAGE = new BigDecimal("0.0349"); // 3.49%
    private static final BigDecimal PAYPAL_FIXED_FEE = new BigDecimal("0.49");

    /**
     * Setter for CheckoutService to break circular dependency
     * CheckoutService -> PaymentService -> CheckoutService
     */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setCheckoutService(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @Transactional
    public PaymentDTO processPayment(CreatePaymentRequest request) {
        log.info("Processing payment for booking: {}", request.getBookingId());

        // Create payment record
        Payment payment = Payment.builder()
                .userId(request.getUserId())
                .bookingId(request.getBookingId())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .currency(request.getCurrency())
                .status(PaymentStatus.PENDING)
                .transactionId(generateTransactionId())
                .paymentDetails(request.getPaymentDetails())
                .build();

        // Calculate fees and net amount
        calculateFees(payment);

        payment = paymentRepository.save(payment);

        // Process payment based on method
        PaymentDTO result;
        try {
            if (request.getPaymentMethod() == PaymentMethod.STRIPE) {
                result = processStripePayment(payment, request);
            } else if (request.getPaymentMethod() == PaymentMethod.PAYPAL) {
                result = processPayPalPayment(payment, request);
            } else {
                // For other payment methods, mark as processing
                payment.setStatus(PaymentStatus.PROCESSING);
                payment = paymentRepository.save(payment);
                result = convertToDTO(payment);
            }
        } catch (Exception e) {
            log.error("Payment processing failed: {}", e.getMessage(), e);
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(e.getMessage());
            payment = paymentRepository.save(payment);
            throw new RuntimeException("Payment processing failed: " + e.getMessage());
        }

        return result;
    }

    @Transactional
    public PaymentDTO processStripePayment(Payment payment, CreatePaymentRequest request) {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("paymentId", payment.getId().toString());
        // BookingId may be null in payment-first checkout flow
        if (payment.getBookingId() != null) {
            metadata.put("bookingId", payment.getBookingId().toString());
        }
        metadata.put("userId", payment.getUserId().toString());

        String description = payment.getBookingId() != null
                ? "Payment for Booking #" + payment.getBookingId()
                : "Payment for Travel #" + payment.getTravelId();

        // Determine payment method ID to use
        String paymentMethodId = null;

        if (request.getSavedPaymentMethodId() != null) {
            // Use saved payment method
            com.travelms.payment.dto.SavedPaymentMethodDTO savedMethod =
                    paymentMethodService.getPaymentMethod(request.getUserId(), request.getSavedPaymentMethodId());
            paymentMethodId = savedMethod.getStripePaymentMethodId();
            log.info("Using saved payment method: {}", request.getSavedPaymentMethodId());
        } else if (request.getStripePaymentMethodId() != null) {
            // Use new payment method from Stripe Elements
            paymentMethodId = request.getStripePaymentMethodId();

            // Save payment method if requested
            if (Boolean.TRUE.equals(request.getSavePaymentMethod())) {
                try {
                    com.travelms.payment.dto.SavePaymentMethodRequest saveRequest =
                            com.travelms.payment.dto.SavePaymentMethodRequest.builder()
                                    .userId(request.getUserId())
                                    .type(PaymentMethod.STRIPE)
                                    .stripePaymentMethodId(paymentMethodId)
                                    .cardholderName(request.getCardholderName())
                                    .setAsDefault(false)
                                    .build();
                    paymentMethodService.savePaymentMethod(saveRequest);
                    log.info("Saved payment method for user: {}", request.getUserId());
                } catch (Exception e) {
                    log.warn("Failed to save payment method: {}", e.getMessage());
                    // Continue with payment even if save fails
                }
            }
        }

        if (paymentMethodId != null) {
            // Use Payment Intent for immediate payment (in-modal)
            metadata.put("paymentMethodId", paymentMethodId);

            StripePaymentResponse stripeResponse = stripeService.createPaymentIntentWithPaymentMethod(
                    payment.getAmount(),
                    payment.getCurrency(),
                    metadata,
                    paymentMethodId
            );

            payment.setPaymentIntentId(stripeResponse.getPaymentIntentId());
            payment.setExternalTransactionId(stripeResponse.getPaymentIntentId());

            // If payment succeeded immediately, mark as completed
            if ("succeeded".equals(stripeResponse.getStatus())) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());
            } else {
                payment.setStatus(PaymentStatus.PROCESSING);
            }

            payment = paymentRepository.save(payment);

            // Publish event if payment completed
            if (payment.getStatus() == PaymentStatus.COMPLETED) {
                publishPaymentCompletedEvent(payment);
            }

            PaymentDTO dto = convertToDTO(payment);
            dto.setClientSecret(stripeResponse.getClientSecret());
            log.info("Returning PaymentDTO with clientSecret: {}", dto.getClientSecret() != null ? "present" : "null");
            return dto;
        } else {
            // No payment method provided, use Checkout Session for redirect
            StripePaymentResponse stripeResponse = stripeService.createCheckoutSession(
                    payment.getAmount(),
                    payment.getCurrency(),
                    metadata,
                    description
            );

            payment.setSessionId(stripeResponse.getSessionId());
            payment.setPaymentIntentId(stripeResponse.getPaymentIntentId());
            payment.setExternalTransactionId(stripeResponse.getSessionId());
            payment.setStatus(PaymentStatus.PROCESSING);
            payment = paymentRepository.save(payment);

            PaymentDTO dto = convertToDTO(payment);
            dto.setCheckoutUrl(stripeResponse.getCheckoutUrl());
            return dto;
        }
    }

    @Transactional
    public PaymentDTO processPayPalPayment(Payment payment, CreatePaymentRequest request) {
        String description = payment.getBookingId() != null
                ? "Payment for Booking #" + payment.getBookingId()
                : "Payment for Travel #" + payment.getTravelId();

        PayPalPaymentResponse paypalResponse = payPalService.createPayment(
                payment.getAmount(),
                payment.getCurrency(),
                description
        );

        payment.setExternalTransactionId(paypalResponse.getOrderId());
        payment.setStatus(PaymentStatus.PROCESSING);
        payment.setPaymentDetails(paypalResponse.getApprovalUrl());
        payment = paymentRepository.save(payment);

        // Convert to DTO and include approval URL for frontend
        PaymentDTO dto = convertToDTO(payment);
        dto.setApprovalUrl(paypalResponse.getApprovalUrl());
        dto.setCheckoutUrl(paypalResponse.getApprovalUrl()); // Frontend looks for checkoutUrl
        log.info("PayPal payment DTO - checkoutUrl: {}, approvalUrl: {}", dto.getCheckoutUrl(), dto.getApprovalUrl());
        return dto;
    }

    @Transactional
    public PaymentDTO confirmStripePayment(String sessionId, String jwtToken) {
        // Try to find payment by session ID first (new checkout flow)
        Payment payment = paymentRepository.findBySessionId(sessionId)
                .orElse(null);

        // Fallback to payment intent ID (legacy flow)
        if (payment == null) {
            payment = paymentRepository.findByPaymentIntentId(sessionId)
                    .orElseThrow(() -> new RuntimeException("Payment not found for session/payment intent: " + sessionId));

            // Legacy Payment Intent flow
            PaymentIntent paymentIntent = stripeService.retrievePaymentIntent(sessionId);

            if ("succeeded".equals(paymentIntent.getStatus())) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());
            } else if ("canceled".equals(paymentIntent.getStatus())) {
                payment.setStatus(PaymentStatus.CANCELLED);
            } else if ("requires_payment_method".equals(paymentIntent.getStatus())) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Payment method required");
            }
        } else {
            // New Checkout Session flow
            com.stripe.model.checkout.Session session = stripeService.retrieveCheckoutSession(sessionId);

            if ("complete".equals(session.getStatus()) && "paid".equals(session.getPaymentStatus())) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());

                // Update payment intent ID if it wasn't set
                if (payment.getPaymentIntentId() == null && session.getPaymentIntent() != null) {
                    payment.setPaymentIntentId(session.getPaymentIntent());
                }
            } else if ("expired".equals(session.getStatus())) {
                payment.setStatus(PaymentStatus.CANCELLED);
                payment.setFailureReason("Checkout session expired");
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Payment not completed");
            }
        }

        payment = paymentRepository.save(payment);

        // Publish event if payment completed
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            publishPaymentCompletedEvent(payment);
        }

        // If payment is completed and has pending booking details, create subscription
        if (payment.getStatus() == PaymentStatus.COMPLETED &&
            payment.getBookingId() == null &&
            payment.getPendingBookingDetails() != null &&
            checkoutService != null) {

            log.info("Payment confirmed successfully. Creating subscription for payment {}", payment.getId());
            try {
                checkoutService.completeCheckoutAfterPayment(payment, jwtToken);
            } catch (Exception e) {
                log.error("Failed to create subscription after payment confirmation: {}", e.getMessage(), e);
                // Continue - payment is still completed, subscription creation failure is logged
            }
        }

        return convertToDTO(payment);
    }

    @Transactional
    public PaymentDTO confirmPayPalPayment(String paymentId, String payerId, String jwtToken) {
        Payment payment = paymentRepository.findByExternalTransactionId(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found for PayPal payment: " + paymentId));

        PayPalPaymentResponse response = payPalService.executePayment(paymentId, payerId);

        if ("approved".equals(response.getStatus())) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());
            payment.setExternalTransactionId(response.getCaptureId());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("PayPal payment not approved");
        }

        payment = paymentRepository.save(payment);

        // Publish event if payment completed
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            publishPaymentCompletedEvent(payment);
        }

        // If payment is completed and has pending booking details, create subscription
        if (payment.getStatus() == PaymentStatus.COMPLETED &&
            payment.getBookingId() == null &&
            payment.getPendingBookingDetails() != null &&
            checkoutService != null) {

            log.info("Payment confirmed successfully. Creating subscription for payment {}", payment.getId());
            try {
                checkoutService.completeCheckoutAfterPayment(payment, jwtToken);
            } catch (Exception e) {
                log.error("Failed to create subscription after payment confirmation: {}", e.getMessage(), e);
                // Continue - payment is still completed, subscription creation failure is logged
            }
        }

        return convertToDTO(payment);
    }

    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
        return convertToDTO(payment);
    }

    public List<PaymentDTO> getUserPayments(Long userId) {
        return paymentRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentDTO> getUserCompletedPayments(Long userId) {
        return paymentRepository.findByUserIdAndStatus(userId, PaymentStatus.COMPLETED).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentDTO getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found for booking: " + bookingId));
        return convertToDTO(payment);
    }

    @Transactional
    public PaymentDTO refundPayment(Long paymentId, RefundRequest refundRequest) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new RuntimeException("Only completed payments can be refunded");
        }

        BigDecimal refundAmount = refundRequest.getAmount() != null ?
                refundRequest.getAmount() : payment.getAmount();

        try {
            if (payment.getPaymentMethod() == PaymentMethod.STRIPE) {
                stripeService.createRefund(payment.getPaymentIntentId(), refundAmount);
            } else if (payment.getPaymentMethod() == PaymentMethod.PAYPAL) {
                payPalService.refundPayment(payment.getExternalTransactionId(),
                        refundAmount, payment.getCurrency());
            }

            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setRefundedAt(LocalDateTime.now());
            payment = paymentRepository.save(payment);

            // Publish refund event
            publishPaymentRefundedEvent(payment);

            log.info("Payment refunded successfully: {}", paymentId);

        } catch (Exception e) {
            log.error("Refund failed: {}", e.getMessage(), e);
            throw new RuntimeException("Refund failed: " + e.getMessage());
        }

        return convertToDTO(payment);
    }

    private void calculateFees(Payment payment) {
        BigDecimal fee;
        if (payment.getPaymentMethod() == PaymentMethod.STRIPE) {
            fee = payment.getAmount()
                    .multiply(STRIPE_FEE_PERCENTAGE)
                    .add(STRIPE_FIXED_FEE);
        } else if (payment.getPaymentMethod() == PaymentMethod.PAYPAL) {
            fee = payment.getAmount()
                    .multiply(PAYPAL_FEE_PERCENTAGE)
                    .add(PAYPAL_FIXED_FEE);
        } else {
            fee = BigDecimal.ZERO;
        }

        payment.setFee(fee.setScale(2, BigDecimal.ROUND_HALF_UP));
        payment.setNetAmount(payment.getAmount().subtract(fee).setScale(2, BigDecimal.ROUND_HALF_UP));
    }

    private String generateTransactionId() {
        return "TXN-" + UUID.randomUUID().toString().toUpperCase();
    }

    private PaymentDTO convertToDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .userId(payment.getUserId())
                .bookingId(payment.getBookingId())
                .amount(payment.getAmount())
                .fee(payment.getFee())
                .netAmount(payment.getNetAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .transactionId(payment.getTransactionId())
                .externalTransactionId(payment.getExternalTransactionId())
                .paymentIntentId(payment.getPaymentIntentId())
                .currency(payment.getCurrency())
                .paidAt(payment.getPaidAt())
                .refundedAt(payment.getRefundedAt())
                .createdAt(payment.getCreatedAt())
                .failureReason(payment.getFailureReason())
                // Note: checkoutUrl, clientSecret, and approvalUrl are set separately after DTO creation
                // as they come from payment gateway responses, not from the Payment entity
                .build();
    }

    /**
     * Get comprehensive income statistics for a manager
     */
    public ManagerIncomeStatsDTO getManagerIncomeStats(Long managerId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneYearAgo = now.minusYears(1);
        LocalDateTime startOfThisMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);
        LocalDateTime endOfLastMonth = startOfThisMonth.minusSeconds(1);

        // Total income
        BigDecimal totalIncome = paymentRepository.getTotalIncomeByManagerId(managerId);
        BigDecimal thisMonthIncome = paymentRepository.getManagerIncomeByDateRange(managerId, startOfThisMonth, now);
        BigDecimal lastMonthIncome = paymentRepository.getManagerIncomeByDateRange(managerId, startOfLastMonth, endOfLastMonth);
        BigDecimal lastYearIncome = paymentRepository.getManagerIncomeByDateRange(managerId, oneYearAgo, now);

        // Transaction counts
        List<Payment> allManagerPayments = paymentRepository.findByManagerId(managerId);
        Long totalTransactions = (long) allManagerPayments.size();
        Long completedTransactions = paymentRepository.countCompletedPaymentsByManagerId(managerId);
        Long refundedTransactions = allManagerPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.REFUNDED)
                .count();

        // Average transaction amount
        BigDecimal averageAmount = BigDecimal.ZERO;
        if (completedTransactions != null && completedTransactions > 0 && totalIncome != null) {
            averageAmount = totalIncome.divide(BigDecimal.valueOf(completedTransactions), 2, RoundingMode.HALF_UP);
        }

        // Income by travel
        List<ManagerIncomeStatsDTO.TravelIncomeDTO> incomeByTravel = new ArrayList<>();
        List<Object[]> travelIncomeData = paymentRepository.getIncomeByTravelForManager(managerId);
        for (Object[] row : travelIncomeData) {
            Long travelId = row[0] != null ? ((Number) row[0]).longValue() : null;
            BigDecimal income = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            if (travelId != null) {
                incomeByTravel.add(ManagerIncomeStatsDTO.TravelIncomeDTO.builder()
                        .travelId(travelId)
                        .totalIncome(income)
                        .transactionCount(0L) // Would need additional query
                        .build());
            }
        }

        // Monthly income breakdown
        List<ManagerIncomeStatsDTO.MonthlyIncomeDTO> monthlyIncome = buildMonthlyIncomeStats(managerId, oneYearAgo);

        // Income by payment method
        Map<String, BigDecimal> incomeByPaymentMethod = new HashMap<>();
        List<Payment> completedPayments = paymentRepository.findByManagerIdAndStatus(managerId, PaymentStatus.COMPLETED);
        for (Payment payment : completedPayments) {
            String method = payment.getPaymentMethod().name();
            BigDecimal current = incomeByPaymentMethod.getOrDefault(method, BigDecimal.ZERO);
            incomeByPaymentMethod.put(method, current.add(payment.getNetAmount() != null ? payment.getNetAmount() : BigDecimal.ZERO));
        }

        return ManagerIncomeStatsDTO.builder()
                .managerId(managerId)
                .totalIncome(totalIncome != null ? totalIncome : BigDecimal.ZERO)
                .lastMonthIncome(lastMonthIncome != null ? lastMonthIncome : BigDecimal.ZERO)
                .thisMonthIncome(thisMonthIncome != null ? thisMonthIncome : BigDecimal.ZERO)
                .lastYearIncome(lastYearIncome != null ? lastYearIncome : BigDecimal.ZERO)
                .totalTransactions(totalTransactions)
                .completedTransactions(completedTransactions != null ? completedTransactions : 0L)
                .refundedTransactions(refundedTransactions)
                .averageTransactionAmount(averageAmount)
                .incomeByTravel(incomeByTravel)
                .monthlyIncome(monthlyIncome)
                .incomeByPaymentMethod(incomeByPaymentMethod)
                .build();
    }

    private List<ManagerIncomeStatsDTO.MonthlyIncomeDTO> buildMonthlyIncomeStats(Long managerId, LocalDateTime startDate) {
        List<ManagerIncomeStatsDTO.MonthlyIncomeDTO> monthlyStats = new ArrayList<>();

        // Get monthly income data
        Map<String, BigDecimal> monthlyIncomeMap = new HashMap<>();
        List<Object[]> monthlyData = paymentRepository.getMonthlyIncomeByManager(managerId, startDate);
        for (Object[] row : monthlyData) {
            int month = ((Number) row[0]).intValue();
            int year = ((Number) row[1]).intValue();
            BigDecimal income = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            String key = year + "-" + String.format("%02d", month);
            monthlyIncomeMap.put(key, income);
        }

        // Build monthly stats for the last 12 months
        LocalDateTime current = LocalDateTime.now();
        for (int i = 11; i >= 0; i--) {
            LocalDateTime monthDate = current.minusMonths(i);
            int year = monthDate.getYear();
            int month = monthDate.getMonthValue();
            String key = year + "-" + String.format("%02d", month);
            String monthName = Month.of(month).name();

            monthlyStats.add(ManagerIncomeStatsDTO.MonthlyIncomeDTO.builder()
                    .month(monthName)
                    .year(year)
                    .income(monthlyIncomeMap.getOrDefault(key, BigDecimal.ZERO))
                    .transactionCount(0L) // Would need additional query
                    .build());
        }

        return monthlyStats;
    }

    public List<PaymentDTO> getManagerPayments(Long managerId) {
        return paymentRepository.findByManagerId(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public BigDecimal getManagerTotalIncome(Long managerId) {
        BigDecimal income = paymentRepository.getTotalIncomeByManagerId(managerId);
        return income != null ? income : BigDecimal.ZERO;
    }

    public BigDecimal getManagerLastMonthIncome(Long managerId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfThisMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);
        LocalDateTime endOfLastMonth = startOfThisMonth.minusSeconds(1);

        BigDecimal income = paymentRepository.getManagerIncomeByDateRange(managerId, startOfLastMonth, endOfLastMonth);
        return income != null ? income : BigDecimal.ZERO;
    }

    /**
     * Calculate total platform income (all successful payments)
     */
    public BigDecimal calculateTotalPlatformIncome() {
        BigDecimal income = paymentRepository.getTotalSuccessfulPaymentsAmount();
        return income != null ? income : BigDecimal.ZERO;
    }

    /**
     * Calculate last month's platform income
     */
    public BigDecimal calculateLastMonthIncome() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfThisMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);
        LocalDateTime endOfLastMonth = startOfThisMonth.minusSeconds(1);

        BigDecimal income = paymentRepository.getTotalPaymentsByDateRange(startOfLastMonth, endOfLastMonth);
        return income != null ? income : BigDecimal.ZERO;
    }

    /**
     * Count total successful payments
     */
    public Long countTotalPayments() {
        return paymentRepository.countByStatus(com.travelms.payment.model.enums.PaymentStatus.COMPLETED);
    }

    /**
     * Cascade delete all payments created by a user
     * Called by user-service when deleting a user
     */
    @Transactional
    public void deleteAllPaymentsByUser(Long userId) {
        List<Payment> payments = paymentRepository.findByUserId(userId);

        log.info("Cascade deleting {} payments for user: {}", payments.size(), userId);

        for (Payment payment : payments) {
            // Cancel/refund payment if it's still active
            if (payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.PROCESSING) {
                try {
                    payment.setStatus(PaymentStatus.CANCELLED);
                    payment.setFailureReason("User account deleted");
                    paymentRepository.save(payment);
                } catch (Exception e) {
                    log.warn("Failed to cancel payment {}: {}", payment.getId(), e.getMessage());
                }
            }

            // Delete the payment
            paymentRepository.delete(payment);
        }

        log.info("Successfully cascade deleted {} payments for user: {}", payments.size(), userId);
    }

    /**
     * Publish PaymentCompletedEvent to Kafka
     * Called when a payment is successfully completed
     */
    private void publishPaymentCompletedEvent(Payment payment) {
        try {
            PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                    .paymentId(payment.getId())
                    .userId(payment.getUserId())
                    .userName(null) // Can be enriched from user-service if needed
                    .travelId(payment.getTravelId())
                    .numberOfParticipants(payment.getNumberOfParticipants())
                    .amount(payment.getAmount())
                    .currency(payment.getCurrency())
                    .completedAt(payment.getPaidAt())
                    .transactionId(payment.getTransactionId())
                    .bookingDetailsJson(payment.getPendingBookingDetails())
                    .build();

            kafkaTemplate.send(paymentCompletedTopic, payment.getId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish PaymentCompletedEvent for paymentId: {}", payment.getId(), ex);
                        } else {
                            log.info("Successfully published PaymentCompletedEvent for paymentId: {} to topic: {}",
                                    payment.getId(), paymentCompletedTopic);
                        }
                    });
        } catch (Exception e) {
            log.error("Error creating PaymentCompletedEvent for paymentId: {}", payment.getId(), e);
        }
    }

    /**
     * Publish PaymentRefundedEvent to Kafka
     * Called when a payment is refunded
     */
    private void publishPaymentRefundedEvent(Payment payment) {
        try {
            PaymentRefundedEvent event = PaymentRefundedEvent.builder()
                    .paymentId(payment.getId())
                    .userId(payment.getUserId())
                    .subscriptionId(payment.getBookingId())
                    .refundAmount(payment.getAmount())
                    .currency(payment.getCurrency())
                    .refundedAt(payment.getRefundedAt())
                    .reason("Payment refunded")
                    .build();

            kafkaTemplate.send(paymentRefundedTopic, payment.getId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish PaymentRefundedEvent for paymentId: {}", payment.getId(), ex);
                        } else {
                            log.info("Successfully published PaymentRefundedEvent for paymentId: {} to topic: {}",
                                    payment.getId(), paymentRefundedTopic);
                        }
                    });
        } catch (Exception e) {
            log.error("Error creating PaymentRefundedEvent for paymentId: {}", payment.getId(), e);
        }
    }
}
