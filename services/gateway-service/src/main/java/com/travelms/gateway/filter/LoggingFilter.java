package com.travelms.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Logging filter for Gateway Service
 * Logs request and response information for monitoring and debugging
 */
@Component
public class LoggingFilter extends AbstractGatewayFilterFactory<LoggingFilter.Config> {

    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    public LoggingFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            ServerHttpResponse response = exchange.getResponse();

            long startTime = System.currentTimeMillis();
            String requestId = generateRequestId();

            // Log incoming request
            logger.info("[{}] [{}] Incoming Request: {} {} from {}",
                    requestId,
                    LocalDateTime.now().format(formatter),
                    request.getMethod(),
                    request.getPath(),
                    getClientIp(request));

            // Log request headers (excluding sensitive data)
            if (logger.isDebugEnabled()) {
                request.getHeaders().forEach((key, values) -> {
                    if (!isSensitiveHeader(key)) {
                        logger.debug("[{}] Request Header: {} = {}", requestId, key, values);
                    }
                });
            }

            return chain.filter(exchange).then(
                    Mono.fromRunnable(() -> {
                        long duration = System.currentTimeMillis() - startTime;

                        // Log response
                        logger.info("[{}] [{}] Response: {} {} - Status: {} - Duration: {}ms",
                                requestId,
                                LocalDateTime.now().format(formatter),
                                request.getMethod(),
                                request.getPath(),
                                response.getStatusCode(),
                                duration);

                        // Log response headers (excluding sensitive data)
                        if (logger.isDebugEnabled()) {
                            response.getHeaders().forEach((key, values) -> {
                                if (!isSensitiveHeader(key)) {
                                    logger.debug("[{}] Response Header: {} = {}", requestId, key, values);
                                }
                            });
                        }

                        // Log performance warning for slow requests
                        if (duration > 5000) { // 5 seconds
                            logger.warn("[{}] Slow request detected: {} {} took {}ms",
                                    requestId, request.getMethod(), request.getPath(), duration);
                        }
                    })
            );
        };
    }

    private String generateRequestId() {
        return "REQ-" + System.currentTimeMillis() + "-" +
               (int)(Math.random() * 1000);
    }

    private String getClientIp(ServerHttpRequest request) {
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddress() != null ?
                request.getRemoteAddress().getAddress().getHostAddress() :
                "unknown";
    }

    private boolean isSensitiveHeader(String headerName) {
        String lowerCaseName = headerName.toLowerCase();
        return lowerCaseName.contains("authorization") ||
               lowerCaseName.contains("cookie") ||
               lowerCaseName.contains("password") ||
               lowerCaseName.contains("token") ||
               lowerCaseName.contains("secret");
    }

    @Override
    public String name() {
        return "Logging";
    }

    public static class Config {
        // Configuration properties can be added here if needed
        private boolean logHeaders = false;
        private boolean logBody = false;

        public boolean isLogHeaders() {
            return logHeaders;
        }

        public void setLogHeaders(boolean logHeaders) {
            this.logHeaders = logHeaders;
        }

        public boolean isLogBody() {
            return logBody;
        }

        public void setLogBody(boolean logBody) {
            this.logBody = logBody;
        }
    }
}