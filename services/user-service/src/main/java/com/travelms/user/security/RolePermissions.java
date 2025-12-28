package com.travelms.user.security;

/**
 * Role Permissions Documentation
 * Based on instruction.txt requirements
 *
 * ADMIN:
 * - View top-ranking managers and travels
 * - View reports on income for the last months
 * - View number of organized travels
 * - Access detailed travel history list and feedbacks
 * - See list of managers ordered by performance score (feedbacks, income, metrics)
 * - Review reports filed by travelers against travels or managers
 * - Perform ALL actions available to TRAVEL_MANAGER and TRAVELER (full oversight)
 * - Add, edit, or delete any user, travel, payment method
 *
 * TRAVEL_MANAGER:
 * - Create and manage personal travel offerings
 * - View feedback specific to their organized travels
 * - Access dashboard with statistics (income, number of trips, number of travelers)
 * - Manage subscriber lists for each travel
 * - View subscriber profiles
 * - Unsubscribe travelers from their travels
 * - Have access to ALL functionalities available to TRAVELER
 *
 * TRAVELER:
 * - Search travels with Elasticsearch autocomplete
 * - Browse available travels
 * - Receive personalized travel suggestions (Neo4j based)
 * - Subscribe to travels (with 3-day cutoff before start date)
 * - Unsubscribe from travels (with 3-day cutoff before start date)
 * - Execute payments for subscriptions
 * - Provide feedback on participated travels
 * - View Travel Manager statistics, ratings, and reports
 * - Report Travel Managers or other travelers
 * - View personal statistics (participation, reports, cancellations, payment methods)
 */
public final class RolePermissions {

    private RolePermissions() {
        // Utility class - prevent instantiation
    }

    // Admin permissions
    public static final String ADMIN_VIEW_STATISTICS = "ADMIN_VIEW_STATISTICS";
    public static final String ADMIN_MANAGE_USERS = "ADMIN_MANAGE_USERS";
    public static final String ADMIN_MANAGE_TRAVELS = "ADMIN_MANAGE_TRAVELS";
    public static final String ADMIN_MANAGE_PAYMENTS = "ADMIN_MANAGE_PAYMENTS";
    public static final String ADMIN_VIEW_REPORTS = "ADMIN_VIEW_REPORTS";
    public static final String ADMIN_VIEW_FEEDBACKS = "ADMIN_VIEW_FEEDBACKS";

    // Travel Manager permissions
    public static final String MANAGER_CREATE_TRAVEL = "MANAGER_CREATE_TRAVEL";
    public static final String MANAGER_MANAGE_OWN_TRAVELS = "MANAGER_MANAGE_OWN_TRAVELS";
    public static final String MANAGER_VIEW_OWN_STATISTICS = "MANAGER_VIEW_OWN_STATISTICS";
    public static final String MANAGER_MANAGE_SUBSCRIBERS = "MANAGER_MANAGE_SUBSCRIBERS";
    public static final String MANAGER_VIEW_OWN_FEEDBACKS = "MANAGER_VIEW_OWN_FEEDBACKS";

    // Traveler permissions
    public static final String TRAVELER_SEARCH_TRAVELS = "TRAVELER_SEARCH_TRAVELS";
    public static final String TRAVELER_BROWSE_TRAVELS = "TRAVELER_BROWSE_TRAVELS";
    public static final String TRAVELER_SUBSCRIBE = "TRAVELER_SUBSCRIBE";
    public static final String TRAVELER_UNSUBSCRIBE = "TRAVELER_UNSUBSCRIBE";
    public static final String TRAVELER_MAKE_PAYMENT = "TRAVELER_MAKE_PAYMENT";
    public static final String TRAVELER_PROVIDE_FEEDBACK = "TRAVELER_PROVIDE_FEEDBACK";
    public static final String TRAVELER_VIEW_MANAGER_STATS = "TRAVELER_VIEW_MANAGER_STATS";
    public static final String TRAVELER_REPORT_USER = "TRAVELER_REPORT_USER";
    public static final String TRAVELER_VIEW_OWN_STATS = "TRAVELER_VIEW_OWN_STATS";
}
