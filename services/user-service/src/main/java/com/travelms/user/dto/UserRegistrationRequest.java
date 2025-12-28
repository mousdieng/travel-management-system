package com.travelms.user.dto;

import com.travelms.user.model.enums.Role;
import com.travelms.user.validation.ValidPassword;
import com.travelms.user.validation.ValidRegistrationRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * DTO for user registration request
 * Role selection is required: TRAVELER or TRAVEL_MANAGER only
 * ADMIN role cannot be selected and is created by the system
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(of = {"username", "email", "role"})
public class UserRegistrationRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @ValidPassword
    private String password;

    @Size(max = 50, message = "First name cannot exceed 50 characters")
    private String firstName;

    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    private String lastName;

    @NotNull(message = "Role is required")
    @ValidRegistrationRole
    private Role role;

    public UserRegistrationRequest(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = Role.TRAVELER; // Default role
    }
}