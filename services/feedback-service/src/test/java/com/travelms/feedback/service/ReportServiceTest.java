package com.travelms.feedback.service;

import com.travelms.feedback.dto.CreateReportRequest;
import com.travelms.feedback.dto.ReportDTO;
import com.travelms.feedback.model.entity.Report;
import com.travelms.feedback.model.enums.ReportStatus;
import com.travelms.feedback.model.enums.ReportType;
import com.travelms.feedback.repository.ReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Report Service Tests")
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @InjectMocks
    private ReportService reportService;

    private Report sampleReport;
    private CreateReportRequest reportRequest;

    @BeforeEach
    void setUp() {
        sampleReport = Report.builder()
                .id(1L)
                .reporterId(4L)
                .reportType(ReportType.TRAVELER)
                .reportedUserId(5L)
                .reason("Inappropriate behavior")
                .status(ReportStatus.PENDING)
                .build();

        reportRequest = new CreateReportRequest();
        reportRequest.setReportType(ReportType.TRAVELER);
        reportRequest.setReportedUserId(5L);
        reportRequest.setReason("Inappropriate behavior");
    }

    // ==================== CREATE REPORT ====================

    @Test
    @DisplayName("Should create user report successfully")
    void createReport_UserReport_Success() {
        // Arrange
        when(reportRepository.save(any(Report.class))).thenReturn(sampleReport);

        // Act
        ReportDTO result = reportService.createReport(reportRequest, 4L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(4L, result.getReporterId());
        assertEquals(ReportType.TRAVELER, result.getReportType());
        assertEquals(ReportStatus.PENDING, result.getStatus());

        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    @DisplayName("Should create travel report successfully")
    void createReport_TravelReport_Success() {
        // Arrange
        reportRequest.setReportType(ReportType.TRAVEL);
        reportRequest.setReportedUserId(null);
        reportRequest.setReportedTravelId(1L);

        Report travelReport = Report.builder()
                .id(2L)
                .reporterId(4L)
                .reportType(ReportType.TRAVEL)
                .reportedTravelId(1L)
                .reason("Misleading information")
                .status(ReportStatus.PENDING)
                .build();

        when(reportRepository.save(any(Report.class))).thenReturn(travelReport);

        // Act
        ReportDTO result = reportService.createReport(reportRequest, 4L);

        // Assert
        assertNotNull(result);
        assertEquals(ReportType.TRAVEL, result.getReportType());
        assertEquals(1L, result.getReportedTravelId());

        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    @DisplayName("Should throw exception when user ID missing for user report")
    void createReport_MissingUserId() {
        // Arrange
        reportRequest.setReportedUserId(null);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reportService.createReport(reportRequest, 4L)
        );
        assertTrue(exception.getMessage().contains("Reported user ID is required"));

        verify(reportRepository, never()).save(any(Report.class));
    }

    @Test
    @DisplayName("Should throw exception when travel ID missing for travel report")
    void createReport_MissingTravelId() {
        // Arrange
        reportRequest.setReportType(ReportType.TRAVEL);
        reportRequest.setReportedUserId(null);
        reportRequest.setReportedTravelId(null);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                reportService.createReport(reportRequest, 4L)
        );
        assertTrue(exception.getMessage().contains("Reported travel ID is required"));

        verify(reportRepository, never()).save(any(Report.class));
    }

    @Test
    @DisplayName("Should create manager report successfully")
    void createReport_ManagerReport_Success() {
        // Arrange
        reportRequest.setReportType(ReportType.TRAVEL_MANAGER);

        Report managerReport = Report.builder()
                .id(3L)
                .reporterId(4L)
                .reportType(ReportType.TRAVEL_MANAGER)
                .reportedUserId(5L)
                .reason("Poor service")
                .status(ReportStatus.PENDING)
                .build();

        when(reportRepository.save(any(Report.class))).thenReturn(managerReport);

        // Act
        ReportDTO result = reportService.createReport(reportRequest, 4L);

        // Assert
        assertNotNull(result);
        assertEquals(ReportType.TRAVEL_MANAGER, result.getReportType());
        assertEquals(5L, result.getReportedUserId());
    }

    // ==================== REVIEW REPORT ====================

    @Test
    @DisplayName("Should review report successfully")
    void reviewReport_Success() {
        // Arrange
        when(reportRepository.findById(1L)).thenReturn(Optional.of(sampleReport));
        when(reportRepository.save(any(Report.class))).thenReturn(sampleReport);

        // Act
        ReportDTO result = reportService.reviewReport(
                1L, 10L, ReportStatus.RESOLVED, "Action taken"
        );

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertNotNull(result.getReviewedAt());

        verify(reportRepository, times(1)).findById(1L);
        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    @DisplayName("Should reject report successfully")
    void reviewReport_Reject() {
        // Arrange
        when(reportRepository.findById(1L)).thenReturn(Optional.of(sampleReport));
        when(reportRepository.save(any(Report.class))).thenReturn(sampleReport);

        // Act
        ReportDTO result = reportService.reviewReport(
                1L, 10L, ReportStatus.DISMISSED, "No evidence found"
        );

        // Assert
        assertNotNull(result);
        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    @DisplayName("Should throw exception when report not found for review")
    void reviewReport_NotFound() {
        // Arrange
        when(reportRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                reportService.reviewReport(999L, 10L, ReportStatus.RESOLVED, "Notes")
        );

        verify(reportRepository, never()).save(any(Report.class));
    }

    // ==================== GET REPORT ====================

    @Test
    @DisplayName("Should get report DTO by ID successfully")
    void getReportDTOById_Success() {
        // Arrange
        when(reportRepository.findById(1L)).thenReturn(Optional.of(sampleReport));

        // Act
        ReportDTO result = reportService.getReportDTOById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(4L, result.getReporterId());
        assertEquals(5L, result.getReportedUserId());

        verify(reportRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should get report entity by ID successfully")
    void getReportById_Success() {
        // Arrange
        when(reportRepository.findById(1L)).thenReturn(Optional.of(sampleReport));

        // Act
        Report result = reportService.getReportById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(ReportType.TRAVELER, result.getReportType());

        verify(reportRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when report not found by ID")
    void getReportById_NotFound() {
        // Arrange
        when(reportRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                reportService.getReportById(999L)
        );
    }

    // ==================== GET ALL REPORTS ====================

    @Test
    @DisplayName("Should get all reports successfully")
    void getAllReports_Success() {
        // Arrange
        Report report2 = Report.builder()
                .id(2L)
                .reporterId(5L)
                .reportType(ReportType.TRAVEL)
                .reportedTravelId(1L)
                .reason("Spam")
                .status(ReportStatus.PENDING)
                .build();

        when(reportRepository.findAllOrderByCreatedAtDesc())
                .thenReturn(Arrays.asList(sampleReport, report2));

        // Act
        List<ReportDTO> results = reportService.getAllReports();

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());

        verify(reportRepository, times(1)).findAllOrderByCreatedAtDesc();
    }

    @Test
    @DisplayName("Should return empty list when no reports exist")
    void getAllReports_Empty() {
        // Arrange
        when(reportRepository.findAllOrderByCreatedAtDesc()).thenReturn(Arrays.asList());

        // Act
        List<ReportDTO> results = reportService.getAllReports();

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET PENDING REPORTS ====================

    @Test
    @DisplayName("Should get pending reports successfully")
    void getPendingReports_Success() {
        // Arrange
        Report pendingReport2 = Report.builder()
                .id(2L)
                .reporterId(5L)
                .reportType(ReportType.TRAVEL)
                .status(ReportStatus.PENDING)
                .build();

        when(reportRepository.findPendingReports())
                .thenReturn(Arrays.asList(sampleReport, pendingReport2));

        // Act
        List<ReportDTO> results = reportService.getPendingReports();

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(r -> r.getStatus() == ReportStatus.PENDING));

        verify(reportRepository, times(1)).findPendingReports();
    }

    @Test
    @DisplayName("Should return empty list when no pending reports")
    void getPendingReports_Empty() {
        // Arrange
        when(reportRepository.findPendingReports()).thenReturn(Arrays.asList());

        // Act
        List<ReportDTO> results = reportService.getPendingReports();

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET USER REPORTS ====================

    @Test
    @DisplayName("Should get reports by user successfully")
    void getUserReports_Success() {
        // Arrange
        Report report2 = Report.builder()
                .id(2L)
                .reporterId(4L)
                .reportType(ReportType.TRAVEL)
                .reportedTravelId(1L)
                .status(ReportStatus.PENDING)
                .build();

        when(reportRepository.findByReporterId(4L))
                .thenReturn(Arrays.asList(sampleReport, report2));

        // Act
        List<ReportDTO> results = reportService.getUserReports(4L);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(r -> r.getReporterId() == 4L));

        verify(reportRepository, times(1)).findByReporterId(4L);
    }

    @Test
    @DisplayName("Should return empty list when user has no reports")
    void getUserReports_Empty() {
        // Arrange
        when(reportRepository.findByReporterId(999L)).thenReturn(Arrays.asList());

        // Act
        List<ReportDTO> results = reportService.getUserReports(999L);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET REPORTS AGAINST USER ====================

    @Test
    @DisplayName("Should get reports against user successfully")
    void getReportsAgainstUser_Success() {
        // Arrange
        Report report2 = Report.builder()
                .id(2L)
                .reporterId(6L)
                .reportType(ReportType.TRAVELER)
                .reportedUserId(5L)
                .status(ReportStatus.PENDING)
                .build();

        when(reportRepository.findByReportedUserId(5L))
                .thenReturn(Arrays.asList(sampleReport, report2));

        // Act
        List<ReportDTO> results = reportService.getReportsAgainstUser(5L);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(r -> r.getReportedUserId() == 5L));

        verify(reportRepository, times(1)).findByReportedUserId(5L);
    }

    @Test
    @DisplayName("Should return empty list when no reports against user")
    void getReportsAgainstUser_Empty() {
        // Arrange
        when(reportRepository.findByReportedUserId(999L)).thenReturn(Arrays.asList());

        // Act
        List<ReportDTO> results = reportService.getReportsAgainstUser(999L);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== COUNT REPORTS ====================

    @Test
    @DisplayName("Should count reports by manager ID")
    void countReportsByManagerId_Success() {
        // Arrange
        when(reportRepository.countReportsByManagerId(2L)).thenReturn(5L);

        // Act
        Long result = reportService.countReportsByManagerId(2L);

        // Assert
        assertNotNull(result);
        assertEquals(5L, result);

        verify(reportRepository, times(1)).countReportsByManagerId(2L);
    }

    @Test
    @DisplayName("Should count reports by status")
    void countByStatus_Success() {
        // Arrange
        when(reportRepository.countByStatus(ReportStatus.PENDING)).thenReturn(10L);

        // Act
        Long result = reportService.countByStatus(ReportStatus.PENDING);

        // Assert
        assertNotNull(result);
        assertEquals(10L, result);

        verify(reportRepository, times(1)).countByStatus(ReportStatus.PENDING);
    }

    @Test
    @DisplayName("Should return zero when no reports for manager")
    void countReportsByManagerId_Zero() {
        // Arrange
        when(reportRepository.countReportsByManagerId(999L)).thenReturn(0L);

        // Act
        Long result = reportService.countReportsByManagerId(999L);

        // Assert
        assertNotNull(result);
        assertEquals(0L, result);
    }

    // ==================== DELETE ALL USER REPORTS ====================

    @Test
    @DisplayName("Should cascade delete all user reports successfully")
    void deleteAllReportsByUser_Success() {
        // Arrange
        Report report2 = Report.builder()
                .id(2L)
                .reporterId(4L)
                .reportType(ReportType.TRAVEL)
                .build();

        when(reportRepository.findByReporterId(4L))
                .thenReturn(Arrays.asList(sampleReport, report2));
        doNothing().when(reportRepository).delete(any(Report.class));

        // Act
        reportService.deleteAllReportsByUser(4L);

        // Assert
        verify(reportRepository, times(1)).findByReporterId(4L);
        verify(reportRepository, times(2)).delete(any(Report.class));
    }

    @Test
    @DisplayName("Should handle empty reports list during cascade delete")
    void deleteAllReportsByUser_NoReports() {
        // Arrange
        when(reportRepository.findByReporterId(999L)).thenReturn(Arrays.asList());

        // Act
        reportService.deleteAllReportsByUser(999L);

        // Assert
        verify(reportRepository, times(1)).findByReporterId(999L);
        verify(reportRepository, never()).delete(any(Report.class));
    }
}
