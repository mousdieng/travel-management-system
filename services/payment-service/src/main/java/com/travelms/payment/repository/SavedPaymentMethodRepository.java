package com.travelms.payment.repository;

import com.travelms.payment.model.entity.SavedPaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPaymentMethodRepository extends JpaRepository<SavedPaymentMethod, Long> {

    List<SavedPaymentMethod> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    Optional<SavedPaymentMethod> findByUserIdAndId(Long userId, Long id);

    Optional<SavedPaymentMethod> findByUserIdAndIsDefaultTrue(Long userId);

    @Modifying
    @Query("UPDATE SavedPaymentMethod spm SET spm.isDefault = false WHERE spm.userId = :userId")
    void clearDefaultForUser(@Param("userId") Long userId);

    void deleteByUserIdAndId(Long userId, Long id);
}
