package com.travelms.feedback.service;

import com.travelms.feedback.dto.FeedbackDTO;
import com.travelms.feedback.dto.admin.*;
import com.travelms.feedback.model.entity.Feedback;
import com.travelms.feedback.repository.FeedbackRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Feedback Service Tests")
class AdminFeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private FeedbackService feedbackService;

    @InjectMocks
    private AdminFeedbackService adminFeedbackService;

    private Feedback feedback1;
    private Feedback feedback2;
    private Feedback feedback3;

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.now();

        feedback1 = Feedback.builder()
                .id(1L)
                .travelerId(4L)
                .travelId(1L)
                .rating(5)
                .comment("Excellent travel!")
                .createdAt(now.minusDays(5))
                .build();

        feedback2 = Feedback.builder()
                .id(2L)
                .travelerId(5L)
                .travelId(1L)
                .rating(4)
                .comment("Good experience")
                .createdAt(now.minusDays(3))
                .build();

        feedback3 = Feedback.builder()
                .id(3L)
                .travelerId(6L)
                .travelId(2L)
                .rating(3)
                .comment("Average")
                .createdAt(now.minusDays(1))
                .build();
    }

    // ==================== GET FEEDBACKS GROUPED BY TRAVEL ====================

    @Test
    @DisplayName("Should group feedbacks by travel successfully")
    void getFeedbacksGroupedByTravel_Success() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act
        List<TravelFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByTravel(
                null, null, null, null
        );

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size()); // 2 unique travels

        // First group should have highest average rating (Travel 1)
        TravelFeedbackGroupDTO firstGroup = results.get(0);
        assertEquals(1L, firstGroup.getTravelId());
        assertEquals(2, firstGroup.getTotalFeedbacks());
        assertTrue(firstGroup.getAverageRating() > 4.0);

        verify(feedbackRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should filter by rating when grouping by travel")
    void getFeedbacksGroupedByTravel_FilterByRating() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act - Filter for rating 5 only
        List<TravelFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByTravel(
                5, null, null, null
        );

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size()); // Only travel 1 with rating 5

        TravelFeedbackGroupDTO group = results.get(0);
        assertEquals(1, group.getTotalFeedbacks()); // Only feedback1
        assertEquals(5.0, group.getAverageRating());
    }

    @Test
    @DisplayName("Should filter by date range when grouping by travel")
    void getFeedbacksGroupedByTravel_FilterByDateRange() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        LocalDateTime dateFrom = LocalDateTime.now().minusDays(4);
        LocalDateTime dateTo = LocalDateTime.now();

        // Act
        List<TravelFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByTravel(
                null, null, dateFrom.toString(), dateTo.toString()
        );

        // Assert
        assertNotNull(results);
        // Should exclude feedback1 (5 days ago)
        assertTrue(results.stream()
                .allMatch(g -> g.getTotalFeedbacks() <= 2));
    }

    @Test
    @DisplayName("Should calculate rating distribution correctly")
    void getFeedbacksGroupedByTravel_RatingDistribution() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act
        List<TravelFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByTravel(
                null, null, null, null
        );

        // Assert
        assertNotNull(results);

        TravelFeedbackGroupDTO travel1Group = results.stream()
                .filter(g -> g.getTravelId() == 1L)
                .findFirst()
                .orElseThrow();

        assertEquals(1, travel1Group.getRating5Count());
        assertEquals(1, travel1Group.getRating4Count());
        assertEquals(0, travel1Group.getRating3Count());
    }

    @Test
    @DisplayName("Should limit recent feedbacks to 5")
    void getFeedbacksGroupedByTravel_LimitRecentFeedbacks() {
        // Arrange
        Feedback f4 = Feedback.builder().id(4L).travelId(1L).rating(5).createdAt(LocalDateTime.now()).build();
        Feedback f5 = Feedback.builder().id(5L).travelId(1L).rating(5).createdAt(LocalDateTime.now()).build();
        Feedback f6 = Feedback.builder().id(6L).travelId(1L).rating(5).createdAt(LocalDateTime.now()).build();
        Feedback f7 = Feedback.builder().id(7L).travelId(1L).rating(5).createdAt(LocalDateTime.now()).build();

        when(feedbackRepository.findAll()).thenReturn(
                Arrays.asList(feedback1, feedback2, f4, f5, f6, f7)
        );

        // Act
        List<TravelFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByTravel(
                null, null, null, null
        );

        // Assert
        assertNotNull(results);
        TravelFeedbackGroupDTO travel1Group = results.get(0);

        // Should only have 5 recent feedbacks, not 6
        assertEquals(5, travel1Group.getRecentFeedbacks().size());
    }

    @Test
    @DisplayName("Should return empty list when no feedbacks exist")
    void getFeedbacksGroupedByTravel_NoFeedbacks() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<TravelFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByTravel(
                null, null, null, null
        );

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET FEEDBACKS GROUPED BY MANAGER ====================

    @Test
    @DisplayName("Should group feedbacks by manager successfully")
    void getFeedbacksGroupedByManager_Success() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act
        List<ManagerFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByManager(
                null, null, null
        );

        // Assert
        assertNotNull(results);
        assertFalse(results.isEmpty());

        ManagerFeedbackGroupDTO managerGroup = results.get(0);
        assertNotNull(managerGroup.getManagerId());
        assertTrue(managerGroup.getTotalFeedbacks() > 0);
        assertTrue(managerGroup.getAverageRating() >= 0);
        assertNotNull(managerGroup.getTravelFeedbacks());

        verify(feedbackRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should filter by rating when grouping by manager")
    void getFeedbacksGroupedByManager_FilterByRating() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act - Filter for rating 5 only
        List<ManagerFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByManager(
                5, null, null
        );

        // Assert
        assertNotNull(results);
        assertFalse(results.isEmpty());

        // Total feedbacks should only include rating 5
        long totalFeedbacks = results.stream()
                .mapToLong(ManagerFeedbackGroupDTO::getTotalFeedbacks)
                .sum();
        assertEquals(1, totalFeedbacks); // Only feedback1
    }

    @Test
    @DisplayName("Should filter by date range when grouping by manager")
    void getFeedbacksGroupedByManager_FilterByDateRange() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        LocalDateTime dateFrom = LocalDateTime.now().minusDays(4);
        LocalDateTime dateTo = LocalDateTime.now();

        // Act
        List<ManagerFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByManager(
                null, dateFrom.toString(), dateTo.toString()
        );

        // Assert
        assertNotNull(results);
        // Should exclude feedback1 (5 days ago)
        long totalFeedbacks = results.stream()
                .mapToLong(ManagerFeedbackGroupDTO::getTotalFeedbacks)
                .sum();
        assertEquals(2, totalFeedbacks); // feedback2 and feedback3
    }

    @Test
    @DisplayName("Should calculate manager statistics correctly")
    void getFeedbacksGroupedByManager_Statistics() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act
        List<ManagerFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByManager(
                null, null, null
        );

        // Assert
        assertNotNull(results);

        for (ManagerFeedbackGroupDTO manager : results) {
            assertTrue(manager.getTotalTravels() > 0);
            assertTrue(manager.getTotalFeedbacks() > 0);
            assertTrue(manager.getAverageRating() >= 0);

            // Rating counts should sum to total feedbacks
            int ratingSum = manager.getRating1Count() + manager.getRating2Count() +
                    manager.getRating3Count() + manager.getRating4Count() + manager.getRating5Count();
            assertEquals(manager.getTotalFeedbacks(), ratingSum);
        }
    }

    @Test
    @DisplayName("Should include travel summaries for manager")
    void getFeedbacksGroupedByManager_TravelSummaries() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act
        List<ManagerFeedbackGroupDTO> results = adminFeedbackService.getFeedbacksGroupedByManager(
                null, null, null
        );

        // Assert
        assertNotNull(results);

        for (ManagerFeedbackGroupDTO manager : results) {
            assertNotNull(manager.getTravelFeedbacks());
            assertFalse(manager.getTravelFeedbacks().isEmpty());

            for (TravelFeedbackSummaryDTO travel : manager.getTravelFeedbacks()) {
                assertNotNull(travel.getTravelId());
                assertTrue(travel.getFeedbackCount() > 0);
                assertTrue(travel.getAverageRating() >= 0);
            }
        }
    }

    // ==================== GET FEEDBACK STATISTICS ====================

    @Test
    @DisplayName("Should calculate feedback statistics successfully")
    void getFeedbackStatistics_Success() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act
        FeedbackStatisticsDTO result = adminFeedbackService.getFeedbackStatistics();

        // Assert
        assertNotNull(result);
        assertEquals(3L, result.getTotalFeedbacks());
        assertTrue(result.getAverageRating() > 0);
        assertEquals(2L, result.getTotalTravelsWithFeedback()); // 2 unique travels

        // Rating counts
        assertEquals(0, result.getRating1Count());
        assertEquals(0, result.getRating2Count());
        assertEquals(1, result.getRating3Count());
        assertEquals(1, result.getRating4Count());
        assertEquals(1, result.getRating5Count());

        verify(feedbackRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should calculate rating percentages correctly")
    void getFeedbackStatistics_Percentages() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(feedback1, feedback2, feedback3));

        // Act
        FeedbackStatisticsDTO result = adminFeedbackService.getFeedbackStatistics();

        // Assert
        assertNotNull(result);

        // Percentages should sum to approximately 100%
        double totalPercentage = result.getRating1Percentage() +
                result.getRating2Percentage() +
                result.getRating3Percentage() +
                result.getRating4Percentage() +
                result.getRating5Percentage();

        assertTrue(totalPercentage >= 99.0 && totalPercentage <= 101.0);

        // Each rating represents 33.3% (1 out of 3)
        assertTrue(result.getRating3Percentage() > 30.0 && result.getRating3Percentage() < 35.0);
        assertTrue(result.getRating4Percentage() > 30.0 && result.getRating4Percentage() < 35.0);
        assertTrue(result.getRating5Percentage() > 30.0 && result.getRating5Percentage() < 35.0);
    }

    @Test
    @DisplayName("Should handle empty feedbacks list")
    void getFeedbackStatistics_NoFeedbacks() {
        // Arrange
        when(feedbackRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        FeedbackStatisticsDTO result = adminFeedbackService.getFeedbackStatistics();

        // Assert
        assertNotNull(result);
        assertEquals(0L, result.getTotalFeedbacks());
        assertEquals(0.0, result.getAverageRating());
        assertEquals(0L, result.getTotalTravelsWithFeedback());

        // All counts should be 0
        assertEquals(0, result.getRating1Count());
        assertEquals(0, result.getRating2Count());
        assertEquals(0, result.getRating3Count());
        assertEquals(0, result.getRating4Count());
        assertEquals(0, result.getRating5Count());

        // All percentages should be 0
        assertEquals(0.0, result.getRating1Percentage());
        assertEquals(0.0, result.getRating2Percentage());
        assertEquals(0.0, result.getRating3Percentage());
        assertEquals(0.0, result.getRating4Percentage());
        assertEquals(0.0, result.getRating5Percentage());
    }

    @Test
    @DisplayName("Should count unique travels correctly")
    void getFeedbackStatistics_UniqueTravels() {
        // Arrange
        Feedback feedback4 = Feedback.builder()
                .id(4L)
                .travelerId(7L)
                .travelId(1L) // Same travel as feedback1 and feedback2
                .rating(5)
                .createdAt(LocalDateTime.now())
                .build();

        when(feedbackRepository.findAll()).thenReturn(
                Arrays.asList(feedback1, feedback2, feedback3, feedback4)
        );

        // Act
        FeedbackStatisticsDTO result = adminFeedbackService.getFeedbackStatistics();

        // Assert
        assertNotNull(result);
        assertEquals(4L, result.getTotalFeedbacks());
        assertEquals(2L, result.getTotalTravelsWithFeedback()); // Still 2 unique travels
    }

    // ==================== CREATE FEEDBACK FOR USER (ADMIN) ====================

    @Test
    @DisplayName("Should create feedback for user as admin successfully")
    void createFeedbackForUser_Success() {
        // Arrange
        when(feedbackRepository.existsByTravelerIdAndTravelId(4L, 1L)).thenReturn(false);
        when(feedbackRepository.save(any(Feedback.class))).thenReturn(feedback1);

        FeedbackDTO expectedDTO = FeedbackDTO.builder()
                .id(1L)
                .travelerId(4L)
                .travelId(1L)
                .rating(5)
                .comment("Excellent travel!")
                .build();

        when(feedbackService.getFeedbackDTOById(1L)).thenReturn(expectedDTO);

        // Act
        FeedbackDTO result = adminFeedbackService.createFeedbackForUser(
                4L, 1L, 5, "Excellent travel!"
        );

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(4L, result.getTravelerId());
        assertEquals(5, result.getRating());

        verify(feedbackRepository, times(1)).existsByTravelerIdAndTravelId(4L, 1L);
        verify(feedbackRepository, times(1)).save(any(Feedback.class));
        verify(feedbackService, times(1)).getFeedbackDTOById(1L);
    }

    @Test
    @DisplayName("Should throw exception when user already has feedback")
    void createFeedbackForUser_AlreadyExists() {
        // Arrange
        when(feedbackRepository.existsByTravelerIdAndTravelId(4L, 1L)).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                adminFeedbackService.createFeedbackForUser(4L, 1L, 5, "Comment")
        );
        assertTrue(exception.getMessage().contains("already submitted feedback"));

        verify(feedbackRepository, never()).save(any(Feedback.class));
    }

    // ==================== UPDATE FEEDBACK FOR USER (ADMIN) ====================

    @Test
    @DisplayName("Should update feedback as admin successfully")
    void updateFeedbackForUser_Success() {
        // Arrange
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback1));
        when(feedbackRepository.save(any(Feedback.class))).thenReturn(feedback1);

        FeedbackDTO expectedDTO = FeedbackDTO.builder()
                .id(1L)
                .rating(4)
                .comment("Updated comment")
                .build();

        when(feedbackService.getFeedbackDTOById(1L)).thenReturn(expectedDTO);

        // Act
        FeedbackDTO result = adminFeedbackService.updateFeedbackForUser(
                1L, 4, "Updated comment"
        );

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(4, result.getRating());
        assertEquals("Updated comment", result.getComment());

        verify(feedbackRepository, times(1)).findById(1L);
        verify(feedbackRepository, times(1)).save(any(Feedback.class));
        verify(feedbackService, times(1)).getFeedbackDTOById(1L);
    }

    @Test
    @DisplayName("Should throw exception when feedback not found for update")
    void updateFeedbackForUser_NotFound() {
        // Arrange
        when(feedbackRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                adminFeedbackService.updateFeedbackForUser(999L, 4, "Comment")
        );

        verify(feedbackRepository, never()).save(any(Feedback.class));
    }

    // ==================== DELETE FEEDBACK AS ADMIN ====================

    @Test
    @DisplayName("Should delete feedback as admin successfully")
    void deleteFeedbackAsAdmin_Success() {
        // Arrange
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback1));
        doNothing().when(feedbackRepository).delete(any(Feedback.class));

        // Act
        adminFeedbackService.deleteFeedbackAsAdmin(1L);

        // Assert
        verify(feedbackRepository, times(1)).findById(1L);
        verify(feedbackRepository, times(1)).delete(feedback1);
    }

    @Test
    @DisplayName("Should throw exception when feedback not found for delete")
    void deleteFeedbackAsAdmin_NotFound() {
        // Arrange
        when(feedbackRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                adminFeedbackService.deleteFeedbackAsAdmin(999L)
        );

        verify(feedbackRepository, never()).delete(any(Feedback.class));
    }
}
