package com.travelms.payment.repository;

import com.travelms.payment.model.entity.Payment;
import com.travelms.payment.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserId(Long userId);

    List<Payment> findByUserIdAndStatus(Long userId, PaymentStatus status);

    Optional<Payment> findByBookingId(Long bookingId);

    List<Payment> findByStatus(PaymentStatus status);

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByExternalTransactionId(String externalTransactionId);

    Optional<Payment> findByPaymentIntentId(String paymentIntentId);

    Optional<Payment> findBySessionId(String sessionId);

    @Query("SELECT p FROM Payment p WHERE p.userId = :userId ORDER BY p.createdAt DESC")
    List<Payment> findUserPaymentsOrderedByDate(@Param("userId") Long userId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.userId = :userId AND p.status = 'COMPLETED'")
    BigDecimal getTotalAmountPaidByUser(@Param("userId") Long userId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startDate AND :endDate")
    BigDecimal getTotalRevenueByDateRange(@Param("startDate") LocalDateTime startDate,
                                           @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startDate AND :endDate")
    Long countPaymentsByDateRange(@Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p.paymentMethod, COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED' GROUP BY p.paymentMethod")
    List<Object[]> getPaymentMethodStatistics();

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.userId = :userId AND p.status = 'COMPLETED'")
    Long countCompletedPaymentsByUserId(@Param("userId") Long userId);

    @Query("SELECT p FROM Payment p WHERE p.status = 'PENDING' AND p.createdAt < :threshold")
    List<Payment> findExpiredPendingPayments(@Param("threshold") LocalDateTime threshold);

    // Manager income queries
    List<Payment> findByManagerId(Long managerId);

    List<Payment> findByManagerIdAndStatus(Long managerId, PaymentStatus status);

    @Query("SELECT SUM(p.netAmount) FROM Payment p WHERE p.managerId = :managerId AND p.status = 'COMPLETED'")
    BigDecimal getTotalIncomeByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT SUM(p.netAmount) FROM Payment p WHERE p.managerId = :managerId AND p.status = 'COMPLETED' " +
           "AND p.paidAt BETWEEN :startDate AND :endDate")
    BigDecimal getManagerIncomeByDateRange(@Param("managerId") Long managerId,
                                            @Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.managerId = :managerId AND p.status = 'COMPLETED'")
    Long countCompletedPaymentsByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT SUM(p.netAmount) FROM Payment p WHERE p.travelId = :travelId AND p.status = 'COMPLETED'")
    BigDecimal getTotalIncomeByTravelId(@Param("travelId") Long travelId);

    @Query("SELECT FUNCTION('MONTH', p.paidAt), FUNCTION('YEAR', p.paidAt), SUM(p.netAmount) FROM Payment p " +
           "WHERE p.managerId = :managerId AND p.status = 'COMPLETED' AND p.paidAt >= :startDate " +
           "GROUP BY FUNCTION('YEAR', p.paidAt), FUNCTION('MONTH', p.paidAt) " +
           "ORDER BY FUNCTION('YEAR', p.paidAt), FUNCTION('MONTH', p.paidAt)")
    List<Object[]> getMonthlyIncomeByManager(@Param("managerId") Long managerId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT p.travelId, SUM(p.netAmount) FROM Payment p " +
           "WHERE p.managerId = :managerId AND p.status = 'COMPLETED' GROUP BY p.travelId ORDER BY SUM(p.netAmount) DESC")
    List<Object[]> getIncomeByTravelForManager(@Param("managerId") Long managerId);

    // Platform statistics queries
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal getTotalSuccessfulPaymentsAmount();

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startDate AND :endDate")
    BigDecimal getTotalPaymentsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status")
    Long countByStatus(@Param("status") PaymentStatus status);
}
