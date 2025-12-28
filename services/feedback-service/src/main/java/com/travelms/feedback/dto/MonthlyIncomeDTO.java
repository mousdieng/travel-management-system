package com.travelms.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyIncomeDTO {

    private Integer year;
    private Integer month;
    private String monthName;
    private BigDecimal totalIncome;
    private Long numberOfPayments;
    private Long numberOfTravels;
    private BigDecimal averagePaymentAmount;
}
