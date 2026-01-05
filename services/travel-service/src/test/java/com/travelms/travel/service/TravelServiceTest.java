package com.travelms.travel.service;

import com.travelms.travel.dto.CreateTravelRequest;
import com.travelms.travel.dto.TravelDTO;
import com.travelms.travel.exception.BadRequestException;
import com.travelms.travel.exception.ResourceNotFoundException;
import com.travelms.travel.model.entity.Travel;
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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Travel Service Tests")
class TravelServiceTest {

    @Mock
    private TravelRepository travelRepository;

    @Mock
    private TravelSearchRepository travelSearchRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private Neo4jSyncService neo4jSyncService;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private TravelService travelService;

    private CreateTravelRequest validRequest;
    private Travel sampleTravel;

    @BeforeEach
    void setUp() {
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
                .averageRating(0.0)
                .totalReviews(0)
                .build();
    }

    // ==================== CREATE TRAVEL ====================

    @Test
    @DisplayName("Should create travel successfully")
    void createTravel_Success() {
        // Arrange
        when(travelRepository.save(any(Travel.class))).thenReturn(sampleTravel);
        doNothing().when(neo4jSyncService).syncTravelNode(any(Travel.class));

        // Act
        TravelDTO result = travelService.createTravel(validRequest, 2L, "John Manager");

        // Assert
        assertNotNull(result);
        assertEquals("Paris Weekend Getaway", result.getTitle());
        assertEquals(2L, result.getTravelManagerId());
        assertTrue(result.getActive());
        verify(travelRepository, times(1)).save(any(Travel.class));
        verify(neo4jSyncService, times(1)).syncTravelNode(any(Travel.class));
    }

