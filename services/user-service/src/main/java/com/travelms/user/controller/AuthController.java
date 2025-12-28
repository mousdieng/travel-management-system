package com.travelms.user.controller;

import com.travelms.user.dto.*;
import com.travelms.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication operations (login, registration)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "User authentication and registration operations")
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Register a new user", description = "Creates a new user account with the provided information")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User registered successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid registration data"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDataResponse>> register(@Valid @RequestBody UserRegistrationRequest request) {
        log.info("Registration request received for username: {}", request.getUsername());

        try {
            AuthenticationResponse authResponse = userService.registerUser(request);
            AuthDataResponse data = new AuthDataResponse(authResponse);

            ApiResponse<AuthDataResponse> response = ApiResponse.success(
                "User registered successfully",
                data
            );

            log.info("User registered successfully: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Registration failed for username: {}", request.getUsername(), e);
            throw e;
        }
    }

    @Operation(summary = "Login user", description = "Authenticates a user and returns JWT tokens")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid login data")
    })
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDataResponse>> login(@Valid @RequestBody UserLoginRequest request) {
        log.info("Login request received for: {}", request.getUsernameOrEmail());

        try {
            AuthenticationResponse authResponse = userService.authenticateUser(request);

            // If 2FA is required, return special response
            if (authResponse.isRequiresTwoFactor()) {
                ApiResponse<AuthDataResponse> response = ApiResponse.success(
                    "2FA required",
                    new AuthDataResponse(authResponse)
                );
                return ResponseEntity.ok(response);
            }

            AuthDataResponse data = new AuthDataResponse(authResponse);
            ApiResponse<AuthDataResponse> response = ApiResponse.success(
                "Login successful",
                data
            );

            log.info("User logged in successfully: {}", request.getUsernameOrEmail());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Login failed for: {}", request.getUsernameOrEmail(), e);
            throw e;
        }
    }

    @Operation(summary = "Check username availability", description = "Checks if a username is available for registration")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Availability checked")
    })
    @GetMapping("/check-username")
    public ResponseEntity<ApiResponse<Boolean>> checkUsernameAvailability(@RequestParam String username) {
        boolean available = userService.isUsernameAvailable(username);
        ApiResponse<Boolean> response = ApiResponse.success(
            available ? "Username is available" : "Username is taken",
            available
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Check email availability", description = "Checks if an email is available for registration")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Availability checked")
    })
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailAvailability(@RequestParam String email) {
        boolean available = userService.isEmailAvailable(email);
        ApiResponse<Boolean> response = ApiResponse.success(
            available ? "Email is available" : "Email is taken",
            available
        );
        return ResponseEntity.ok(response);
    }
}
