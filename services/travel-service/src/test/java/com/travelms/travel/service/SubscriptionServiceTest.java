package com.travelms.travel.service;

import com.travelms.travel.dto.CreateSubscriptionRequest;
import com.travelms.travel.dto.SubscriptionDTO;
import com.travelms.travel.exception.BadRequestException;
import com.travelms.travel.exception.ResourceNotFoundException;
import com.travelms.travel.model.entity.Subscription;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.model.enums.SubscriptionStatus;
import com.travelms.travel.repository.jpa.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Subscription Service Tests")
class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private TravelService travelService;

    @Mock
    private Neo4jSyncService neo4jSyncService;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private Travel sampleTravel;
    private Subscription sampleSubscription;
    private CreateSubscriptionRequest subscriptionRequest;

    @BeforeEach
    void setUp() {
        sampleTravel = Travel.builder()
                .id(1L)
                .title("Paris Weekend")
                .price(BigDecimal.valueOf(1299.99))
                .maxParticipants(15)
                .currentParticipants(5)
                .travelManagerId(2L)
                .startDate(LocalDateTime.now().plusDays(30))
                .endDate(LocalDateTime.now().plusDays(33))
                .active(true)
                .build();

        sampleSubscription = Subscription.builder()
                .id(1L)
                .travelerId(4L)
                .travelerName("Alice Johnson")
                .travel(sampleTravel)
                .status(SubscriptionStatus.ACTIVE)
                .numberOfParticipants(2)
                .totalAmount(BigDecimal.valueOf(2599.98))
                .build();

        subscriptionRequest = new CreateSubscriptionRequest();
        subscriptionRequest.setTravelId(1L);
        subscriptionRequest.setNumberOfParticipants(2);
    }

    // ==================== CREATE SUBSCRIPTION ====================

    @Test
    @DisplayName("Should create subscription successfully")
    void createSubscription_Success() {
        // Arrange
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);
        when(subscriptionRepository.existsByTravelerIdAndTravelAndStatus(
                eq(4L), any(Travel.class), eq(SubscriptionStatus.ACTIVE)))
                .thenReturn(false);
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(sampleSubscription);
        when(travelService.saveTravelEntity(any(Travel.class))).thenReturn(sampleTravel);
        doNothing().when(neo4jSyncService).syncSubscription(any(Subscription.class));

        // Act
        SubscriptionDTO result = subscriptionService.createSubscription(subscriptionRequest, 4L, "Alice Johnson");

        // Assert
        assertNotNull(result);
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
        verify(travelService, times(1)).saveTravelEntity(any(Travel.class));
        verify(neo4jSyncService, times(1)).syncSubscription(any(Subscription.class));
    }

    @Test
    @DisplayName("Should throw exception when travel is inactive")
    void createSubscription_InactiveTravel() {
        // Arrange
        sampleTravel.setActive(false);
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.createSubscription(subscriptionRequest, 4L, "Alice Johnson")
        );
        assertEquals("This travel is no longer available", exception.getMessage());
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should throw exception when not enough spots available")
    void createSubscription_NotEnoughSpots() {
        // Arrange
        sampleTravel.setCurrentParticipants(14);
        subscriptionRequest.setNumberOfParticipants(2);
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.createSubscription(subscriptionRequest, 4L, "Alice Johnson")
        );
        assertTrue(exception.getMessage().contains("Not enough available spots"));
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should throw exception when user already subscribed")
    void createSubscription_AlreadySubscribed() {
        // Arrange
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);
        when(subscriptionRepository.existsByTravelerIdAndTravelAndStatus(
                eq(4L), any(Travel.class), eq(SubscriptionStatus.ACTIVE)))
                .thenReturn(true);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.createSubscription(subscriptionRequest, 4L, "Alice Johnson")
        );
        assertEquals("You are already subscribed to this travel", exception.getMessage());
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should throw exception when travel has already started")
    void createSubscription_TravelNotUpcoming() {
        // Arrange
        sampleTravel.setStartDate(LocalDateTime.now().minusDays(1));
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.createSubscription(subscriptionRequest, 4L, "Alice Johnson")
        );
        assertEquals("Cannot subscribe to a travel that has already started or ended", exception.getMessage());
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    // ==================== CANCEL SUBSCRIPTION ====================

    @Test
    @DisplayName("Should cancel subscription successfully")
    void cancelSubscription_Success() {
        // Arrange
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sampleSubscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(sampleSubscription);
        doNothing().when(travelService).decrementParticipants(anyLong());

        // Act
        subscriptionService.cancelSubscription(1L, 4L);

        // Assert
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
        verify(travelService, times(1)).decrementParticipants(1L);
    }

    @Test
    @DisplayName("Should throw exception when non-owner tries to cancel")
    void cancelSubscription_NotOwner() {
        // Arrange
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sampleSubscription));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.cancelSubscription(1L, 999L)
        );
        assertEquals("You can only cancel your own subscriptions", exception.getMessage());
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should throw exception when subscription not found")
    void cancelSubscription_NotFound() {
        // Arrange
        when(subscriptionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                subscriptionService.cancelSubscription(999L, 4L)
        );
    }

    // ==================== GET SUBSCRIPTIONS ====================

    @Test
    @DisplayName("Should get user subscriptions successfully")
    void getUserSubscriptions_Success() {
        // Arrange
        Subscription sub2 = Subscription.builder()
                .id(2L)
                .travelerId(4L)
                .status(SubscriptionStatus.ACTIVE)
                .travel(sampleTravel)
                .build();

        when(subscriptionRepository.findByTravelerId(4L))
                .thenReturn(Arrays.asList(sampleSubscription, sub2));

        // Act
        List<SubscriptionDTO> results = subscriptionService.getUserSubscriptions(4L);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        verify(subscriptionRepository, times(1)).findByTravelerId(4L);
    }

    @Test
    @DisplayName("Should get user active subscriptions only")
    void getUserActiveSubscriptions_Success() {
        // Arrange
        when(subscriptionRepository.findByTravelerIdAndStatus(4L, SubscriptionStatus.ACTIVE))
                .thenReturn(Arrays.asList(sampleSubscription));

        // Act
        List<SubscriptionDTO> results = subscriptionService.getUserActiveSubscriptions(4L);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(SubscriptionStatus.ACTIVE, results.get(0).getStatus());
        verify(subscriptionRepository, times(1)).findByTravelerIdAndStatus(4L, SubscriptionStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should get subscription by ID successfully")
    void getSubscriptionById_Success() {
        // Arrange
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sampleSubscription));

        // Act
        SubscriptionDTO result = subscriptionService.getSubscriptionById(1L, 4L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(subscriptionRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when accessing other user's subscription")
    void getSubscriptionById_Unauthorized() {
        // Arrange
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sampleSubscription));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.getSubscriptionById(1L, 999L)
        );
        assertEquals("You can only view your own subscriptions", exception.getMessage());
    }

    // ==================== GET TRAVEL SUBSCRIPTIONS ====================

    @Test
    @DisplayName("Should get travel subscriptions as manager")
    void getTravelSubscriptions_Success() {
        // Arrange
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);
        when(subscriptionRepository.findByTravel(sampleTravel))
                .thenReturn(Arrays.asList(sampleSubscription));

        // Act
        List<SubscriptionDTO> results = subscriptionService.getTravelSubscriptions(1L, 2L);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        verify(subscriptionRepository, times(1)).findByTravel(sampleTravel);
    }

    @Test
    @DisplayName("Should throw exception when non-manager tries to view travel subscriptions")
    void getTravelSubscriptions_NotManager() {
        // Arrange
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.getTravelSubscriptions(1L, 999L)
        );
        assertEquals("You can only view subscriptions for your own travels", exception.getMessage());
        verify(subscriptionRepository, never()).findByTravel(any(Travel.class));
    }

    // ==================== MANAGER CANCEL SUBSCRIPTION ====================

    @Test
    @DisplayName("Should allow manager to cancel subscription")
    void managerCancelSubscription_Success() {
        // Arrange
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sampleSubscription));
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(sampleSubscription);
        doNothing().when(travelService).decrementParticipants(anyLong());

        // Act
        subscriptionService.managerCancelSubscription(1L, 1L, 2L);

        // Assert
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
        verify(travelService, times(1)).decrementParticipants(1L);
    }

    @Test
    @DisplayName("Should throw exception when subscription doesn't belong to travel")
    void managerCancelSubscription_WrongTravel() {
        // Arrange
        sampleSubscription.getTravel().setId(2L);
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sampleSubscription));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.managerCancelSubscription(1L, 1L, 2L)
        );
        assertEquals("Subscription does not belong to this travel", exception.getMessage());
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should throw exception when non-manager tries to cancel subscription")
    void managerCancelSubscription_NotManager() {
        // Arrange
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sampleSubscription));
        when(travelService.getTravelById(1L)).thenReturn(sampleTravel);

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                subscriptionService.managerCancelSubscription(1L, 1L, 999L)
        );
        assertEquals("You can only manage subscriptions for your own travels", exception.getMessage());
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    // ==================== COMPLETE SUBSCRIPTION ====================

    @Test
    @DisplayName("Should complete subscription when travel is completed")
    void completeSubscription_Success() {
        // Arrange
        sampleTravel.setEndDate(LocalDateTime.now().minusDays(1));
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sampleSubscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(sampleSubscription);

        // Act
        subscriptionService.completeSubscription(1L);

        // Assert
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
    }

    // ==================== DELETE ALL USER SUBSCRIPTIONS ====================

    @Test
    @DisplayName("Should delete all user subscriptions successfully")
    void deleteAllSubscriptionsByUser_Success() {
        // Arrange
        Subscription sub2 = Subscription.builder()
                .id(2L)
                .travelerId(4L)
                .status(SubscriptionStatus.ACTIVE)
                .numberOfParticipants(1)
                .travel(sampleTravel)
                .build();

        when(subscriptionRepository.findByTravelerId(4L))
                .thenReturn(Arrays.asList(sampleSubscription, sub2));
        when(travelService.saveTravelEntity(any(Travel.class))).thenReturn(sampleTravel);
        doNothing().when(neo4jSyncService).deleteSubscriptionRelationship(anyLong(), anyLong());
        doNothing().when(subscriptionRepository).delete(any(Subscription.class));

        // Act
        subscriptionService.deleteAllSubscriptionsByUser(4L);

        // Assert
        verify(subscriptionRepository, times(2)).delete(any(Subscription.class));
        verify(travelService, times(2)).saveTravelEntity(any(Travel.class));
        verify(neo4jSyncService, times(2)).deleteSubscriptionRelationship(anyLong(), anyLong());
    }
}
