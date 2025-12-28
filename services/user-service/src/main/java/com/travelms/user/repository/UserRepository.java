package com.travelms.user.repository;

import com.travelms.user.model.entity.User;
import com.travelms.user.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByRole(Role role);

    List<User> findByRole(Role role);

    List<User> findByEnabledTrue();

    @Query("SELECT u FROM User u WHERE u.role = :role ORDER BY u.createdAt DESC")
    List<User> findUsersByRole(@Param("role") Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.createdAt >= :startDate")
    Long countNewUsersByRoleSince(@Param("role") Role role, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startDate")
    Long countNewUsersSince(@Param("startDate") LocalDateTime startDate);

    Optional<User> findByUsernameOrEmail(String username, String email);

    // Search and pagination methods
    @Query("SELECT u FROM User u WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<User> findUsersWithSearch(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchByUsername(@Param("searchTerm") String searchTerm);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchByFullName(@Param("searchTerm") String searchTerm);

    @Modifying
    @Query("UPDATE User u SET u.lastLoginAt = :lastLoginAt WHERE u.id = :userId")
    void updateLastLogin(@Param("userId") Long userId, @Param("lastLoginAt") LocalDateTime lastLoginAt);

    @Query("SELECT u FROM User u WHERE u.id = :userId")
    Optional<User> findUserForStatistics(@Param("userId") Long userId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    Long countByRole(@Param("role") Role role);

    // Count users by role name (string)
    default Long countByRole(String roleName) {
        try {
            Role role = Role.valueOf(roleName);
            return countByRole(role);
        } catch (IllegalArgumentException e) {
            return 0L;
        }
    }

    // Statistics methods (return 0 for now as these features might not be implemented yet)
    default Long countUserRatings(Long userId) {
        return 0L;
    }

    default Double getAverageRating(Long userId) {
        return 0.0;
    }

    default Long countWatchlistItems(Long userId) {
        return 0L;
    }

    default Long countFriends(Long userId) {
        return 0L;
    }

}
