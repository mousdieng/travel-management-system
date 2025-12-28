package com.travelms.travel.controller;

import com.travelms.travel.dto.TravelDTO;
import com.travelms.travel.security.JwtAuthenticationFilter;
import com.travelms.travel.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "Travel Recommendations", description = "APIs for personalized travel recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * Extract user ID from SecurityContext
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getDetails() instanceof JwtAuthenticationFilter.UserAuthenticationDetails) {
            JwtAuthenticationFilter.UserAuthenticationDetails details =
                (JwtAuthenticationFilter.UserAuthenticationDetails) authentication.getDetails();
            return Long.parseLong(details.getUserId());
        }
        throw new RuntimeException("User not authenticated or user ID not found");
    }

    @GetMapping("/personalized")
    @Operation(summary = "Get personalized travel recommendations")
    public ResponseEntity<List<TravelDTO>> getPersonalizedRecommendations() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(userId));
    }
}
