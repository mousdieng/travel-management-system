package com.travelms.travel.service;

import com.travelms.travel.dto.admin.ManagerRankingDTO;
import com.travelms.travel.dto.admin.TravelPerformanceMetricsDTO;
import com.travelms.travel.dto.admin.UnderperformingTravelDTO;
import com.travelms.travel.model.entity.Travel;
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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Analytics Service Tests")
class AdminAnalyticsServiceTest {

    @Mock
    private TravelRepository travelRepository;

    @InjectMocks
    private AdminAnalyticsService adminAnalyticsService;

    private Travel travel1;
    private Travel travel2;
    private Travel travel3;

    @BeforeEach
    void setUp() {
        travel1 = Travel.builder()
                .id(1L)
                .title("Paris Weekend")
                .category("CITY")
                .travelManagerId(2L)
                .travelManagerName("John Manager")
                .price(BigDecimal.valueOf(1299.99))
                .maxParticipants(15)
                .currentParticipants(12)
                .averageRating(4.5)
                .totalReviews(10)
                .active(true)
                .build();

        travel2 = Travel.builder()
                .id(2L)
                .title("Tokyo Experience")
                .category("CITY")
                .travelManagerId(2L)
                .travelManagerName("John Manager")
                .price(BigDecimal.valueOf(2500.00))
                .maxParticipants(10)
                .currentParticipants(8)
                .averageRating(4.8)
                .totalReviews(8)
                .active(true)
                .build();

        travel3 = Travel.builder()
                .id(3L)
                .title("Beach Getaway")
                .category("BEACH")
                .travelManagerId(3L)
                .travelManagerName("Jane Manager")
                .price(BigDecimal.valueOf(999.99))
                .maxParticipants(20)
                .currentParticipants(3)
                .averageRating(3.2)
                .totalReviews(5)
                .active(true)
                .build();
    }

    // ==================== GET MANAGER RANKINGS ====================

