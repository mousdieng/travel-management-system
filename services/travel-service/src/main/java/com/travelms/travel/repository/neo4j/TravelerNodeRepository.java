package com.travelms.travel.repository.neo4j;

import com.travelms.travel.model.neo4j.TravelerNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelerNodeRepository extends Neo4jRepository<TravelerNode, Long> {

    Optional<TravelerNode> findByUserId(Long userId);

    @Query("MATCH (t:Traveler {userId: $userId})-[r:GAVE_FEEDBACK]->(travel:Travel) " +
           "RETURN travel ORDER BY r.rating DESC LIMIT 10")
    List<Object> findHighRatedTravelsByTraveler(@Param("userId") Long userId);

    @Query("MATCH (t:Traveler {userId: $userId})-[:GAVE_FEEDBACK]->(travel1:Travel)-[:IN_CATEGORY]->(cat:Category) " +
           "MATCH (travel2:Travel)-[:IN_CATEGORY]->(cat) " +
           "WHERE NOT (t)-[:SUBSCRIBED_TO]->(travel2) AND travel2.travelId <> travel1.travelId " +
           "RETURN DISTINCT travel2 ORDER BY travel2.averageRating DESC LIMIT 10")
    List<Object> findRecommendedTravelsByCategory(@Param("userId") Long userId);

    @Query("MATCH (t:Traveler {userId: $userId})-[:SUBSCRIBED_TO]->(travel:Travel)-[:BELONGS_TO_DESTINATION]->(dest:Destination) " +
           "MATCH (newTravel:Travel)-[:BELONGS_TO_DESTINATION]->(dest) " +
           "WHERE NOT (t)-[:SUBSCRIBED_TO]->(newTravel) " +
           "RETURN DISTINCT newTravel ORDER BY newTravel.averageRating DESC LIMIT 10")
    List<Object> findRecommendedTravelsByDestination(@Param("userId") Long userId);
}
