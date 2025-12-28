package com.travelms.travel.config;

import com.travelms.travel.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for Travel Service
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // Actuator and documentation
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html", "/api-docs/**").permitAll()

                        // Public travel browsing endpoints (GET only)
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/travels",
                                "/api/v1/travels/{id}",
                                "/api/v1/travels/search",
                                "/api/v1/travels/search/**",
                                "/api/v1/travels/available",
                                "/api/v1/travels/upcoming",
                                "/api/v1/travels/top-rated",
                                "/api/v1/travels/autocomplete",
                                "/api/v1/travels/categories",
                                "/api/v1/travels/manager/{managerId}",
                                "/api/v1/travels/manager/{managerId}/stats"
                        ).permitAll()

                        // Internal service communication endpoints (cascade deletes)
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/travels/manager/{managerId}/cascade-delete",
                                "/api/v1/subscriptions/user/{userId}/cascade-delete"
                        ).permitAll()

                        // Admin-only endpoints
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        // All other travel endpoints require authentication
                        .requestMatchers("/api/v1/travels/**").authenticated()

                        // Subscriptions require authentication
                        .requestMatchers("/api/v1/subscriptions/**").authenticated()

                        // Recommendations require authentication
                        .requestMatchers("/api/v1/recommendations/**").authenticated()

                        // Default: require authentication
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
