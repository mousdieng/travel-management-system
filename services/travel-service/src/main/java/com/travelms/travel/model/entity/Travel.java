package com.travelms.travel.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "travels")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Travel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 3, max = 200)
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false, length = 2000)
    private String description;

    @NotBlank
    private String destination;

    private String country;

    private String state;

    private String city;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime startDate;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime endDate;

    @NotNull
    @DecimalMin("0.0")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer maxParticipants;

    @Column(nullable = false)
    private Integer currentParticipants = 0;

    @Column(name = "travel_manager_id", nullable = false)
    private Long travelManagerId;

    @Column(name = "travel_manager_name")
    private String travelManagerName;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "travel_images", joinColumns = @JoinColumn(name = "travel_id"))
    @Column(name = "image_url", length = 500)  // Increased to store MinIO keys (not presigned URLs)
    private List<String> images = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "travel_highlights", joinColumns = @JoinColumn(name = "travel_id"))
    @Column(name = "highlight")
    private List<String> highlights = new ArrayList<>();

    @Column(nullable = false)
    private Boolean active = true;

    private String category;

    @Column(length = 1000)
    private String itinerary;

    @Column(columnDefinition = "TEXT")
    private String itineraryStopsJson;

    @Column(columnDefinition = "TEXT")
    private String routeInfoJson;

    @DecimalMin("0.0")
    @DecimalMax("5.0")
    private Double averageRating = 0.0;

    /**
     * Subscriptions for this travel - cascade delete when travel is deleted
     */
    @OneToMany(mappedBy = "travel", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Subscription> subscriptions = new ArrayList<>();

    @Column(nullable = false)
    private Integer totalReviews = 0;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public boolean isFull() {
        return currentParticipants >= maxParticipants;
    }

    public boolean isUpcoming() {
        return LocalDateTime.now().isBefore(startDate);
    }

    public boolean isOngoing() {
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(startDate) && now.isBefore(endDate);
    }

    public boolean isCompleted() {
        return LocalDateTime.now().isAfter(endDate);
    }
}
