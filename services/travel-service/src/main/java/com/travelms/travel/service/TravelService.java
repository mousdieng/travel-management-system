package com.travelms.travel.service;

import com.travelms.travel.dto.CreateTravelRequest;
import com.travelms.travel.dto.ManagerTravelStatsDTO;
import com.travelms.travel.dto.TravelDTO;
import com.travelms.travel.exception.BadRequestException;
import com.travelms.travel.exception.ResourceNotFoundException;
import com.travelms.travel.model.document.TravelDocument;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.model.enums.SubscriptionStatus;
import com.travelms.travel.repository.elasticsearch.TravelSearchRepository;
import com.travelms.travel.repository.jpa.SubscriptionRepository;
import com.travelms.travel.repository.jpa.TravelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TravelService {

    private final TravelRepository travelRepository;
    private final TravelSearchRepository travelSearchRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final Neo4jSyncService neo4jSyncService;
    private final FileStorageService fileStorageService;

    @Transactional
    public TravelDTO createTravel(CreateTravelRequest request, Long managerId, String managerName) {
        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        // Validate that start date is in the future for new travels
        if (request.getStartDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Start date must be in the future");
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

        return convertToDTO(travel);
    }

    @Transactional
    public TravelDTO updateTravel(Long id, CreateTravelRequest request, Long managerId) {
        Travel travel = getTravelById(id);

        // Check if user is the travel manager
        if (!travel.getTravelManagerId().equals(managerId)) {
            throw new BadRequestException("You are not authorized to update this travel");
        }

        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

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

        // Update in Neo4j
        neo4jSyncService.syncTravelNode(travel);

        return convertToDTO(travel);
    }

    @Transactional
    public void deleteTravel(Long id, Long managerId) {
        Travel travel = getTravelById(id);

        // Check if user is the travel manager or admin
        // Admins can delete any travel, managers can only delete their own
        if (!com.travelms.travel.security.RoleUtil.isAdmin() &&
            !travel.getTravelManagerId().equals(managerId)) {
            throw new BadRequestException("You are not authorized to delete this travel");
        }

        // Soft delete - just mark as inactive
        travel.setActive(false);
        travelRepository.save(travel);

        // Remove from Elasticsearch
        travelSearchRepository.deleteById(String.valueOf(id));
    }

    /**
     * Admin: Create travel on behalf of a specific manager
     */
    @Transactional
    public TravelDTO adminCreateTravel(CreateTravelRequest request, Long managerId, String managerName) {
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

        log.info("Admin created travel {} for manager {}", travel.getId(), managerId);

        return convertToDTO(travel);
    }

    /**
     * Admin: Update any travel without ownership restriction
     */
    @Transactional
    public TravelDTO adminUpdateTravel(Long id, CreateTravelRequest request) {
        Travel travel = getTravelById(id);

        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

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

        // Update in Neo4j
        neo4jSyncService.syncTravelNode(travel);

        log.info("Admin updated travel {}", id);

        return convertToDTO(travel);
    }

    @Transactional(readOnly = true)
    public TravelDTO getTravelDTOById(Long id) {
        Travel travel = getTravelById(id);
        return convertToDTO(travel);
    }

    public Travel getTravelById(Long id) {
        return travelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Travel", "id", id));
    }

    @Transactional(readOnly = true)
    public List<TravelDTO> getAllTravels() {
        return travelRepository.findByActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TravelDTO> getAvailableTravels() {
        return travelRepository.findAvailableTravels(LocalDateTime.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TravelDTO> getUpcomingTravels() {
        return travelRepository.findUpcomingTravels(LocalDateTime.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TravelDTO> getManagerTravels(Long managerId) {
        return travelRepository.findByTravelManagerIdAndActiveTrue(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TravelDTO> searchTravels(String keyword) {
        // Search using Elasticsearch
        List<TravelDocument> documents = travelSearchRepository.searchByKeyword(keyword);
        return documents.stream()
                .map(this::convertDocumentToDTO)
                .collect(Collectors.toList());
    }

    public List<TravelDTO> autocomplete(String query) {
        List<TravelDocument> documents = travelSearchRepository.autocompleteByTitle(query);
        return documents.stream()
                .map(this::convertDocumentToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TravelDTO> getTopRatedTravels(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return travelRepository.findTopRatedTravels(pageable).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void incrementParticipants(Long travelId) {
        Travel travel = getTravelById(travelId);
        if (travel.isFull()) {
            throw new BadRequestException("Travel is already full");
        }
        travel.setCurrentParticipants(travel.getCurrentParticipants() + 1);
        travelRepository.save(travel);
    }

    @Transactional
    public void decrementParticipants(Long travelId) {
        Travel travel = getTravelById(travelId);
        if (travel.getCurrentParticipants() > 0) {
            travel.setCurrentParticipants(travel.getCurrentParticipants() - 1);
            travelRepository.save(travel);
        }
    }

    @Transactional
    public Travel saveTravelEntity(Travel travel) {
        return travelRepository.save(travel);
    }

    @Transactional
    public void updateRating(Long travelId, Double newAverageRating, Integer totalReviews) {
        Travel travel = getTravelById(travelId);
        travel.setAverageRating(newAverageRating);
        travel.setTotalReviews(totalReviews);
        travelRepository.save(travel);

        // Update in Elasticsearch
        indexTravelInElasticsearch(travel);
    }

    /**
     * Get comprehensive statistics for a travel manager
     */
    @Transactional(readOnly = true)
    public ManagerTravelStatsDTO getManagerStats(Long managerId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneYearAgo = now.minusYears(1);

        // Travel counts
        Long totalTravels = travelRepository.countByTravelManagerId(managerId);
        Long activeTravels = travelRepository.countActiveByTravelManagerId(managerId);
        Long completedTravels = travelRepository.countCompletedByTravelManagerId(managerId, now);
        Long upcomingTravels = travelRepository.countUpcomingByTravelManagerId(managerId, now);

        // Participant stats
        Long totalParticipants = travelRepository.sumParticipantsByTravelManagerId(managerId);
        Long activeSubscribers = subscriptionRepository.countByTravelManagerAndStatus(managerId, SubscriptionStatus.ACTIVE);
        Long cancelledSubscribers = subscriptionRepository.countByTravelManagerAndStatus(managerId, SubscriptionStatus.CANCELLED);
        Long completedSubscribers = subscriptionRepository.countByTravelManagerAndStatus(managerId, SubscriptionStatus.COMPLETED);

        // Rating stats
        Double averageRating = travelRepository.avgRatingByTravelManagerId(managerId);
        Long totalReviews = travelRepository.sumReviewsByTravelManagerId(managerId);

        // Revenue
        BigDecimal totalRevenue = travelRepository.sumRevenueByTravelManagerId(managerId, now);

        // Category breakdown
        Map<String, Long> travelsByCategory = new HashMap<>();
        List<Object[]> categoryData = travelRepository.countTravelsByCategoryForManager(managerId);
        for (Object[] row : categoryData) {
            String category = row[0] != null ? row[0].toString() : "Other";
            Long count = ((Number) row[1]).longValue();
            travelsByCategory.put(category, count);
        }

        // Top performing travels
        List<Travel> topTravels = travelRepository.findTopPerformingTravelsByManager(managerId, PageRequest.of(0, 5));
        List<ManagerTravelStatsDTO.TravelPerformanceDTO> topPerformingTravels = topTravels.stream()
                .map(this::convertToPerformanceDTO)
                .collect(Collectors.toList());

        // Monthly stats for the last 12 months
        List<ManagerTravelStatsDTO.MonthlyTravelStatsDTO> monthlyStats = buildMonthlyStats(managerId, oneYearAgo);

        return ManagerTravelStatsDTO.builder()
                .managerId(managerId)
                .totalTravels(totalTravels != null ? totalTravels : 0L)
                .activeTravels(activeTravels != null ? activeTravels : 0L)
                .completedTravels(completedTravels != null ? completedTravels : 0L)
                .upcomingTravels(upcomingTravels != null ? upcomingTravels : 0L)
                .totalParticipants(totalParticipants != null ? totalParticipants : 0L)
                .activeSubscribers(activeSubscribers != null ? activeSubscribers : 0L)
                .cancelledSubscribers(cancelledSubscribers != null ? cancelledSubscribers : 0L)
                .completedSubscribers(completedSubscribers != null ? completedSubscribers : 0L)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .totalRevenuePotential(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .travelsByCategory(travelsByCategory)
                .topPerformingTravels(topPerformingTravels)
                .monthlyStats(monthlyStats)
                .build();
    }

    private ManagerTravelStatsDTO.TravelPerformanceDTO convertToPerformanceDTO(Travel travel) {
        double occupancyRate = travel.getMaxParticipants() > 0
                ? (double) travel.getCurrentParticipants() / travel.getMaxParticipants() * 100
                : 0.0;
        BigDecimal revenue = travel.getPrice().multiply(BigDecimal.valueOf(travel.getCurrentParticipants()));

        return ManagerTravelStatsDTO.TravelPerformanceDTO.builder()
                .travelId(travel.getId())
                .title(travel.getTitle())
                .destination(travel.getDestination())
                .participants(travel.getCurrentParticipants())
                .maxParticipants(travel.getMaxParticipants())
                .occupancyRate(occupancyRate)
                .averageRating(travel.getAverageRating())
                .totalReviews(travel.getTotalReviews())
                .price(travel.getPrice())
                .revenue(revenue)
                .build();
    }

    private List<ManagerTravelStatsDTO.MonthlyTravelStatsDTO> buildMonthlyStats(Long managerId, LocalDateTime startDate) {
        List<ManagerTravelStatsDTO.MonthlyTravelStatsDTO> monthlyStats = new ArrayList<>();

        // Get monthly travel creation counts
        Map<String, Long> travelsCreatedMap = new HashMap<>();
        List<Object[]> travelCreations = travelRepository.countTravelsCreatedByMonth(managerId, startDate);
        for (Object[] row : travelCreations) {
            int month = ((Number) row[0]).intValue();
            int year = ((Number) row[1]).intValue();
            Long count = ((Number) row[2]).longValue();
            String key = year + "-" + String.format("%02d", month);
            travelsCreatedMap.put(key, count);
        }

        // Get monthly subscription counts
        Map<String, Long> subscribersMap = new HashMap<>();
        List<Object[]> subscriptions = subscriptionRepository.countSubscriptionsByMonth(managerId, startDate);
        for (Object[] row : subscriptions) {
            int month = ((Number) row[0]).intValue();
            int year = ((Number) row[1]).intValue();
            Long count = ((Number) row[2]).longValue();
            String key = year + "-" + String.format("%02d", month);
            subscribersMap.put(key, count);
        }

        // Build monthly stats for the last 12 months
        LocalDateTime current = LocalDateTime.now();
        for (int i = 11; i >= 0; i--) {
            LocalDateTime monthDate = current.minusMonths(i);
            int year = monthDate.getYear();
            int month = monthDate.getMonthValue();
            String key = year + "-" + String.format("%02d", month);
            String monthName = Month.of(month).name();

            monthlyStats.add(ManagerTravelStatsDTO.MonthlyTravelStatsDTO.builder()
                    .month(monthName)
                    .year(year)
                    .travelsCreated(travelsCreatedMap.getOrDefault(key, 0L))
                    .subscribersGained(subscribersMap.getOrDefault(key, 0L))
                    .revenueGenerated(BigDecimal.ZERO) // This would require payment service integration
                    .build());
        }

        return monthlyStats;
    }

    private void indexTravelInElasticsearch(Travel travel) {
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
                .highlights(travel.getHighlights())
                .averageRating(travel.getAverageRating())
                .totalReviews(travel.getTotalReviews())
                .active(travel.getActive())
                .createdAt(travel.getCreatedAt())
                .build();

        travelSearchRepository.save(document);
    }

    private TravelDTO convertToDTO(Travel travel) {
        // Convert MinIO keys to presigned URLs
        List<String> imageUrls = travel.getImages() != null
            ? travel.getImages().stream()
                .map(key -> {
                    try {
                        return fileStorageService.getFileUrl(key);
                    } catch (Exception e) {
                        // If URL generation fails, return null and filter it out
                        return null;
                    }
                })
                .filter(url -> url != null)
                .collect(Collectors.toList())
            : new ArrayList<>();

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
                .images(imageUrls)  // Presigned URLs for display
                .imageKeys(travel.getImages())  // Original MinIO keys for updates
                .highlights(travel.getHighlights())
                .active(travel.getActive())
                .category(travel.getCategory())
                .itinerary(travel.getItinerary())
                .averageRating(travel.getAverageRating())
                .totalReviews(travel.getTotalReviews())
                .createdAt(travel.getCreatedAt())
                .build();
    }

    private TravelDTO convertDocumentToDTO(TravelDocument document) {
        return TravelDTO.builder()
                .id(Long.parseLong(document.getId()))
                .title(document.getTitle())
                .description(document.getDescription())
                .destination(document.getDestination())
                .country(document.getCountry())
                .city(document.getCity())
                .startDate(document.getStartDate())
                .endDate(document.getEndDate())
                .price(document.getPrice())
                .maxParticipants(document.getMaxParticipants())
                .currentParticipants(document.getCurrentParticipants())
                .travelManagerId(document.getTravelManagerId())
                .travelManagerName(document.getTravelManagerName())
                .category(document.getCategory())
                .highlights(document.getHighlights())
                .averageRating(document.getAverageRating())
                .totalReviews(document.getTotalReviews())
                .active(document.getActive())
                .createdAt(document.getCreatedAt())
                .build();
    }

    /**
     * Get similar travels based on category, destination, and price range (±30%)
     */
    @Transactional(readOnly = true)
    public List<TravelDTO> getSimilarTravels(Long travelId, int limit) {
        Travel travel = getTravelById(travelId);

        // Calculate price range (±30%)
        BigDecimal minPrice = travel.getPrice().multiply(BigDecimal.valueOf(0.7));
        BigDecimal maxPrice = travel.getPrice().multiply(BigDecimal.valueOf(1.3));

        // Query similar travels
        List<Travel> similarTravels = travelRepository.findSimilarTravels(
            travelId,
            travel.getCategory(),
            travel.getDestination(),
            minPrice,
            maxPrice,
            LocalDateTime.now(),
            PageRequest.of(0, limit)
        );

        return similarTravels.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get trending travels (most subscribed in last 30 days)
     */
    @Transactional(readOnly = true)
    public List<TravelDTO> getTrendingTravels(int limit) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        List<Travel> trendingTravels = travelRepository.findTrendingTravels(
            thirtyDaysAgo,
            LocalDateTime.now(),
            LocalDateTime.now(),
            PageRequest.of(0, limit)
        );

        return trendingTravels.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Validate itinerary stops and calculate route information
     */
    public com.travelms.travel.dto.RouteInfoDTO validateItinerary(List<com.travelms.travel.dto.ItineraryStopDTO> stops) {
        // Validation checks
        if (stops == null || stops.size() < 2) {
            throw new BadRequestException("At least 2 stops are required for route validation");
        }

        // Sort stops by order
        stops.sort((a, b) -> Integer.compare(a.getOrder(), b.getOrder()));

        // Validate stop types
        if (stops.get(0).getType() != com.travelms.travel.dto.ItineraryStopDTO.StopType.START) {
            throw new BadRequestException("First stop must be of type START");
        }

        if (stops.get(stops.size() - 1).getType() != com.travelms.travel.dto.ItineraryStopDTO.StopType.END) {
            throw new BadRequestException("Last stop must be of type END");
        }

        // Validate order sequence
        for (int i = 0; i < stops.size(); i++) {
            if (stops.get(i).getOrder() != i) {
                throw new BadRequestException("Stop order must be sequential starting from 0");
            }
        }

        // Validate coordinates
        for (com.travelms.travel.dto.ItineraryStopDTO stop : stops) {
            if (stop.getLatitude() < -90 || stop.getLatitude() > 90) {
                throw new BadRequestException("Invalid latitude for stop: " + stop.getName());
            }
            if (stop.getLongitude() < -180 || stop.getLongitude() > 180) {
                throw new BadRequestException("Invalid longitude for stop: " + stop.getName());
            }
        }

        // Calculate approximate distance and duration using Haversine formula
        long totalDistance = 0;
        int totalDuration = 0;

        for (int i = 0; i < stops.size() - 1; i++) {
            com.travelms.travel.dto.ItineraryStopDTO current = stops.get(i);
            com.travelms.travel.dto.ItineraryStopDTO next = stops.get(i + 1);

            double distance = calculateHaversineDistance(
                    current.getLatitude(), current.getLongitude(),
                    next.getLatitude(), next.getLongitude()
            );

            totalDistance += (long) distance;

            // Estimate duration: assume average speed of 60 km/h
            int segmentDuration = (int) (distance / 1000 / 60 * 60); // Convert to minutes
            totalDuration += segmentDuration;

            // Update stop duration if not set
            if (current.getDurationMinutes() == null) {
                current.setDurationMinutes(segmentDuration);
            }
        }

        // Build route info
        return com.travelms.travel.dto.RouteInfoDTO.builder()
                .totalDistance(totalDistance)
                .totalDuration(totalDuration)
                .isValid(true)
                .waypoints(stops)
                .build();
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Earth radius in meters

        double φ1 = Math.toRadians(lat1);
        double φ2 = Math.toRadians(lat2);
        double Δφ = Math.toRadians(lat2 - lat1);
        double Δλ = Math.toRadians(lon2 - lon1);

        double a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Count all travels
     */
    public Long countAllTravels() {
        return travelRepository.count();
    }

    /**
     * Count active travels (travels with active = true)
     */
    public Long countActiveTravels() {
        return travelRepository.findByActiveTrue().stream().count();
    }

    /**
     * Count completed travels (travels where endDate < now)
     */
    public Long countCompletedTravels() {
        return travelRepository.countCompletedTravels(LocalDateTime.now());
    }

    /**
     * Cascade delete all travels created by a manager
     * Called by user-service when deleting a travel manager
     * JPA cascade will automatically delete associated subscriptions
     */
    @Transactional
    public void deleteAllTravelsByManager(Long managerId) {
        List<Travel> travels = travelRepository.findByTravelManagerId(managerId);

        log.info("Cascade deleting {} travels for manager: {}", travels.size(), managerId);

        for (Travel travel : travels) {
            // Remove from Elasticsearch first
            try {
                travelSearchRepository.deleteById(String.valueOf(travel.getId()));
            } catch (Exception e) {
                log.warn("Failed to delete travel {} from Elasticsearch: {}", travel.getId(), e.getMessage());
            }

            // Delete from Neo4j
            try {
                neo4jSyncService.deleteTravelNode(travel.getId());
            } catch (Exception e) {
                log.warn("Failed to delete travel {} from Neo4j: {}", travel.getId(), e.getMessage());
            }

            // Delete the travel (JPA cascade will delete subscriptions)
            travelRepository.delete(travel);
        }

        log.info("Successfully cascade deleted {} travels for manager: {}", travels.size(), managerId);
    }
}
