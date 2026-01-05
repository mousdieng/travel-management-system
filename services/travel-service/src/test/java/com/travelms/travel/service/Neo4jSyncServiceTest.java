package com.travelms.travel.service;

import com.travelms.travel.model.entity.Subscription;
import com.travelms.travel.model.entity.Travel;
import com.travelms.travel.model.neo4j.*;
import com.travelms.travel.repository.neo4j.TravelNodeRepository;
import com.travelms.travel.repository.neo4j.TravelerNodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Neo4j Sync Service Tests")
class Neo4jSyncServiceTest {

    @Mock
    private TravelerNodeRepository travelerNodeRepository;

    @Mock
    private TravelNodeRepository travelNodeRepository;

    @InjectMocks
    private Neo4jSyncService neo4jSyncService;

    private TravelerNode sampleTravelerNode;
    private TravelNode sampleTravelNode;
    private Travel sampleTravel;
    private Subscription sampleSubscription;

    @BeforeEach
    void setUp() {
        sampleTravelerNode = TravelerNode.builder()
                .userId(4L)
                .username("alice")
                .subscribedTravels(new HashSet<>())
                .feedbacks(new HashSet<>())
                .preferredDestinations(new HashSet<>())
                .build();

        DestinationNode destinationNode = DestinationNode.builder()
                .name("Paris")
                .country("France")
                .city("Paris")
                .build();

        CategoryNode categoryNode = CategoryNode.builder()
                .name("Adventure")
                .build();

        ManagerNode managerNode = ManagerNode.builder()
                .userId(2L)
                .username("manager1")
                .averageRating(0.0)
                .build();

        sampleTravelNode = new TravelNode();
        sampleTravelNode.setTravelId(1L);
        sampleTravelNode.setTitle("Paris Weekend");
        sampleTravelNode.setDestination("Paris");
        sampleTravelNode.setCountry("France");
        sampleTravelNode.setCity("Paris");
        sampleTravelNode.setCategory("Adventure");
        sampleTravelNode.setPrice(BigDecimal.valueOf(1500.0));
        sampleTravelNode.setStartDate(LocalDateTime.of(2024, 6, 1, 10, 0));
        sampleTravelNode.setEndDate(LocalDateTime.of(2024, 6, 5, 18, 0));
        sampleTravelNode.setAverageRating(4.5);
        sampleTravelNode.setDestinationNode(destinationNode);
        sampleTravelNode.setCategoryNode(categoryNode);
        sampleTravelNode.setManager(managerNode);

        sampleTravel = Travel.builder()
                .id(1L)
                .title("Paris Weekend")
                .destination("Paris")
                .country("France")
                .city("Paris")
                .category("Adventure")
                .price(BigDecimal.valueOf(1500.0))
                .startDate(LocalDateTime.of(2024, 6, 1, 10, 0))
                .endDate(LocalDateTime.of(2024, 6, 5, 18, 0))
                .averageRating(4.5)
                .travelManagerId(2L)
                .travelManagerName("manager1")
                .build();

        sampleSubscription = Subscription.builder()
                .id(1L)
                .travelerId(4L)
                .travel(sampleTravel)
                .build();
    }

    // ==================== SYNC TRAVELER NODE ====================

