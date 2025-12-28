package com.travelms.travel.security;

import com.travelms.travel.model.enums.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;

/**
 * Utility class for role-based authorization checks in Travel Service
 * Implements hierarchical role permissions:
 * - ADMIN can do everything
 * - TRAVEL_MANAGER can manage their own travels + all TRAVELER actions
 * - TRAVELER can browse, subscribe, and provide feedback
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

    public static boolean isAdmin() {
        return hasRole(Role.ADMIN);
    }

    public static boolean isManager() {
        return hasRole(Role.TRAVEL_MANAGER);
    }

    public static boolean isTraveler() {
        return hasRole(Role.TRAVELER);
    }

    public static boolean isAdminOrManager() {
        return isAdmin() || isManager();
    }

    public static boolean isAnyRole() {
        return isAdmin() || isManager() || isTraveler();
    }

    public static Role getCurrentUserRole() {
        if (isAdmin()) return Role.ADMIN;
        if (isManager()) return Role.TRAVEL_MANAGER;
        if (isTraveler()) return Role.TRAVELER;
        return null;
    }

    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getName();
    }
}
