package com.travelms.payment.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentMethod;
import com.travelms.payment.dto.SavePaymentMethodRequest;
import com.travelms.payment.dto.SavedPaymentMethodDTO;
import com.travelms.payment.model.entity.SavedPaymentMethod;
import com.travelms.payment.repository.SavedPaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentMethodService {

    private final SavedPaymentMethodRepository savedPaymentMethodRepository;

    @Transactional
    public SavedPaymentMethodDTO savePaymentMethod(SavePaymentMethodRequest request) {
        try {
            // Retrieve payment method details from Stripe
            PaymentMethod stripePaymentMethod = PaymentMethod.retrieve(request.getStripePaymentMethodId());

            // Extract card details
            PaymentMethod.Card card = stripePaymentMethod.getCard();

            // If setting as default, clear other defaults first
            if (request.getSetAsDefault()) {
                savedPaymentMethodRepository.clearDefaultForUser(request.getUserId());
            }

            // Create saved payment method
            SavedPaymentMethod savedMethod = SavedPaymentMethod.builder()
                    .userId(request.getUserId())
                    .type(com.travelms.payment.model.enums.PaymentMethod.STRIPE)
                    .stripePaymentMethodId(request.getStripePaymentMethodId())
                    .last4(card.getLast4())
                    .brand(card.getBrand())
                    .expMonth(String.format("%02d", card.getExpMonth().intValue()))
                    .expYear(card.getExpYear().toString())
                    .cardholderName(request.getCardholderName())
                    .isDefault(request.getSetAsDefault())
                    .build();

            savedMethod = savedPaymentMethodRepository.save(savedMethod);

            log.info("Saved payment method for user: {}", request.getUserId());

            return convertToDTO(savedMethod);

        } catch (StripeException e) {
            log.error("Error saving payment method: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save payment method: " + e.getMessage());
        }
    }

    public List<SavedPaymentMethodDTO> getUserPaymentMethods(Long userId) {
        return savedPaymentMethodRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SavedPaymentMethodDTO getPaymentMethod(Long userId, Long methodId) {
        SavedPaymentMethod method = savedPaymentMethodRepository.findByUserIdAndId(userId, methodId)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));
        return convertToDTO(method);
    }

    @Transactional
    public void deletePaymentMethod(Long userId, Long methodId) {
        savedPaymentMethodRepository.deleteByUserIdAndId(userId, methodId);
        log.info("Deleted payment method {} for user {}", methodId, userId);
    }

    @Transactional
    public SavedPaymentMethodDTO setDefaultPaymentMethod(Long userId, Long methodId) {
        // Clear current default
        savedPaymentMethodRepository.clearDefaultForUser(userId);

        // Set new default
        SavedPaymentMethod method = savedPaymentMethodRepository.findByUserIdAndId(userId, methodId)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));

        method.setIsDefault(true);
        method = savedPaymentMethodRepository.save(method);

        return convertToDTO(method);
    }

    public SavedPaymentMethodDTO getDefaultPaymentMethod(Long userId) {
        SavedPaymentMethod method = savedPaymentMethodRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElse(null);
        return method != null ? convertToDTO(method) : null;
    }

    /**
     * Cascade delete all saved payment methods for a user
     * Called by user-service when deleting a user
     */
    @Transactional
    public void deleteAllPaymentMethodsByUser(Long userId) {
        List<SavedPaymentMethod> methods = savedPaymentMethodRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);

        log.info("Cascade deleting {} payment methods for user: {}", methods.size(), userId);

        for (SavedPaymentMethod method : methods) {
            savedPaymentMethodRepository.delete(method);
        }

        log.info("Successfully cascade deleted {} payment methods for user: {}", methods.size(), userId);
    }

    /**
     * Admin: Get all payment methods across all users
     */
    public List<SavedPaymentMethodDTO> getAllPaymentMethods() {
        return savedPaymentMethodRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Admin: Get payment method by ID (without user restriction)
     */
    public SavedPaymentMethodDTO getPaymentMethodById(Long methodId) {
        SavedPaymentMethod method = savedPaymentMethodRepository.findById(methodId)
                .orElseThrow(() -> new RuntimeException("Payment method not found with id: " + methodId));
        return convertToDTO(method);
    }

    /**
     * Admin: Update payment method
     */
    @Transactional
    public SavedPaymentMethodDTO updatePaymentMethod(Long methodId, SavePaymentMethodRequest request) {
        SavedPaymentMethod method = savedPaymentMethodRepository.findById(methodId)
                .orElseThrow(() -> new RuntimeException("Payment method not found with id: " + methodId));

        // Update only provided fields
        if (request.getCardholderName() != null) {
            method.setCardholderName(request.getCardholderName());
        }

        if (request.getSetAsDefault() != null && request.getSetAsDefault()) {
            savedPaymentMethodRepository.clearDefaultForUser(method.getUserId());
            method.setIsDefault(true);
        }

        method = savedPaymentMethodRepository.save(method);
        log.info("Admin updated payment method: {}", methodId);

        return convertToDTO(method);
    }

    /**
     * Admin: Delete payment method by ID (without user restriction)
     */
    @Transactional
    public void deletePaymentMethodById(Long methodId) {
        if (!savedPaymentMethodRepository.existsById(methodId)) {
            throw new RuntimeException("Payment method not found with id: " + methodId);
        }
        savedPaymentMethodRepository.deleteById(methodId);
        log.info("Admin deleted payment method: {}", methodId);
    }

    private SavedPaymentMethodDTO convertToDTO(SavedPaymentMethod method) {
        return SavedPaymentMethodDTO.builder()
                .id(method.getId())
                .userId(method.getUserId())
                .type(method.getType())
                .stripePaymentMethodId(method.getStripePaymentMethodId())
                .last4(method.getLast4())
                .brand(method.getBrand())
                .expMonth(method.getExpMonth())
                .expYear(method.getExpYear())
                .cardholderName(method.getCardholderName())
                .isDefault(method.getIsDefault())
                .createdAt(method.getCreatedAt())
                .build();
    }
}
