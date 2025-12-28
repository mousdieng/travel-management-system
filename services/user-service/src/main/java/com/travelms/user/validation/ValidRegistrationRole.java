package com.travelms.user.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Validation annotation for registration role
 * Only allows TRAVELER and TRAVEL_MANAGER roles during registration
 * ADMIN role cannot be selected and is created by the system only
 */
@Documented
@Constraint(validatedBy = RegistrationRoleValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidRegistrationRole {

    String message() default "Invalid role. Only TRAVELER and TRAVEL_MANAGER roles are allowed during registration";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
