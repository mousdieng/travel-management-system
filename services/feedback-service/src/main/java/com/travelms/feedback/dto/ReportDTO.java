package com.travelms.feedback.dto;

import com.travelms.feedback.model.enums.ReportStatus;
import com.travelms.feedback.model.enums.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {

    private Long id;
    private Long reporterId;
    private String reporterName;
    private ReportType reportType;
    private Long reportedUserId;
    private String reportedUserName;
    private Long reportedTravelId;
    private String reportedTravelTitle;
    private String reason;
    private ReportStatus status;
    private String adminNotes;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
}
