package com.travelms.travel.repository.jpa;

import com.travelms.travel.model.entity.Subscription;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.model.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    @Query("SELECT s FROM Subscription s JOIN FETCH s.travel WHERE s.travelerId = :travelerId")
    List<Subscription> findByTravelerId(@Param("travelerId") Long travelerId);

    List<Subscription> findByTravel(Travel travel);

    @Query("SELECT s FROM Subscription s JOIN FETCH s.travel WHERE s.travelerId = :travelerId AND s.status = :status")
    List<Subscription> findByTravelerIdAndStatus(@Param("travelerId") Long travelerId, @Param("status") SubscriptionStatus status);

    Optional<Subscription> findByTravelerIdAndTravel(Long travelerId, Travel travel);

    Boolean existsByTravelerIdAndTravelAndStatus(Long travelerId, Travel travel, SubscriptionStatus status);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.travelerId = :travelerId AND s.status = :status")
    Long countByTravelerIdAndStatus(@Param("travelerId") Long travelerId, @Param("status") SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s WHERE s.travel.id = :travelId AND s.status = 'ACTIVE'")
    List<Subscription> findActiveSubscriptionsByTravelId(@Param("travelId") Long travelId);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.travelerId = :travelerId AND s.status = 'CANCELLED'")
    Long countCancelledSubscriptionsByTravelerId(@Param("travelerId") Long travelerId);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.travel.travelManagerId = :managerId AND s.status = :status")
    Long countByTravelManagerAndStatus(@Param("managerId") Long managerId, @Param("status") SubscriptionStatus status);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.travel.travelManagerId = :managerId")
    Long countAllByTravelManagerId(@Param("managerId") Long managerId);

    @Query("SELECT EXTRACT(MONTH FROM s.createdAt), EXTRACT(YEAR FROM s.createdAt), COUNT(s) FROM Subscription s " +
           "WHERE s.travel.travelManagerId = :managerId AND s.createdAt >= :startDate " +
           "GROUP BY EXTRACT(YEAR FROM s.createdAt), EXTRACT(MONTH FROM s.createdAt) " +
           "ORDER BY EXTRACT(YEAR FROM s.createdAt), EXTRACT(MONTH FROM s.createdAt)")
    List<Object[]> countSubscriptionsByMonth(@Param("managerId") Long managerId, @Param("startDate") LocalDateTime startDate);
}
