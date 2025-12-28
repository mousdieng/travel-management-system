package com.travelms.user.service;

import com.travelms.user.dto.*;
import com.travelms.user.event.UserDeletedEvent;
import com.travelms.user.exception.UserAlreadyExistsException;
import com.travelms.user.exception.UserNotFoundException;
import com.travelms.user.exception.InvalidPasswordException;
import com.travelms.user.model.entity.User;
import com.travelms.user.model.enums.Role;
import com.travelms.user.repository.UserRepository;
import com.travelms.user.security.JwtService;
import com.travelms.user.security.TwoFactorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service layer for user operations
 */
@Service
@Transactional
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TwoFactorService twoFactorService;
    private final AuthenticationManager authenticationManager;
    private final FileStorageService fileStorageService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.user-deleted}")
    private String userDeletedTopic;

    @Autowired
    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TwoFactorService twoFactorService,
            AuthenticationManager authenticationManager,
            FileStorageService fileStorageService,
            KafkaTemplate<String, Object> kafkaTemplate
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.twoFactorService = twoFactorService;
        this.authenticationManager = authenticationManager;
        this.fileStorageService = fileStorageService;
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Register a new user
     */
    public AuthenticationResponse registerUser(UserRegistrationRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        // Use the provided role (validated to be only TRAVELER or TRAVEL_MANAGER)
        user.setRole(request.getRole() != null ? request.getRole() : Role.TRAVELER);
        user.setEnabled(true);

        // Save user
        User savedUser = userRepository.save(user);

        // Generate JWT tokens
        String accessToken = jwtService.generateTokenWithUserInfo(savedUser, savedUser.getId().toString(), savedUser.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        // Create response
        AuthenticationResponse response = new AuthenticationResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(jwtService.getExpirationTime());
        response.setUser(convertToUserResponse(savedUser));

        return response;
    }

    /**
     * Admin: Create user with any role (including ADMIN)
     * Does not return authentication tokens since admin is creating the user
     */
    public UserResponse adminCreateUser(com.travelms.user.dto.AdminCreateUserRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        // Admin can set any role including ADMIN
        user.setRole(request.getRole());
        user.setEnabled(true);

        // Save user
        User savedUser = userRepository.save(user);

        log.info("Admin created new user: {} with role: {}", savedUser.getUsername(), savedUser.getRole());

        return convertToUserResponse(savedUser);
    }

    /**
     * Authenticate user login
     */
    public AuthenticationResponse authenticateUser(UserLoginRequest request) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsernameOrEmail(),
                            request.getPassword()
                    )
            );

            User user = (User) authentication.getPrincipal();

            // Check if 2FA is enabled
            if (user.isTwoFactorEnabled()) {
                if (request.getTwoFactorCode() == null || request.getTwoFactorCode().isEmpty()) {
                    AuthenticationResponse response = new AuthenticationResponse();
                    response.setRequiresTwoFactor(true);
                    response.setUser(convertToUserResponse(user));
                    return response;
                }

                // Verify 2FA code
                if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), request.getTwoFactorCode())) {
                    throw new InvalidPasswordException("Invalid 2FA code");
                }
            }

            // Update last login time using targeted query to avoid overwriting relationships
            userRepository.updateLastLogin(user.getId(), LocalDateTime.now());

            // Generate JWT tokens
            String accessToken = jwtService.generateTokenWithUserInfo(user, user.getId().toString(), user.getRole().name());
            String refreshToken = jwtService.generateRefreshToken(user);

            // Create response
            AuthenticationResponse response = new AuthenticationResponse();
            response.setAccessToken(accessToken);
            response.setRefreshToken(refreshToken);
            response.setExpiresIn(jwtService.getExpirationTime());
            response.setUser(convertToUserResponse(user));

            return response;

        } catch (AuthenticationException e) {
            throw new InvalidPasswordException("Invalid credentials");
        }
    }

    /**
     * Get user by ID
     */
    @Transactional(readOnly = true)
    public Optional<UserResponse> getUserById(Long userId) {
        return userRepository.findById(userId)
                .map(this::convertToUserResponse);
    }

    /**
     * Get user entity by ID (for internal use)
     */
    @Transactional(readOnly = true)
    public User getUserEntityById(Long userId) {
        return userRepository.findById(userId)
                .orElse(null);
    }

    /**
     * Get user by username
     */
    @Transactional(readOnly = true)
    public Optional<UserResponse> getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(this::convertToUserResponse);
    }

    /**
     * Update user information
     */
    public UserResponse updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        // Check username uniqueness if changed
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
            }
            user.setUsername(request.getUsername());
        }

        // Check email uniqueness if changed
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
            user.setEmailVerified(false); // Reset email verification
        }

        // Update other fields
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }

        user.updateTimestamp();
        User updatedUser = userRepository.save(user);
        return convertToUserResponse(updatedUser);
    }

    /**
     * Change user password
     */
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidPasswordException("Current password is incorrect");
        }

        // Verify password confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidPasswordException("New password and confirmation do not match");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.updateTimestamp();
        userRepository.save(user);
    }

    /**
     * Enable 2FA for user
     */
    public TwoFactorSetupResponse enableTwoFactor(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        if (user.isTwoFactorEnabled()) {
            throw new IllegalStateException("2FA is already enabled for this user");
        }

        // Generate secret and QR code
        String secret = twoFactorService.generateSecret();
        user.setTwoFactorSecret(secret);
        user.setTwoFactorEnabled(true);
        user.updateTimestamp();
        userRepository.save(user);

        String qrCode = twoFactorService.generateQrCodeImageUri(secret, user.getUsername());

        return new TwoFactorSetupResponse(qrCode, secret);
    }

    /**
     * Disable 2FA for user
     */
    public void disableTwoFactor(Long userId, String twoFactorCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        if (!user.isTwoFactorEnabled()) {
            throw new IllegalStateException("2FA is not enabled for this user");
        }

        // Verify 2FA code before disabling
        if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), twoFactorCode)) {
            throw new InvalidPasswordException("Invalid 2FA code");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        user.updateTimestamp();
        userRepository.save(user);
    }

    /**
     * Get all users with pagination
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(String searchTerm, Pageable pageable) {
        Page<User> users = userRepository.findUsersWithSearch(searchTerm, pageable);
        return users.map(this::convertToUserResponse);
    }

    /**
     * Search users
     */
    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String searchTerm, Long currentUserId) {
        List<User> users = userRepository.searchByUsername(searchTerm);
        users.addAll(userRepository.searchByFullName(searchTerm));
        return users.stream()
                .distinct()
                .filter(user -> !user.getId().equals(currentUserId))
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    /**
     * Delete user with cascading deletes across all microservices via Kafka events
     * This will publish a UserDeletedEvent that triggers cascade deletes in:
     * - travel-service: User's travels (and their subscriptions via JPA cascade) + subscriptions as traveler
     * - payment-service: User's payments and payment methods
     * - feedback-service: User's feedbacks and reports
     */
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        log.info("Starting cascading delete for user: {} ({})", userId, user.getUsername());

        // Delete the user from user-service first
        userRepository.delete(user);
        log.info("Deleted user from user-service: {}", userId);

        // Publish Kafka event to trigger cascade deletes in other services
        UserDeletedEvent event = UserDeletedEvent.builder()
                .userId(userId)
                .email(user.getEmail())
                .role(user.getRole().name())
                .deletedAt(LocalDateTime.now())
                .deletedBy(null) // TODO: Get from security context when available
                .build();

        kafkaTemplate.send(userDeletedTopic, userId.toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish UserDeletedEvent for userId: {}", userId, ex);
                    } else {
                        log.info("Successfully published UserDeletedEvent for userId: {} to topic: {}",
                                userId, userDeletedTopic);
                    }
                });

        log.info("Initiated cascading delete for user: {} via Kafka event", userId);
    }

    /**
     * Enable/disable user account
     */
    public UserResponse toggleUserStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        user.setEnabled(enabled);
        user.updateTimestamp();
        User updatedUser = userRepository.save(user);
        return convertToUserResponse(updatedUser);
    }

    /**
     * Get user statistics
     */
    @Transactional(readOnly = true)
    public UserResponse getUserWithStatistics(Long userId) {
        // Get user
        User user = userRepository.findUserForStatistics(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        // Convert to response
        UserResponse response = convertToUserResponse(user);

        // Get statistics separately
        Long totalRatings = userRepository.countUserRatings(userId);
        Double averageRating = userRepository.getAverageRating(userId);
        Long watchlistSize = userRepository.countWatchlistItems(userId);
        Long friendCount = userRepository.countFriends(userId);

        // Set statistics
        response.setTotalRatings(totalRatings != null ? totalRatings : 0L);
        response.setWatchlistSize(watchlistSize != null ? watchlistSize : 0L);
        response.setFriendCount(friendCount != null ? friendCount : 0L);
        response.setAverageRating(averageRating != null ? averageRating : 0.0);

        return response;
    }

    /**
     * Check if user exists
     */
    @Transactional(readOnly = true)
    public boolean userExists(Long userId) {
        return userRepository.existsById(userId);
    }

    /**
     * Check if username is available
     */
    @Transactional(readOnly = true)
    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }

    /**
     * Check if email is available
     */
    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }

    /**
     * Update user profile picture URL
     */
    public void updateUserProfilePictureUrl(Long userId, String profilePictureUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        user.setProfilePictureUrl(profilePictureUrl);
        user.updateTimestamp();
        userRepository.save(user);
    }

    /**
     * Count all users
     */
    public Long countAllUsers() {
        return userRepository.count();
    }

    /**
     * Count users by role
     */
    public Long countUsersByRole(String roleName) {
        return userRepository.countByRole(roleName);
    }

    /**
     * Convert User entity to UserResponse DTO
     * Generates fresh presigned URLs for profile pictures on-the-fly
     */
    private UserResponse convertToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setFullName(user.getFullName());
        response.setDateOfBirth(user.getDateOfBirth());

        // Return relative API path instead of direct MinIO URL
        // Frontend will fetch avatar via /api/v1/users/{userId}/avatar
        // This prevents direct MinIO access from browser
        String objectKey = user.getProfilePictureUrl();
        if (objectKey != null && !objectKey.isEmpty()) {
            response.setProfilePictureUrl("/api/v1/users/" + user.getId() + "/avatar");
        } else {
            response.setProfilePictureUrl(null);
        }

        response.setBio(user.getBio());
        response.setEnabled(user.isEnabled());
        response.setEmailVerified(user.isEmailVerified());
        response.setTwoFactorEnabled(user.isTwoFactorEnabled());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        response.setLastLoginAt(user.getLastLoginAt());
        response.setRole(user.getRole());
        return response;
    }
}