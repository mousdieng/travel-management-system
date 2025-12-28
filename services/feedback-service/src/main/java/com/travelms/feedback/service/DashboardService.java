package com.travelms.feedback.service;

import com.travelms.feedback.dto.DashboardStatsDTO;
import com.travelms.feedback.integration.PaymentServiceClient;
import com.travelms.feedback.integration.TravelServiceClient;
import com.travelms.feedback.integration.UserServiceClient;
import com.travelms.feedback.model.enums.ReportStatus;
import com.travelms.feedback.repository.FeedbackRepository;
import com.travelms.feedback.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final FeedbackRepository feedbackRepository;
    private final ReportRepository reportRepository;
    private final UserServiceClient userServiceClient;
    private final TravelServiceClient travelServiceClient;
    private final PaymentServiceClient paymentServiceClient;

    public DashboardStatsDTO getTravelerStats(Long travelerId) {
        Long reportsFiled = reportRepository.countReportsByReporterId(travelerId);
        Long feedbacksGiven = feedbackRepository.countByTravelerId(travelerId);

        return DashboardStatsDTO.builder()
                .reportsFiled(reportsFiled)
                .totalReviews(feedbacksGiven)
                .build();
    }

    public DashboardStatsDTO getManagerStats(Long managerId) {
        // Note: This requires data from other services for full implementation
        Long reportsReceived = reportRepository.countReportsByManagerId(managerId);

        return DashboardStatsDTO.builder()
                .reportsReceived(reportsReceived)
                .build();
    }

    public DashboardStatsDTO getAdminStats() {
        // Fetch feedback and report stats from local database
        Long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        Long totalFeedbacks = feedbackRepository.count();

        Double averagePlatformRating = feedbackRepository.findAll().stream()
                .mapToDouble(f -> f.getRating())
                .average()
                .orElse(0.0);

        // Fetch stats from other services
        UserServiceClient.UserStatsResponse userStats = userServiceClient.getUserStats();
        TravelServiceClient.TravelStatsResponse travelStats = travelServiceClient.getTravelStats();
        PaymentServiceClient.PaymentStatsResponse paymentStats = paymentServiceClient.getPaymentStats();

        return DashboardStatsDTO.builder()
                // User stats
                .totalUsers(userStats.getTotalUsers())
                .totalManagers(userStats.getTotalManagers())
                .totalTravelers(userStats.getTotalTravelers())
                // Travel stats
                .totalTravels(travelStats.getTotalTravels())
                .activeTravels(travelStats.getActiveTravels())
                .completedTravels(travelStats.getCompletedTravels())
                // Financial stats
                .platformIncome(paymentStats.getPlatformIncome())
                .lastMonthIncome(paymentStats.getLastMonthIncome())
                // Feedback stats
                .totalFeedbacks(totalFeedbacks)
                .averagePlatformRating(averagePlatformRating)
                // Report stats
                .pendingReports(pendingReports)
                .build();
    }
}