    @Test
    @DisplayName("Should throw exception when end date is before start date")
    void createTravel_InvalidDates() {
        // Arrange
        validRequest.setEndDate(LocalDateTime.now().plusDays(10));
        validRequest.setStartDate(LocalDateTime.now().plusDays(30));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                travelService.createTravel(validRequest, 2L, "John Manager")
        );
        assertEquals("End date must be after start date", exception.getMessage());
        verify(travelRepository, never()).save(any(Travel.class));
    }

    @Test
    @DisplayName("Should throw exception when start date is in the past")
    void createTravel_PastStartDate() {
        // Arrange
        validRequest.setStartDate(LocalDateTime.now().minusDays(1));
        validRequest.setEndDate(LocalDateTime.now().plusDays(3));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                travelService.createTravel(validRequest, 2L, "John Manager")
        );
        assertEquals("Start date must be in the future", exception.getMessage());
        verify(travelRepository, never()).save(any(Travel.class));
    }

    // ==================== UPDATE TRAVEL ====================

    @Test
    @DisplayName("Should update travel successfully")
    void updateTravel_Success() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        when(travelRepository.save(any(Travel.class))).thenReturn(sampleTravel);
        doNothing().when(neo4jSyncService).syncTravelNode(any(Travel.class));

        validRequest.setTitle("Updated Paris Trip");

        // Act
        TravelDTO result = travelService.updateTravel(1L, validRequest, 2L);

        // Assert
        assertNotNull(result);
        verify(travelRepository, times(1)).findById(1L);
        verify(travelRepository, times(1)).save(any(Travel.class));
    }

    @Test
    @DisplayName("Should throw exception when non-owner tries to update travel")
    void updateTravel_Unauthorized() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                travelService.updateTravel(1L, validRequest, 999L)
        );
        assertEquals("You are not authorized to update this travel", exception.getMessage());
        verify(travelRepository, never()).save(any(Travel.class));
    }

    @Test
    @DisplayName("Should throw exception when travel not found for update")
    void updateTravel_NotFound() {
        // Arrange
        when(travelRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                travelService.updateTravel(999L, validRequest, 2L)
        );
        verify(travelRepository, never()).save(any(Travel.class));
    }

    // ==================== DELETE TRAVEL ====================

    @Test
    @DisplayName("Should delete travel successfully (soft delete)")
    void deleteTravel_Success() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        when(travelRepository.save(any(Travel.class))).thenReturn(sampleTravel);

        // Act
        travelService.deleteTravel(1L, 2L);

        // Assert
        verify(travelRepository, times(1)).findById(1L);
        verify(travelRepository, times(1)).save(any(Travel.class));
        assertFalse(sampleTravel.getActive());
    }

    @Test
    @DisplayName("Should throw exception when non-owner tries to delete travel")
    void deleteTravel_Unauthorized() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));

        // Act & Assert
        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                travelService.deleteTravel(1L, 999L)
        );
        assertEquals("You are not authorized to delete this travel", exception.getMessage());
        verify(travelRepository, never()).delete(any(Travel.class));
    }

    // ==================== GET TRAVEL ====================

    @Test
    @DisplayName("Should get travel by ID successfully")
    void getTravelById_Success() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));

        // Act
        Travel result = travelService.getTravelById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Paris Weekend Getaway", result.getTitle());
        verify(travelRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when travel not found")
    void getTravelById_NotFound() {
        // Arrange
        when(travelRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                travelService.getTravelById(999L)
        );
    }

    // ==================== GET ALL TRAVELS ====================

    @Test
    @DisplayName("Should get all active travels")
    void getAllTravels_Success() {
        // Arrange
        Travel travel2 = Travel.builder()
                .id(2L)
                .title("Tokyo Experience")
                .active(true)
                .build();

        when(travelRepository.findByActiveTrue()).thenReturn(Arrays.asList(sampleTravel, travel2));

        // Act
        List<TravelDTO> results = travelService.getAllTravels();

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        verify(travelRepository, times(1)).findByActiveTrue();
    }

    @Test
    @DisplayName("Should return empty list when no travels exist")
    void getAllTravels_EmptyList() {
        // Arrange
        when(travelRepository.findByActiveTrue()).thenReturn(new ArrayList<>());

        // Act
        List<TravelDTO> results = travelService.getAllTravels();

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET MANAGER TRAVELS ====================

    @Test
    @DisplayName("Should get all travels for a specific manager")
    void getManagerTravels_Success() {
        // Arrange
        when(travelRepository.findByTravelManagerIdAndActiveTrue(2L)).thenReturn(Arrays.asList(sampleTravel));

        // Act
        List<TravelDTO> results = travelService.getManagerTravels(2L);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(2L, results.get(0).getTravelManagerId());
        verify(travelRepository, times(1)).findByTravelManagerIdAndActiveTrue(2L);
    }

    // ==================== INCREMENT/DECREMENT PARTICIPANTS ====================

    @Test
    @DisplayName("Should increment participants count")
    void incrementParticipants_Success() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        when(travelRepository.save(any(Travel.class))).thenReturn(sampleTravel);

        // Act
        travelService.incrementParticipants(1L);

        // Assert
        verify(travelRepository, times(1)).findById(1L);
        verify(travelRepository, times(1)).save(any(Travel.class));
    }

    @Test
    @DisplayName("Should decrement participants count")
    void decrementParticipants_Success() {
        // Arrange
        sampleTravel.setCurrentParticipants(5);
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));
        when(travelRepository.save(any(Travel.class))).thenReturn(sampleTravel);

        // Act
        travelService.decrementParticipants(1L);

        // Assert
        verify(travelRepository, times(1)).findById(1L);
        verify(travelRepository, times(1)).save(any(Travel.class));
    }

    @Test
    @DisplayName("Should not decrement below zero")
    void decrementParticipants_AtZero() {
        // Arrange
        sampleTravel.setCurrentParticipants(0);
        when(travelRepository.findById(1L)).thenReturn(Optional.of(sampleTravel));

        // Act
        travelService.decrementParticipants(1L);

        // Assert
        assertEquals(0, sampleTravel.getCurrentParticipants());
        verify(travelRepository, never()).save(any(Travel.class));
    }

    // ==================== ACTIVATE/DEACTIVATE ====================

}
