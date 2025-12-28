package com.travelms.travel.repository.neo4j;

import com.travelms.travel.model.neo4j.TravelNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelNodeRepository extends Neo4jRepository<TravelNode, Long> {

    Optional<TravelNode> findByTravelId(Long travelId);

    List<TravelNode> findByCategory(String category);

    @Query("MATCH (t:Travel)-[:BELONGS_TO_DESTINATION]->(d:Destination {name: $destination}) " +
           "RETURN t ORDER BY t.averageRating DESC")
    List<TravelNode> findByDestination(@Param("destination") String destination);
}
