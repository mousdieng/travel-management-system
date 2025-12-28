package com.travelms.user.dto;

import lombok.*;

/**
 * DTO for authentication response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(of = {"tokenType", "expiresIn", "user"})
public class AuthenticationResponse {

    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private long expiresIn;
    private UserResponse user;

    @Builder.Default
    private boolean requiresTwoFactor = false;

    private String twoFactorQrCode;
}