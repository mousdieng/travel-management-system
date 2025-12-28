package com.travelms.travel.model.neo4j;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Destination")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationNode {

    @Id
    @GeneratedValue
    private Long id;

    private String name;
    private String country;
    private String city;
}
