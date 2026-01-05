package com.travelms.payment.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatisticsDTO {
    private Long totalPayments;
    private Long completedPayments;
    private Long pendingPayments;
    private Long failedPayments;
    private Long refundedPayments;
    private Double totalIncome;
    private Double totalRefunded;
    private Double netIncome;
    private Double averagePaymentAmount;
    private String mostUsedPaymentMethod;
}
