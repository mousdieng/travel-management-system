package com.travelms.payment.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerIncomeBreakdownDTO {
    private Long managerId;
    private String managerName;
    private String managerEmail;
    private Integer totalTravels;
    private Integer totalPayments;
    private Double totalIncome;
    private Double averageIncomePerTravel;
    private String period;
}
