package com.travelms.travel.repository.elasticsearch;

import com.travelms.travel.model.document.TravelDocument;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TravelSearchRepository extends ElasticsearchRepository<TravelDocument, String> {

    List<TravelDocument> findByTitleContainingOrDescriptionContainingOrDestinationContaining(
            String title, String description, String destination);

    List<TravelDocument> findByDestination(String destination);

    List<TravelDocument> findByCategory(String category);

    List<TravelDocument> findByActiveTrue();

    @Query("{\"bool\": {\"must\": [{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"title^3\", \"description^2\", \"destination\", \"country\", \"city\", \"category\"]}}]}}")
    List<TravelDocument> searchByKeyword(String keyword);

    @Query("{\"bool\": {\"must\": [{\"match_phrase_prefix\": {\"title\": \"?0\"}}]}}")
    List<TravelDocument> autocompleteByTitle(String prefix);
}
