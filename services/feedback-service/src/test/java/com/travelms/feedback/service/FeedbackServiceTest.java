package com.travelms.feedback.service;

import com.travelms.feedback.dto.CreateFeedbackRequest;
import com.travelms.feedback.dto.FeedbackDTO;
import com.travelms.feedback.integration.TravelServiceClient;
import com.travelms.feedback.integration.UserServiceClient;
import com.travelms.feedback.model.entity.Feedback;
import com.travelms.feedback.repository.FeedbackRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feedback Service Tests")
class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private TravelServiceClient travelServiceClient;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private FeedbackService feedbackService;

    private Feedback sampleFeedback;
    private CreateFeedbackRequest feedbackRequest;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(feedbackService, "feedbackChangedTopic", "feedback-changed-topic");

        sampleFeedback = Feedback.builder()
                .id(1L)
                .travelerId(4L)
                .travelId(1L)
                .rating(5)
                .comment("Amazing travel experience!")
                .build();

        feedbackRequest = new CreateFeedbackRequest();
        feedbackRequest.setTravelId(1L);
        feedbackRequest.setRating(5);
        feedbackRequest.setComment("Amazing travel experience!");

        // Mock Kafka template to return successful future (lenient as not all tests trigger Kafka events)
        lenient().when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenReturn(CompletableFuture.completedFuture(null));
    }

    // ==================== SUBMIT FEEDBACK ====================

    @Test
    @DisplayName("Should submit feedback successfully")
    void submitFeedback_Success() {
        // Arrange
        when(feedbackRepository.existsByTravelerIdAndTravelId(4L, 1L)).thenReturn(false);
        when(feedbackRepository.save(any(Feedback.class))).thenReturn(sampleFeedback);
        when(userServiceClient.getUserName(4L)).thenReturn("Alice Johnson");
        when(travelServiceClient.getTravelTitle(1L)).thenReturn("Paris Weekend");

        // Act
        FeedbackDTO result = feedbackService.submitFeedback(feedbackRequest, 4L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(4L, result.getTravelerId());
        assertEquals(5, result.getRating());
        assertEquals("Amazing travel experience!", result.getComment());

        verify(feedbackRepository, times(1)).existsByTravelerIdAndTravelId(4L, 1L);
        verify(feedbackRepository, times(1)).save(any(Feedback.class));
        verify(kafkaTemplate, times(1)).send(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Should throw exception when already submitted feedback")
    void submitFeedback_AlreadySubmitted() {
        // Arrange
        when(feedbackRepository.existsByTravelerIdAndTravelId(4L, 1L)).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                feedbackService.submitFeedback(feedbackRequest, 4L)
        );
        assertTrue(exception.getMessage().contains("already submitted feedback"));

        verify(feedbackRepository, never()).save(any(Feedback.class));
    }

    // ==================== UPDATE FEEDBACK ====================

    @Test
    @DisplayName("Should update feedback successfully")
    void updateFeedback_Success() {
        // Arrange
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(sampleFeedback));
        when(feedbackRepository.save(any(Feedback.class))).thenReturn(sampleFeedback);
        when(userServiceClient.getUserName(4L)).thenReturn("Alice Johnson");
        when(travelServiceClient.getTravelTitle(1L)).thenReturn("Paris Weekend");
        when(feedbackRepository.getAverageRatingByTravelId(1L)).thenReturn(5.0);
        when(feedbackRepository.countByTravelId(1L)).thenReturn(1L);
        doNothing().when(travelServiceClient).updateTravelRating(anyLong(), anyDouble(), anyInt());

        feedbackRequest.setRating(4);
        feedbackRequest.setComment("Updated comment");

        // Act
        FeedbackDTO result = feedbackService.updateFeedback(1L, feedbackRequest, 4L);

        // Assert
        assertNotNull(result);
        verify(feedbackRepository, times(1)).findById(1L);
        verify(feedbackRepository, times(1)).save(any(Feedback.class));
        verify(travelServiceClient, times(1)).updateTravelRating(anyLong(), anyDouble(), anyInt());
        verify(kafkaTemplate, times(1)).send(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Should throw exception when non-owner tries to update feedback")
    void updateFeedback_NotOwner() {
        // Arrange
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(sampleFeedback));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                feedbackService.updateFeedback(1L, feedbackRequest, 999L)
        );
        assertTrue(exception.getMessage().contains("your own feedback"));

        verify(feedbackRepository, never()).save(any(Feedback.class));
    }

    @Test
    @DisplayName("Should throw exception when feedback not found for update")
    void updateFeedback_NotFound() {
        // Arrange
        when(feedbackRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                feedbackService.updateFeedback(999L, feedbackRequest, 4L)
        );

        verify(feedbackRepository, never()).save(any(Feedback.class));
    }

    // ==================== DELETE FEEDBACK ====================

    @Test
    @DisplayName("Should delete feedback successfully")
    void deleteFeedback_Success() {
        // Arrange
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(sampleFeedback));
        doNothing().when(feedbackRepository).delete(any(Feedback.class));
        when(feedbackRepository.getAverageRatingByTravelId(1L)).thenReturn(0.0);
        when(feedbackRepository.countByTravelId(1L)).thenReturn(0L);
        doNothing().when(travelServiceClient).updateTravelRating(anyLong(), anyDouble(), anyInt());

        // Act
        feedbackService.deleteFeedback(1L, 4L);

        // Assert
        verify(feedbackRepository, times(1)).findById(1L);
        verify(feedbackRepository, times(1)).delete(sampleFeedback);
        verify(travelServiceClient, times(1)).updateTravelRating(anyLong(), anyDouble(), anyInt());
        verify(kafkaTemplate, times(1)).send(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Should throw exception when non-owner tries to delete feedback")
    void deleteFeedback_NotOwner() {
        // Arrange
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(sampleFeedback));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                feedbackService.deleteFeedback(1L, 999L)
        );
        assertTrue(exception.getMessage().contains("your own feedback"));

        verify(feedbackRepository, never()).delete(any(Feedback.class));
    }

    @Test
    @DisplayName("Should throw exception when feedback not found for delete")
    void deleteFeedback_NotFound() {
        // Arrange
        when(feedbackRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                feedbackService.deleteFeedback(999L, 4L)
        );

        verify(feedbackRepository, never()).delete(any(Feedback.class));
    }

    // ==================== GET FEEDBACK ====================

    @Test
    @DisplayName("Should get feedback DTO by ID successfully")
    void getFeedbackDTOById_Success() {
        // Arrange
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(sampleFeedback));
        when(userServiceClient.getUserName(4L)).thenReturn("Alice Johnson");
        when(travelServiceClient.getTravelTitle(1L)).thenReturn("Paris Weekend");

        // Act
        FeedbackDTO result = feedbackService.getFeedbackDTOById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Alice Johnson", result.getTravelerName());
        assertEquals("Paris Weekend", result.getTravelTitle());

        verify(feedbackRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should get feedback entity by ID successfully")
    void getFeedbackById_Success() {
        // Arrange
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(sampleFeedback));

        // Act
        Feedback result = feedbackService.getFeedbackById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(4L, result.getTravelerId());

        verify(feedbackRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when feedback not found by ID")
    void getFeedbackById_NotFound() {
        // Arrange
        when(feedbackRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                feedbackService.getFeedbackById(999L)
        );
    }

    // ==================== GET TRAVEL FEEDBACKS ====================

    @Test
    @DisplayName("Should get all feedbacks for a travel")
    void getTravelFeedbacks_Success() {
        // Arrange
        Feedback feedback2 = Feedback.builder()
                .id(2L)
                .travelerId(5L)
                .travelId(1L)
                .rating(4)
                .comment("Good experience")
                .build();

        when(feedbackRepository.findByTravelId(1L)).thenReturn(Arrays.asList(sampleFeedback, feedback2));
        when(userServiceClient.getUserName(anyLong())).thenReturn("User");
        when(travelServiceClient.getTravelTitle(1L)).thenReturn("Paris Weekend");

        // Act
        List<FeedbackDTO> results = feedbackService.getTravelFeedbacks(1L);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());

        verify(feedbackRepository, times(1)).findByTravelId(1L);
    }

    @Test
    @DisplayName("Should return empty list when travel has no feedbacks")
    void getTravelFeedbacks_Empty() {
        // Arrange
        when(feedbackRepository.findByTravelId(999L)).thenReturn(Arrays.asList());

        // Act
        List<FeedbackDTO> results = feedbackService.getTravelFeedbacks(999L);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET USER FEEDBACKS ====================

    @Test
    @DisplayName("Should get all feedbacks by a user")
    void getUserFeedbacks_Success() {
        // Arrange
        Feedback feedback2 = Feedback.builder()
                .id(2L)
                .travelerId(4L)
                .travelId(2L)
                .rating(4)
                .comment("Another review")
                .build();

        when(feedbackRepository.findByTravelerId(4L)).thenReturn(Arrays.asList(sampleFeedback, feedback2));
        when(userServiceClient.getUserName(4L)).thenReturn("Alice Johnson");
        when(travelServiceClient.getTravelTitle(anyLong())).thenReturn("Travel");

        // Act
        List<FeedbackDTO> results = feedbackService.getUserFeedbacks(4L);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());

        verify(feedbackRepository, times(1)).findByTravelerId(4L);
    }

    @Test
    @DisplayName("Should return empty list when user has no feedbacks")
    void getUserFeedbacks_Empty() {
        // Arrange
        when(feedbackRepository.findByTravelerId(999L)).thenReturn(Arrays.asList());

        // Act
        List<FeedbackDTO> results = feedbackService.getUserFeedbacks(999L);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET ALL FEEDBACKS ====================

    @Test
    @DisplayName("Should get all feedbacks")
    void getAllFeedbacks_Success() {
        // Arrange
        Feedback feedback2 = Feedback.builder()
                .id(2L)
                .travelerId(5L)
                .travelId(2L)
                .rating(4)
                .build();

        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(sampleFeedback, feedback2));
        when(userServiceClient.getUserName(anyLong())).thenReturn("User");
        when(travelServiceClient.getTravelTitle(anyLong())).thenReturn("Travel");

        // Act
        List<FeedbackDTO> results = feedbackService.getAllFeedbacks();

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());

        verify(feedbackRepository, times(1)).findAll();
    }

    // ==================== GET MANAGER TRAVEL FEEDBACKS ====================

    @Test
    @DisplayName("Should get feedbacks for manager's travels")
    void getManagerTravelsFeedbacks_Success() {
        // Arrange
        List<Long> managerTravelIds = Arrays.asList(1L, 2L);
        when(travelServiceClient.getManagerTravelIds(2L)).thenReturn(managerTravelIds);
        when(feedbackRepository.findByTravelIdIn(managerTravelIds))
                .thenReturn(Arrays.asList(sampleFeedback));
        when(userServiceClient.getUserName(4L)).thenReturn("Alice Johnson");
        when(travelServiceClient.getTravelTitle(1L)).thenReturn("Paris Weekend");

        // Act
        List<FeedbackDTO> results = feedbackService.getManagerTravelsFeedbacks(2L);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());

        verify(travelServiceClient, times(1)).getManagerTravelIds(2L);
        verify(feedbackRepository, times(1)).findByTravelIdIn(managerTravelIds);
    }

    @Test
    @DisplayName("Should return empty list when manager has no travels")
    void getManagerTravelsFeedbacks_NoTravels() {
        // Arrange
        when(travelServiceClient.getManagerTravelIds(999L)).thenReturn(Arrays.asList());

        // Act
        List<FeedbackDTO> results = feedbackService.getManagerTravelsFeedbacks(999L);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());

        verify(feedbackRepository, never()).findByTravelIdIn(anyList());
    }

    // ==================== GET STATISTICS ====================

    @Test
    @DisplayName("Should get average rating by travel ID")
    void getAverageRatingByTravelId_Success() {
        // Arrange
        when(feedbackRepository.getAverageRatingByTravelId(1L)).thenReturn(4.5);

        // Act
        Double result = feedbackService.getAverageRatingByTravelId(1L);

        // Assert
        assertNotNull(result);
        assertEquals(4.5, result);

        verify(feedbackRepository, times(1)).getAverageRatingByTravelId(1L);
    }

    @Test
    @DisplayName("Should return 0.0 when no ratings exist")
    void getAverageRatingByTravelId_NoRatings() {
        // Arrange
        when(feedbackRepository.getAverageRatingByTravelId(999L)).thenReturn(null);

        // Act
        Double result = feedbackService.getAverageRatingByTravelId(999L);

        // Assert
        assertNotNull(result);
        assertEquals(0.0, result);
    }

    @Test
    @DisplayName("Should get feedback count by travel ID")
    void getFeedbackCountByTravelId_Success() {
        // Arrange
        when(feedbackRepository.countByTravelId(1L)).thenReturn(10L);

        // Act
        Long result = feedbackService.getFeedbackCountByTravelId(1L);

        // Assert
        assertNotNull(result);
        assertEquals(10L, result);

        verify(feedbackRepository, times(1)).countByTravelId(1L);
    }

    // ==================== DELETE ALL USER FEEDBACKS ====================

    @Test
    @DisplayName("Should cascade delete all user feedbacks successfully")
    void deleteAllFeedbacksByUser_Success() {
        // Arrange
        Feedback feedback2 = Feedback.builder()
                .id(2L)
                .travelerId(4L)
                .travelId(2L)
                .rating(4)
                .build();

        when(feedbackRepository.findByTravelerId(4L)).thenReturn(Arrays.asList(sampleFeedback, feedback2));
        doNothing().when(feedbackRepository).delete(any(Feedback.class));
        when(feedbackRepository.getAverageRatingByTravelId(anyLong())).thenReturn(4.0);
        when(feedbackRepository.countByTravelId(anyLong())).thenReturn(1L);
        doNothing().when(travelServiceClient).updateTravelRating(anyLong(), anyDouble(), anyInt());

        // Act
        feedbackService.deleteAllFeedbacksByUser(4L);

        // Assert
        verify(feedbackRepository, times(1)).findByTravelerId(4L);
        verify(feedbackRepository, times(2)).delete(any(Feedback.class));
        verify(travelServiceClient, times(2)).updateTravelRating(anyLong(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("Should handle empty feedbacks list during cascade delete")
    void deleteAllFeedbacksByUser_NoFeedbacks() {
        // Arrange
        when(feedbackRepository.findByTravelerId(999L)).thenReturn(Arrays.asList());

        // Act
        feedbackService.deleteAllFeedbacksByUser(999L);

        // Assert
        verify(feedbackRepository, times(1)).findByTravelerId(999L);
        verify(feedbackRepository, never()).delete(any(Feedback.class));
        verify(travelServiceClient, never()).updateTravelRating(anyLong(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("Should continue cascade delete even if rating update fails")
    void deleteAllFeedbacksByUser_RatingUpdateFails() {
        // Arrange
        when(feedbackRepository.findByTravelerId(4L)).thenReturn(Arrays.asList(sampleFeedback));
        doNothing().when(feedbackRepository).delete(any(Feedback.class));
        doThrow(new RuntimeException("Travel service unavailable"))
                .when(travelServiceClient).updateTravelRating(anyLong(), anyDouble(), anyInt());

        // Act - Should not throw exception
        assertDoesNotThrow(() -> feedbackService.deleteAllFeedbacksByUser(4L));

        // Assert
        verify(feedbackRepository, times(1)).delete(any(Feedback.class));
    }
}
