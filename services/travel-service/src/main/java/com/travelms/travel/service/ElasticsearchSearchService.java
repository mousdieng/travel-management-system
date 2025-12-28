package com.travelms.travel.service;

import com.travelms.travel.model.document.TravelDocument;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.repository.elasticsearch.TravelSearchRepository;
import com.travelms.travel.repository.jpa.TravelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchSearchService {

    private final TravelSearchRepository searchRepository;
    private final TravelRepository travelRepository;
    private final ElasticsearchTemplate elasticsearchTemplate;

    /**
     * Advanced search with autocomplete across all travel fields
     */
    public List<TravelDocument> searchTravels(String keyword, int limit) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        log.info("Searching travels with keyword: {}", keyword);

        // Use multi-match query for comprehensive search
        List<TravelDocument> results = searchRepository.searchByKeyword(keyword);

        return results.stream()
                .filter(doc -> doc.getActive() != null && doc.getActive())
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Autocomplete suggestions for travel titles
     */
    public List<String> autocompleteTitles(String prefix, int limit) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return List.of();
        }

        log.info("Autocomplete for prefix: {}", prefix);

        List<TravelDocument> results = searchRepository.autocompleteByTitle(prefix);

        return results.stream()
                .filter(doc -> doc.getActive() != null && doc.getActive())
                .map(TravelDocument::getTitle)
                .distinct()
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Autocomplete suggestions across multiple fields
     */
    public List<AutocompleteSuggestion> autocompleteAll(String prefix, int limit) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return List.of();
        }

        log.info("Autocomplete all fields for prefix: {}", prefix);

        List<TravelDocument> results = searchRepository.searchByKeyword(prefix);

        return results.stream()
                .filter(doc -> doc.getActive() != null && doc.getActive())
                .limit(limit)
                .map(doc -> AutocompleteSuggestion.builder()
                        .id(doc.getId())
                        .title(doc.getTitle())
                        .destination(doc.getDestination())
                        .country(doc.getCountry())
                        .city(doc.getCity())
                        .category(doc.getCategory())
                        .price(doc.getPrice())
                        .averageRating(doc.getAverageRating())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Search by destination
     */
    public List<TravelDocument> searchByDestination(String destination) {
        log.info("Searching by destination: {}", destination);
        return searchRepository.findByDestination(destination);
    }

    /**
     * Search by category
     */
    public List<TravelDocument> searchByCategory(String category) {
        log.info("Searching by category: {}", category);
        return searchRepository.findByCategory(category);
    }

    /**
     * Sync travel data from PostgreSQL to Elasticsearch
     */
    public void syncTravelToElasticsearch(Long travelId) {
        Travel travel = travelRepository.findById(travelId).orElse(null);
        if (travel == null) {
            log.warn("Travel with id {} not found for Elasticsearch sync", travelId);
            return;
        }

        TravelDocument document = convertToDocument(travel);
        searchRepository.save(document);
        log.info("Synced travel {} to Elasticsearch", travelId);
    }

    /**
     * Sync all active travels to Elasticsearch
     */
    public void syncAllTravels() {
        log.info("Starting full sync of travels to Elasticsearch");
        List<Travel> travels = travelRepository.findByActiveTrue();

        List<TravelDocument> documents = travels.stream()
                .map(this::convertToDocument)
                .collect(Collectors.toList());

        searchRepository.saveAll(documents);
        log.info("Synced {} travels to Elasticsearch", documents.size());
    }

    /**
     * Delete travel from Elasticsearch
     */
    public void deleteTravelFromElasticsearch(Long travelId) {
        searchRepository.deleteById(String.valueOf(travelId));
        log.info("Deleted travel {} from Elasticsearch", travelId);
    }

    private TravelDocument convertToDocument(Travel travel) {
        return TravelDocument.builder()
                .id(String.valueOf(travel.getId()))
                .title(travel.getTitle())
                .description(travel.getDescription())
                .destination(travel.getDestination())
                .country(travel.getCountry())
                .city(travel.getCity())
                .startDate(travel.getStartDate())
                .endDate(travel.getEndDate())
                .price(travel.getPrice())
                .maxParticipants(travel.getMaxParticipants())
                .currentParticipants(travel.getCurrentParticipants())
                .travelManagerId(travel.getTravelManagerId())
                .travelManagerName(travel.getTravelManagerName())
                .category(travel.getCategory())
                .highlights(travel.getHighlights())
                .averageRating(travel.getAverageRating())
                .totalReviews(travel.getTotalReviews())
                .active(travel.getActive())
                .createdAt(travel.getCreatedAt())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class AutocompleteSuggestion {
        private String id;
        private String title;
        private String destination;
        private String country;
        private String city;
        private String category;
        private java.math.BigDecimal price;
        private Double averageRating;
    }
}
