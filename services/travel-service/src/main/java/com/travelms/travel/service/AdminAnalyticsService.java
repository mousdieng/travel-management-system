package com.travelms.travel.service;

import com.travelms.travel.dto.admin.ManagerRankingDTO;
import com.travelms.travel.dto.admin.TravelPerformanceMetricsDTO;
import com.travelms.travel.dto.admin.UnderperformingTravelDTO;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.repository.jpa.TravelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private final TravelRepository travelRepository;

    @Transactional(readOnly = true)
    public List<ManagerRankingDTO> getManagerRankings(Integer limit) {
        log.info("Fetching manager rankings with limit: {}", limit);

        List<Travel> allTravels = travelRepository.findAll();

        // Group travels by manager ID
        Map<Long, List<Travel>> travelsByManager = allTravels.stream()
                .filter(travel -> travel.getTravelManagerId() != null)
                .collect(Collectors.groupingBy(Travel::getTravelManagerId));

        // Calculate rankings for each manager
        List<ManagerRankingDTO> rankings = travelsByManager.entrySet().stream()
                .map(entry -> {
                    Long managerId = entry.getKey();
                    List<Travel> managerTravels = entry.getValue();

                    int totalTravels = managerTravels.size();
                    int activeTravels = (int) managerTravels.stream()
                            .filter(Travel::getActive)
                            .count();

                    double avgRating = managerTravels.stream()
                            .filter(t -> t.getAverageRating() != null)
                            .mapToDouble(Travel::getAverageRating)
                            .average()
                            .orElse(0.0);

                    long totalBookings = managerTravels.stream()
                            .filter(t -> t.getCurrentParticipants() != null)
                            .mapToLong(Travel::getCurrentParticipants)
                            .sum();

                    double totalRevenue = managerTravels.stream()
                            .mapToDouble(t -> t.getPrice() != null ?
                                    t.getPrice().doubleValue() * t.getCurrentParticipants() : 0.0)
                            .sum();

                    String managerName = managerTravels.stream()
                            .map(Travel::getTravelManagerName)
                            .filter(Objects::nonNull)
                            .findFirst()
                            .orElse("Manager " + managerId);

                    // Calculate performance score (0-100 scale)
                    // Weighted: 40% revenue, 30% rating, 20% bookings, 10% active travels
                    double revenueScore = Math.min(totalRevenue / 100.0, 100.0); // Max out at 10000
                    double ratingScore = (avgRating / 5.0) * 100.0;
                    double bookingScore = Math.min(totalBookings / 10.0, 100.0); // Max out at 1000 bookings
                    double activeScore = totalTravels > 0 ? (activeTravels * 100.0 / totalTravels) : 0.0;

                    double performanceScore = (revenueScore * 0.4) + (ratingScore * 0.3) +
                                             (bookingScore * 0.2) + (activeScore * 0.1);

                    return ManagerRankingDTO.builder()
                            .managerId(managerId)
                            .managerName(managerName)
                            .managerEmail("manager" + managerId + "@example.com") // TODO: Fetch from user service
                            .totalTravels(totalTravels)
                            .activeTravels(activeTravels)
                            .averageRating(Math.round(avgRating * 10.0) / 10.0)
                            .totalBookings(totalBookings)
                            .totalRevenue(Math.round(totalRevenue * 100.0) / 100.0)
                            .performanceScore(Math.round(performanceScore * 10.0) / 10.0)
                            .build();
                })
                .sorted(Comparator.comparing(ManagerRankingDTO::getTotalRevenue).reversed())
                .collect(Collectors.toList());

        // Assign ranks
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }

        // Apply limit if specified
        if (limit != null && limit > 0) {
            rankings = rankings.stream().limit(limit).collect(Collectors.toList());
        }

        log.info("Found {} manager rankings", rankings.size());
        return rankings;
    }

    @Transactional(readOnly = true)
    public List<TravelPerformanceMetricsDTO> getTravelPerformanceMetrics(
            String category, String status, Double minRating, String dateFrom, String dateTo) {
        log.info("Fetching travel performance metrics");

        List<Travel> travels = travelRepository.findAll();

        // Apply filters
        List<TravelPerformanceMetricsDTO> metrics = travels.stream()
                .filter(travel -> category == null || category.equals(travel.getCategory()))
                .filter(travel -> status == null ||
                        (status.equalsIgnoreCase("active") && travel.getActive()) ||
                        (status.equalsIgnoreCase("inactive") && !travel.getActive()))
                .filter(travel -> minRating == null ||
                        (travel.getAverageRating() != null && travel.getAverageRating() >= minRating))
                .map(travel -> {
                    int currentBookings = travel.getCurrentParticipants() != null ?
                            travel.getCurrentParticipants() : 0;
                    double revenue = travel.getPrice() != null ?
                            travel.getPrice().doubleValue() * currentBookings : 0.0;
                    int capacity = travel.getMaxParticipants() != null ?
                            travel.getMaxParticipants() : 0;
                    double bookingRate = capacity > 0 ? (currentBookings * 100.0 / capacity) : 0.0;

                    return TravelPerformanceMetricsDTO.builder()
                            .travelId(travel.getId())
                            .title(travel.getTitle())
                            .category(travel.getCategory())
                            .status(travel.getActive() ? "ACTIVE" : "INACTIVE")
                            .managerId(travel.getTravelManagerId())
                            .managerName(travel.getTravelManagerName() != null ?
                                    travel.getTravelManagerName() :
                                    "Manager " + travel.getTravelManagerId())
                            .averageRating(travel.getAverageRating() != null ?
                                    Math.round(travel.getAverageRating() * 10.0) / 10.0 : 0.0)
                            .totalBookings(currentBookings)
                            .totalRevenue(Math.round(revenue * 100.0) / 100.0)
                            .capacity(capacity)
                            .bookingRate(Math.round(bookingRate * 10.0) / 10.0)
                            .totalReviews(travel.getTotalReviews() != null ?
                                    travel.getTotalReviews() : 0)
                            .build();
                })
                .sorted(Comparator.comparing(TravelPerformanceMetricsDTO::getTotalRevenue).reversed())
                .collect(Collectors.toList());

        log.info("Found {} travel performance metrics", metrics.size());
        return metrics;
    }

    @Transactional(readOnly = true)
    public List<UnderperformingTravelDTO> getUnderperformingTravels(Integer threshold) {
        log.info("Fetching underperforming travels with threshold: {}", threshold);

        List<Travel> travels = travelRepository.findAll();

        List<UnderperformingTravelDTO> underperforming = travels.stream()
                .filter(Travel::getActive) // Only active travels
                .map(travel -> {
                    int currentBookings = travel.getCurrentParticipants() != null ?
                            travel.getCurrentParticipants() : 0;
                    int capacity = travel.getMaxParticipants() != null ?
                            travel.getMaxParticipants() : 0;
                    double bookingRate = capacity > 0 ? (currentBookings * 100.0 / capacity) : 0.0;

                    String reason = determineUnderperformingReason(travel, bookingRate);

                    return UnderperformingTravelDTO.builder()
                            .travelId(travel.getId())
                            .title(travel.getTitle())
                            .category(travel.getCategory())
                            .managerId(travel.getTravelManagerId())
                            .managerName(travel.getTravelManagerName() != null ?
                                    travel.getTravelManagerName() :
                                    "Manager " + travel.getTravelManagerId())
                            .averageRating(travel.getAverageRating() != null ?
                                    Math.round(travel.getAverageRating() * 10.0) / 10.0 : 0.0)
                            .totalBookings(currentBookings)
                            .capacity(capacity)
                            .bookingRate(Math.round(bookingRate * 10.0) / 10.0)
                            .reason(reason)
                            .build();
                })
                .filter(dto -> dto.getBookingRate() < threshold)
                .sorted(Comparator.comparing(UnderperformingTravelDTO::getBookingRate))
                .collect(Collectors.toList());

        log.info("Found {} underperforming travels", underperforming.size());
        return underperforming;
    }

    private String determineUnderperformingReason(Travel travel, double bookingRate) {
        if (bookingRate < 20) {
            return "Very low booking rate (" + Math.round(bookingRate) + "%)";
        } else if (travel.getAverageRating() != null && travel.getAverageRating() < 3.0) {
            return "Low rating (" + travel.getAverageRating() + " stars)";
        } else if (bookingRate < 50) {
            return "Below 50% capacity (" + Math.round(bookingRate) + "%)";
        } else {
            return "Underperforming based on threshold";
        }
    }

    @Transactional(readOnly = true)
    public List<TravelPerformanceMetricsDTO> getTopPerformingTravels(Integer limit) {
        log.info("Fetching top performing travels with limit: {}", limit);

        List<Travel> travels = travelRepository.findAll();

        List<TravelPerformanceMetricsDTO> topTravels = travels.stream()
                .map(travel -> {
                    int currentBookings = travel.getCurrentParticipants() != null ?
                            travel.getCurrentParticipants() : 0;
                    double revenue = travel.getPrice() != null ?
                            travel.getPrice().doubleValue() * currentBookings : 0.0;
                    int capacity = travel.getMaxParticipants() != null ?
                            travel.getMaxParticipants() : 0;
                    double bookingRate = capacity > 0 ? (currentBookings * 100.0 / capacity) : 0.0;

                    return TravelPerformanceMetricsDTO.builder()
                            .travelId(travel.getId())
                            .title(travel.getTitle())
                            .category(travel.getCategory())
                            .status(travel.getActive() ? "ACTIVE" : "INACTIVE")
                            .managerId(travel.getTravelManagerId())
                            .managerName(travel.getTravelManagerName() != null ?
                                    travel.getTravelManagerName() :
                                    "Manager " + travel.getTravelManagerId())
                            .averageRating(travel.getAverageRating() != null ?
                                    Math.round(travel.getAverageRating() * 10.0) / 10.0 : 0.0)
                            .totalBookings(currentBookings)
                            .totalRevenue(Math.round(revenue * 100.0) / 100.0)
                            .capacity(capacity)
                            .bookingRate(Math.round(bookingRate * 10.0) / 10.0)
                            .totalReviews(travel.getTotalReviews() != null ?
                                    travel.getTotalReviews() : 0)
                            .build();
                })
                .sorted(Comparator.comparing(TravelPerformanceMetricsDTO::getTotalRevenue).reversed())
                .limit(limit != null && limit > 0 ? limit : 10)
                .collect(Collectors.toList());

        log.info("Found {} top performing travels", topTravels.size());
        return topTravels;
    }

    @Transactional(readOnly = true)
    public List<TravelPerformanceMetricsDTO> getAllTravelsHistory() {
        log.info("Fetching all travels history");

        List<Travel> travels = travelRepository.findAll();

        List<TravelPerformanceMetricsDTO> history = travels.stream()
                .map(travel -> {
                    int currentBookings = travel.getCurrentParticipants() != null ?
                            travel.getCurrentParticipants() : 0;
                    double revenue = travel.getPrice() != null ?
                            travel.getPrice().doubleValue() * currentBookings : 0.0;
                    int capacity = travel.getMaxParticipants() != null ?
                            travel.getMaxParticipants() : 0;
                    double bookingRate = capacity > 0 ? (currentBookings * 100.0 / capacity) : 0.0;

                    return TravelPerformanceMetricsDTO.builder()
                            .travelId(travel.getId())
                            .title(travel.getTitle())
                            .category(travel.getCategory())
                            .status(travel.getActive() ? "ACTIVE" : "INACTIVE")
                            .managerId(travel.getTravelManagerId())
                            .managerName(travel.getTravelManagerName() != null ?
                                    travel.getTravelManagerName() :
                                    "Manager " + travel.getTravelManagerId())
                            .averageRating(travel.getAverageRating() != null ?
                                    Math.round(travel.getAverageRating() * 10.0) / 10.0 : 0.0)
                            .totalBookings(currentBookings)
                            .totalRevenue(Math.round(revenue * 100.0) / 100.0)
                            .capacity(capacity)
                            .bookingRate(Math.round(bookingRate * 10.0) / 10.0)
                            .totalReviews(travel.getTotalReviews() != null ?
                                    travel.getTotalReviews() : 0)
                            .build();
                })
                .sorted(Comparator.comparing(TravelPerformanceMetricsDTO::getTravelId).reversed())
                .collect(Collectors.toList());

        log.info("Found {} travels in history", history.size());
        return history;
    }

    @Transactional(readOnly = true)
    public TravelPerformanceMetricsDTO getTravelDetailedStats(Long travelId) {
        log.info("Fetching detailed stats for travel: {}", travelId);

        Travel travel = travelRepository.findById(travelId)
                .orElseThrow(() -> new RuntimeException("Travel not found with id: " + travelId));

        int currentBookings = travel.getCurrentParticipants() != null ?
                travel.getCurrentParticipants() : 0;
        double revenue = travel.getPrice() != null ?
                travel.getPrice().doubleValue() * currentBookings : 0.0;
        int capacity = travel.getMaxParticipants() != null ?
                travel.getMaxParticipants() : 0;
        double bookingRate = capacity > 0 ? (currentBookings * 100.0 / capacity) : 0.0;

        return TravelPerformanceMetricsDTO.builder()
                .travelId(travel.getId())
                .title(travel.getTitle())
                .category(travel.getCategory())
                .status(travel.getActive() ? "ACTIVE" : "INACTIVE")
                .managerId(travel.getTravelManagerId())
                .managerName(travel.getTravelManagerName() != null ?
                        travel.getTravelManagerName() :
                        "Manager " + travel.getTravelManagerId())
                .averageRating(travel.getAverageRating() != null ?
                        Math.round(travel.getAverageRating() * 10.0) / 10.0 : 0.0)
                .totalBookings(currentBookings)
                .totalRevenue(Math.round(revenue * 100.0) / 100.0)
                .capacity(capacity)
                .bookingRate(Math.round(bookingRate * 10.0) / 10.0)
                .totalReviews(travel.getTotalReviews() != null ?
                        travel.getTotalReviews() : 0)
                .build();
    }

    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        log.info("Fetching all travel categories");

        List<String> categories = travelRepository.findAll().stream()
                .map(Travel::getCategory)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        log.info("Found {} categories", categories.size());
        return categories;
    }
}
