package com.travelms.user.dto;

/**
 * Authentication data for API response wrapper
 */
public class AuthDataResponse {

    private UserResponse user;
    private String token;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private boolean requiresTwoFactor;
    private String twoFactorQrCode;

    // Constructors
    public AuthDataResponse() {}

    public AuthDataResponse(AuthenticationResponse authResponse) {
        this.user = authResponse.getUser();
        this.token = authResponse.getAccessToken();
        this.refreshToken = authResponse.getRefreshToken();
        this.tokenType = authResponse.getTokenType();
        this.expiresIn = authResponse.getExpiresIn();
        this.requiresTwoFactor = authResponse.isRequiresTwoFactor();
        this.twoFactorQrCode = authResponse.getTwoFactorQrCode();
    }

    // Getters and Setters
    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public boolean isRequiresTwoFactor() {
        return requiresTwoFactor;
    }

    public void setRequiresTwoFactor(boolean requiresTwoFactor) {
        this.requiresTwoFactor = requiresTwoFactor;
    }

    public String getTwoFactorQrCode() {
        return twoFactorQrCode;
    }

    public void setTwoFactorQrCode(String twoFactorQrCode) {
        this.twoFactorQrCode = twoFactorQrCode;
    }
}
