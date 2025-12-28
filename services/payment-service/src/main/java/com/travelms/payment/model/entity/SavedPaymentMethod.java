package com.travelms.payment.model.entity;

import com.travelms.payment.model.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_payment_methods")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SavedPaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod type;

    // Stripe payment method ID
    @Column(length = 100)
    private String stripePaymentMethodId;

    // Card information (for display only - never store full card numbers)
    @Column(length = 4)
    private String last4;

    @Column(length = 50)
    private String brand; // visa, mastercard, etc.

    @Column(length = 2)
    private String expMonth;

    @Column(length = 4)
    private String expYear;

    @Column(length = 100)
    private String cardholderName;

    @Column(nullable = false)
    private Boolean isDefault = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
