package com.travelms.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * DTO for user login request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(of = {"usernameOrEmail"})
public class UserLoginRequest {

    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;

    private String twoFactorCode;
}