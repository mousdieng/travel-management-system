package com.travelms.payment.model.entity;

import com.travelms.payment.model.enums.PaymentMethod;
import com.travelms.payment.model.enums.PaymentStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long userId;

    // BookingId is nullable initially for payment-first checkout flow
    // It gets populated after subscription is created following payment confirmation
    @Column(nullable = true)
    private Long bookingId;

    // Travel and Manager references for statistics
    private Long travelId;

    private Long managerId;

    // Temporary storage for booking details until subscription is created
    // Used in payment-first checkout flow
    @Column(columnDefinition = "TEXT")
    private String pendingBookingDetails; // JSON: {travelId, numberOfParticipants, passengerDetails}

    @NotNull
    @DecimalMin("0.0")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(precision = 10, scale = 2)
    private BigDecimal fee;

    @Column(precision = 10, scale = 2)
    private BigDecimal netAmount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PaymentMethod paymentMethod;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(unique = true, length = 255)
    private String transactionId;

    @Column(unique = true, length = 255)
    private String externalTransactionId; // Stripe/PayPal transaction ID

    @Column(length = 100)
    private String paymentIntentId; // Stripe Payment Intent ID

    @Column(length = 100)
    private String sessionId; // Stripe Checkout Session ID

    @Column(columnDefinition = "TEXT")
    private String paymentDetails;

    @Column(columnDefinition = "TEXT")
    private String failureReason;

    private LocalDateTime paidAt;

    private LocalDateTime refundedAt;

    @Column(length = 3)
    private String currency = "USD";

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
