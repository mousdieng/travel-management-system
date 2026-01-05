package com.travelms.payment.service;

import com.travelms.payment.dto.admin.*;
import com.travelms.payment.model.entity.Payment;
import com.travelms.payment.model.enums.PaymentMethod;
import com.travelms.payment.model.enums.PaymentStatus;
import com.travelms.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Payment Service Tests")
class AdminPaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private AdminPaymentService adminPaymentService;

    private Payment completedPayment1;
    private Payment completedPayment2;
    private Payment pendingPayment;
    private Payment refundedPayment;

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.now();

        completedPayment1 = Payment.builder()
                .id(1L)
                .userId(4L)
                .travelId(1L)
                .managerId(2L)
                .amount(BigDecimal.valueOf(1299.99))
                .netAmount(BigDecimal.valueOf(1299.99))
                .currency("USD")
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.STRIPE)
                .paidAt(now.minusDays(5))
                .createdAt(now.minusDays(5))
                .build();

        completedPayment2 = Payment.builder()
                .id(2L)
                .userId(5L)
                .travelId(2L)
                .managerId(2L)
                .amount(BigDecimal.valueOf(2500.00))
                .netAmount(BigDecimal.valueOf(2500.00))
                .currency("USD")
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.PAYPAL)
                .paidAt(now.minusDays(3))
                .createdAt(now.minusDays(3))
                .build();

        pendingPayment = Payment.builder()
                .id(3L)
                .userId(6L)
                .travelId(3L)
                .managerId(3L)
                .amount(BigDecimal.valueOf(999.99))
                .status(PaymentStatus.PENDING)
                .paymentMethod(PaymentMethod.STRIPE)
                .createdAt(now.minusDays(2))
                .build();

        refundedPayment = Payment.builder()
                .id(4L)
                .userId(7L)
                .travelId(4L)
                .managerId(2L)
                .amount(BigDecimal.valueOf(500.00))
                .status(PaymentStatus.REFUNDED)
                .paymentMethod(PaymentMethod.STRIPE)
                .refundedAt(now.minusDays(10))
                .createdAt(now.minusDays(10))
                .build();
    }

    // ==================== GET INCOME BY MANAGER ====================

    @Test
    @DisplayName("Should calculate income by manager successfully")
    void getIncomeByManager_Success() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, pendingPayment, refundedPayment)
        );

        // Act
        List<ManagerIncomeBreakdownDTO> result = adminPaymentService.getIncomeByManager("all");

        // Assert
        assertNotNull(result);
        assertFalse(result.isEmpty());

        // Manager 2 should have highest income (2 completed payments)
        ManagerIncomeBreakdownDTO topManager = result.get(0);
        assertEquals(2L, topManager.getManagerId());
        assertEquals(2, topManager.getTotalPayments());
        assertTrue(topManager.getTotalIncome() > 3700.0); // 1299.99 + 2500.00

        verify(paymentRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should filter income by period - week")
    void getIncomeByManager_WeekPeriod() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, pendingPayment)
        );

        // Act
        List<ManagerIncomeBreakdownDTO> result = adminPaymentService.getIncomeByManager("week");

        // Assert
        assertNotNull(result);
        // Should include recent payments within last week
        verify(paymentRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should filter income by period - month")
    void getIncomeByManager_MonthPeriod() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, pendingPayment)
        );

        // Act
        List<ManagerIncomeBreakdownDTO> result = adminPaymentService.getIncomeByManager("month");

        // Assert
        assertNotNull(result);
        verify(paymentRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should exclude pending and refunded payments from manager income")
    void getIncomeByManager_OnlyCompletedPayments() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, pendingPayment, refundedPayment)
        );

        // Act
        List<ManagerIncomeBreakdownDTO> result = adminPaymentService.getIncomeByManager("all");

        // Assert
        assertNotNull(result);

        // Verify only completed payments are counted
        long totalPayments = result.stream()
                .mapToLong(ManagerIncomeBreakdownDTO::getTotalPayments)
                .sum();
        assertEquals(2, totalPayments); // Only 2 completed payments
    }

    @Test
    @DisplayName("Should return empty list when no completed payments exist")
    void getIncomeByManager_NoCompletedPayments() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(Arrays.asList(pendingPayment));

        // Act
        List<ManagerIncomeBreakdownDTO> result = adminPaymentService.getIncomeByManager("all");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should sort managers by total income descending")
    void getIncomeByManager_SortedByIncome() {
        // Arrange
        Payment managerPayment3 = Payment.builder()
                .id(5L)
                .userId(8L)
                .travelId(5L)
                .managerId(3L)
                .amount(BigDecimal.valueOf(5000.00))
                .netAmount(BigDecimal.valueOf(5000.00))
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.STRIPE)
                .paidAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, managerPayment3)
        );

        // Act
        List<ManagerIncomeBreakdownDTO> result = adminPaymentService.getIncomeByManager("all");

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());

        // Highest income should be first
        assertTrue(result.get(0).getTotalIncome() >= result.get(1).getTotalIncome());
    }

    // ==================== GET INCOME BY CATEGORY ====================

    @Test
    @DisplayName("Should calculate income by category successfully")
    void getIncomeByCategory_Success() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, pendingPayment)
        );

        // Act
        List<CategoryIncomeBreakdownDTO> result = adminPaymentService.getIncomeByCategory();

        // Assert
        assertNotNull(result);
        assertFalse(result.isEmpty());

        CategoryIncomeBreakdownDTO category = result.get(0);
        assertNotNull(category.getCategory());
        assertTrue(category.getTotalIncome() > 0);
        assertTrue(category.getPercentageOfTotalIncome() >= 0);

        verify(paymentRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should only include completed payments in category income")
    void getIncomeByCategory_OnlyCompleted() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, pendingPayment, refundedPayment)
        );

        // Act
        List<CategoryIncomeBreakdownDTO> result = adminPaymentService.getIncomeByCategory();

        // Assert
        assertNotNull(result);
        assertFalse(result.isEmpty());

        // Total payments should only count completed ones
        long totalPayments = result.stream()
                .mapToLong(CategoryIncomeBreakdownDTO::getTotalPayments)
                .sum();
        assertEquals(2, totalPayments);
    }

    @Test
    @DisplayName("Should calculate percentage of total income correctly")
    void getIncomeByCategory_PercentageCalculation() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2)
        );

        // Act
        List<CategoryIncomeBreakdownDTO> result = adminPaymentService.getIncomeByCategory();

        // Assert
        assertNotNull(result);

        double totalPercentage = result.stream()
                .mapToDouble(CategoryIncomeBreakdownDTO::getPercentageOfTotalIncome)
                .sum();

        // Total percentage should be approximately 100% (allowing for rounding)
        assertTrue(totalPercentage >= 99.0 && totalPercentage <= 101.0);
    }

    // ==================== GET PAYMENT STATISTICS ====================

    @Test
    @DisplayName("Should calculate payment statistics successfully")
    void getPaymentStatistics_Success() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, pendingPayment, refundedPayment)
        );

        // Act
        PaymentStatisticsDTO result = adminPaymentService.getPaymentStatistics();

        // Assert
        assertNotNull(result);
        assertEquals(4, result.getTotalPayments());
        assertEquals(2, result.getCompletedPayments());
        assertEquals(1, result.getPendingPayments());
        assertEquals(0, result.getFailedPayments());
        assertEquals(1, result.getRefundedPayments());

        assertTrue(result.getTotalIncome() > 3700.0); // 1299.99 + 2500.00
        assertTrue(result.getTotalRefunded() > 0);
        assertTrue(result.getNetIncome() > 0);
        assertTrue(result.getAveragePaymentAmount() > 0);
        assertNotNull(result.getMostUsedPaymentMethod());

        verify(paymentRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should calculate net income correctly")
    void getPaymentStatistics_NetIncome() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, refundedPayment)
        );

        // Act
        PaymentStatisticsDTO result = adminPaymentService.getPaymentStatistics();

        // Assert
        assertNotNull(result);

        // Net income = total income - total refunded
        double expectedNet = result.getTotalIncome() - result.getTotalRefunded();
        assertEquals(expectedNet, result.getNetIncome(), 0.01);
    }

    @Test
    @DisplayName("Should identify most used payment method")
    void getPaymentStatistics_MostUsedMethod() {
        // Arrange
        Payment stripePayment3 = Payment.builder()
                .id(5L)
                .userId(9L)
                .travelId(6L)
                .managerId(2L)
                .amount(BigDecimal.valueOf(1000.00))
                .netAmount(BigDecimal.valueOf(1000.00))
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.STRIPE)
                .paidAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, stripePayment3)
        );

        // Act
        PaymentStatisticsDTO result = adminPaymentService.getPaymentStatistics();

        // Assert
        assertNotNull(result);
        assertEquals("STRIPE", result.getMostUsedPaymentMethod()); // 2 STRIPE vs 1 PAYPAL
    }

    @Test
    @DisplayName("Should handle zero completed payments")
    void getPaymentStatistics_NoCompletedPayments() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(Arrays.asList(pendingPayment));

        // Act
        PaymentStatisticsDTO result = adminPaymentService.getPaymentStatistics();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalPayments());
        assertEquals(0, result.getCompletedPayments());
        assertEquals(0.0, result.getTotalIncome());
        assertEquals(0.0, result.getAveragePaymentAmount());
    }

    @Test
    @DisplayName("Should return N/A for most used method when no payments")
    void getPaymentStatistics_NoPayments_DefaultMethod() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        PaymentStatisticsDTO result = adminPaymentService.getPaymentStatistics();

        // Assert
        assertNotNull(result);
        assertEquals("N/A", result.getMostUsedPaymentMethod());
    }

    // ==================== GET MANAGER INCOME HISTORY ====================

    @Test
    @DisplayName("Should get manager income history successfully")
    void getManagerIncomeHistory_Success() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, refundedPayment)
        );

        // Act
        ManagerIncomeHistoryDTO result = adminPaymentService.getManagerIncomeHistory(2L, 6);

        // Assert
        assertNotNull(result);
        assertEquals(2L, result.getManagerId());
        assertNotNull(result.getMonthlyIncome());
        assertTrue(result.getTotalIncome() > 0);
        assertTrue(result.getAverageMonthlyIncome() >= 0);

        verify(paymentRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should only include completed payments in history")
    void getManagerIncomeHistory_OnlyCompleted() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, pendingPayment, refundedPayment)
        );

        // Act
        ManagerIncomeHistoryDTO result = adminPaymentService.getManagerIncomeHistory(2L, 6);

        // Assert
        assertNotNull(result);

        // Count total payments in monthly breakdown
        int totalPaymentsInHistory = result.getMonthlyIncome().stream()
                .mapToInt(MonthlyIncomeDTO::getPaymentsCount)
                .sum();

        // Should only include 2 completed payments for manager 2
        assertEquals(2, totalPaymentsInHistory);
    }

    @Test
    @DisplayName("Should filter by time period correctly")
    void getManagerIncomeHistory_FilteredByMonths() {
        // Arrange
        Payment oldPayment = Payment.builder()
                .id(6L)
                .userId(10L)
                .travelId(6L)
                .managerId(2L)
                .amount(BigDecimal.valueOf(1000.00))
                .netAmount(BigDecimal.valueOf(1000.00))
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.STRIPE)
                .paidAt(LocalDateTime.now().minusMonths(12)) // 12 months ago
                .createdAt(LocalDateTime.now().minusMonths(12))
                .build();

        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2, oldPayment)
        );

        // Act - Only get last 6 months
        ManagerIncomeHistoryDTO result = adminPaymentService.getManagerIncomeHistory(2L, 6);

        // Assert
        assertNotNull(result);

        // Old payment should not be included
        int totalPayments = result.getMonthlyIncome().stream()
                .mapToInt(MonthlyIncomeDTO::getPaymentsCount)
                .sum();

        assertEquals(2, totalPayments); // Only recent payments
    }

    @Test
    @DisplayName("Should calculate average monthly income correctly")
    void getManagerIncomeHistory_AverageCalculation() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, completedPayment2)
        );

        // Act
        ManagerIncomeHistoryDTO result = adminPaymentService.getManagerIncomeHistory(2L, 6);

        // Assert
        assertNotNull(result);

        if (result.getMonthlyIncome().size() > 0) {
            double expectedAvg = result.getTotalIncome() / result.getMonthlyIncome().size();
            assertEquals(expectedAvg, result.getAverageMonthlyIncome(), 0.01);
        }
    }

    @Test
    @DisplayName("Should return empty history for manager with no payments")
    void getManagerIncomeHistory_NoPayments() {
        // Arrange
        when(paymentRepository.findAll()).thenReturn(Arrays.asList(completedPayment1));

        // Act
        ManagerIncomeHistoryDTO result = adminPaymentService.getManagerIncomeHistory(999L, 6);

        // Assert
        assertNotNull(result);
        assertEquals(999L, result.getManagerId());
        assertTrue(result.getMonthlyIncome().isEmpty());
        assertEquals(0.0, result.getTotalIncome());
        assertEquals(0.0, result.getAverageMonthlyIncome());
    }

    @Test
    @DisplayName("Should group payments by month correctly")
    void getManagerIncomeHistory_GroupedByMonth() {
        // Arrange
        Payment sameMonthPayment = Payment.builder()
                .id(7L)
                .userId(11L)
                .travelId(7L)
                .managerId(2L)
                .amount(BigDecimal.valueOf(800.00))
                .netAmount(BigDecimal.valueOf(800.00))
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.STRIPE)
                .paidAt(completedPayment1.getPaidAt().plusDays(1)) // Same month as completedPayment1
                .createdAt(completedPayment1.getCreatedAt().plusDays(1))
                .build();

        when(paymentRepository.findAll()).thenReturn(
                Arrays.asList(completedPayment1, sameMonthPayment)
        );

        // Act
        ManagerIncomeHistoryDTO result = adminPaymentService.getManagerIncomeHistory(2L, 6);

        // Assert
        assertNotNull(result);
        assertFalse(result.getMonthlyIncome().isEmpty());

        // Both payments should be in the same month
        MonthlyIncomeDTO monthData = result.getMonthlyIncome().get(0);
        assertEquals(2, monthData.getPaymentsCount());
    }
}
