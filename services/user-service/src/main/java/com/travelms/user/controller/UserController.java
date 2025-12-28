package com.travelms.user.controller;

import com.travelms.user.dto.*;
import com.travelms.user.model.entity.User;
import com.travelms.user.service.FileStorageService;
import com.travelms.user.service.TravelerStatisticsService;
import com.travelms.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * REST controller for user management operations
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "User profile and account management operations")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final TravelerStatisticsService travelerStatisticsService;

    @Autowired
    public UserController(UserService userService, FileStorageService fileStorageService, TravelerStatisticsService travelerStatisticsService) {
        this.userService = userService;
        this.fileStorageService = fileStorageService;
        this.travelerStatisticsService = travelerStatisticsService;
    }

    @Operation(summary = "Get current user profile", description = "Retrieves the current authenticated user's profile from JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        UserResponse userWithStats = userService.getUserWithStatistics(currentUser.getId());
        return ResponseEntity.ok(userWithStats);
    }

    @Operation(summary = "Get current user profile (legacy)", description = "Retrieves the current authenticated user's profile")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        UserResponse userWithStats = userService.getUserWithStatistics(currentUser.getId());
        return ResponseEntity.ok(userWithStats);
    }

    @Operation(summary = "Update current user profile", description = "Updates the current authenticated user's profile from JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User profile updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid update data"),
            @ApiResponse(responseCode = "401", description = "User not authenticated"),
            @ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> updateCurrentUserProfile(
            @Valid @RequestBody UpdateUserRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        UserResponse updatedUser = userService.updateUser(currentUser.getId(), request);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Update current user profile (legacy)", description = "Updates the current authenticated user's profile information")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User profile updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid update data"),
            @ApiResponse(responseCode = "401", description = "User not authenticated"),
            @ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(@Valid @RequestBody UpdateUserRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        UserResponse updatedUser = userService.updateUser(currentUser.getId(), request);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Change current user password", description = "Changes the current authenticated user's password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password changed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid password data"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    @PostMapping("/me/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        userService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok("Password changed successfully");
    }

    @Operation(summary = "Enable 2FA", description = "Enables two-factor authentication for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "2FA enabled successfully, QR code and secret returned"),
            @ApiResponse(responseCode = "400", description = "2FA already enabled"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    @PostMapping("/me/enable-2fa")
    public ResponseEntity<TwoFactorSetupResponse> enableTwoFactor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        TwoFactorSetupResponse response = userService.enableTwoFactor(currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Disable 2FA", description = "Disables two-factor authentication for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "2FA disabled successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid 2FA code or 2FA not enabled"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    @PostMapping("/me/disable-2fa")
    public ResponseEntity<String> disableTwoFactor(@RequestParam String twoFactorCode) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        userService.disableTwoFactor(currentUser.getId(), twoFactorCode);
        return ResponseEntity.ok("2FA disabled successfully");
    }

    @Operation(summary = "Get user by ID", description = "Retrieves a user's public profile by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(@Parameter(description = "User ID") @PathVariable Long userId) {
        return userService.getUserById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Get user by username", description = "Retrieves a user's public profile by username")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/username/{username}")
    public ResponseEntity<UserResponse> getUserByUsername(@Parameter(description = "Username") @PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Search users", description = "Search users by username or name")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search completed successfully")
    })
    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@Parameter(description = "Search term") @RequestParam String q) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        List<UserResponse> users = userService.searchUsers(q, currentUser.getId());
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Get all users (Admin only)", description = "Retrieves all users with pagination - Admin access required")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @Parameter(description = "Search term") @RequestParam(required = false) String search,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<UserResponse> users = userService.getAllUsers(search, pageable);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Update user (Admin only)", description = "Updates any user's information - Admin access required")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid update data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse updatedUser = userService.updateUser(userId, request);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Toggle user status (Admin only)", description = "Enable or disable a user account - Admin access required")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User status updated successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleUserStatus(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Enable or disable user") @RequestParam boolean enabled) {
        UserResponse updatedUser = userService.toggleUserStatus(userId, enabled);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Delete user (Admin only)", description = "Deletes a user account - Admin access required")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "User deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@Parameter(description = "User ID") @PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Create user (Admin only)", description = "Create a new user with any role including ADMIN - Admin access required")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid user data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required"),
            @ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> adminCreateUser(
            @Valid @RequestBody com.travelms.user.dto.AdminCreateUserRequest request) {
        log.info("Admin creating new user: {}", request.getUsername());
        UserResponse createdUser = userService.adminCreateUser(request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(createdUser);
    }

    @Operation(summary = "Check if user exists", description = "Checks if a user exists by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User existence checked")
    })
    @GetMapping("/{userId}/exists")
    public ResponseEntity<Boolean> userExists(@Parameter(description = "User ID") @PathVariable Long userId) {
        boolean exists = userService.userExists(userId);
        return ResponseEntity.ok(exists);
    }

    @Operation(summary = "Get user with statistics", description = "Retrieves a user's profile with detailed statistics")
    @GetMapping("/{userId}/stats")
    public ResponseEntity<UserResponse> getUserWithStatistics(@Parameter(description = "User ID") @PathVariable Long userId) {
        UserResponse userWithStats = userService.getUserWithStatistics(userId);
        return ResponseEntity.ok(userWithStats);
    }

    @Operation(summary = "Upload profile picture", description = "Uploads a profile picture for the current authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile picture uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid file"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    @PostMapping("/me/upload-avatar")
    public ResponseEntity<Map<String, String>> uploadProfilePicture(
            @Parameter(description = "Profile picture file") @RequestParam("file") MultipartFile file) {

        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        // Upload file - returns object key (e.g., "avatars/abc123.png")
        String objectKey = fileStorageService.uploadFile(file, "avatars");

        // Update user with object key (NOT presigned URL)
        userService.updateUserProfilePictureUrl(currentUser.getId(), objectKey);

        // Return a relative path instead of presigned URL
        // Frontend will use /api/v1/users/{userId}/avatar to fetch it
        String avatarPath = "/api/v1/users/" + currentUser.getId() + "/avatar";

        return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "Profile picture uploaded successfully",
                "profilePictureUrl", avatarPath
        ));
    }

    @Operation(summary = "Get user avatar", description = "Retrieves a user's profile picture")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avatar retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Avatar not found")
    })
    @GetMapping("/{userId}/avatar")
    public ResponseEntity<byte[]> getUserAvatar(@Parameter(description = "User ID") @PathVariable Long userId) {
        // Get user
        User user = userService.getUserEntityById(userId);
        if (user == null || user.getProfilePictureUrl() == null || user.getProfilePictureUrl().isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            // Get presigned URL from MinIO using internal URL (for server-side access)
            String presignedUrl = fileStorageService.getInternalFileUrl(user.getProfilePictureUrl());
            if (presignedUrl == null) {
                return ResponseEntity.notFound().build();
            }

            // Fetch the image data from MinIO using internal network
            java.net.URL url = new java.net.URL(presignedUrl);
            java.io.InputStream inputStream = url.openStream();
            byte[] imageBytes = inputStream.readAllBytes();
            inputStream.close();

            // Determine content type from the file extension
            String contentType = "image/jpeg"; // default
            String objectKey = user.getProfilePictureUrl();
            if (objectKey.endsWith(".png")) {
                contentType = "image/png";
            } else if (objectKey.endsWith(".gif")) {
                contentType = "image/gif";
            } else if (objectKey.endsWith(".webp")) {
                contentType = "image/webp";
            }

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "public, max-age=86400") // Cache for 1 day
                    .body(imageBytes);

        } catch (Exception e) {
            log.error("Error fetching avatar for user {}", userId, e);
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get traveler statistics", description = "Retrieves comprehensive statistics for the current traveler")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated"),
            @ApiResponse(responseCode = "403", description = "Access denied - Not a traveler")
    })
    @GetMapping("/me/statistics")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TravelerStatisticsDTO> getMyStatistics() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        TravelerStatisticsDTO stats = travelerStatisticsService.getTravelerStatistics(currentUser.getId());
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Get traveler statistics by ID", description = "Retrieves statistics for a specific traveler (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "User not authenticated"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin only"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{userId}/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TravelerStatisticsDTO> getUserStatistics(@PathVariable Long userId) {
        TravelerStatisticsDTO stats = travelerStatisticsService.getTravelerStatistics(userId);
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Get user statistics", description = "Retrieves overall user statistics for admin dashboard")
    @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getUserStats() {
        Long totalUsers = userService.countAllUsers();
        Long totalManagers = userService.countUsersByRole("TRAVEL_MANAGER");
        Long totalTravelers = userService.countUsersByRole("TRAVELER");

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalManagers", totalManagers,
                "totalTravelers", totalTravelers
        ));
    }
}