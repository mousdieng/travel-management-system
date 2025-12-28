package com.travelms.payment.dto;

import com.travelms.payment.model.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavePaymentMethodRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Payment method type is required")
    private PaymentMethod type;

    // Stripe payment method ID (from Stripe.js)
    private String stripePaymentMethodId;

    // Card details (will be extracted from Stripe)
    private String cardholderName;

    private Boolean setAsDefault = false;
}
