package com.travelms.travel.service;

import com.travelms.travel.dto.SubscriptionDTO;
import com.travelms.travel.exception.BadRequestException;
import com.travelms.travel.exception.ResourceNotFoundException;
import com.travelms.travel.model.entity.Subscription;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.model.enums.SubscriptionStatus;
import com.travelms.travel.repository.jpa.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final TravelService travelService;
    private final Neo4jSyncService neo4jSyncService;

    @Transactional
    public SubscriptionDTO createSubscription(com.travelms.travel.dto.CreateSubscriptionRequest request, Long travelerId, String travelerName) {
        Travel travel = travelService.getTravelById(request.getTravelId());

        // Check if travel is available
        if (!travel.getActive()) {
            throw new BadRequestException("This travel is no longer available");
        }

        // Check if there's enough space for all participants
        int availableSpots = travel.getMaxParticipants() - travel.getCurrentParticipants();
        if (availableSpots < request.getNumberOfParticipants()) {
            throw new BadRequestException("Not enough available spots. Only " + availableSpots + " spots remaining");
        }

        if (!travel.isUpcoming()) {
            throw new BadRequestException("Cannot subscribe to a travel that has already started or ended");
        }

        // Check if already subscribed
        if (subscriptionRepository.existsByTravelerIdAndTravelAndStatus(
                travelerId, travel, SubscriptionStatus.ACTIVE)) {
            throw new BadRequestException("You are already subscribed to this travel");
        }

        // Calculate total amount
        java.math.BigDecimal totalAmount = travel.getPrice().multiply(
                java.math.BigDecimal.valueOf(request.getNumberOfParticipants())
        );

        // Store passenger details as JSON
        String passengerDetailsJson = null;
        if (request.getPassengerDetails() != null && !request.getPassengerDetails().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                passengerDetailsJson = mapper.writeValueAsString(request.getPassengerDetails());
            } catch (Exception e) {
                // If serialization fails, continue without passenger details
            }
        }

        // Create subscription
        Subscription subscription = Subscription.builder()
                .travelerId(travelerId)
                .travelerName(travelerName)
                .travel(travel)
                .status(SubscriptionStatus.ACTIVE)
                .numberOfParticipants(request.getNumberOfParticipants())
                .totalAmount(totalAmount)
                .passengerDetailsJson(passengerDetailsJson)
                .build();

        subscription = subscriptionRepository.save(subscription);

        // Update travel current participants
        travel.setCurrentParticipants(travel.getCurrentParticipants() + request.getNumberOfParticipants());
        travelService.saveTravelEntity(travel);

        // Sync to Neo4j
        neo4jSyncService.syncSubscription(subscription);

        return convertToDTO(subscription);
    }

    @Transactional
    public SubscriptionDTO subscribe(Long travelId, Long travelerId, String travelerName) {
        Travel travel = travelService.getTravelById(travelId);

        // Check if travel is available
        if (!travel.getActive()) {
            throw new BadRequestException("This travel is no longer available");
        }

        if (travel.isFull()) {
            throw new BadRequestException("This travel is already full");
        }

        if (!travel.isUpcoming()) {
            throw new BadRequestException("Cannot subscribe to a travel that has already started or ended");
        }

        // Check if already subscribed
        if (subscriptionRepository.existsByTravelerIdAndTravelAndStatus(
                travelerId, travel, SubscriptionStatus.ACTIVE)) {
            throw new BadRequestException("You are already subscribed to this travel");
        }

        // Create subscription
        Subscription subscription = Subscription.builder()
                .travelerId(travelerId)
                .travelerName(travelerName)
                .travel(travel)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        subscription = subscriptionRepository.save(subscription);

        // Increment participants count
        travelService.incrementParticipants(travelId);

        // Sync to Neo4j
        neo4jSyncService.syncSubscription(subscription);

        return convertToDTO(subscription);
    }

    @Transactional
    public void cancelSubscription(Long subscriptionId, Long travelerId) {
        Subscription subscription = getSubscriptionById(subscriptionId);

        // Verify ownership
        if (!subscription.getTravelerId().equals(travelerId)) {
            throw new BadRequestException("You can only cancel your own subscriptions");
        }

        // Check if can be cancelled (3-day cutoff)
        if (!subscription.canBeCancelled()) {
            throw new BadRequestException(
                    "Cannot cancel subscription. Either it's within 3 days of travel start or already cancelled");
        }

        // Cancel subscription
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);

        // Decrement participants count
        travelService.decrementParticipants(subscription.getTravel().getId());
    }

    @Transactional(readOnly = true)
    public SubscriptionDTO getSubscriptionById(Long id, Long travelerId) {
        Subscription subscription = getSubscriptionById(id);

        // Verify ownership
        if (!subscription.getTravelerId().equals(travelerId)) {
            throw new BadRequestException("You can only view your own subscriptions");
        }

        return convertToDTO(subscription);
    }

    @Transactional(readOnly = true)
    public Subscription getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", id));
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDTO> getUserSubscriptions(Long travelerId) {
        return subscriptionRepository.findByTravelerId(travelerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDTO> getUserActiveSubscriptions(Long travelerId) {
        return subscriptionRepository.findByTravelerIdAndStatus(travelerId, SubscriptionStatus.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDTO> getTravelSubscriptions(Long travelId, Long managerId) {
        Travel travel = travelService.getTravelById(travelId);

        // Verify ownership
        if (!travel.getTravelManagerId().equals(managerId)) {
            throw new BadRequestException("You can only view subscriptions for your own travels");
        }

        return subscriptionRepository.findByTravel(travel).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void completeSubscription(Long subscriptionId) {
        Subscription subscription = getSubscriptionById(subscriptionId);

        if (subscription.getStatus() == SubscriptionStatus.ACTIVE &&
            subscription.getTravel().isCompleted()) {
            subscription.setStatus(SubscriptionStatus.COMPLETED);
            subscriptionRepository.save(subscription);
        }
    }

    @Transactional
    public void managerCancelSubscription(Long subscriptionId, Long travelId, Long managerId) {
        Subscription subscription = getSubscriptionById(subscriptionId);
        Travel travel = travelService.getTravelById(travelId);

        // Verify the subscription belongs to this travel
        if (!subscription.getTravel().getId().equals(travelId)) {
            throw new BadRequestException("Subscription does not belong to this travel");
        }

        // Verify ownership of the travel
        if (!travel.getTravelManagerId().equals(managerId)) {
            throw new BadRequestException("You can only manage subscriptions for your own travels");
        }

        // Cancel subscription regardless of cutoff date (manager privilege)
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);

        // Decrement participants count
        travelService.decrementParticipants(travelId);
    }

    /**
     * Cascade delete all subscriptions created by a user
     * Called by user-service when deleting a traveler
     * Also decrements participant counts for affected travels
     */
    @Transactional
    public void deleteAllSubscriptionsByUser(Long userId) {
        List<Subscription> subscriptions = subscriptionRepository.findByTravelerId(userId);

        log.info("Cascade deleting {} subscriptions for user: {}", subscriptions.size(), userId);

        for (Subscription subscription : subscriptions) {
            // Decrement participants count if subscription is active
            if (subscription.getStatus() == SubscriptionStatus.ACTIVE) {
                try {
                    int participantsToRemove = subscription.getNumberOfParticipants() != null
                        ? subscription.getNumberOfParticipants()
                        : 1;

                    Travel travel = subscription.getTravel();
                    travel.setCurrentParticipants(
                        Math.max(0, travel.getCurrentParticipants() - participantsToRemove)
                    );
                    travelService.saveTravelEntity(travel);
                } catch (Exception e) {
                    log.warn("Failed to decrement participants for travel {}: {}",
                        subscription.getTravel().getId(), e.getMessage());
                }
            }

            // Delete from Neo4j
            try {
                neo4jSyncService.deleteSubscriptionRelationship(subscription.getId());
            } catch (Exception e) {
                log.warn("Failed to delete subscription {} from Neo4j: {}",
                    subscription.getId(), e.getMessage());
            }

            // Delete the subscription
            subscriptionRepository.delete(subscription);
        }

        log.info("Successfully cascade deleted {} subscriptions for user: {}", subscriptions.size(), userId);
    }

    private SubscriptionDTO convertToDTO(Subscription subscription) {
        return SubscriptionDTO.builder()
                .id(subscription.getId())
                .travelerId(subscription.getTravelerId())
                .travelerName(subscription.getTravelerName())
                .travelId(subscription.getTravel().getId())
                .travelTitle(subscription.getTravel().getTitle())
                .status(subscription.getStatus())
                .numberOfParticipants(subscription.getNumberOfParticipants() != null ? subscription.getNumberOfParticipants() : 1)
                .totalAmount(subscription.getTotalAmount())
                .canBeCancelled(subscription.canBeCancelled())
                .cancelledAt(subscription.getCancelledAt())
                .createdAt(subscription.getCreatedAt())
                .build();
    }
}
