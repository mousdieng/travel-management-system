package com.travelms.payment.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryIncomeBreakdownDTO {
    private String category;
    private Integer totalTravels;
    private Integer totalPayments;
    private Double totalIncome;
    private Double averageIncomePerTravel;
    private Double percentageOfTotalIncome;
}
