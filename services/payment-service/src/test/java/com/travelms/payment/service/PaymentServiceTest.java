package com.travelms.payment.service;

import com.travelms.payment.dto.PaymentDTO;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Payment Service Tests")
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Payment samplePayment;

    @BeforeEach
    void setUp() {
        samplePayment = Payment.builder()
                .id(1L)
                .userId(4L)
                .bookingId(1L)
                .travelId(1L)
                .managerId(2L)
                .amount(BigDecimal.valueOf(1500.00))
                .fee(BigDecimal.valueOf(50.00))
                .netAmount(BigDecimal.valueOf(1450.00))
                .paymentMethod(PaymentMethod.STRIPE)
                .status(PaymentStatus.COMPLETED)
                .transactionId("TXN123")
                .build();
    }

    // ==================== GET PAYMENT BY ID ====================

    @Test
    @DisplayName("Should get payment by ID successfully")
    void getPaymentById_Success() {
        // Arrange
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(samplePayment));

        // Act
        PaymentDTO result = paymentService.getPaymentById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(4L, result.getUserId());
        verify(paymentRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when payment not found")
    void getPaymentById_NotFound() {
        // Arrange
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> paymentService.getPaymentById(999L));
    }

    // ==================== GET USER PAYMENTS ====================

    @Test
    @DisplayName("Should get all payments for a user")
    void getUserPayments_Success() {
        // Arrange
        Payment payment2 = Payment.builder()
                .id(2L)
                .userId(4L)
                .amount(BigDecimal.valueOf(2000.00))
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.PAYPAL)
                .build();

        when(paymentRepository.findByUserId(4L)).thenReturn(Arrays.asList(samplePayment, payment2));

        // Act
        List<PaymentDTO> results = paymentService.getUserPayments(4L);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(p -> p.getUserId() == 4L));
        verify(paymentRepository, times(1)).findByUserId(4L);
    }

    @Test
    @DisplayName("Should return empty list when user has no payments")
    void getUserPayments_Empty() {
        // Arrange
        when(paymentRepository.findByUserId(999L)).thenReturn(Arrays.asList());

        // Act
        List<PaymentDTO> results = paymentService.getUserPayments(999L);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET USER COMPLETED PAYMENTS ====================

    @Test
    @DisplayName("Should get completed payments for a user")
    void getUserCompletedPayments_Success() {
        // Arrange
        when(paymentRepository.findByUserIdAndStatus(4L, PaymentStatus.COMPLETED))
                .thenReturn(Arrays.asList(samplePayment));

        // Act
        List<PaymentDTO> results = paymentService.getUserCompletedPayments(4L);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(PaymentStatus.COMPLETED, results.get(0).getStatus());
        verify(paymentRepository, times(1)).findByUserIdAndStatus(4L, PaymentStatus.COMPLETED);
    }

    // ==================== GET PAYMENT BY BOOKING ====================

    @Test
    @DisplayName("Should get payment by booking ID")
    void getPaymentByBookingId_Success() {
        // Arrange
        when(paymentRepository.findByBookingId(1L)).thenReturn(Optional.of(samplePayment));

        // Act
        PaymentDTO result = paymentService.getPaymentByBookingId(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getBookingId());
        verify(paymentRepository, times(1)).findByBookingId(1L);
    }

    @Test
    @DisplayName("Should throw exception when payment not found by booking ID")
    void getPaymentByBookingId_NotFound() {
        // Arrange
        when(paymentRepository.findByBookingId(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                paymentService.getPaymentByBookingId(999L));
    }

    // ==================== GET MANAGER PAYMENTS ====================

    @Test
    @DisplayName("Should get all payments for a manager")
    void getManagerPayments_Success() {
        // Arrange
        when(paymentRepository.findByManagerId(2L)).thenReturn(Arrays.asList(samplePayment));

        // Act
        List<PaymentDTO> results = paymentService.getManagerPayments(2L);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getId());
        verify(paymentRepository, times(1)).findByManagerId(2L);
    }

    // ==================== MANAGER INCOME ====================

    @Test
    @DisplayName("Should calculate manager total income")
    void getManagerTotalIncome_Success() {
        // Arrange
        when(paymentRepository.getTotalIncomeByManagerId(2L))
                .thenReturn(BigDecimal.valueOf(5000.00));

        // Act
        BigDecimal result = paymentService.getManagerTotalIncome(2L);

        // Assert
        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(5000.00), result);
        verify(paymentRepository, times(1)).getTotalIncomeByManagerId(2L);
    }

    @Test
    @DisplayName("Should return zero when manager has no income")
    void getManagerTotalIncome_Zero() {
        // Arrange
        when(paymentRepository.getTotalIncomeByManagerId(999L)).thenReturn(null);

        // Act
        BigDecimal result = paymentService.getManagerTotalIncome(999L);

        // Assert
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result);
    }

    // ==================== PLATFORM INCOME ====================

    @Test
    @DisplayName("Should calculate total platform income")
    void calculateTotalPlatformIncome_Success() {
        // Arrange
        when(paymentRepository.getTotalSuccessfulPaymentsAmount())
                .thenReturn(BigDecimal.valueOf(100000.00));

        // Act
        BigDecimal result = paymentService.calculateTotalPlatformIncome();

        // Assert
        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(100000.00), result);
        verify(paymentRepository, times(1)).getTotalSuccessfulPaymentsAmount();
    }

    // ==================== COUNT PAYMENTS ====================

    @Test
    @DisplayName("Should count total completed payments")
    void countTotalPayments_Success() {
        // Arrange
        when(paymentRepository.countByStatus(PaymentStatus.COMPLETED)).thenReturn(100L);

        // Act
        Long result = paymentService.countTotalPayments();

        // Assert
        assertNotNull(result);
        assertEquals(100L, result);
        verify(paymentRepository, times(1)).countByStatus(PaymentStatus.COMPLETED);
    }

    // ==================== DELETE USER PAYMENTS ====================

    @Test
    @DisplayName("Should cascade delete all user payments")
    void deleteAllPaymentsByUser_Success() {
        // Arrange
        Payment payment2 = Payment.builder()
                .id(2L)
                .userId(4L)
                .status(PaymentStatus.PENDING)
                .paymentMethod(PaymentMethod.STRIPE)
                .build();

        when(paymentRepository.findByUserId(4L))
                .thenReturn(Arrays.asList(samplePayment, payment2));
        doNothing().when(paymentRepository).delete(any(Payment.class));

        // Act
        paymentService.deleteAllPaymentsByUser(4L);

        // Assert
        verify(paymentRepository, times(1)).findByUserId(4L);
        verify(paymentRepository, times(2)).delete(any(Payment.class));
    }

    @Test
    @DisplayName("Should handle empty payments list during cascade delete")
    void deleteAllPaymentsByUser_NoPayments() {
        // Arrange
        when(paymentRepository.findByUserId(999L)).thenReturn(Arrays.asList());

        // Act
        paymentService.deleteAllPaymentsByUser(999L);

        // Assert
        verify(paymentRepository, times(1)).findByUserId(999L);
        verify(paymentRepository, never()).delete(any(Payment.class));
    }
}
