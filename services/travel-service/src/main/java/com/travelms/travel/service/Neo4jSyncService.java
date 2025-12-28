package com.travelms.travel.service;

import com.travelms.travel.model.entity.*;
import com.travelms.travel.model.neo4j.*;
import com.travelms.travel.repository.neo4j.TravelNodeRepository;
import com.travelms.travel.repository.neo4j.TravelerNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class Neo4jSyncService {

    private final TravelerNodeRepository travelerNodeRepository;
    private final TravelNodeRepository travelNodeRepository;

    @Transactional
    public void syncTravelerNode(Long userId, String username) {
        Optional<TravelerNode> existingNode = travelerNodeRepository.findByUserId(userId);

        TravelerNode travelerNode;
        if (existingNode.isPresent()) {
            travelerNode = existingNode.get();
            travelerNode.setUsername(username);
        } else {
            travelerNode = TravelerNode.builder()
                    .userId(userId)
                    .username(username)
                    .subscribedTravels(new HashSet<>())
                    .feedbacks(new HashSet<>())
                    .preferredDestinations(new HashSet<>())
                    .build();
        }

        travelerNodeRepository.save(travelerNode);
        log.info("Synced traveler node for user: {}", userId);
    }

    @Transactional
    public void syncTravelNode(Travel travel) {
        Optional<TravelNode> existingNode = travelNodeRepository.findByTravelId(travel.getId());

        TravelNode travelNode;
        if (existingNode.isPresent()) {
            travelNode = existingNode.get();
        } else {
            travelNode = new TravelNode();
        }

        travelNode.setTravelId(travel.getId());
        travelNode.setTitle(travel.getTitle());
        travelNode.setDestination(travel.getDestination());
        travelNode.setCountry(travel.getCountry());
        travelNode.setCity(travel.getCity());
        travelNode.setCategory(travel.getCategory());
        travelNode.setPrice(travel.getPrice());
        travelNode.setStartDate(travel.getStartDate());
        travelNode.setEndDate(travel.getEndDate());
        travelNode.setAverageRating(travel.getAverageRating());

        // Create destination node if needed
        if (travel.getDestination() != null) {
            DestinationNode destinationNode = DestinationNode.builder()
                    .name(travel.getDestination())
                    .country(travel.getCountry())
                    .city(travel.getCity())
                    .build();
            travelNode.setDestinationNode(destinationNode);
        }

        // Create category node if needed
        if (travel.getCategory() != null) {
            CategoryNode categoryNode = CategoryNode.builder()
                    .name(travel.getCategory())
                    .build();
            travelNode.setCategoryNode(categoryNode);
        }

        // Create manager node
        ManagerNode managerNode = ManagerNode.builder()
                .userId(travel.getTravelManagerId())
                .username(travel.getTravelManagerName())
                .averageRating(0.0) // Will be calculated separately
                .build();
        travelNode.setManager(managerNode);

        travelNodeRepository.save(travelNode);
        log.info("Synced travel node for travel: {}", travel.getId());
    }

    @Transactional
    public void syncSubscription(Subscription subscription) {
        Optional<TravelerNode> travelerNode = travelerNodeRepository.findByUserId(
                subscription.getTravelerId());
        Optional<TravelNode> travelNode = travelNodeRepository.findByTravelId(
                subscription.getTravel().getId());

        if (travelerNode.isPresent() && travelNode.isPresent()) {
            TravelerNode traveler = travelerNode.get();
            TravelNode travel = travelNode.get();

            // Add subscription relationship
            traveler.getSubscribedTravels().add(travel);
            travelerNodeRepository.save(traveler);

            log.info("Synced subscription: Traveler {} to Travel {}",
                    subscription.getTravelerId(), subscription.getTravel().getId());
        } else {
            log.warn("Could not sync subscription: nodes not found");
        }
    }

    @Transactional
    public void syncFeedback(Long travelerId, String travelerName, Travel travel, Integer rating,
                             java.time.LocalDateTime createdAt) {
        Optional<TravelerNode> travelerNode = travelerNodeRepository.findByUserId(travelerId);
        Optional<TravelNode> travelNode = travelNodeRepository.findByTravelId(travel.getId());

        if (travelerNode.isPresent() && travelNode.isPresent()) {
            TravelerNode traveler = travelerNode.get();
            TravelNode travelN = travelNode.get();

            // Create feedback relationship
            FeedbackRelationship feedbackRel = FeedbackRelationship.builder()
                    .rating(rating)
                    .createdAt(createdAt)
                    .travel(travelN)
                    .build();

            // Add to traveler's feedbacks
            traveler.getFeedbacks().add(feedbackRel);

            // Add destination preference based on feedback
            if (rating >= 4 && travelN.getDestinationNode() != null) {
                traveler.getPreferredDestinations().add(travelN.getDestinationNode());
            }

            travelerNodeRepository.save(traveler);

            log.info("Synced feedback: Traveler {} for Travel {}", travelerId, travel.getId());
        } else {
            log.warn("Could not sync feedback: nodes not found");
        }
    }

    @Transactional
    public void deleteTravelNode(Long travelId) {
        try {
            travelNodeRepository.findByTravelId(travelId).ifPresent(travelNode -> {
                travelNodeRepository.delete(travelNode);
                log.info("Deleted travel node for travel: {}", travelId);
            });
        } catch (Exception e) {
            log.error("Failed to delete travel node for travel {}: {}", travelId, e.getMessage());
            throw e;
        }
    }

    @Transactional
    public void deleteSubscriptionRelationship(Long travelerId, Long travelId) {
        try {
            Optional<TravelerNode> travelerNode = travelerNodeRepository.findByUserId(travelerId);
            Optional<TravelNode> travelNode = travelNodeRepository.findByTravelId(travelId);

            if (travelerNode.isPresent() && travelNode.isPresent()) {
                TravelerNode traveler = travelerNode.get();
                TravelNode travel = travelNode.get();

                // Remove subscription relationship
                traveler.getSubscribedTravels().remove(travel);
                travelerNodeRepository.save(traveler);

                log.info("Deleted subscription relationship: Traveler {} from Travel {}", travelerId, travelId);
            }
        } catch (Exception e) {
            log.error("Failed to delete subscription relationship for traveler {} and travel {}: {}",
                    travelerId, travelId, e.getMessage());
            throw e;
        }
    }

    @Transactional
    public void deleteTravelerNode(Long userId) {
        try {
            travelerNodeRepository.findByUserId(userId).ifPresent(travelerNode -> {
                travelerNodeRepository.delete(travelerNode);
                log.info("Deleted traveler node for user: {}", userId);
            });
        } catch (Exception e) {
            log.error("Failed to delete traveler node for user {}: {}", userId, e.getMessage());
            throw e;
        }
    }
}
