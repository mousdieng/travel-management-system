package com.travelms.feedback.repository;

import com.travelms.feedback.model.entity.Report;
import com.travelms.feedback.model.enums.ReportStatus;
import com.travelms.feedback.model.enums.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByReporterId(Long reporterId);

    List<Report> findByReportedUserId(Long reportedUserId);

    List<Report> findByStatus(ReportStatus status);

    List<Report> findByReportType(ReportType reportType);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.reportedUserId = :userId AND r.reportType = 'TRAVEL_MANAGER'")
    Long countReportsByManagerId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.reporterId = :userId")
    Long countReportsByReporterId(@Param("userId") Long userId);

    @Query("SELECT r FROM Report r ORDER BY r.createdAt DESC")
    List<Report> findAllOrderByCreatedAtDesc();

    @Query("SELECT r FROM Report r WHERE r.status = 'PENDING' ORDER BY r.createdAt ASC")
    List<Report> findPendingReports();

    @Query("SELECT COUNT(r) FROM Report r WHERE r.status = :status")
    Long countByStatus(@Param("status") ReportStatus status);

    @Query("SELECT r.reportType, COUNT(r) FROM Report r GROUP BY r.reportType")
    List<Object[]> countByReportType();
}
