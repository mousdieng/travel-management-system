package com.travelms.feedback.service;

import com.travelms.feedback.dto.CreateReportRequest;
import com.travelms.feedback.dto.ReportDTO;
import com.travelms.feedback.model.entity.Report;
import com.travelms.feedback.model.enums.ReportStatus;
import com.travelms.feedback.model.enums.ReportType;
import com.travelms.feedback.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;

    @Transactional
    public ReportDTO createReport(CreateReportRequest request, Long reporterId) {
        // Validate report type and target
        if (request.getReportType() == ReportType.TRAVEL_MANAGER ||
            request.getReportType() == ReportType.TRAVELER) {
            if (request.getReportedUserId() == null) {
                throw new RuntimeException("Reported user ID is required for user reports");
            }
        } else if (request.getReportType() == ReportType.TRAVEL) {
            if (request.getReportedTravelId() == null) {
                throw new RuntimeException("Reported travel ID is required for travel reports");
            }
        }

        Report report = Report.builder()
                .reporterId(reporterId)
                .reportType(request.getReportType())
                .reportedUserId(request.getReportedUserId())
                .reportedTravelId(request.getReportedTravelId())
                .reason(request.getReason())
                .status(ReportStatus.PENDING)
                .build();

        report = reportRepository.save(report);

        return convertToDTO(report);
    }

    @Transactional
    public ReportDTO reviewReport(Long id, Long adminId, ReportStatus newStatus, String adminNotes) {
        Report report = getReportById(id);

        report.setStatus(newStatus);
        report.setAdminNotes(adminNotes);
        report.setReviewedBy(adminId);
        report.setReviewedAt(LocalDateTime.now());

        report = reportRepository.save(report);

        return convertToDTO(report);
    }

    public ReportDTO getReportDTOById(Long id) {
        Report report = getReportById(id);
        return convertToDTO(report);
    }

    public Report getReportById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found with id: " + id));
    }

    public List<ReportDTO> getAllReports() {
        return reportRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ReportDTO> getPendingReports() {
        return reportRepository.findPendingReports().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ReportDTO> getUserReports(Long reporterId) {
        return reportRepository.findByReporterId(reporterId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ReportDTO> getReportsAgainstUser(Long userId) {
        return reportRepository.findByReportedUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Long countReportsByManagerId(Long managerId) {
        return reportRepository.countReportsByManagerId(managerId);
    }

    public Long countByStatus(ReportStatus status) {
        return reportRepository.countByStatus(status);
    }

    /**
     * Cascade delete all reports created by a user
     * Called by user-service when deleting a user
     */
    @Transactional
    public void deleteAllReportsByUser(Long userId) {
        List<Report> reports = reportRepository.findByReporterId(userId);

        log.info("Cascade deleting {} reports for user: {}", reports.size(), userId);

        for (Report report : reports) {
            reportRepository.delete(report);
        }

        log.info("Successfully cascade deleted {} reports for user: {}", reports.size(), userId);
    }

    private ReportDTO convertToDTO(Report report) {
        ReportDTO dto = ReportDTO.builder()
                .id(report.getId())
                .reporterId(report.getReporterId())
                .reporterName("User " + report.getReporterId()) // TODO: Fetch from User Service
                .reportType(report.getReportType())
                .reason(report.getReason())
                .status(report.getStatus())
                .adminNotes(report.getAdminNotes())
                .reviewedAt(report.getReviewedAt())
                .createdAt(report.getCreatedAt())
                .build();

        if (report.getReportedUserId() != null) {
            dto.setReportedUserId(report.getReportedUserId());
            dto.setReportedUserName("User " + report.getReportedUserId()); // TODO: Fetch from User Service
        }

        if (report.getReportedTravelId() != null) {
            dto.setReportedTravelId(report.getReportedTravelId());
            dto.setReportedTravelTitle("Travel " + report.getReportedTravelId()); // TODO: Fetch from Travel Service
        }

        if (report.getReviewedBy() != null) {
            dto.setReviewedById(report.getReviewedBy());
            dto.setReviewedByName("Admin " + report.getReviewedBy()); // TODO: Fetch from User Service
        }

        return dto;
    }
}
