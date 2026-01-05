package com.travelms.travel.service;

import com.travelms.travel.dto.CreateSubscriptionRequest;
import com.travelms.travel.dto.CreateTravelRequest;
import com.travelms.travel.dto.SubscriptionDTO;
import com.travelms.travel.dto.TravelDTO;
import com.travelms.travel.exception.BadRequestException;
import com.travelms.travel.exception.ResourceNotFoundException;
import com.travelms.travel.model.document.TravelDocument;
import com.travelms.travel.model.entity.Subscription;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.model.enums.SubscriptionStatus;
import com.travelms.travel.repository.elasticsearch.TravelSearchRepository;
import com.travelms.travel.repository.jpa.SubscriptionRepository;
import com.travelms.travel.repository.jpa.TravelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin service for managing travels and subscriptions without ownership restrictions
 * Allows admins to perform operations on behalf of managers and travelers
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminTravelService {

    private final TravelRepository travelRepository;
    private final TravelSearchRepository travelSearchRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final TravelService travelService;
    private final SubscriptionService subscriptionService;
    private final Neo4jSyncService neo4jSyncService;

    /**
     * Create travel on behalf of a manager (ADMIN only)
     * Bypasses manager authentication checks
     */
    @Transactional
    public TravelDTO createTravelForManager(CreateTravelRequest request, Long managerId, String managerName) {
        log.info("Admin creating travel for manager: {}", managerId);

        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        Travel travel = Travel.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .destination(request.getDestination())
                .country(request.getCountry())
                .state(request.getState())
                .city(request.getCity())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .price(request.getPrice())
                .maxParticipants(request.getMaxParticipants())
                .currentParticipants(0)
                .travelManagerId(managerId)
                .travelManagerName(managerName)
                .category(request.getCategory())
                .itinerary(request.getItinerary())
                .highlights(request.getHighlights() != null ? request.getHighlights() : new ArrayList<>())
                .images(request.getImages() != null ? request.getImages() : new ArrayList<>())
                .active(true)
                .averageRating(0.0)
                .totalReviews(0)
                .build();

        travel = travelRepository.save(travel);

        // Index in Elasticsearch
        indexTravelInElasticsearch(travel);

        // Sync to Neo4j
        neo4jSyncService.syncTravelNode(travel);

        log.info("Admin successfully created travel {} for manager: {}", travel.getId(), managerId);
        return convertToDTO(travel);
    }

    /**
     * Update any travel without manager ownership check (ADMIN only)
     */
    @Transactional
    public TravelDTO updateTravelForManager(Long travelId, CreateTravelRequest request) {
        log.info("Admin updating travel: {}", travelId);

        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel", "id", travelId));

        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        // Update travel fields
        travel.setTitle(request.getTitle());
        travel.setDescription(request.getDescription());
        travel.setDestination(request.getDestination());
        travel.setCountry(request.getCountry());
        travel.setState(request.getState());
        travel.setCity(request.getCity());
        travel.setStartDate(request.getStartDate());
        travel.setEndDate(request.getEndDate());
        travel.setPrice(request.getPrice());
        travel.setMaxParticipants(request.getMaxParticipants());
        travel.setCategory(request.getCategory());
        travel.setItinerary(request.getItinerary());

        if (request.getHighlights() != null) {
            travel.setHighlights(request.getHighlights());
        }
        if (request.getImages() != null) {
            travel.setImages(request.getImages());
        }

        travel = travelRepository.save(travel);

        // Update in Elasticsearch
        indexTravelInElasticsearch(travel);

        // Update Neo4j
        neo4jSyncService.syncTravelNode(travel);

        log.info("Admin successfully updated travel: {}", travelId);
        return convertToDTO(travel);
    }

    /**
     * Delete any travel without manager ownership check (ADMIN only)
     */
    @Transactional
    public void deleteTravelAsAdmin(Long travelId) {
        log.info("Admin deleting travel: {}", travelId);

        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel", "id", travelId));

        // Check if there are active subscriptions
        long activeSubscriptions = travel.getSubscriptions().stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE)
                .count();

        if (activeSubscriptions > 0) {
            throw new BadRequestException(
                    "Cannot delete travel with active subscriptions. Please cancel all subscriptions first.");
        }

        // Delete from repositories
        travelRepository.delete(travel);

        // Delete from Elasticsearch
        try {
            travelSearchRepository.deleteById(String.valueOf(travelId));
        } catch (Exception e) {
            log.warn("Failed to delete travel from Elasticsearch: {}", travelId, e);
        }

        // Delete from Neo4j
        neo4jSyncService.deleteTravelNode(travelId);

        log.info("Admin successfully deleted travel: {}", travelId);
    }

    /**
     * Subscribe a user to a travel (ADMIN only)
     * Bypasses user authentication checks
     */
    @Transactional
    public SubscriptionDTO subscribeUserToTravel(Long userId, String userName, Long travelId) {
        log.info("Admin subscribing user {} to travel: {}", userId, travelId);

        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel", "id", travelId));

        // Check if user already has a subscription
        boolean hasSubscription = subscriptionRepository.existsByTravelerIdAndTravelAndStatus(
                userId, travel, SubscriptionStatus.ACTIVE);
        if (hasSubscription) {
            throw new BadRequestException("User already has an active subscription for this travel");
        }

        // Check if travel is full
        if (travel.isFull()) {
            throw new BadRequestException("Travel is already full");
        }

        // Check if travel is in the past
        if (travel.isCompleted()) {
            throw new BadRequestException("Cannot subscribe to a completed travel");
        }

        // Create subscription
        Subscription subscription = Subscription.builder()
                .travel(travel)
                .travelerId(userId)
                .travelerName(userName)
                .status(SubscriptionStatus.ACTIVE)
                .totalAmount(travel.getPrice())
                .numberOfParticipants(1)
                .build();

        subscription = subscriptionRepository.save(subscription);

        // Update current participants
        travel.setCurrentParticipants(travel.getCurrentParticipants() + 1);
        travelRepository.save(travel);

        // Update Elasticsearch
        indexTravelInElasticsearch(travel);

        log.info("Admin successfully subscribed user {} to travel: {}", userId, travelId);
        return subscriptionService.convertToDTO(subscription);
    }

    /**
     * Cancel any subscription without user ownership check (ADMIN only)
     */
    @Transactional
    public void cancelSubscriptionForUser(Long subscriptionId) {
        log.info("Admin cancelling subscription: {}", subscriptionId);

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));

        // Update subscription status
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);

        // Update current participants
        Travel travel = subscription.getTravel();
        if (travel.getCurrentParticipants() > 0) {
            travel.setCurrentParticipants(travel.getCurrentParticipants() - 1);
            travelRepository.save(travel);

            // Update Elasticsearch
            indexTravelInElasticsearch(travel);
        }

        log.info("Admin successfully cancelled subscription: {}", subscriptionId);
    }

    /**
     * Get all subscriptions for a user (ADMIN only)
     */
    @Transactional(readOnly = true)
    public List<SubscriptionDTO> getUserSubscriptionsAsAdmin(Long userId) {
        log.info("Admin getting subscriptions for user: {}", userId);

        return subscriptionRepository.findByTravelerId(userId).stream()
                .map(subscriptionService::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to index travel in Elasticsearch
     */
    private void indexTravelInElasticsearch(Travel travel) {
        try {
            TravelDocument document = TravelDocument.builder()
                    .id(String.valueOf(travel.getId()))
                    .title(travel.getTitle())
                    .description(travel.getDescription())
                    .destination(travel.getDestination())
                    .country(travel.getCountry())
                    .city(travel.getCity())
                    .startDate(travel.getStartDate())
                    .endDate(travel.getEndDate())
                    .price(travel.getPrice())
                    .maxParticipants(travel.getMaxParticipants())
                    .currentParticipants(travel.getCurrentParticipants())
                    .travelManagerId(travel.getTravelManagerId())
                    .travelManagerName(travel.getTravelManagerName())
                    .category(travel.getCategory())
                    .averageRating(travel.getAverageRating())
                    .totalReviews(travel.getTotalReviews())
                    .active(travel.getActive())
                    .createdAt(travel.getCreatedAt())
                    .build();

            travelSearchRepository.save(document);
            log.info("Travel {} indexed in Elasticsearch", travel.getId());
        } catch (Exception e) {
            log.error("Failed to index travel in Elasticsearch: {}", travel.getId(), e);
        }
    }

    /**
     * Helper method to convert Travel entity to DTO
     */
    private TravelDTO convertToDTO(Travel travel) {
        return TravelDTO.builder()
                .id(travel.getId())
                .title(travel.getTitle())
                .description(travel.getDescription())
                .destination(travel.getDestination())
                .country(travel.getCountry())
                .city(travel.getCity())
                .startDate(travel.getStartDate())
                .endDate(travel.getEndDate())
                .price(travel.getPrice())
                .maxParticipants(travel.getMaxParticipants())
                .currentParticipants(travel.getCurrentParticipants())
                .travelManagerId(travel.getTravelManagerId())
                .travelManagerName(travel.getTravelManagerName())
                .images(travel.getImages())
                .highlights(travel.getHighlights())
                .active(travel.getActive())
                .category(travel.getCategory())
                .itinerary(travel.getItinerary())
                .averageRating(travel.getAverageRating())
                .totalReviews(travel.getTotalReviews())
                .createdAt(travel.getCreatedAt())
                .build();
    }
}
