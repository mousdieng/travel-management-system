package com.travelms.user.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Security audit logger for tracking security-related events
 * All security events are logged with structured information for monitoring and alerting
 */
@Slf4j
@Component
public class SecurityAuditLogger {

    private static final String SECURITY_MARKER = "[SECURITY_AUDIT]";

    /**
     * Log successful authentication
     */
    public void logSuccessfulAuth(String username, String ipAddress, String userAgent) {
        log.info("{} Successful authentication - User: {}, IP: {}, UserAgent: {}",
                SECURITY_MARKER, username, ipAddress, userAgent);
    }

    /**
     * Log failed authentication attempt
     */
    public void logFailedAuth(String username, String ipAddress, String userAgent, String reason) {
        log.warn("{} Failed authentication - User: {}, IP: {}, UserAgent: {}, Reason: {}",
                SECURITY_MARKER, username, ipAddress, userAgent, reason);
    }

    /**
     * Log account lockout
     */
    public void logAccountLockout(String username, String ipAddress, String reason) {
        log.warn("{} Account locked - User: {}, IP: {}, Reason: {}",
                SECURITY_MARKER, username, ipAddress, reason);
    }

    /**
     * Log password change
     */
    public void logPasswordChange(String username, String ipAddress, boolean success) {
        if (success) {
            log.info("{} Password changed - User: {}, IP: {}",
                    SECURITY_MARKER, username, ipAddress);
        } else {
            log.warn("{} Password change failed - User: {}, IP: {}",
                    SECURITY_MARKER, username, ipAddress);
        }
    }

    /**
     * Log 2FA enable/disable
     */
    public void log2FAChange(String username, boolean enabled, String ipAddress) {
        log.info("{} 2FA {} - User: {}, IP: {}",
                SECURITY_MARKER, enabled ? "enabled" : "disabled", username, ipAddress);
    }

    /**
     * Log suspicious activity
     */
    public void logSuspiciousActivity(String username, String ipAddress, String activityType, String details) {
        log.warn("{} Suspicious activity detected - Type: {}, User: {}, IP: {}, Details: {}",
                SECURITY_MARKER, activityType, username, ipAddress, details);
    }

    /**
     * Log rate limit exceeded
     */
    public void logRateLimitExceeded(String ipAddress, String endpoint, int attempts) {
        log.warn("{} Rate limit exceeded - IP: {}, Endpoint: {}, Attempts: {}",
                SECURITY_MARKER, ipAddress, endpoint, attempts);
    }

    /**
     * Log permission denied
     */
    public void logAccessDenied(String username, String ipAddress, String resource, String action) {
        log.warn("{} Access denied - User: {}, IP: {}, Resource: {}, Action: {}",
                SECURITY_MARKER, username, ipAddress, resource, action);
    }

    /**
     * Log user registration
     */
    public void logUserRegistration(String username, String email, String ipAddress) {
        log.info("{} User registered - Username: {}, Email: {}, IP: {}",
                SECURITY_MARKER, username, email, ipAddress);
    }

    /**
     * Log token refresh
     */
    public void logTokenRefresh(String username, String ipAddress) {
        log.info("{} Token refreshed - User: {}, IP: {}",
                SECURITY_MARKER, username, ipAddress);
    }

    /**
     * Log session invalidation
     */
    public void logSessionInvalidation(String username, String ipAddress, String reason) {
        log.info("{} Session invalidated - User: {}, IP: {}, Reason: {}",
                SECURITY_MARKER, username, ipAddress, reason);
    }

    /**
     * Log privilege escalation attempt
     */
    public void logPrivilegeEscalationAttempt(String username, String ipAddress, String attemptedRole) {
        log.error("{} Privilege escalation attempt - User: {}, IP: {}, Attempted Role: {}",
                SECURITY_MARKER, username, ipAddress, attemptedRole);
    }

    /**
     * Log data export
     */
    public void logDataExport(String username, String ipAddress, String dataType) {
        log.info("{} Data exported - User: {}, IP: {}, Data Type: {}",
                SECURITY_MARKER, username, ipAddress, dataType);
    }
}
