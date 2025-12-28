package com.travelms.user.config;

import com.travelms.user.model.entity.User;
import com.travelms.user.model.enums.Role;
import com.travelms.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Initializes the default Admin user at application startup
 * Admin credentials:
 * - Username: admin
 * - Email: admin@travelms.com
 * - Password: Admin@123 (should be changed after first login)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            // Check if admin user already exists
            if (!userRepository.existsByRole(Role.ADMIN)) {
                log.info("No admin user found. Creating default admin user...");

                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@travelms.com");
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                admin.setFirstName("System");
                admin.setLastName("Administrator");
                admin.setRole(Role.ADMIN);
                admin.setEnabled(true);
                admin.setAccountNonExpired(true);
                admin.setAccountNonLocked(true);
                admin.setCredentialsNonExpired(true);
                admin.setEmailVerified(true);

                userRepository.save(admin);

                log.info("==================================================");
                log.info("Default admin user created successfully!");
                log.info("Username: admin");
                log.info("Email: admin@travelms.com");
                log.info("Password: Admin@123");
                log.info("IMPORTANT: Please change the password after first login!");
                log.info("==================================================");
            } else {
                log.info("Admin user already exists. Skipping admin creation.");
            }
        } catch (Exception e) {
            log.error("Error creating default admin user: {}", e.getMessage(), e);
        }
    }
}
