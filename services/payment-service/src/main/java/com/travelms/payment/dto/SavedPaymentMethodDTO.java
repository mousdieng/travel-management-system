package com.travelms.payment.dto;

import com.travelms.payment.model.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedPaymentMethodDTO {
    private Long id;
    private Long userId;
    private PaymentMethod type;
    private String stripePaymentMethodId;
    private String last4;
    private String brand;
    private String expMonth;
    private String expYear;
    private String cardholderName;
    private Boolean isDefault;
    private LocalDateTime createdAt;
}
