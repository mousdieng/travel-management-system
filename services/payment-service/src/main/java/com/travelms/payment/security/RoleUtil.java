package com.travelms.payment.security;

import com.travelms.payment.model.enums.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;

/**
 * Utility class for role-based authorization checks
 * Implements hierarchical role permissions as defined in instruction.txt:
 * - ADMIN can do everything (ADMIN + TRAVEL_MANAGER + TRAVELER permissions)
 * - TRAVEL_MANAGER can do MANAGER actions + TRAVELER actions
 * - TRAVELER can only do TRAVELER actions
 */
public final class RoleUtil {

    private RoleUtil() {
        // Utility class - prevent instantiation
    }

    /**
     * Check if the current user has the specified role
     */
    public static boolean hasRole(Role role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        return authorities.stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role.name()));
    }

    /**
     * Check if the current user is an ADMIN
     */
    public static boolean isAdmin() {
        return hasRole(Role.ADMIN);
    }

    /**
     * Check if the current user is a TRAVEL_MANAGER
     */
    public static boolean isManager() {
        return hasRole(Role.TRAVEL_MANAGER);
    }

    /**
     * Check if the current user is a TRAVELER
     */
    public static boolean isTraveler() {
        return hasRole(Role.TRAVELER);
    }

    /**
     * Check if user has ADMIN or MANAGER role
     * (ADMIN can do everything a MANAGER can do)
     */
    public static boolean isAdminOrManager() {
        return isAdmin() || isManager();
    }

    /**
     * Check if user has any role (ADMIN, MANAGER, or TRAVELER)
     * (ADMIN and MANAGER can do everything a TRAVELER can do)
     */
    public static boolean isAnyRole() {
        return isAdmin() || isManager() || isTraveler();
    }

    /**
     * Check if the current user can manage payments
     * Only ADMIN can manage payments (refunds, etc.)
     */
    public static boolean canManagePayments() {
        return isAdmin();
    }

    /**
     * Check if the current user can view all payment reports
     * Only ADMIN can view all payment reports
     */
    public static boolean canViewAllPayments() {
        return isAdmin();
    }

    /**
     * Get the current user's role
     */
    public static Role getCurrentUserRole() {
        if (isAdmin()) return Role.ADMIN;
        if (isManager()) return Role.TRAVEL_MANAGER;
        if (isTraveler()) return Role.TRAVELER;
        return null;
    }

    /**
     * Get the current username
     */
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getName();
    }

    /**
     * Get the current user ID from authentication
     * Assumes the user ID is stored in the authentication name
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
