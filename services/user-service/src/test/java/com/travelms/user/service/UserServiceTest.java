package com.travelms.user.service;

import com.travelms.user.dto.*;
import com.travelms.user.exception.*;
import com.travelms.user.model.entity.User;
import com.travelms.user.model.enums.Role;
import com.travelms.user.repository.UserRepository;
import com.travelms.user.security.JwtService;
import com.travelms.user.security.TwoFactorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("User Service Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private TwoFactorService twoFactorService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private UserService userService;

    private User sampleUser;
    private UserRegistrationRequest registrationRequest;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "userDeletedTopic", "user-deleted-topic");

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setUsername("testuser");
        sampleUser.setEmail("test@example.com");
        sampleUser.setPassword("encodedPassword");
        sampleUser.setFirstName("Test");
        sampleUser.setLastName("User");
        sampleUser.setRole(Role.TRAVELER);
        sampleUser.setEnabled(true);
        sampleUser.setCreatedAt(LocalDateTime.now());

        registrationRequest = new UserRegistrationRequest();
        registrationRequest.setUsername("newuser");
        registrationRequest.setEmail("newuser@example.com");
        registrationRequest.setPassword("password123");
        registrationRequest.setFirstName("New");
        registrationRequest.setLastName("User");
        registrationRequest.setRole(Role.TRAVELER);

        // Mock Kafka template to return successful future (lenient because not all tests need it)
        lenient().when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenReturn(CompletableFuture.completedFuture(null));
    }

    // ==================== REGISTER USER ====================

    @Test
    @DisplayName("Should register user successfully")
    void registerUser_Success() {
        // Arrange
        when(userRepository.existsByUsername(registrationRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registrationRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registrationRequest.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtService.generateTokenWithUserInfo(any(User.class), anyString(), anyString()))
                .thenReturn("accessToken");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("refreshToken");
        when(jwtService.getExpirationTime()).thenReturn(3600000L);

        // Act
        AuthenticationResponse result = userService.registerUser(registrationRequest);

        // Assert
        assertNotNull(result);
        assertEquals("accessToken", result.getAccessToken());
        assertEquals("refreshToken", result.getRefreshToken());
        assertNotNull(result.getUser());

        verify(userRepository, times(1)).existsByUsername(registrationRequest.getUsername());
        verify(userRepository, times(1)).existsByEmail(registrationRequest.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when username already exists")
    void registerUser_UsernameExists() {
        // Arrange
        when(userRepository.existsByUsername(registrationRequest.getUsername())).thenReturn(true);

        // Act & Assert
        assertThrows(UserAlreadyExistsException.class, () ->
                userService.registerUser(registrationRequest)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void registerUser_EmailExists() {
        // Arrange
        when(userRepository.existsByUsername(registrationRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registrationRequest.getEmail())).thenReturn(true);

        // Act & Assert
        assertThrows(UserAlreadyExistsException.class, () ->
                userService.registerUser(registrationRequest)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    // ==================== ADMIN CREATE USER ====================

    @Test
    @DisplayName("Should allow admin to create user with ADMIN role")
    void adminCreateUser_Success() {
        // Arrange
        AdminCreateUserRequest request = new AdminCreateUserRequest();
        request.setUsername("admin");
        request.setEmail("admin@example.com");
        request.setPassword("adminpass");
        request.setFirstName("Admin");
        request.setLastName("User");
        request.setRole(Role.ADMIN);

        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        // Act
        UserResponse result = userService.adminCreateUser(request);

        // Assert
        assertNotNull(result);
        verify(userRepository, times(1)).save(any(User.class));
    }

    // ==================== AUTHENTICATE USER ====================

    @Test
    @DisplayName("Should authenticate user successfully")
    void authenticateUser_Success() {
        // Arrange
        UserLoginRequest loginRequest = new UserLoginRequest();
        loginRequest.setUsernameOrEmail("testuser");
        loginRequest.setPassword("password123");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(sampleUser);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        doNothing().when(userRepository).updateLastLogin(anyLong(), any(LocalDateTime.class));
        when(jwtService.generateTokenWithUserInfo(any(User.class), anyString(), anyString()))
                .thenReturn("accessToken");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("refreshToken");
        when(jwtService.getExpirationTime()).thenReturn(3600000L);

        // Act
        AuthenticationResponse result = userService.authenticateUser(loginRequest);

        // Assert
        assertNotNull(result);
        assertEquals("accessToken", result.getAccessToken());
        assertEquals("refreshToken", result.getRefreshToken());
        assertFalse(result.isRequiresTwoFactor());

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository, times(1)).updateLastLogin(anyLong(), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Should require 2FA when enabled and code not provided")
    void authenticateUser_Requires2FA() {
        // Arrange
        sampleUser.setTwoFactorEnabled(true);
        sampleUser.setTwoFactorSecret("secret");

        UserLoginRequest loginRequest = new UserLoginRequest();
        loginRequest.setUsernameOrEmail("testuser");
        loginRequest.setPassword("password123");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(sampleUser);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);

        // Act
        AuthenticationResponse result = userService.authenticateUser(loginRequest);

        // Assert
        assertNotNull(result);
        assertTrue(result.isRequiresTwoFactor());
        assertNull(result.getAccessToken());

        verify(jwtService, never()).generateTokenWithUserInfo(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should throw exception on invalid credentials")
    void authenticateUser_InvalidCredentials() {
        // Arrange
        UserLoginRequest loginRequest = new UserLoginRequest();
        loginRequest.setUsernameOrEmail("testuser");
        loginRequest.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new org.springframework.security.core.AuthenticationException("Bad credentials") {});

        // Act & Assert
        assertThrows(InvalidPasswordException.class, () ->
                userService.authenticateUser(loginRequest)
        );
    }

    // ==================== GET USER ====================

    @Test
    @DisplayName("Should get user by ID successfully")
    void getUserById_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // Act
        Optional<UserResponse> result = userService.getUserById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());

        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should return empty when user not found by ID")
    void getUserById_NotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<UserResponse> result = userService.getUserById(999L);

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should get user by username successfully")
    void getUserByUsername_Success() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleUser));

        // Act
        Optional<UserResponse> result = userService.getUserByUsername("testuser");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
    }

    // ==================== UPDATE USER ====================

    @Test
    @DisplayName("Should update user successfully")
    void updateUser_Success() {
        // Arrange
        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setFirstName("Updated");
        updateRequest.setLastName("Name");
        updateRequest.setBio("Updated bio");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        // Act
        UserResponse result = userService.updateUser(1L, updateRequest);

        // Assert
        assertNotNull(result);
        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when updating to existing username")
    void updateUser_UsernameExists() {
        // Arrange
        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setUsername("existinguser");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        // Act & Assert
        assertThrows(UserAlreadyExistsException.class, () ->
                userService.updateUser(1L, updateRequest)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    // ==================== CHANGE PASSWORD ====================

    @Test
    @DisplayName("Should change password successfully")
    void changePassword_Success() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPassword");
        request.setNewPassword("newPassword");
        request.setConfirmPassword("newPassword");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPassword", sampleUser.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        // Act
        userService.changePassword(1L, request);

        // Assert
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when current password is wrong")
    void changePassword_WrongCurrentPassword() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongPassword");
        request.setNewPassword("newPassword");
        request.setConfirmPassword("newPassword");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPassword", sampleUser.getPassword())).thenReturn(false);

        // Act & Assert
        assertThrows(InvalidPasswordException.class, () ->
                userService.changePassword(1L, request)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when passwords don't match")
    void changePassword_PasswordMismatch() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPassword");
        request.setNewPassword("newPassword");
        request.setConfirmPassword("differentPassword");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPassword", sampleUser.getPassword())).thenReturn(true);

        // Act & Assert
        assertThrows(InvalidPasswordException.class, () ->
                userService.changePassword(1L, request)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    // ==================== TWO-FACTOR AUTHENTICATION ====================

    @Test
    @DisplayName("Should enable 2FA successfully")
    void enableTwoFactor_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(twoFactorService.generateSecret()).thenReturn("secret123");
        when(twoFactorService.generateQrCodeImageUri("secret123", "testuser"))
                .thenReturn("data:image/png;base64,qrcode");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        // Act
        TwoFactorSetupResponse result = userService.enableTwoFactor(1L);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getQrCode());
        assertNotNull(result.getSecret());

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when 2FA already enabled")
    void enableTwoFactor_AlreadyEnabled() {
        // Arrange
        sampleUser.setTwoFactorEnabled(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // Act & Assert
        assertThrows(IllegalStateException.class, () ->
                userService.enableTwoFactor(1L)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should disable 2FA successfully")
    void disableTwoFactor_Success() {
        // Arrange
        sampleUser.setTwoFactorEnabled(true);
        sampleUser.setTwoFactorSecret("secret123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(twoFactorService.verifyCode("secret123", "123456")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        // Act
        userService.disableTwoFactor(1L, "123456");

        // Assert
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when 2FA code invalid during disable")
    void disableTwoFactor_InvalidCode() {
        // Arrange
        sampleUser.setTwoFactorEnabled(true);
        sampleUser.setTwoFactorSecret("secret123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(twoFactorService.verifyCode("secret123", "wrongcode")).thenReturn(false);

        // Act & Assert
        assertThrows(InvalidPasswordException.class, () ->
                userService.disableTwoFactor(1L, "wrongcode")
        );

        verify(userRepository, never()).save(any(User.class));
    }

    // ==================== GET ALL USERS ====================

    @Test
    @DisplayName("Should get all users with pagination")
    void getAllUsers_Success() {
        // Arrange
        User user2 = new User();
        user2.setId(2L);
        user2.setUsername("user2");

        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(Arrays.asList(sampleUser, user2));

        when(userRepository.findUsersWithSearch(null, pageable)).thenReturn(userPage);

        // Act
        Page<UserResponse> results = userService.getAllUsers(null, pageable);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.getTotalElements());

        verify(userRepository, times(1)).findUsersWithSearch(null, pageable);
    }

    // ==================== SEARCH USERS ====================

    @Test
    @DisplayName("Should search users successfully")
    void searchUsers_Success() {
        // Arrange
        User user2 = new User();
        user2.setId(2L);
        user2.setUsername("testuser2");

        when(userRepository.searchByUsername("test")).thenReturn(Arrays.asList(sampleUser, user2));
        when(userRepository.searchByFullName("test")).thenReturn(Arrays.asList());

        // Act
        List<UserResponse> results = userService.searchUsers("test", 999L);

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
    }

    // ==================== DELETE USER ====================

    @Test
    @DisplayName("Should delete user and publish Kafka event")
    void deleteUser_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        doNothing().when(userRepository).delete(any(User.class));

        // Act
        userService.deleteUser(1L);

        // Assert
        verify(userRepository, times(1)).delete(sampleUser);
        verify(kafkaTemplate, times(1)).send(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent user")
    void deleteUser_NotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UserNotFoundException.class, () ->
                userService.deleteUser(999L)
        );

        verify(userRepository, never()).delete(any(User.class));
    }

    // ==================== TOGGLE USER STATUS ====================

    @Test
    @DisplayName("Should toggle user status successfully")
    void toggleUserStatus_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        // Act
        UserResponse result = userService.toggleUserStatus(1L, false);

        // Assert
        assertNotNull(result);
        verify(userRepository, times(1)).save(any(User.class));
    }

    // ==================== AVAILABILITY CHECKS ====================

    @Test
    @DisplayName("Should check username availability")
    void isUsernameAvailable() {
        // Arrange
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        // Act & Assert
        assertTrue(userService.isUsernameAvailable("newuser"));
        assertFalse(userService.isUsernameAvailable("existinguser"));
    }

    @Test
    @DisplayName("Should check email availability")
    void isEmailAvailable() {
        // Arrange
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // Act & Assert
        assertTrue(userService.isEmailAvailable("new@example.com"));
        assertFalse(userService.isEmailAvailable("existing@example.com"));
    }

    @Test
    @DisplayName("Should check if user exists")
    void userExists() {
        // Arrange
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        assertTrue(userService.userExists(1L));
        assertFalse(userService.userExists(999L));
    }

    // ==================== COUNT USERS ====================

    @Test
    @DisplayName("Should count all users")
    void countAllUsers() {
        // Arrange
        when(userRepository.count()).thenReturn(100L);

        // Act
        Long result = userService.countAllUsers();

        // Assert
        assertEquals(100L, result);
    }

    @Test
    @DisplayName("Should count users by role")
    void countUsersByRole() {
        // Arrange
        when(userRepository.countByRole("TRAVELER")).thenReturn(50L);

        // Act
        Long result = userService.countUsersByRole("TRAVELER");

        // Assert
        assertEquals(50L, result);
    }
}
