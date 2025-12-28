package com.travelms.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for Gateway Service
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(exchanges -> exchanges
                        // Public endpoints - actuator and monitoring
                        .pathMatchers(
                                "/actuator/**",
                                "/fallback/**"
                        ).permitAll()

                        // Public endpoints - API documentation
                        .pathMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/webjars/**",
                                "/*/v3/api-docs"
                        ).permitAll()

                        // Public endpoints - authentication
                        .pathMatchers(
                                "/api/v1/auth/register",
                                "/api/v1/auth/login",
                                "/api/v1/auth/check-username",
                                "/api/v1/auth/check-email"
                        ).permitAll()

                        // Public endpoints - user profiles (read-only)
                        .pathMatchers(
                                "/api/v1/users/*/avatar",
                                "/api/v1/users/{userId}",
                                "/api/v1/users/username/{username}",
                                "/api/v1/users/{userId}/exists",
                                "/api/v1/users/search"
                        ).permitAll()

                        // Public endpoints - travel browsing
                        .pathMatchers(
                                "/api/v1/travels/search",
                                "/api/v1/travels",
                                "/api/v1/travels/{id}",
                                "/api/v1/travels/available",
                                "/api/v1/travels/upcoming",
                                "/api/v1/travels/top-rated",
                                "/api/v1/travels/autocomplete"
                        ).permitAll()

                        // Public endpoints - payment webhooks
                        .pathMatchers(
                                "/api/v1/webhooks/**"
                        ).permitAll()

                        // Public endpoints - feedback viewing
                        .pathMatchers(
                                "/api/v1/feedbacks/travel/{travelId}",
                                "/api/v1/feedbacks/travel/{travelId}/average-rating",
                                "/api/v1/feedbacks/travel/{travelId}/count"
                        ).permitAll()

                        // All other requests - authentication handled by gateway filters
                        .anyExchange().permitAll()
                )
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow specific origins with patterns (required when allowCredentials is true)
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "https://localhost:*",
                "http://127.0.0.1:*",
                "https://127.0.0.1:*",
                "http://192.168.*.*:*",
                "https://192.168.*.*:*"
        ));

        // Allow common HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"
        ));

        // Allow all headers
        configuration.setAllowedHeaders(List.of("*"));

        // Allow credentials
        configuration.setAllowCredentials(true);

        // Expose headers to client
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Total-Count",
                "X-User-Id",
                "X-User-Name",
                "X-User-Role"
        ));

        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}