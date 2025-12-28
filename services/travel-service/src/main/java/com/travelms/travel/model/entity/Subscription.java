package com.travelms.travel.model.entity;

import com.travelms.travel.model.enums.SubscriptionStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"traveler_id", "travel_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "traveler_id", nullable = false)
    @NotNull
    private Long travelerId;

    @Column(name = "traveler_name")
    private String travelerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_id", nullable = false)
    @NotNull
    private Travel travel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Column(name = "number_of_participants", nullable = false)
    private Integer numberOfParticipants = 1;

    @Column(name = "total_amount")
    private java.math.BigDecimal totalAmount;

    @Column(name = "passenger_details", columnDefinition = "TEXT")
    private String passengerDetailsJson;

    private LocalDateTime cancelledAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public boolean canBeCancelled() {
        if (status != SubscriptionStatus.ACTIVE) {
            return false;
        }
        LocalDateTime cutoffDate = travel.getStartDate().minusDays(3);
        return LocalDateTime.now().isBefore(cutoffDate);
    }
}
