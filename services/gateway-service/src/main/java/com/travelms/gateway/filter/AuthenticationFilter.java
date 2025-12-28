package com.travelms.gateway.filter;

import com.travelms.gateway.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Authentication filter for Gateway Service
 * Validates JWT tokens and enriches requests with user information
 */
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);

    private final JwtService jwtService;

    @Autowired
    public AuthenticationFilter(JwtService jwtService) {
        super(Config.class);
        this.jwtService = jwtService;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            ServerHttpResponse response = exchange.getResponse();

            // Check for Authorization header
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                logger.warn("Missing Authorization header for protected route: {}", request.getPath());
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return response.setComplete();
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.warn("Invalid Authorization header format for route: {}", request.getPath());
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return response.setComplete();
            }

            try {
                // Extract JWT token
                String token = authHeader.substring(7);
                logger.info("Processing JWT token for route: {}", request.getPath());

                // Validate token
                if (!jwtService.isTokenValid(token)) {
                    logger.warn("Invalid JWT token for route: {}", request.getPath());
                    response.setStatusCode(HttpStatus.UNAUTHORIZED);
                    return response.setComplete();
                }

                logger.info("JWT token validated successfully for route: {}", request.getPath());

                // Token is valid - let it pass through to microservices
                // Microservices will extract user info from the JWT token themselves
                return chain.filter(exchange);

            } catch (Exception e) {
                logger.error("Authentication error for route {}: {}", request.getPath(), e.getMessage());
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return response.setComplete();
            }
        };
    }

    @Override
    public String name() {
        return "Authentication";
    }

    public static class Config {
        // Configuration properties can be added here if needed
    }
}