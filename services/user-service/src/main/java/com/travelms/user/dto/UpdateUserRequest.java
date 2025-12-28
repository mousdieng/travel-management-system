package com.travelms.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(min = 3, max = 50)
    private String username;

    @Email
    private String email;

    @Size(min = 2, max = 50)
    private String firstName;

    @Size(min = 2, max = 50)
    private String lastName;

    private String phoneNumber;

    @Size(max = 500)
    private String bio;

    private String address;

    private String city;

    private String country;

    private LocalDateTime dateOfBirth;

    private String profilePictureUrl;
}
