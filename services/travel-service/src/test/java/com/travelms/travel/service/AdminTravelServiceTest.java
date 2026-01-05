package com.travelms.travel.service;

import com.travelms.travel.dto.CreateTravelRequest;
import com.travelms.travel.dto.SubscriptionDTO;
import com.travelms.travel.dto.TravelDTO;
import com.travelms.travel.exception.BadRequestException;
import com.travelms.travel.exception.ResourceNotFoundException;
import com.travelms.travel.model.entity.Subscription;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.model.enums.SubscriptionStatus;
import com.travelms.travel.repository.elasticsearch.TravelSearchRepository;
import com.travelms.travel.repository.jpa.SubscriptionRepository;
import com.travelms.travel.repository.jpa.TravelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminTravelService
 *
 * This test class demonstrates the testing pattern for the Travel Management System.
 * Follow this pattern for testing other services:
 * 1. Use @ExtendWith(MockitoExtension.class) for Mockito support
 * 2. Mock dependencies with @Mock
 * 3. Inject mocks with @InjectMocks
 * 4. Use @DisplayName for readable test descriptions
 * 5. Arrange-Act-Assert pattern in each test
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Travel Service Tests")
class AdminTravelServiceTest {

    @Mock
    private TravelRepository travelRepository;

    @Mock
    private TravelSearchRepository travelSearchRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private TravelService travelService;

    @Mock
    private SubscriptionService subscriptionService;

    @Mock
    private Neo4jSyncService neo4jSyncService;

    @InjectMocks
    private AdminTravelService adminTravelService;

    private CreateTravelRequest validRequest;
    private Travel sampleTravel;

