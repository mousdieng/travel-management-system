package com.travelms.travel.model.neo4j;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Category")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryNode {

    @Id
    @GeneratedValue
    private Long id;

    private String name;
}
