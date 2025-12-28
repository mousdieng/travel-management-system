package com.travelms.travel.model.neo4j;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Node("Travel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelNode {

    @Id
    @GeneratedValue
    private Long id;

    private Long travelId;
    private String title;
    private String destination;
    private String country;
    private String city;
    private String category;
    private BigDecimal price;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Double averageRating;

    @Relationship(type = "BELONGS_TO_DESTINATION", direction = Relationship.Direction.OUTGOING)
    private DestinationNode destinationNode;

    @Relationship(type = "IN_CATEGORY", direction = Relationship.Direction.OUTGOING)
    private CategoryNode categoryNode;

    @Relationship(type = "MANAGED_BY", direction = Relationship.Direction.OUTGOING)
    private ManagerNode manager;
}
