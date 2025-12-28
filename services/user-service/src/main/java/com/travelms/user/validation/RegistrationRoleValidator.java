package com.travelms.user.validation;

import com.travelms.user.model.enums.Role;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator for registration role
 * Ensures only TRAVELER and TRAVEL_MANAGER can be selected during registration
 */
public class RegistrationRoleValidator implements ConstraintValidator<ValidRegistrationRole, Role> {

    @Override
    public boolean isValid(Role role, ConstraintValidatorContext context) {
        if (role == null) {
            // Default to TRAVELER if no role is provided
            return true;
        }

        // Only TRAVELER and TRAVEL_MANAGER are allowed during registration
        // ADMIN cannot be selected and is created by the system only
        return role == Role.TRAVELER || role == Role.TRAVEL_MANAGER;
    }
}