    @Test
    @DisplayName("Should get manager rankings successfully")
    void getManagerRankings_Success() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<ManagerRankingDTO> results = adminAnalyticsService.getManagerRankings(null);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size()); // 2 unique managers

        // Manager 2 should be ranked first (highest revenue)
        ManagerRankingDTO topManager = results.get(0);
        assertEquals(2L, topManager.getManagerId());
        assertEquals("John Manager", topManager.getManagerName());
        assertEquals(1, topManager.getRank());
        assertEquals(2, topManager.getTotalTravels());
        assertEquals(2, topManager.getActiveTravels());
        assertTrue(topManager.getTotalRevenue() > 30000); // 12*1299.99 + 8*2500

        verify(travelRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should limit manager rankings when limit is specified")
    void getManagerRankings_WithLimit() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<ManagerRankingDTO> results = adminAnalyticsService.getManagerRankings(1);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(1, results.get(0).getRank());
    }

    @Test
    @DisplayName("Should calculate performance score correctly")
    void getManagerRankings_PerformanceScore() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2));

        // Act
        List<ManagerRankingDTO> results = adminAnalyticsService.getManagerRankings(null);

        // Assert
        assertNotNull(results);
        ManagerRankingDTO manager = results.get(0);

        // Performance score should be between 0 and 100
        assertTrue(manager.getPerformanceScore() >= 0);
        assertTrue(manager.getPerformanceScore() <= 100);
    }

    @Test
    @DisplayName("Should handle managers with no active travels")
    void getManagerRankings_NoActiveTravels() {
        // Arrange
        travel1.setActive(false);
        travel2.setActive(false);

        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2));

        // Act
        List<ManagerRankingDTO> results = adminAnalyticsService.getManagerRankings(null);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());

        ManagerRankingDTO manager = results.get(0);
        assertEquals(0, manager.getActiveTravels());
    }

    @Test
    @DisplayName("Should return empty list when no travels exist")
    void getManagerRankings_NoTravels() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<ManagerRankingDTO> results = adminAnalyticsService.getManagerRankings(null);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET TRAVEL PERFORMANCE METRICS ====================

    @Test
    @DisplayName("Should get travel performance metrics successfully")
    void getTravelPerformanceMetrics_Success() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getTravelPerformanceMetrics(
                null, null, null, null, null
        );

        // Assert
        assertNotNull(results);
        assertEquals(3, results.size());

        // Should be sorted by revenue descending
        assertTrue(results.get(0).getTotalRevenue() >= results.get(1).getTotalRevenue());
        assertTrue(results.get(1).getTotalRevenue() >= results.get(2).getTotalRevenue());

        verify(travelRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should filter by category")
    void getTravelPerformanceMetrics_FilterByCategory() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getTravelPerformanceMetrics(
                "CITY", null, null, null, null
        );

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(t -> "CITY".equals(t.getCategory())));
    }

    @Test
    @DisplayName("Should filter by status")
    void getTravelPerformanceMetrics_FilterByStatus() {
        // Arrange
        travel3.setActive(false);
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act - Get only active travels
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getTravelPerformanceMetrics(
                null, "active", null, null, null
        );

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(t -> "ACTIVE".equals(t.getStatus())));
    }

    @Test
    @DisplayName("Should filter by minimum rating")
    void getTravelPerformanceMetrics_FilterByRating() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act - Get only travels with rating >= 4.0
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getTravelPerformanceMetrics(
                null, null, 4.0, null, null
        );

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size()); // Only travel1 and travel2
        assertTrue(results.stream().allMatch(t -> t.getAverageRating() >= 4.0));
    }

    @Test
    @DisplayName("Should calculate booking rate correctly")
    void getTravelPerformanceMetrics_BookingRate() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1));

        // Act
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getTravelPerformanceMetrics(
                null, null, null, null, null
        );

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());

        TravelPerformanceMetricsDTO metrics = results.get(0);
        // Booking rate = 12/15 = 80%
        assertEquals(80.0, metrics.getBookingRate());
    }

    // ==================== GET UNDERPERFORMING TRAVELS ====================

    @Test
    @DisplayName("Should get underperforming travels successfully")
    void getUnderperformingTravels_Success() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act - Get travels with booking rate below 50%
        List<UnderperformingTravelDTO> results = adminAnalyticsService.getUnderperformingTravels(50);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size()); // Only travel3 (3/20 = 15%)

        UnderperformingTravelDTO underperforming = results.get(0);
        assertEquals(3L, underperforming.getTravelId());
        assertTrue(underperforming.getBookingRate() < 50);
        assertNotNull(underperforming.getReason());

        verify(travelRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should only include active travels in underperforming list")
    void getUnderperformingTravels_OnlyActive() {
        // Arrange
        travel3.setActive(false);
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<UnderperformingTravelDTO> results = adminAnalyticsService.getUnderperformingTravels(90);

        // Assert
        assertNotNull(results);
        // travel3 is inactive, so should not be included
        assertTrue(results.stream().noneMatch(t -> t.getTravelId() == 3L));
    }

    @Test
    @DisplayName("Should sort underperforming travels by booking rate ascending")
    void getUnderperformingTravels_SortedByBookingRate() {
        // Arrange
        Travel travel4 = Travel.builder()
                .id(4L)
                .title("Low Booking Travel")
                .category("ADVENTURE")
                .travelManagerId(3L)
                .price(BigDecimal.valueOf(500.00))
                .maxParticipants(30)
                .currentParticipants(3) // 10% booking rate
                .active(true)
                .build();

        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3, travel4));

        // Act
        List<UnderperformingTravelDTO> results = adminAnalyticsService.getUnderperformingTravels(50);

        // Assert
        assertNotNull(results);
        assertTrue(results.size() >= 2);

        // Should be sorted by booking rate (ascending)
        for (int i = 0; i < results.size() - 1; i++) {
            assertTrue(results.get(i).getBookingRate() <= results.get(i + 1).getBookingRate());
        }
    }

    @Test
    @DisplayName("Should provide appropriate reason for underperformance")
    void getUnderperformingTravels_Reason() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel3));

        // Act
        List<UnderperformingTravelDTO> results = adminAnalyticsService.getUnderperformingTravels(50);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());

        UnderperformingTravelDTO underperforming = results.get(0);
        assertNotNull(underperforming.getReason());
        assertTrue(underperforming.getReason().contains("booking rate") ||
                   underperforming.getReason().contains("rating"));
    }

    // ==================== GET TOP PERFORMING TRAVELS ====================

    @Test
    @DisplayName("Should get top performing travels successfully")
    void getTopPerformingTravels_Success() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getTopPerformingTravels(2);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());

        // Should be sorted by revenue descending
        assertTrue(results.get(0).getTotalRevenue() >= results.get(1).getTotalRevenue());

        verify(travelRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should default to top 10 when limit is null")
    void getTopPerformingTravels_DefaultLimit() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getTopPerformingTravels(null);

        // Assert
        assertNotNull(results);
        assertEquals(3, results.size()); // Only 3 travels available
    }

    // ==================== GET ALL TRAVELS HISTORY ====================

    @Test
    @DisplayName("Should get all travels history successfully")
    void getAllTravelsHistory_Success() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getAllTravelsHistory();

        // Assert
        assertNotNull(results);
        assertEquals(3, results.size());

        verify(travelRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should sort travels by ID descending in history")
    void getAllTravelsHistory_SortedByIdDescending() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getAllTravelsHistory();

        // Assert
        assertNotNull(results);

        // Should be sorted by ID descending
        for (int i = 0; i < results.size() - 1; i++) {
            assertTrue(results.get(i).getTravelId() >= results.get(i + 1).getTravelId());
        }
    }

    @Test
    @DisplayName("Should return empty list when no travels in history")
    void getAllTravelsHistory_Empty() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<TravelPerformanceMetricsDTO> results = adminAnalyticsService.getAllTravelsHistory();

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // ==================== GET TRAVEL DETAILED STATS ====================

    @Test
    @DisplayName("Should get travel detailed stats successfully")
    void getTravelDetailedStats_Success() {
        // Arrange
        when(travelRepository.findById(1L)).thenReturn(Optional.of(travel1));

        // Act
        TravelPerformanceMetricsDTO result = adminAnalyticsService.getTravelDetailedStats(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getTravelId());
        assertEquals("Paris Weekend", result.getTitle());
        assertEquals("CITY", result.getCategory());
        assertEquals("ACTIVE", result.getStatus());
        assertEquals(2L, result.getManagerId());
        assertEquals(12, result.getTotalBookings());
        assertTrue(result.getTotalRevenue() > 15000);
        assertEquals(80.0, result.getBookingRate());
        assertEquals(4.5, result.getAverageRating());

        verify(travelRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when travel not found for detailed stats")
    void getTravelDetailedStats_NotFound() {
        // Arrange
        when(travelRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                adminAnalyticsService.getTravelDetailedStats(999L)
        );
    }

    @Test
    @DisplayName("Should handle travel with no bookings in detailed stats")
    void getTravelDetailedStats_NoBookings() {
        // Arrange
        travel1.setCurrentParticipants(0);
        when(travelRepository.findById(1L)).thenReturn(Optional.of(travel1));

        // Act
        TravelPerformanceMetricsDTO result = adminAnalyticsService.getTravelDetailedStats(1L);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getTotalBookings());
        assertEquals(0.0, result.getTotalRevenue());
        assertEquals(0.0, result.getBookingRate());
    }

    // ==================== GET ALL CATEGORIES ====================

    @Test
    @DisplayName("Should get all travel categories successfully")
    void getAllCategories_Success() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<String> results = adminAnalyticsService.getAllCategories();

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size()); // CITY and BEACH
        assertTrue(results.contains("CITY"));
        assertTrue(results.contains("BEACH"));

        verify(travelRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should return sorted categories")
    void getAllCategories_Sorted() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList(travel1, travel2, travel3));

        // Act
        List<String> results = adminAnalyticsService.getAllCategories();

        // Assert
        assertNotNull(results);

        // Should be sorted alphabetically
        for (int i = 0; i < results.size() - 1; i++) {
            assertTrue(results.get(i).compareTo(results.get(i + 1)) <= 0);
        }
    }

    @Test
    @DisplayName("Should return empty list when no categories exist")
    void getAllCategories_Empty() {
        // Arrange
        when(travelRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<String> results = adminAnalyticsService.getAllCategories();

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    @DisplayName("Should exclude null categories")
    void getAllCategories_ExcludeNull() {
        // Arrange
        Travel travelWithoutCategory = Travel.builder()
                .id(4L)
                .title("No Category Travel")
                .category(null)
                .active(true)
                .build();

        when(travelRepository.findAll()).thenReturn(
                Arrays.asList(travel1, travel2, travel3, travelWithoutCategory)
        );

        // Act
        List<String> results = adminAnalyticsService.getAllCategories();

        // Assert
        assertNotNull(results);
        assertTrue(results.stream().noneMatch(c -> c == null));
    }
}
