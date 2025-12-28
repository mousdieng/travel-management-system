package com.travelms.payment.integration.paypal;

import com.paypal.api.payments.*;
import com.paypal.base.rest.APIContext;
import com.paypal.base.rest.PayPalRESTException;
import com.travelms.payment.dto.PayPalPaymentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PayPalService {

    @Value("${paypal.client.id}")
    private String clientId;

    @Value("${paypal.client.secret}")
    private String clientSecret;

    @Value("${paypal.mode}")
    private String mode;

    @Value("${paypal.return.url}")
    private String returnUrl;

    @Value("${paypal.cancel.url}")
    private String cancelUrl;

    private APIContext getAPIContext() {
        return new APIContext(clientId, clientSecret, mode);
    }

    public PayPalPaymentResponse createPayment(BigDecimal amount, String currency, String description) {
        try {
            Amount paymentAmount = new Amount();
            paymentAmount.setCurrency(currency);
            paymentAmount.setTotal(amount.setScale(2, BigDecimal.ROUND_HALF_UP).toString());

            Transaction transaction = new Transaction();
            transaction.setDescription(description);
            transaction.setAmount(paymentAmount);

            List<Transaction> transactions = new ArrayList<>();
            transactions.add(transaction);

            Payer payer = new Payer();
            payer.setPaymentMethod("paypal");

            Payment payment = new Payment();
            payment.setIntent("sale");
            payment.setPayer(payer);
            payment.setTransactions(transactions);

            RedirectUrls redirectUrls = new RedirectUrls();
            redirectUrls.setCancelUrl(cancelUrl);
            redirectUrls.setReturnUrl(returnUrl);
            payment.setRedirectUrls(redirectUrls);

            Payment createdPayment = payment.create(getAPIContext());

            String approvalUrl = createdPayment.getLinks().stream()
                    .filter(link -> link.getRel().equals("approval_url"))
                    .findFirst()
                    .map(Links::getHref)
                    .orElse(null);

            log.info("Created PayPal Payment: {}", createdPayment.getId());

            return PayPalPaymentResponse.builder()
                    .orderId(createdPayment.getId())
                    .approvalUrl(approvalUrl)
                    .status(createdPayment.getState())
                    .build();

        } catch (PayPalRESTException e) {
            log.error("Error creating PayPal payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create PayPal payment: " + e.getMessage());
        }
    }

    public PayPalPaymentResponse executePayment(String paymentId, String payerId) {
        try {
            Payment payment = new Payment();
            payment.setId(paymentId);

            PaymentExecution paymentExecution = new PaymentExecution();
            paymentExecution.setPayerId(payerId);

            Payment executedPayment = payment.execute(getAPIContext(), paymentExecution);

            String captureId = executedPayment.getTransactions().stream()
                    .flatMap(t -> t.getRelatedResources().stream())
                    .filter(r -> r.getSale() != null)
                    .map(r -> r.getSale().getId())
                    .findFirst()
                    .orElse(null);

            log.info("Executed PayPal Payment: {}", executedPayment.getId());

            return PayPalPaymentResponse.builder()
                    .orderId(executedPayment.getId())
                    .status(executedPayment.getState())
                    .captureId(captureId)
                    .build();

        } catch (PayPalRESTException e) {
            log.error("Error executing PayPal payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to execute PayPal payment: " + e.getMessage());
        }
    }

    public Payment getPaymentDetails(String paymentId) {
        try {
            return Payment.get(getAPIContext(), paymentId);
        } catch (PayPalRESTException e) {
            log.error("Error getting PayPal payment details: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get payment details: " + e.getMessage());
        }
    }

    public RefundResponse refundPayment(String saleId, BigDecimal amount, String currency) {
        try {
            Sale sale = new Sale();
            sale.setId(saleId);

            RefundRequest refundRequest = new RefundRequest();
            Amount refundAmount = new Amount();
            refundAmount.setCurrency(currency);
            refundAmount.setTotal(amount.setScale(2, BigDecimal.ROUND_HALF_UP).toString());
            refundRequest.setAmount(refundAmount);

            DetailedRefund refund = sale.refund(getAPIContext(), refundRequest);
            log.info("Created PayPal Refund: {}", refund.getId());

            return RefundResponse.builder()
                    .refundId(refund.getId())
                    .status(refund.getState())
                    .build();

        } catch (PayPalRESTException e) {
            log.error("Error creating PayPal refund: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create refund: " + e.getMessage());
        }
    }
}
