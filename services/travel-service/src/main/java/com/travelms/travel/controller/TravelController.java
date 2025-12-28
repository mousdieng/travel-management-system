package com.travelms.travel.controller;

import com.travelms.travel.dto.CreateTravelRequest;
import com.travelms.travel.dto.ManagerTravelStatsDTO;
import com.travelms.travel.dto.TravelDTO;
import com.travelms.travel.security.JwtAuthenticationFilter;
import com.travelms.travel.service.FileStorageService;
import com.travelms.travel.service.TravelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Travel Controller with role-based access control
 * - Public endpoints: Browse, search, view travels (all roles)
 * - ADMIN + TRAVEL_MANAGER: Create, update, delete travels
 * - ADMIN: Full access to all travels
 * - TRAVEL_MANAGER: Can only manage their own travels
 */
@RestController
@RequestMapping("/api/v1/travels")
@RequiredArgsConstructor
@Tag(name = "Travel Management", description = "APIs for managing travels")
@SecurityRequirement(name = "bearerAuth")
public class TravelController {

    private final TravelService travelService;
    private final FileStorageService fileStorageService;
    private final com.travelms.travel.service.ElasticsearchSearchService searchService;
    private final com.travelms.travel.service.RecommendationService recommendationService;

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

    /**
     * Extract username from SecurityContext
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            return authentication.getName();
        }
        throw new RuntimeException("User not authenticated");
    }

    @GetMapping
    @Operation(summary = "Get all travels")
    public ResponseEntity<List<TravelDTO>> getAllTravels() {
        return ResponseEntity.ok(travelService.getAllTravels());
    }

    @GetMapping("/available")
    @Operation(summary = "Get available travels")
    public ResponseEntity<List<TravelDTO>> getAvailableTravels() {
        return ResponseEntity.ok(travelService.getAvailableTravels());
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming travels")
    public ResponseEntity<List<TravelDTO>> getUpcomingTravels() {
        return ResponseEntity.ok(travelService.getUpcomingTravels());
    }

    @GetMapping("/top-rated")
    @Operation(summary = "Get top-rated travels")
    public ResponseEntity<List<TravelDTO>> getTopRatedTravels(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(travelService.getTopRatedTravels(limit));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get travel by ID")
    public ResponseEntity<TravelDTO> getTravelById(@PathVariable Long id) {
        return ResponseEntity.ok(travelService.getTravelDTOById(id));
    }

    @GetMapping("/search")
    @Operation(summary = "Search travels by keyword")
    public ResponseEntity<List<TravelDTO>> searchTravels(@RequestParam String keyword) {
        return ResponseEntity.ok(travelService.searchTravels(keyword));
    }

    @GetMapping("/autocomplete")
    @Operation(summary = "Autocomplete travel search")
    public ResponseEntity<List<TravelDTO>> autocomplete(@RequestParam String query) {
        return ResponseEntity.ok(travelService.autocomplete(query));
    }

    @GetMapping("/my-travels")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my travels (authenticated manager)")
    public ResponseEntity<List<TravelDTO>> getMyTravels() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(travelService.getManagerTravels(userId));
    }

    @GetMapping("/manager/{managerId}")
    @Operation(summary = "Get travels by manager ID")
    public ResponseEntity<List<TravelDTO>> getManagerTravels(@PathVariable Long managerId) {
        return ResponseEntity.ok(travelService.getManagerTravels(managerId));
    }

    @GetMapping("/manager/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current manager's travel statistics")
    public ResponseEntity<ManagerTravelStatsDTO> getCurrentManagerStats() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(travelService.getManagerStats(userId));
    }

    @GetMapping("/manager/{managerId}/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get manager travel statistics by ID (Manager themselves or ADMIN)")
    public ResponseEntity<ManagerTravelStatsDTO> getManagerStats(@PathVariable Long managerId) {
        return ResponseEntity.ok(travelService.getManagerStats(managerId));
    }

    @GetMapping("/{id}/similar")
    @Operation(summary = "Get similar travels based on category, destination, and price")
    public ResponseEntity<List<TravelDTO>> getSimilarTravels(
            @PathVariable Long id,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(travelService.getSimilarTravels(id, limit));
    }

    @GetMapping("/trending")
    @Operation(summary = "Get trending travels (most subscribed in last 30 days)")
    public ResponseEntity<List<TravelDTO>> getTrendingTravels(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(travelService.getTrendingTravels(limit));
    }

    @GetMapping("/{id}/suggestions")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get post-subscription travel suggestions (similar, trending, personalized)")
    public ResponseEntity<com.travelms.travel.dto.TravelSuggestionsDTO> getTravelSuggestions(@PathVariable Long id) {
        Long userId = getCurrentUserId();

        com.travelms.travel.dto.TravelSuggestionsDTO suggestions = com.travelms.travel.dto.TravelSuggestionsDTO.builder()
            .similar(travelService.getSimilarTravels(id, 6))
            .trending(travelService.getTrendingTravels(6))
            .personalized(recommendationService.getPersonalizedRecommendationsWithReasons(userId, 6))
            .build();

        return ResponseEntity.ok(suggestions);
    }

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
    @Operation(summary = "Create a new travel with cover image (ADMIN or TRAVEL_MANAGER only)")
    public ResponseEntity<TravelDTO> createTravel(
            @RequestPart("cover") MultipartFile coverImage,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("destination") String destination,
            @RequestParam(value = "country", required = false) String country,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam("price") BigDecimal price,
            @RequestParam("maxParticipants") Integer maxParticipants,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "itinerary", required = false) String itinerary,
            @RequestParam(value = "highlights", required = false) List<String> highlights) {

        try {
            Long userId = getCurrentUserId();
            String userName = getCurrentUsername();

            // Upload cover image first
            String coverImageKey = fileStorageService.uploadFile(coverImage, "travels");

            // Build request with cover image
            CreateTravelRequest request = CreateTravelRequest.builder()
                    .title(title)
                    .description(description)
                    .destination(destination)
                    .country(country)
                    .state(state)
                    .city(city)
                    .startDate(LocalDateTime.parse(startDate))
                    .endDate(LocalDateTime.parse(endDate))
                    .price(price)
                    .maxParticipants(maxParticipants)
                    .category(category)
                    .itinerary(itinerary)
                    .highlights(highlights)
                    .images(List.of(coverImageKey)) // Cover image as first image
                    .build();

            TravelDTO travel = travelService.createTravel(request, userId, userName);
            return new ResponseEntity<>(travel, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
    @Operation(summary = "Update a travel (ADMIN or TRAVEL_MANAGER - managers can only update their own travels)")
    public ResponseEntity<TravelDTO> updateTravel(
            @PathVariable Long id,
            @Valid @RequestBody CreateTravelRequest request) {
        Long userId = getCurrentUserId();
        TravelDTO travel = travelService.updateTravel(id, request, userId);
        return ResponseEntity.ok(travel);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
    @Operation(summary = "Delete a travel (ADMIN or TRAVEL_MANAGER - managers can only delete their own travels)")
    public ResponseEntity<Void> deleteTravel(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        travelService.deleteTravel(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Cascade delete endpoint called by user-service when a manager is deleted
     * Deletes all travels created by the manager (subscriptions cascade via JPA)
     */
    @DeleteMapping("/manager/{managerId}/cascade-delete")
    @Operation(summary = "Cascade delete all travels by manager (Internal service call)", hidden = true)
    public ResponseEntity<Void> cascadeDeleteManagerTravels(@PathVariable Long managerId) {
        travelService.deleteAllTravelsByManager(managerId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/rating")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update travel rating (ADMIN only - internal use)")
    public ResponseEntity<Void> updateRating(
            @PathVariable Long id,
            @RequestParam Double averageRating,
            @RequestParam Integer totalReviews) {
        travelService.updateRating(id, averageRating, totalReviews);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload-image")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
    @Operation(summary = "Upload travel image (ADMIN or TRAVEL_MANAGER only)")
    public ResponseEntity<Map<String, String>> uploadTravelImage(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            // Upload file and get object key
            String objectKey = fileStorageService.uploadFile(file, "travels");

            // Return object key (not a presigned URL)
            return ResponseEntity.ok(Map.of(
                    "message", "Image uploaded successfully",
                    "imageKey", objectKey
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete-image")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
    @Operation(summary = "Delete travel image (ADMIN or TRAVEL_MANAGER only)")
    public ResponseEntity<Map<String, String>> deleteTravelImage(@RequestParam("imageKey") String imageKey) {
        try {
            fileStorageService.deleteFile(imageKey);
            return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete image: " + e.getMessage()));
        }
    }

    @PostMapping("/validate-itinerary")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRAVEL_MANAGER')")
    @Operation(summary = "Validate travel itinerary (ADMIN or TRAVEL_MANAGER only)")
    public ResponseEntity<?> validateItinerary(@Valid @RequestBody com.travelms.travel.dto.ValidateItineraryRequest request) {
        try {
            com.travelms.travel.dto.RouteInfoDTO routeInfo = travelService.validateItinerary(request.getStops());
            return ResponseEntity.ok(routeInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to validate itinerary: " + e.getMessage()));
        }
    }

    /**
     * Get all available travel categories
     * Public endpoint - no authentication required
     */
    @GetMapping("/categories")
    @Operation(summary = "Get all available travel categories (Public)")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = List.of(
                "Adventure",
                "Beach & Relaxation",
                "City Break",
                "Cultural & Heritage",
                "Cruise",
                "Eco-Tourism",
                "Family Vacation",
                "Food & Wine",
                "Honeymoon & Romance",
                "Luxury Travel",
                "Mountain & Hiking",
                "Safari & Wildlife",
                "Ski & Snow",
                "Backpacking",
                "Business Travel",
                "Road Trip",
                "Wellness & Spa",
                "Photography Tour",
                "Sports & Activities",
                "Music & Festival"
        );
        return ResponseEntity.ok(categories);
    }

    // ========== Elasticsearch Search Endpoints ==========

    /**
     * Advanced search using Elasticsearch
     * Searches across title, description, destination, country, city, and category
     */
    @GetMapping("/search/advanced")
    @Operation(summary = "Advanced search using Elasticsearch (searches all travel fields)")
    public ResponseEntity<List<com.travelms.travel.model.document.TravelDocument>> searchTravelsAdvanced(
            @RequestParam String query,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(searchService.searchTravels(query, limit));
    }

    /**
     * Autocomplete suggestions for travel titles using Elasticsearch
     */
    @GetMapping("/search/autocomplete/titles")
    @Operation(summary = "Autocomplete travel titles using Elasticsearch")
    public ResponseEntity<List<String>> autocompleteTitles(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(searchService.autocompleteTitles(query, limit));
    }

    /**
     * Autocomplete suggestions across all fields using Elasticsearch
     */
    @GetMapping("/search/autocomplete/all")
    @Operation(summary = "Autocomplete suggestions across all travel fields")
    public ResponseEntity<List<com.travelms.travel.service.ElasticsearchSearchService.AutocompleteSuggestion>> autocompleteAll(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(searchService.autocompleteAll(query, limit));
    }

    /**
     * Search by destination using Elasticsearch
     */
    @GetMapping("/search/destination/{destination}")
    @Operation(summary = "Search travels by destination")
    public ResponseEntity<List<com.travelms.travel.model.document.TravelDocument>> searchByDestination(
            @PathVariable String destination) {
        return ResponseEntity.ok(searchService.searchByDestination(destination));
    }

    /**
     * Search by category using Elasticsearch
     */
    @GetMapping("/search/category/{category}")
    @Operation(summary = "Search travels by category")
    public ResponseEntity<List<com.travelms.travel.model.document.TravelDocument>> searchByCategory(
            @PathVariable String category) {
        return ResponseEntity.ok(searchService.searchByCategory(category));
    }

    // ========== Personalized Recommendations Endpoints (Neo4j) ==========

    /**
     * Get personalized travel recommendations for current user
     * Uses Neo4j to analyze feedback and participation patterns
     * Considers category, destination, and rating preferences
     */
    @GetMapping("/recommendations")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get personalized travel recommendations (requires authentication)")
    public ResponseEntity<List<com.travelms.travel.service.RecommendationService.TravelRecommendationDTO>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendationsWithReasons(userId, limit));
    }

    /**
     * Sync travel to Elasticsearch (Admin only)
     */
    @PostMapping("/{id}/sync/elasticsearch")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Sync travel to Elasticsearch (ADMIN only)")
    public ResponseEntity<String> syncTravelToElasticsearch(@PathVariable Long id) {
        searchService.syncTravelToElasticsearch(id);
        return ResponseEntity.ok("Travel synced to Elasticsearch successfully");
    }

    /**
     * Sync all travels to Elasticsearch (Admin only)
     */
    @PostMapping("/sync/elasticsearch/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Sync all travels to Elasticsearch (ADMIN only)")
    public ResponseEntity<String> syncAllTravelsToElasticsearch() {
        searchService.syncAllTravels();
        return ResponseEntity.ok("All travels synced to Elasticsearch successfully");
    }

    /**
     * Get travel statistics for admin dashboard
     */
    @GetMapping("/stats")
    @Operation(summary = "Get travel statistics for admin dashboard")
    public ResponseEntity<java.util.Map<String, Long>> getTravelStats() {
        Long totalTravels = travelService.countAllTravels();
        Long activeTravels = travelService.countActiveTravels();
        Long completedTravels = travelService.countCompletedTravels();

        return ResponseEntity.ok(java.util.Map.of(
                "totalTravels", totalTravels,
                "activeTravels", activeTravels,
                "completedTravels", completedTravels
        ));
    }

    // ========== Admin-Specific Travel Management Endpoints ==========

    /**
     * Admin: Create travel on behalf of a specific manager
     */
    @PostMapping("/admin/create-for-manager")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Create travel on behalf of a manager",
               description = "Admin can create a travel for any manager by specifying managerId")
    public ResponseEntity<TravelDTO> adminCreateTravelForManager(
            @Valid @RequestBody CreateTravelRequest request,
            @RequestParam Long managerId,
            @RequestParam String managerName) {
        TravelDTO travel = travelService.adminCreateTravel(request, managerId, managerName);
        return new ResponseEntity<>(travel, HttpStatus.CREATED);
    }

    /**
     * Admin: Update any travel without ownership restriction
     */
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Update any travel",
               description = "Admin can update any travel without ownership restriction")
    public ResponseEntity<TravelDTO> adminUpdateTravel(
            @PathVariable Long id,
            @Valid @RequestBody CreateTravelRequest request) {
        TravelDTO travel = travelService.adminUpdateTravel(id, request);
        return ResponseEntity.ok(travel);
    }
}
