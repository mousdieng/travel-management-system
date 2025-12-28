package com.travelms.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerIncomeStatsDTO {

    private Long managerId;

    // Total income stats
    private BigDecimal totalIncome;
    private BigDecimal lastMonthIncome;
    private BigDecimal thisMonthIncome;
    private BigDecimal lastYearIncome;

    // Transaction counts
    private Long totalTransactions;
    private Long completedTransactions;
    private Long refundedTransactions;

    // Averages
    private BigDecimal averageTransactionAmount;

    // Income by travel
    private List<TravelIncomeDTO> incomeByTravel;

    // Monthly breakdown
    private List<MonthlyIncomeDTO> monthlyIncome;

    // Payment method breakdown
    private Map<String, BigDecimal> incomeByPaymentMethod;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TravelIncomeDTO {
        private Long travelId;
        private BigDecimal totalIncome;
        private Long transactionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyIncomeDTO {
        private String month;
        private Integer year;
        private BigDecimal income;
        private Long transactionCount;
    }
}
