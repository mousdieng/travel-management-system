package com.travelms.travel.service;

import com.travelms.travel.dto.TravelDTO;
import com.travelms.travel.model.neo4j.TravelNode;
import com.travelms.travel.repository.neo4j.TravelerNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final TravelerNodeRepository travelerNodeRepository;
    private final TravelService travelService;

    /**
     * Get personalized recommendations with reasons
     * Uses Neo4j to analyze feedback and participation patterns
     * Considers at least 3 fields: category, destination, and rating
     */
    public List<TravelRecommendationDTO> getPersonalizedRecommendationsWithReasons(Long userId, int limit) {
        Map<Long, TravelRecommendationDTO> recommendationMap = new HashMap<>();

        try {
            // 1. Recommendations based on category preferences from feedback
            List<Object> categoryRecommendations = travelerNodeRepository
                    .findRecommendedTravelsByCategory(userId);
            addRecommendations(recommendationMap, categoryRecommendations,
                    "Based on your feedback on similar categories", 3.0);

            // 2. Recommendations based on destination history
            List<Object> destinationRecommendations = travelerNodeRepository
                    .findRecommendedTravelsByDestination(userId);
            addRecommendations(recommendationMap, destinationRecommendations,
                    "You've previously traveled to this destination", 2.5);

            // 3. Recommendations based on high ratings given
            List<Object> highRatedTravels = travelerNodeRepository
                    .findHighRatedTravelsByTraveler(userId);
            addRecommendations(recommendationMap, highRatedTravels,
                    "Similar to travels you rated highly", 2.0);

            log.info("Found {} personalized recommendations for user {}",
                    recommendationMap.size(), userId);

            // Sort by score and return top results
            return recommendationMap.values().stream()
                    .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                    .limit(limit)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting personalized recommendations for user {}: {}",
                    userId, e.getMessage());
            // Return empty list on error
            return List.of();
        }
    }

    /**
     * Legacy method - kept for backward compatibility
     */
    public List<TravelDTO> getPersonalizedRecommendations(Long userId) {
        return getPersonalizedRecommendationsWithReasons(userId, 10).stream()
                .map(rec -> travelService.getTravelDTOById(rec.getTravelId()))
                .collect(Collectors.toList());
    }

    private void addRecommendations(Map<Long, TravelRecommendationDTO> map,
                                   List<Object> results,
                                   String reason,
                                   double scoreIncrement) {
        for (Object result : results) {
            if (result instanceof TravelNode) {
                TravelNode node = (TravelNode) result;
                Long travelId = node.getTravelId();

                if (map.containsKey(travelId)) {
                    // Increase score if travel appears multiple times
                    TravelRecommendationDTO existing = map.get(travelId);
                    existing.setScore(existing.getScore() + scoreIncrement);
                    existing.getReasons().add(reason);
                } else {
                    // Add new recommendation
                    TravelDTO travelDTO = travelService.getTravelDTOById(travelId);
                    if (travelDTO != null) {
                        map.put(travelId, TravelRecommendationDTO.builder()
                                .travelId(travelId)
                                .travel(travelDTO)
                                .score(scoreIncrement)
                                .reasons(new ArrayList<>(List.of(reason)))
                                .build());
                    }
                }
            }
        }
    }

    private Set<Long> extractTravelIds(List<Object> results) {
        Set<Long> ids = new HashSet<>();
        for (Object result : results) {
            if (result instanceof TravelNode) {
                TravelNode travelNode = (TravelNode) result;
                ids.add(travelNode.getTravelId());
            }
        }
        return ids;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class TravelRecommendationDTO {
        private Long travelId;
        private TravelDTO travel;
        private Double score;
        private List<String> reasons;
    }
}
