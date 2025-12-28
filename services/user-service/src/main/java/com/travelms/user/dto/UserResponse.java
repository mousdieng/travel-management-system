package com.travelms.user.dto;

import com.travelms.user.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for user data in API responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private LocalDateTime dateOfBirth;
    private String profilePictureUrl;
    private String phoneNumber;
    private String profileImage;
    private String bio;
    private String address;
    private String city;
    private String country;
    private Role role;
    private Boolean enabled;
    private Boolean emailVerified;
    private Boolean twoFactorEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;

    // Statistics fields (optional)
    private Long totalRatings;
    private Double averageRating;
    private Long watchlistSize;
    private Long friendCount;
}
