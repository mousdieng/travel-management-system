package com.travelms.payment.service;

import com.travelms.payment.dto.admin.*;
import com.travelms.payment.model.entity.Payment;
import com.travelms.payment.model.enums.PaymentStatus;
import com.travelms.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPaymentService {

    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public List<ManagerIncomeBreakdownDTO> getIncomeByManager(String period) {
        log.info("Fetching income by manager with period: {}", period);

        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .filter(p -> filterByPeriod(p, period))
                .collect(Collectors.toList());

        // Group by manager ID
        Map<Long, List<Payment>> paymentsByManager = payments.stream()
                .filter(p -> p.getManagerId() != null)
                .collect(Collectors.groupingBy(Payment::getManagerId));

        List<ManagerIncomeBreakdownDTO> breakdown = paymentsByManager.entrySet().stream()
                .map(entry -> {
                    Long managerId = entry.getKey();
                    List<Payment> managerPayments = entry.getValue();

                    double totalIncome = managerPayments.stream()
                            .mapToDouble(p -> p.getAmount().doubleValue())
                            .sum();

                    Set<Long> uniqueTravels = managerPayments.stream()
                            .map(Payment::getTravelId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());

                    return ManagerIncomeBreakdownDTO.builder()
                            .managerId(managerId)
                            .managerName("Manager " + managerId) // TODO: Fetch from user service
                            .managerEmail("manager" + managerId + "@example.com") // TODO: Fetch from user service
                            .totalTravels(uniqueTravels.size())
                            .totalPayments(managerPayments.size())
                            .totalIncome(Math.round(totalIncome * 100.0) / 100.0)
                            .averageIncomePerTravel(uniqueTravels.size() > 0 ?
                                    Math.round((totalIncome / uniqueTravels.size()) * 100.0) / 100.0 : 0.0)
                            .period(period != null ? period : "all")
                            .build();
                })
                .sorted(Comparator.comparing(ManagerIncomeBreakdownDTO::getTotalIncome).reversed())
                .collect(Collectors.toList());

        log.info("Found {} manager income breakdowns", breakdown.size());
        return breakdown;
    }

    @Transactional(readOnly = true)
    public List<CategoryIncomeBreakdownDTO> getIncomeByCategory() {
        log.info("Fetching income by category");

        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .collect(Collectors.toList());

        double totalIncome = payments.stream()
                .mapToDouble(p -> p.getAmount().doubleValue())
                .sum();

        // For now, we'll use a placeholder since we don't have category in Payment entity
        // In production, you would join with Travel service to get categories
        Map<String, List<Payment>> paymentsByCategory = new HashMap<>();
        paymentsByCategory.put("Adventure", payments);

        List<CategoryIncomeBreakdownDTO> breakdown = paymentsByCategory.entrySet().stream()
                .map(entry -> {
                    String category = entry.getKey();
                    List<Payment> categoryPayments = entry.getValue();

                    double categoryIncome = categoryPayments.stream()
                            .mapToDouble(p -> p.getAmount().doubleValue())
                            .sum();

                    Set<Long> uniqueTravels = categoryPayments.stream()
                            .map(Payment::getTravelId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());

                    return CategoryIncomeBreakdownDTO.builder()
                            .category(category)
                            .totalTravels(uniqueTravels.size())
                            .totalPayments(categoryPayments.size())
                            .totalIncome(Math.round(categoryIncome * 100.0) / 100.0)
                            .averageIncomePerTravel(uniqueTravels.size() > 0 ?
                                    Math.round((categoryIncome / uniqueTravels.size()) * 100.0) / 100.0 : 0.0)
                            .percentageOfTotalIncome(totalIncome > 0 ?
                                    Math.round((categoryIncome / totalIncome * 100.0) * 10.0) / 10.0 : 0.0)
                            .build();
                })
                .sorted(Comparator.comparing(CategoryIncomeBreakdownDTO::getTotalIncome).reversed())
                .collect(Collectors.toList());

        log.info("Found {} category income breakdowns", breakdown.size());
        return breakdown;
    }

    @Transactional(readOnly = true)
    public PaymentStatisticsDTO getPaymentStatistics() {
        log.info("Fetching payment statistics");

        List<Payment> allPayments = paymentRepository.findAll();

        long totalPayments = allPayments.size();
        long completedPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .count();
        long pendingPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .count();
        long failedPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.FAILED)
                .count();
        long refundedPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.REFUNDED)
                .count();

        double totalIncome = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .mapToDouble(p -> p.getAmount().doubleValue())
                .sum();

        double totalRefunded = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.REFUNDED)
                .mapToDouble(p -> p.getAmount().doubleValue())
                .sum();

        double averagePayment = completedPayments > 0 ? totalIncome / completedPayments : 0.0;

        Map<String, Long> methodCounts = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .collect(Collectors.groupingBy(p -> p.getPaymentMethod().toString(), Collectors.counting()));

        String mostUsedMethod = methodCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");

        return PaymentStatisticsDTO.builder()
                .totalPayments(totalPayments)
                .completedPayments(completedPayments)
                .pendingPayments(pendingPayments)
                .failedPayments(failedPayments)
                .refundedPayments(refundedPayments)
                .totalIncome(Math.round(totalIncome * 100.0) / 100.0)
                .totalRefunded(Math.round(totalRefunded * 100.0) / 100.0)
                .netIncome(Math.round((totalIncome - totalRefunded) * 100.0) / 100.0)
                .averagePaymentAmount(Math.round(averagePayment * 100.0) / 100.0)
                .mostUsedPaymentMethod(mostUsedMethod)
                .build();
    }

    @Transactional(readOnly = true)
    public ManagerIncomeHistoryDTO getManagerIncomeHistory(Long managerId, Integer months) {
        log.info("Fetching income history for manager: {} for {} months", managerId, months);

        LocalDateTime startDate = LocalDateTime.now().minusMonths(months);

        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .filter(p -> p.getManagerId() != null && p.getManagerId().equals(managerId))
                .filter(p -> p.getCreatedAt().isAfter(startDate))
                .collect(Collectors.toList());

        // Group by month
        Map<String, List<Payment>> paymentsByMonth = payments.stream()
                .collect(Collectors.groupingBy(p -> {
                    LocalDateTime created = p.getCreatedAt();
                    return created.getYear() + "-" + String.format("%02d", created.getMonthValue());
                }));

        List<MonthlyIncomeDTO> monthlyIncome = paymentsByMonth.entrySet().stream()
                .map(entry -> {
                    String yearMonth = entry.getKey();
                    List<Payment> monthPayments = entry.getValue();

                    String[] parts = yearMonth.split("-");
                    int year = Integer.parseInt(parts[0]);
                    int monthValue = Integer.parseInt(parts[1]);

                    double income = monthPayments.stream()
                            .mapToDouble(p -> p.getAmount().doubleValue())
                            .sum();

                    return MonthlyIncomeDTO.builder()
                            .month(java.time.Month.of(monthValue).getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                            .year(year)
                            .income(Math.round(income * 100.0) / 100.0)
                            .paymentsCount(monthPayments.size())
                            .build();
                })
                .sorted(Comparator.comparing((MonthlyIncomeDTO m) -> m.getYear())
                        .thenComparing(m -> java.time.Month.valueOf(m.getMonth().toUpperCase()).getValue()))
                .collect(Collectors.toList());

        double totalIncome = payments.stream()
                .mapToDouble(p -> p.getAmount().doubleValue())
                .sum();

        double avgMonthlyIncome = monthlyIncome.size() > 0 ? totalIncome / monthlyIncome.size() : 0.0;

        return ManagerIncomeHistoryDTO.builder()
                .managerId(managerId)
                .managerName("Manager " + managerId) // TODO: Fetch from user service
                .managerEmail("manager" + managerId + "@example.com") // TODO: Fetch from user service
                .monthlyIncome(monthlyIncome)
                .totalIncome(Math.round(totalIncome * 100.0) / 100.0)
                .averageMonthlyIncome(Math.round(avgMonthlyIncome * 100.0) / 100.0)
                .build();
    }

    private boolean filterByPeriod(Payment payment, String period) {
        if (period == null || period.equals("all")) {
            return true;
        }

        LocalDateTime created = payment.getCreatedAt();
        LocalDateTime now = LocalDateTime.now();

        switch (period.toLowerCase()) {
            case "today":
                return created.toLocalDate().equals(now.toLocalDate());
            case "week":
                return created.isAfter(now.minusWeeks(1));
            case "month":
                return created.isAfter(now.minusMonths(1));
            case "year":
                return created.isAfter(now.minusYears(1));
            default:
                return true;
        }
    }
}
