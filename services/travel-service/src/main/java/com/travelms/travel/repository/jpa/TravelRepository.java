package com.travelms.travel.repository.jpa;

import com.travelms.travel.model.entity.Travel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TravelRepository extends JpaRepository<Travel, Long> {

    List<Travel> findByTravelManagerId(Long travelManagerId);

    List<Travel> findByTravelManagerIdAndActiveTrue(Long travelManagerId);

    List<Travel> findByActiveTrue();

    Page<Travel> findByActiveTrueAndStartDateAfter(LocalDateTime date, Pageable pageable);

    @Query("SELECT t FROM Travel t WHERE t.active = true AND t.startDate > :now ORDER BY t.createdAt DESC")
    List<Travel> findUpcomingTravels(@Param("now") LocalDateTime now);

    @Query("SELECT t FROM Travel t WHERE t.active = true AND t.startDate > :now AND t.currentParticipants < t.maxParticipants")
    List<Travel> findAvailableTravels(@Param("now") LocalDateTime now);

    @Query("SELECT t FROM Travel t WHERE t.travelManagerId = :managerId AND t.active = true ORDER BY t.createdAt DESC")
    List<Travel> findByTravelManagerIdOrderByCreatedAtDesc(@Param("managerId") Long managerId);

    @Query("SELECT t FROM Travel t WHERE t.active = true AND " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.destination) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Travel> searchTravels(@Param("keyword") String keyword);

    @Query("SELECT t FROM Travel t WHERE t.active = true ORDER BY t.averageRating DESC, t.totalReviews DESC")
    List<Travel> findTopRatedTravels(Pageable pageable);

    @Query("SELECT t.category, COUNT(t) FROM Travel t WHERE t.active = true GROUP BY t.category")
    List<Object[]> countTravelsByCategory();

    @Query("SELECT COUNT(t) FROM Travel t WHERE t.active = true AND t.endDate < :now")
    Long countCompletedTravels(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(t) FROM Travel t WHERE t.active = true AND t.startDate <= :now AND t.endDate >= :now")
    Long countOngoingTravels(@Param("now") LocalDateTime now);

    @Query("SELECT t FROM Travel t WHERE t.active = true AND t.endDate < :now ORDER BY t.averageRating DESC, t.currentParticipants DESC")
    List<Travel> findTopPerformingCompletedTravels(@Param("now") LocalDateTime now, Pageable pageable);

    // Manager statistics queries
    @Query("SELECT COUNT(t) FROM Travel t WHERE t.travelManagerId = :managerId")
    Long countByTravelManagerId(@Param("managerId") Long managerId);

    @Query("SELECT COUNT(t) FROM Travel t WHERE t.travelManagerId = :managerId AND t.active = true")
    Long countActiveByTravelManagerId(@Param("managerId") Long managerId);

    @Query("SELECT COUNT(t) FROM Travel t WHERE t.travelManagerId = :managerId AND t.endDate < :now")
    Long countCompletedByTravelManagerId(@Param("managerId") Long managerId, @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(t) FROM Travel t WHERE t.travelManagerId = :managerId AND t.startDate > :now AND t.active = true")
    Long countUpcomingByTravelManagerId(@Param("managerId") Long managerId, @Param("now") LocalDateTime now);

    @Query("SELECT SUM(t.currentParticipants) FROM Travel t WHERE t.travelManagerId = :managerId")
    Long sumParticipantsByTravelManagerId(@Param("managerId") Long managerId);

    @Query("SELECT AVG(t.averageRating) FROM Travel t WHERE t.travelManagerId = :managerId AND t.totalReviews > 0")
    Double avgRatingByTravelManagerId(@Param("managerId") Long managerId);

    @Query("SELECT SUM(t.totalReviews) FROM Travel t WHERE t.travelManagerId = :managerId")
    Long sumReviewsByTravelManagerId(@Param("managerId") Long managerId);

    @Query("SELECT SUM(t.price * t.currentParticipants) FROM Travel t WHERE t.travelManagerId = :managerId AND t.endDate < :now")
    BigDecimal sumRevenueByTravelManagerId(@Param("managerId") Long managerId, @Param("now") LocalDateTime now);

    @Query("SELECT t.category, COUNT(t) FROM Travel t WHERE t.travelManagerId = :managerId GROUP BY t.category")
    List<Object[]> countTravelsByCategoryForManager(@Param("managerId") Long managerId);

    @Query("SELECT t FROM Travel t WHERE t.travelManagerId = :managerId AND t.active = true ORDER BY t.averageRating DESC, t.currentParticipants DESC")
    List<Travel> findTopPerformingTravelsByManager(@Param("managerId") Long managerId, Pageable pageable);

    @Query("SELECT EXTRACT(MONTH FROM t.createdAt), EXTRACT(YEAR FROM t.createdAt), COUNT(t) FROM Travel t " +
           "WHERE t.travelManagerId = :managerId AND t.createdAt >= :startDate GROUP BY EXTRACT(YEAR FROM t.createdAt), EXTRACT(MONTH FROM t.createdAt) " +
           "ORDER BY EXTRACT(YEAR FROM t.createdAt), EXTRACT(MONTH FROM t.createdAt)")
    List<Object[]> countTravelsCreatedByMonth(@Param("managerId") Long managerId, @Param("startDate") LocalDateTime startDate);

    // Similar travels query - based on category, destination, and price range
    @Query("SELECT t FROM Travel t WHERE " +
           "t.id != :excludeId AND " +
           "t.active = true AND " +
           "t.startDate > :now AND " +
           "(t.category = :category OR t.destination = :destination) AND " +
           "t.price BETWEEN :minPrice AND :maxPrice " +
           "ORDER BY " +
           "CASE WHEN t.category = :category AND t.destination = :destination THEN 0 " +
           "     WHEN t.category = :category THEN 1 " +
           "     WHEN t.destination = :destination THEN 2 " +
           "     ELSE 3 END, " +
           "t.averageRating DESC")
    List<Travel> findSimilarTravels(
        @Param("excludeId") Long excludeId,
        @Param("category") String category,
        @Param("destination") String destination,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("now") LocalDateTime now,
        Pageable pageable
    );

    // Trending travels query - most subscribed in last 30 days
    @Query("SELECT t FROM Travel t " +
           "LEFT JOIN Subscription s ON s.travel = t AND s.createdAt BETWEEN :startDate AND :endDate " +
           "WHERE t.active = true AND t.startDate > :now " +
           "GROUP BY t " +
           "ORDER BY COUNT(s) DESC, t.averageRating DESC")
    List<Travel> findTrendingTravels(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("now") LocalDateTime now,
        Pageable pageable
    );

}