    @BeforeEach
    void setUp() {
        // Arrange - Create sample data for tests
        validRequest = new CreateTravelRequest();
        validRequest.setTitle("Paris Weekend Getaway");
        validRequest.setDescription("Experience the romance of Paris");
        validRequest.setDestination("Paris, France");
        validRequest.setCountry("France");
        validRequest.setState("Île-de-France");
        validRequest.setCity("Paris");
        validRequest.setStartDate(LocalDateTime.now().plusDays(30));
        validRequest.setEndDate(LocalDateTime.now().plusDays(33));
        validRequest.setPrice(BigDecimal.valueOf(1299.99));
        validRequest.setMaxParticipants(15);
        validRequest.setCategory("CITY");
        validRequest.setHighlights(new ArrayList<>());
        validRequest.setImages(new ArrayList<>());

        sampleTravel = Travel.builder()
                .id(1L)
                .title(validRequest.getTitle())
                .description(validRequest.getDescription())
                .destination(validRequest.getDestination())
                .country(validRequest.getCountry())
                .city(validRequest.getCity())
                .startDate(validRequest.getStartDate())
                .endDate(validRequest.getEndDate())
                .price(validRequest.getPrice())
                .maxParticipants(validRequest.getMaxParticipants())
                .currentParticipants(0)
                .travelManagerId(2L)
                .travelManagerName("John Manager")
                .category(validRequest.getCategory())
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Should create travel for manager successfully")
    void createTravelForManager_Success() {
        // Arrange
        when(travelRepository.save(any(Travel.class))).thenReturn(sampleTravel);
        doNothing().when(neo4jSyncService).syncTravelNode(any(Travel.class));

        // Act
        TravelDTO result = adminTravelService.createTravelForManager(validRequest, 2L, "John Manager");

        // Assert
        assertNotNull(result);
        assertEquals("Paris Weekend Getaway", result.getTitle());
        assertEquals(2L, result.getTravelManagerId());
        verify(travelRepository, times(1)).save(any(Travel.class));
        verify(neo4jSyncService, times(1)).syncTravelNode(any(Travel.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when end date is before start date")
    void createTravelForManager_InvalidDates() {
        // Arrange
        validRequest.setEndDate(LocalDateTime.now().plusDays(10));
        validRequest.setStartDate(LocalDateTime.now().plusDays(30));

        // Act & Assert
        assertThrows(BadRequestException.class, () ->
                adminTravelService.createTravelForManager(validRequest, 2L, "John Manager")
        );
        verify(travelRepository, never()).save(any(Travel.class));
    }

    @Test
    @DisplayName("Should update travel for manager successfully")
    void updateTravelForManager_Success() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        when(travelRepository.save(any(Travel.class))).thenReturn(sampleTravel);
        doNothing().when(neo4jSyncService).syncTravelNode(any(Travel.class));

        validRequest.setTitle("Updated Paris Trip");

        // Act
        TravelDTO result = adminTravelService.updateTravelForManager(1L, validRequest);

        // Assert
        assertNotNull(result);
        verify(travelRepository, times(1)).findById(1L);
        verify(travelRepository, times(1)).save(any(Travel.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when travel not found for update")
    void updateTravelForManager_NotFound() {
        // Arrange
        when(travelRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                adminTravelService.updateTravelForManager(999L, validRequest)
        );
        verify(travelRepository, times(1)).findById(999L);
        verify(travelRepository, never()).save(any(Travel.class));
    }

    @Test
    @DisplayName("Should delete travel as admin successfully")
    void deleteTravelAsAdmin_Success() {
        // Arrange
        sampleTravel.setSubscriptions(new ArrayList<>());
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        doNothing().when(travelRepository).delete(any(Travel.class));
        doNothing().when(neo4jSyncService).deleteTravelNode(anyLong());

        // Act
        adminTravelService.deleteTravelAsAdmin(1L);

        // Assert
        verify(travelRepository, times(1)).findById(1L);
        verify(travelRepository, times(1)).delete(sampleTravel);
        verify(neo4jSyncService, times(1)).deleteTravelNode(1L);
    }

    @Test
    @DisplayName("Should throw BadRequestException when deleting travel with active subscriptions")
    void deleteTravelAsAdmin_WithActiveSubscriptions() {
        // Arrange
        Subscription activeSubscription = new Subscription();
        activeSubscription.setStatus(SubscriptionStatus.ACTIVE);
        sampleTravel.setSubscriptions(java.util.List.of(activeSubscription));

        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));

        // Act & Assert
        assertThrows(BadRequestException.class, () ->
                adminTravelService.deleteTravelAsAdmin(1L)
        );
        verify(travelRepository, times(1)).findById(1L);
        verify(travelRepository, never()).delete(any(Travel.class));
    }

    @Test
    @DisplayName("Should subscribe user to travel successfully")
    void subscribeUserToTravel_Success() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        when(subscriptionRepository.existsByTravelerIdAndTravelAndStatus(
                anyLong(), any(Travel.class), eq(SubscriptionStatus.ACTIVE))
        ).thenReturn(false);

        Subscription newSubscription = new Subscription();
        newSubscription.setId(1L);
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(newSubscription);

        SubscriptionDTO subscriptionDTO = new SubscriptionDTO();
        subscriptionDTO.setId(1L);
        when(subscriptionService.convertToDTO(any(Subscription.class))).thenReturn(subscriptionDTO);

        // Act
        SubscriptionDTO result = adminTravelService.subscribeUserToTravel(4L, "Alice Johnson", 1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
        verify(travelRepository, times(1)).save(sampleTravel);
    }

    @Test
    @DisplayName("Should throw BadRequestException when user already subscribed")
    void subscribeUserToTravel_AlreadySubscribed() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        when(subscriptionRepository.existsByTravelerIdAndTravelAndStatus(
                anyLong(), any(Travel.class), eq(SubscriptionStatus.ACTIVE))
        ).thenReturn(true);

        // Act & Assert
        assertThrows(BadRequestException.class, () ->
                adminTravelService.subscribeUserToTravel(4L, "Alice Johnson", 1L)
        );
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when travel is full")
    void subscribeUserToTravel_TravelFull() {
        // Arrange
        sampleTravel.setCurrentParticipants(15);
        sampleTravel.setMaxParticipants(15);
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        when(subscriptionRepository.existsByTravelerIdAndTravelAndStatus(
                anyLong(), any(Travel.class), eq(SubscriptionStatus.ACTIVE))
        ).thenReturn(false);

        // Act & Assert
        assertThrows(BadRequestException.class, () ->
                adminTravelService.subscribeUserToTravel(4L, "Alice Johnson", 1L)
        );
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }
}
