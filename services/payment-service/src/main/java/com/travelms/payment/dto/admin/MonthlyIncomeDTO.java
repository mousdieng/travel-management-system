package com.travelms.payment.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyIncomeDTO {
    private String month;
    private Integer year;
    private Double income;
    private Integer paymentsCount;
}