    @Test
    @DisplayName("Should create new traveler node when not exists")
    void syncTravelerNode_CreateNew() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.empty());
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenReturn(sampleTravelerNode);

        // Act
        neo4jSyncService.syncTravelerNode(4L, "alice");

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelerNodeRepository, times(1)).save(any(TravelerNode.class));
    }

    @Test
    @DisplayName("Should update existing traveler node")
    void syncTravelerNode_UpdateExisting() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenReturn(sampleTravelerNode);

        // Act
        neo4jSyncService.syncTravelerNode(4L, "alice_updated");

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelerNodeRepository, times(1)).save(any(TravelerNode.class));
        assertEquals("alice_updated", sampleTravelerNode.getUsername());
    }

    @Test
    @DisplayName("Should initialize collections when creating new traveler node")
    void syncTravelerNode_InitializeCollections() {
        // Arrange
        when(travelerNodeRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenAnswer(invocation -> {
            TravelerNode node = invocation.getArgument(0);
            assertNotNull(node.getSubscribedTravels());
            assertNotNull(node.getFeedbacks());
            assertNotNull(node.getPreferredDestinations());
            return node;
        });

        // Act
        neo4jSyncService.syncTravelerNode(5L, "newuser");

        // Assert
        verify(travelerNodeRepository, times(1)).save(any(TravelerNode.class));
    }

    // ==================== SYNC TRAVEL NODE ====================

    @Test
    @DisplayName("Should create new travel node when not exists")
    void syncTravelNode_CreateNew() {
        // Arrange
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());
        when(travelNodeRepository.save(any(TravelNode.class))).thenReturn(sampleTravelNode);

        // Act
        neo4jSyncService.syncTravelNode(sampleTravel);

        // Assert
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelNodeRepository, times(1)).save(any(TravelNode.class));
    }

    @Test
    @DisplayName("Should update existing travel node")
    void syncTravelNode_UpdateExisting() {
        // Arrange
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        when(travelNodeRepository.save(any(TravelNode.class))).thenReturn(sampleTravelNode);

        sampleTravel.setTitle("Updated Paris Trip");
        sampleTravel.setPrice(BigDecimal.valueOf(2000.0));

        // Act
        neo4jSyncService.syncTravelNode(sampleTravel);

        // Assert
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelNodeRepository, times(1)).save(any(TravelNode.class));
        assertEquals("Updated Paris Trip", sampleTravelNode.getTitle());
        assertEquals(BigDecimal.valueOf(2000.0), sampleTravelNode.getPrice());
    }

    @Test
    @DisplayName("Should create destination node when destination is not null")
    void syncTravelNode_CreateDestinationNode() {
        // Arrange
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());
        when(travelNodeRepository.save(any(TravelNode.class))).thenAnswer(invocation -> {
            TravelNode node = invocation.getArgument(0);
            assertNotNull(node.getDestinationNode());
            assertEquals("Paris", node.getDestinationNode().getName());
            assertEquals("France", node.getDestinationNode().getCountry());
            assertEquals("Paris", node.getDestinationNode().getCity());
            return node;
        });

        // Act
        neo4jSyncService.syncTravelNode(sampleTravel);

        // Assert
        verify(travelNodeRepository, times(1)).save(any(TravelNode.class));
    }

    @Test
    @DisplayName("Should create category node when category is not null")
    void syncTravelNode_CreateCategoryNode() {
        // Arrange
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());
        when(travelNodeRepository.save(any(TravelNode.class))).thenAnswer(invocation -> {
            TravelNode node = invocation.getArgument(0);
            assertNotNull(node.getCategoryNode());
            assertEquals("Adventure", node.getCategoryNode().getName());
            return node;
        });

        // Act
        neo4jSyncService.syncTravelNode(sampleTravel);

        // Assert
        verify(travelNodeRepository, times(1)).save(any(TravelNode.class));
    }

    @Test
    @DisplayName("Should create manager node with travel")
    void syncTravelNode_CreateManagerNode() {
        // Arrange
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());
        when(travelNodeRepository.save(any(TravelNode.class))).thenAnswer(invocation -> {
            TravelNode node = invocation.getArgument(0);
            assertNotNull(node.getManager());
            assertEquals(2L, node.getManager().getUserId());
            assertEquals("manager1", node.getManager().getUsername());
            assertEquals(0.0, node.getManager().getAverageRating());
            return node;
        });

        // Act
        neo4jSyncService.syncTravelNode(sampleTravel);

        // Assert
        verify(travelNodeRepository, times(1)).save(any(TravelNode.class));
    }

    @Test
    @DisplayName("Should handle null destination gracefully")
    void syncTravelNode_NullDestination() {
        // Arrange
        sampleTravel.setDestination(null);
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());
        when(travelNodeRepository.save(any(TravelNode.class))).thenAnswer(invocation -> {
            TravelNode node = invocation.getArgument(0);
            assertNull(node.getDestinationNode());
            return node;
        });

        // Act
        neo4jSyncService.syncTravelNode(sampleTravel);

        // Assert
        verify(travelNodeRepository, times(1)).save(any(TravelNode.class));
    }

    @Test
    @DisplayName("Should handle null category gracefully")
    void syncTravelNode_NullCategory() {
        // Arrange
        sampleTravel.setCategory(null);
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());
        when(travelNodeRepository.save(any(TravelNode.class))).thenAnswer(invocation -> {
            TravelNode node = invocation.getArgument(0);
            assertNull(node.getCategoryNode());
            return node;
        });

        // Act
        neo4jSyncService.syncTravelNode(sampleTravel);

        // Assert
        verify(travelNodeRepository, times(1)).save(any(TravelNode.class));
    }

    // ==================== SYNC SUBSCRIPTION ====================

    @Test
    @DisplayName("Should sync subscription successfully when both nodes exist")
    void syncSubscription_Success() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenReturn(sampleTravelerNode);

        // Act
        neo4jSyncService.syncSubscription(sampleSubscription);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelerNodeRepository, times(1)).save(sampleTravelerNode);
        assertTrue(sampleTravelerNode.getSubscribedTravels().contains(sampleTravelNode));
    }

    @Test
    @DisplayName("Should not sync subscription when traveler node not found")
    void syncSubscription_TravelerNotFound() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.empty());
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));

        // Act
        neo4jSyncService.syncSubscription(sampleSubscription);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelerNodeRepository, never()).save(any(TravelerNode.class));
    }

    @Test
    @DisplayName("Should not sync subscription when travel node not found")
    void syncSubscription_TravelNotFound() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());

        // Act
        neo4jSyncService.syncSubscription(sampleSubscription);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelerNodeRepository, never()).save(any(TravelerNode.class));
    }

    @Test
    @DisplayName("Should not sync subscription when both nodes not found")
    void syncSubscription_BothNodesNotFound() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.empty());
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());

        // Act
        neo4jSyncService.syncSubscription(sampleSubscription);

        // Assert
        verify(travelerNodeRepository, never()).save(any(TravelerNode.class));
    }

    // ==================== SYNC FEEDBACK ====================

    @Test
    @DisplayName("Should sync feedback successfully when both nodes exist")
    void syncFeedback_Success() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenReturn(sampleTravelerNode);

        // Act
        neo4jSyncService.syncFeedback(4L, "alice", sampleTravel, 5, createdAt);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelerNodeRepository, times(1)).save(sampleTravelerNode);
        assertEquals(1, sampleTravelerNode.getFeedbacks().size());
    }

    @Test
    @DisplayName("Should add destination to preferences when rating >= 4")
    void syncFeedback_AddPreferredDestination() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenReturn(sampleTravelerNode);

        // Act
        neo4jSyncService.syncFeedback(4L, "alice", sampleTravel, 5, createdAt);

        // Assert
        verify(travelerNodeRepository, times(1)).save(sampleTravelerNode);
        assertTrue(sampleTravelerNode.getPreferredDestinations().size() > 0);
        assertTrue(sampleTravelerNode.getPreferredDestinations().contains(sampleTravelNode.getDestinationNode()));
    }

    @Test
    @DisplayName("Should not add destination to preferences when rating < 4")
    void syncFeedback_NoPreferredDestination() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenReturn(sampleTravelerNode);

        // Act
        neo4jSyncService.syncFeedback(4L, "alice", sampleTravel, 3, createdAt);

        // Assert
        verify(travelerNodeRepository, times(1)).save(sampleTravelerNode);
        assertEquals(0, sampleTravelerNode.getPreferredDestinations().size());
    }

    @Test
    @DisplayName("Should handle feedback when destination node is null")
    void syncFeedback_NullDestinationNode() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        sampleTravelNode.setDestinationNode(null);
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenReturn(sampleTravelerNode);

        // Act
        neo4jSyncService.syncFeedback(4L, "alice", sampleTravel, 5, createdAt);

        // Assert
        verify(travelerNodeRepository, times(1)).save(sampleTravelerNode);
        assertEquals(0, sampleTravelerNode.getPreferredDestinations().size());
    }

    @Test
    @DisplayName("Should not sync feedback when traveler node not found")
    void syncFeedback_TravelerNotFound() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.empty());
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));

        // Act
        neo4jSyncService.syncFeedback(4L, "alice", sampleTravel, 5, createdAt);

        // Assert
        verify(travelerNodeRepository, never()).save(any(TravelerNode.class));
    }

    @Test
    @DisplayName("Should not sync feedback when travel node not found")
    void syncFeedback_TravelNotFound() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());

        // Act
        neo4jSyncService.syncFeedback(4L, "alice", sampleTravel, 5, createdAt);

        // Assert
        verify(travelerNodeRepository, never()).save(any(TravelerNode.class));
    }

    // ==================== DELETE TRAVEL NODE ====================

    @Test
    @DisplayName("Should delete travel node successfully when exists")
    void deleteTravelNode_Success() {
        // Arrange
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        doNothing().when(travelNodeRepository).delete(any(TravelNode.class));

        // Act
        neo4jSyncService.deleteTravelNode(1L);

        // Assert
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelNodeRepository, times(1)).delete(sampleTravelNode);
    }

    @Test
    @DisplayName("Should handle delete gracefully when travel node not found")
    void deleteTravelNode_NotFound() {
        // Arrange
        when(travelNodeRepository.findByTravelId(999L)).thenReturn(Optional.empty());

        // Act
        neo4jSyncService.deleteTravelNode(999L);

        // Assert
        verify(travelNodeRepository, times(1)).findByTravelId(999L);
        verify(travelNodeRepository, never()).delete(any(TravelNode.class));
    }

    @Test
    @DisplayName("Should throw exception when delete fails")
    void deleteTravelNode_DeleteFails() {
        // Arrange
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        doThrow(new RuntimeException("Database error")).when(travelNodeRepository).delete(any(TravelNode.class));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> neo4jSyncService.deleteTravelNode(1L));
        verify(travelNodeRepository, times(1)).delete(sampleTravelNode);
    }

    // ==================== DELETE SUBSCRIPTION RELATIONSHIP ====================

    @Test
    @DisplayName("Should delete subscription relationship successfully")
    void deleteSubscriptionRelationship_Success() {
        // Arrange
        sampleTravelerNode.getSubscribedTravels().add(sampleTravelNode);
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        when(travelerNodeRepository.save(any(TravelerNode.class))).thenReturn(sampleTravelerNode);

        // Act
        neo4jSyncService.deleteSubscriptionRelationship(4L, 1L);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelerNodeRepository, times(1)).save(sampleTravelerNode);
        assertFalse(sampleTravelerNode.getSubscribedTravels().contains(sampleTravelNode));
    }

    @Test
    @DisplayName("Should handle delete subscription when traveler not found")
    void deleteSubscriptionRelationship_TravelerNotFound() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.empty());
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));

        // Act
        neo4jSyncService.deleteSubscriptionRelationship(4L, 1L);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelerNodeRepository, never()).save(any(TravelerNode.class));
    }

    @Test
    @DisplayName("Should handle delete subscription when travel not found")
    void deleteSubscriptionRelationship_TravelNotFound() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.empty());

        // Act
        neo4jSyncService.deleteSubscriptionRelationship(4L, 1L);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelNodeRepository, times(1)).findByTravelId(1L);
        verify(travelerNodeRepository, never()).save(any(TravelerNode.class));
    }

    @Test
    @DisplayName("Should throw exception when delete subscription fails")
    void deleteSubscriptionRelationship_DeleteFails() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        when(travelNodeRepository.findByTravelId(1L)).thenReturn(Optional.of(sampleTravelNode));
        doThrow(new RuntimeException("Database error")).when(travelerNodeRepository).save(any(TravelerNode.class));

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
                neo4jSyncService.deleteSubscriptionRelationship(4L, 1L));
    }

    // ==================== DELETE TRAVELER NODE ====================

    @Test
    @DisplayName("Should delete traveler node successfully when exists")
    void deleteTravelerNode_Success() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        doNothing().when(travelerNodeRepository).delete(any(TravelerNode.class));

        // Act
        neo4jSyncService.deleteTravelerNode(4L);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(4L);
        verify(travelerNodeRepository, times(1)).delete(sampleTravelerNode);
    }

    @Test
    @DisplayName("Should handle delete gracefully when traveler node not found")
    void deleteTravelerNode_NotFound() {
        // Arrange
        when(travelerNodeRepository.findByUserId(999L)).thenReturn(Optional.empty());

        // Act
        neo4jSyncService.deleteTravelerNode(999L);

        // Assert
        verify(travelerNodeRepository, times(1)).findByUserId(999L);
        verify(travelerNodeRepository, never()).delete(any(TravelerNode.class));
    }

    @Test
    @DisplayName("Should throw exception when delete traveler fails")
    void deleteTravelerNode_DeleteFails() {
        // Arrange
        when(travelerNodeRepository.findByUserId(4L)).thenReturn(Optional.of(sampleTravelerNode));
        doThrow(new RuntimeException("Database error")).when(travelerNodeRepository).delete(any(TravelerNode.class));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> neo4jSyncService.deleteTravelerNode(4L));
        verify(travelerNodeRepository, times(1)).delete(sampleTravelerNode);
    }
}
