package com.travelms.feedback.repository;

import com.travelms.feedback.model.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findByTravelId(Long travelId);

    List<Feedback> findByTravelIdIn(List<Long> travelIds);

    List<Feedback> findByTravelerId(Long travelerId);

    Optional<Feedback> findByTravelerIdAndTravelId(Long travelerId, Long travelId);

    Boolean existsByTravelerIdAndTravelId(Long travelerId, Long travelId);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.travelId = :travelId")
    Double getAverageRatingByTravelId(@Param("travelId") Long travelId);

    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.travelId = :travelId")
    Long countByTravelId(@Param("travelId") Long travelId);

    Long countByTravelerId(Long travelerId);
}
