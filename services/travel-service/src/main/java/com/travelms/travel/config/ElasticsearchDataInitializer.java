package com.travelms.travel.config;

import com.travelms.travel.service.ElasticsearchSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Initializes Elasticsearch with travel data on application startup
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchDataInitializer {

    private final ElasticsearchSearchService searchService;

    @EventListener(ApplicationReadyEvent.class)
    public void initializeElasticsearchData() {
        try {
            log.info("Initializing Elasticsearch with travel data...");
            searchService.syncAllTravels();
            log.info("Elasticsearch data initialization completed successfully");
        } catch (Exception e) {
            log.error("Failed to initialize Elasticsearch data: {}", e.getMessage());
            // Don't fail the application startup if Elasticsearch sync fails
        }
    }
}
