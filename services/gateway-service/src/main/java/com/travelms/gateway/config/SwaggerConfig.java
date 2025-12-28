package com.travelms.gateway.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI documentation aggregation configuration
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi gatewayApi() {
        return GroupedOpenApi.builder()
                .group("gateway-service")
                .pathsToMatch("/actuator/**", "/fallback/**")
                .build();
    }

    @Bean
    public GroupedOpenApi userServiceApi() {
        return GroupedOpenApi.builder()
                .group("user-service")
                .pathsToMatch("/api/v1/auth/**", "/api/v1/users/**")
                .build();
    }

    @Bean
    public GroupedOpenApi movieServiceApi() {
        return GroupedOpenApi.builder()
                .group("movie-service")
                .pathsToMatch("/api/v1/movies/**")
                .build();
    }

    @Bean
    public GroupedOpenApi ratingServiceApi() {
        return GroupedOpenApi.builder()
                .group("rating-service")
                .pathsToMatch("/api/v1/ratings/**")
                .build();
    }

    @Bean
    public GroupedOpenApi recommendationServiceApi() {
        return GroupedOpenApi.builder()
                .group("recommendation-service")
                .pathsToMatch("/api/v1/recommendations/**")
                .build();
    }

    @Bean
    public GroupedOpenApi watchlistServiceApi() {
        return GroupedOpenApi.builder()
                .group("watchlist-service")
                .pathsToMatch("/api/v1/watchlist/**")
                .build();
    }
}