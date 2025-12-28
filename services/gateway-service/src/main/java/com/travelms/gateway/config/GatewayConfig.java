package com.travelms.gateway.config;

import com.travelms.gateway.filter.AuthenticationFilter;
import com.travelms.gateway.filter.LoggingFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

import java.util.Objects;

/**
 * Gateway routing configuration for Travel Management System microservices
 */
@Configuration
public class GatewayConfig {

    private final AuthenticationFilter authenticationFilter;
    private final LoggingFilter loggingFilter;

    @Autowired
    public GatewayConfig(AuthenticationFilter authenticationFilter, LoggingFilter loggingFilter) {
        this.authenticationFilter = authenticationFilter;
        this.loggingFilter = loggingFilter;
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // ========================================
                // USER SERVICE ROUTES
                // ========================================

                // Authentication endpoints (Public)
                .route("user-service-auth", r -> r
                        .path("/api/v1/auth/**")
                        .filters(f -> f
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("user-service-cb")
                                        .setFallbackUri("forward:/fallback/user-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://user-service"))

                // Public user endpoints (read-only)
                .route("user-service-public-get", r -> r
                        .path("/api/v1/users/{userId}",
                              "/api/v1/users/username/{username}",
                              "/api/v1/users/{userId}/exists",
                              "/api/v1/users/search",
                              "/api/v1/users/{userId}/avatar")
                        .and()
                        .method("GET")
                        .filters(f -> f
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("user-service-cb")
                                        .setFallbackUri("forward:/fallback/user-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://user-service"))

                // Protected user endpoints (require authentication)
                .route("user-service-protected", r -> r
                        .path("/api/v1/users/**")
                        .filters(f -> f
                                .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("user-service-cb")
                                        .setFallbackUri("forward:/fallback/user-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://user-service"))

                // ========================================
                // TRAVEL SERVICE ROUTES
                // ========================================

                // Public travel browsing endpoints
                .route("travel-service-public-browsing", r -> r
                        .path("/api/v1/travels/search",
                              "/api/v1/travels/available",
                              "/api/v1/travels/upcoming",
                              "/api/v1/travels/top-rated",
                              "/api/v1/travels/autocomplete")
                        .and()
                        .method("GET")
                        .filters(f -> f
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .requestRateLimiter(c -> c
                                        .setRateLimiter(redisRateLimiter())
                                        .setKeyResolver(hostAddressKeyResolver()))
                                .circuitBreaker(c -> c
                                        .setName("travel-service-cb")
                                        .setFallbackUri("forward:/fallback/travel-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://travel-service"))

                // Public travel list/detail endpoints
                .route("travel-service-public-get", r -> r
                        .path("/api/v1/travels", "/api/v1/travels/{id}")
                        .and()
                        .method("GET")
                        .filters(f -> f
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .requestRateLimiter(c -> c
                                        .setRateLimiter(redisRateLimiter())
                                        .setKeyResolver(hostAddressKeyResolver()))
                                .circuitBreaker(c -> c
                                        .setName("travel-service-cb")
                                        .setFallbackUri("forward:/fallback/travel-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://travel-service"))

                // Protected travel management endpoints
                .route("travel-service-protected", r -> r
                        .path("/api/v1/travels/**")
                        .filters(f -> f
                                .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("travel-service-cb")
                                        .setFallbackUri("forward:/fallback/travel-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://travel-service"))

                // Subscription endpoints (all protected)
                .route("subscription-service-protected", r -> r
                        .path("/api/v1/subscriptions/**")
                        .filters(f -> f
                                .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("travel-service-cb")
                                        .setFallbackUri("forward:/fallback/travel-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://travel-service"))

                // Recommendation endpoints (all protected)
                .route("recommendation-service-protected", r -> r
                        .path("/api/v1/recommendations/**")
                        .filters(f -> f
                                .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("travel-service-cb")
                                        .setFallbackUri("forward:/fallback/travel-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://travel-service"))

                // ========================================
                // PAYMENT SERVICE ROUTES
                // ========================================

                // Payment webhooks (public - verified by signature)
                .route("payment-webhooks-stripe", r -> r
                        .path("/api/v1/webhooks/stripe")
                        .and()
                        .method("POST")
                        .filters(f -> f
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("payment-service-cb")
                                        .setFallbackUri("forward:/fallback/payment-service"))
                                .retry(retryConfig -> retryConfig.setRetries(1)))
                        .uri("lb://payment-service"))

                .route("payment-webhooks-paypal", r -> r
                        .path("/api/v1/webhooks/paypal")
                        .and()
                        .method("POST")
                        .filters(f -> f
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("payment-service-cb")
                                        .setFallbackUri("forward:/fallback/payment-service"))
                                .retry(retryConfig -> retryConfig.setRetries(1)))
                        .uri("lb://payment-service"))

                // Protected payment endpoints
                .route("payment-service-protected", r -> r
                        .path("/api/v1/payments/**")
                        .filters(f -> f
                                .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("payment-service-cb")
                                        .setFallbackUri("forward:/fallback/payment-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://payment-service"))

                // ========================================
                // FEEDBACK SERVICE ROUTES
                // ========================================

                // Public feedback viewing endpoints
                .route("feedback-service-public-view", r -> r
                        .path("/api/v1/feedbacks/travel/{travelId}",
                              "/api/v1/feedbacks/travel/{travelId}/average-rating",
                              "/api/v1/feedbacks/travel/{travelId}/count")
                        .and()
                        .method("GET")
                        .filters(f -> f
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .requestRateLimiter(c -> c
                                        .setRateLimiter(redisRateLimiter())
                                        .setKeyResolver(hostAddressKeyResolver()))
                                .circuitBreaker(c -> c
                                        .setName("feedback-service-cb")
                                        .setFallbackUri("forward:/fallback/feedback-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://feedback-service"))

                // Protected feedback endpoints
                .route("feedback-service-protected", r -> r
                        .path("/api/v1/feedbacks/**")
                        .filters(f -> f
                                .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("feedback-service-cb")
                                        .setFallbackUri("forward:/fallback/feedback-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://feedback-service"))

                // Protected report endpoints
                .route("report-service-protected", r -> r
                        .path("/api/v1/reports/**")
                        .filters(f -> f
                                .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("feedback-service-cb")
                                        .setFallbackUri("forward:/fallback/feedback-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://feedback-service"))

                // Protected dashboard endpoints
                .route("dashboard-service-protected", r -> r
                        .path("/api/v1/dashboard/**")
                        .filters(f -> f
                                .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .circuitBreaker(c -> c
                                        .setName("feedback-service-cb")
                                        .setFallbackUri("forward:/fallback/feedback-service"))
                                .retry(retryConfig -> retryConfig.setRetries(3)))
                        .uri("lb://feedback-service"))

                // ========================================
                // INFRASTRUCTURE ROUTES
                // ========================================

                // Actuator endpoints
                .route("actuator-routes", r -> r
                        .path("/actuator/**")
                        .filters(f -> f
                                .filter(loggingFilter.apply(new LoggingFilter.Config()))
                                .stripPrefix(0))
                        .uri("lb://gateway-service"))

                // ========================================
                // SWAGGER/OPENAPI DOCUMENTATION
                // ========================================

                .route("user-service-docs", r -> r
                        .path("/user-service/v3/api-docs")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://user-service"))

                .route("travel-service-docs", r -> r
                        .path("/travel-service/v3/api-docs")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://travel-service"))

                .route("payment-service-docs", r -> r
                        .path("/payment-service/v3/api-docs")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://payment-service"))

                .route("feedback-service-docs", r -> r
                        .path("/feedback-service/v3/api-docs")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://feedback-service"))

                .build();
    }

    /**
     * Redis rate limiter configuration
     * Default: 10 requests per second, burst capacity of 20
     */
    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(10, 20, 1);
    }

    /**
     * Key resolver based on host address (IP)
     * Used for public endpoints rate limiting
     */
    @Bean("hostAddressKeyResolver")
    @Primary
    public KeyResolver hostAddressKeyResolver() {
        return exchange -> Mono.just(
                exchange.getRequest().getRemoteAddress() != null ?
                        exchange.getRequest().getRemoteAddress().getAddress().getHostAddress() :
                        "unknown"
        );
    }

    /**
     * Key resolver based on user ID from JWT token
     * Used for authenticated endpoints rate limiting
     */
    @Bean("userKeyResolver")
    public KeyResolver userKeyResolver() {
        return exchange -> Mono.just(
                exchange.getRequest().getHeaders().getFirst("X-User-Id") != null ?
                        Objects.requireNonNull(exchange.getRequest().getHeaders().getFirst("X-User-Id")) :
                        "anonymous"
        );
    }
}
