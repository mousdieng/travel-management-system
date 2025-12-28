package com.travelms.travel.model.neo4j;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.HashSet;
import java.util.Set;

@Node("Traveler")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelerNode {

    @Id
    @GeneratedValue
    private Long id;

    private Long userId;
    private String username;

    @Relationship(type = "SUBSCRIBED_TO", direction = Relationship.Direction.OUTGOING)
    private Set<TravelNode> subscribedTravels = new HashSet<>();

    @Relationship(type = "GAVE_FEEDBACK", direction = Relationship.Direction.OUTGOING)
    private Set<FeedbackRelationship> feedbacks = new HashSet<>();

    @Relationship(type = "PREFERS_DESTINATION", direction = Relationship.Direction.OUTGOING)
    private Set<DestinationNode> preferredDestinations = new HashSet<>();
}
