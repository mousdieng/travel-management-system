# Testing Guidelines for Travel Management System

## Overview

This document provides guidelines for writing tests across the microservices architecture. Follow these patterns to maintain consistency and ensure comprehensive test coverage.

## Test Structure

### 1. Unit Tests

Unit tests should follow the **Arrange-Act-Assert** pattern:

```java
@Test
@DisplayName("Should perform action successfully")
void methodName_Scenario() {
    // Arrange - Set up test data and mock behavior
    when(repository.findById(1L)).thenReturn(Optional.of(entity));

    // Act - Execute the method under test
    Result result = service.performAction(1L);

    // Assert - Verify the outcome
    assertNotNull(result);
    verify(repository, times(1)).findById(1L);
}
```

### 2. Required Annotations

```java
@ExtendWith(MockitoExtension.class)  // Enable Mockito
@DisplayName("Service Name Tests")    // Readable test class description
class ServiceNameTest {

    @Mock                              // Mock dependencies
    private Repository repository;

    @InjectMocks                       // Inject mocks into service
    private Service service;

    @BeforeEach                        // Setup before each test
    void setUp() { }

    @Test                              // Mark test method
    @DisplayName("Readable test description")
    void testMethod() { }
}
```

### 3. Test File Locations

```
services/
├── travel-service/
│   └── src/
│       ├── main/java/com/travelms/travel/
│       │   └── service/
│       │       └── AdminTravelService.java
│       └── test/java/com/travelms/travel/
│           └── service/
│               └── AdminTravelServiceTest.java  ← Same package structure
```

## Testing Checklist

### For Each Service Method

- [ ] **Happy Path** - Test successful execution
- [ ] **Null/Empty Input** - Test edge cases
- [ ] **Invalid Input** - Test validation errors
- [ ] **Not Found** - Test resource not found scenarios
- [ ] **Business Logic Errors** - Test domain-specific failures
- [ ] **Verify Interactions** - Verify repository/service calls

### Example Test Coverage

```java
// 1. Happy Path
@Test
void createTravel_Success() { }

// 2. Validation Errors
@Test
void createTravel_InvalidDates() { }

@Test
void createTravel_NullTitle() { }

// 3. Not Found
@Test
void updateTravel_NotFound() { }

// 4. Business Logic
@Test
void deleteTravel_WithActiveSubscriptions() { }

// 5. Edge Cases
@Test
void subscribeToTravel_TravelFull() { }
```

## Common Testing Patterns

### 1. Mocking Repository findById

```java
@Test
void testMethod() {
    // Arrange
    Entity entity = new Entity();
    when(repository.findById(1L)).thenReturn(Optional.of(entity));

    // Act
    DTO result = service.getById(1L);

    // Assert
    assertNotNull(result);
}
```

### 2. Testing Exceptions

```java
@Test
void testMethod_ThrowsException() {
    // Arrange
    when(repository.findById(999L)).thenReturn(Optional.empty());

    // Act & Assert
    assertThrows(ResourceNotFoundException.class, () ->
        service.getById(999L)
    );
}
```

### 3. Verifying Method Calls

```java
@Test
void testMethod_VerifyInteractions() {
    // Arrange
    when(repository.save(any())).thenReturn(entity);

    // Act
    service.create(dto);

    // Assert
    verify(repository, times(1)).save(any(Entity.class));
    verify(neo4jService, times(1)).syncNode(any());
}
```

### 4. Testing with Lists

```java
@Test
void testMethod_ReturnsMultiple() {
    // Arrange
    List<Entity> entities = Arrays.asList(entity1, entity2);
    when(repository.findAll()).thenReturn(entities);

    // Act
    List<DTO> results = service.getAll();

    // Assert
    assertEquals(2, results.size());
}
```

## Priority Services to Test

### High Priority (Core Business Logic)

1. **Travel Service**
   - `TravelService.java`
   - `AdminTravelService.java` ✅ (Example provided)
   - `TravelSearchService.java`

2. **Subscription Service**
   - `SubscriptionService.java`

3. **Payment Service**
   - `PaymentService.java`
   - `AdminPaymentService.java`

4. **Feedback Service**
   - `FeedbackService.java`
   - `AdminFeedbackService.java`

5. **User Service**
   - `UserService.java`
   - `AuthService.java`

### Medium Priority (Analytics & Reports)

6. **Admin Analytics**
   - `AdminAnalyticsService.java`

7. **Report Service**
   - `ReportService.java`

### Lower Priority (Infrastructure)

8. **Neo4j Sync**
   - `Neo4jSyncService.java`

9. **File Service**
   - `FileService.java`

## Running Tests

```bash
# Run all tests for a service
cd services/travel-service && mvn test

# Run specific test class
mvn test -Dtest=AdminTravelServiceTest

# Run with coverage
mvn test jacoco:report

# Run all service tests
mvn clean test -pl services/travel-service,services/payment-service
```

## Test Coverage Goals

- **Minimum Coverage**: 70% line coverage
- **Target Coverage**: 80% line coverage
- **Critical Services**: 90% coverage for core business logic

## Integration Tests

For integration tests that require database:

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional  // Rollback after each test
class IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/travels"))
            .andExpect(status().isOk());
    }
}
```

## Next Steps

1. **Copy the example test** (`AdminTravelServiceTest.java`) as a template
2. **Create tests for your service** following the same pattern
3. **Run tests** and verify they pass
4. **Check coverage** and add missing test cases
5. **Commit with tests** - Never commit code without tests

## Resources

- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [Spring Boot Testing](https://spring.io/guides/gs/testing-web/)

---

**Remember**: Tests are documentation. Write them as if teaching someone how your code works!
