package com.travelms.payment.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerIncomeHistoryDTO {
    private Long managerId;
    private String managerName;
    private String managerEmail;
    private List<MonthlyIncomeDTO> monthlyIncome;
    private Double totalIncome;
    private Double averageMonthlyIncome;
}
