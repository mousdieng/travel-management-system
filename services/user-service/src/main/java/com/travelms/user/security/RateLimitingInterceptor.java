package com.travelms.user.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting interceptor to prevent API abuse
 * Implements a sliding window rate limiter per IP address
 */
@Slf4j
@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    // Configuration
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 5;
    private static final long WINDOW_SIZE_MS = 60_000; // 1 minute

    // Store request counts per IP
    private final Map<String, RateLimitInfo> requestCounts = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIP(request);
        String requestPath = request.getRequestURI();

        // Determine rate limit based on endpoint
        int maxRequests = isAuthEndpoint(requestPath) ? MAX_AUTH_REQUESTS_PER_MINUTE : MAX_REQUESTS_PER_MINUTE;

        RateLimitInfo rateLimitInfo = requestCounts.computeIfAbsent(clientIp, k -> new RateLimitInfo());

        synchronized (rateLimitInfo) {
            long currentTime = System.currentTimeMillis();

            // Reset if window has passed
            if (currentTime - rateLimitInfo.windowStart > WINDOW_SIZE_MS) {
                rateLimitInfo.reset(currentTime);
            }

            // Check if limit exceeded
            if (rateLimitInfo.requestCount.get() >= maxRequests) {
                log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, requestPath);

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write(String.format(
                    "{\"error\": \"Too many requests\", \"message\": \"Rate limit exceeded. Please try again later.\", \"retryAfter\": %d}",
                    (WINDOW_SIZE_MS - (currentTime - rateLimitInfo.windowStart)) / 1000
                ));

                return false;
            }

            // Increment counter
            rateLimitInfo.requestCount.incrementAndGet();
        }

        return true;
    }

    /**
     * Get client IP address, considering proxies
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Check if endpoint is an authentication endpoint (stricter rate limiting)
     */
    private boolean isAuthEndpoint(String path) {
        return path.contains("/auth/") ||
               path.contains("/login") ||
               path.contains("/register") ||
               path.contains("/reset-password");
    }

    /**
     * Clean up expired entries periodically
     */
    public void cleanupExpiredEntries() {
        long currentTime = System.currentTimeMillis();
        requestCounts.entrySet().removeIf(entry ->
            currentTime - entry.getValue().windowStart > WINDOW_SIZE_MS * 2
        );
    }

    /**
     * Rate limit information for a client
     */
    private static class RateLimitInfo {
        private AtomicInteger requestCount = new AtomicInteger(0);
        private long windowStart = System.currentTimeMillis();

        public void reset(long newWindowStart) {
            this.requestCount.set(0);
            this.windowStart = newWindowStart;
        }
    }
}
