package com.travelms.feedback.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT Authentication Filter for Movie Service
 * Validates JWT tokens from User Service
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Autowired
    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;
        final String userId;
        final String role;

        // Check if Authorization header is present and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract JWT token from header
        jwt = authHeader.substring(7);

        try {
            username = jwtService.extractUsername(jwt);
            userId = jwtService.extractUserId(jwt);
            role = jwtService.extractUserRole(jwt);

            // If username is found and no authentication is set in SecurityContext
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Validate token format
                if (jwtService.isTokenFormatValid(jwt)) {
                    // Create authentication token with user info
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            List.of(authority)
                    );

                    // Add user ID to authentication details
                    authToken.setDetails(new UserAuthenticationDetails(request, userId, role));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Invalid token - continue without authentication
            logger.debug("JWT token validation failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Custom authentication details to store user ID and role
     */
    public static class UserAuthenticationDetails {
        private final String remoteAddress;
        private final String sessionId;
        private final String userId;
        private final String role;

        public UserAuthenticationDetails(HttpServletRequest request, String userId, String role) {
            this.remoteAddress = request.getRemoteAddr();
            this.sessionId = request.getRequestedSessionId();
            this.userId = userId;
            this.role = role;
        }

        public String getRemoteAddress() {
            return remoteAddress;
        }

        public String getSessionId() {
            return sessionId;
        }

        public String getUserId() {
            return userId;
        }

        public String getRole() {
            return role;
        }

        @Override
        public String toString() {
            return String.format("UserAuthenticationDetails{remoteAddress='%s', userId='%s', role='%s'}",
                remoteAddress, userId, role);
        }
    }
}