package com.travelms.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayPalPaymentResponse {
    private String orderId;
    private String approvalUrl;
    private String status;
    private String captureId;
}
