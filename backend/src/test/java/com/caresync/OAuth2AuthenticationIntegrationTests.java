package com.caresync;

import com.caresync.dto.AuthResponse;
import com.caresync.dto.LoginRequest;
import com.caresync.dto.OAuthExchangeRequest;
import com.caresync.dto.RegisterRequest;
import com.caresync.exception.OAuth2AccountConflictException;
import com.caresync.exception.OAuth2AuthenticationProcessingException;
import com.caresync.model.entity.Patient;
import com.caresync.model.entity.User;
import com.caresync.model.entity.UserOAuthAccount;
import com.caresync.model.enums.Role;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.UserOAuthAccountRepository;
import com.caresync.repository.UserRepository;
import com.caresync.security.JwtService;
import com.caresync.security.OAuth2ExchangeCodeService;
import com.caresync.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class OAuth2AuthenticationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserOAuthAccountRepository userOAuthAccountRepository;

    @Autowired
    private OAuth2ExchangeCodeService exchangeCodeService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JavaMailSender javaMailSender;

    @Test
    @DisplayName("New Google OAuth user creates PATIENT user and Patient profile")
    void testNewGoogleUserRegistration_createsPatientRoleAndPatientRecord() {
        String sub = "google-sub-new-12345";
        String email = "jane.newpatient@caresync.com";
        String name = "Jane New Patient";

        AuthResponse authResponse = authService.processOAuth2Login("GOOGLE", sub, email, name, true);

        assertNotNull(authResponse);
        assertNotNull(authResponse.getToken());
        assertEquals("Bearer", authResponse.getTokenType());
        assertEquals(Role.PATIENT, authResponse.getUser().getRole());
        assertEquals(email, authResponse.getUser().getEmail());
        assertEquals(name, authResponse.getUser().getFullName());
        assertNotNull(authResponse.getUser().getPatientId());

        // Verify database state
        Optional<User> savedUserOpt = userRepository.findByEmail(email);
        assertTrue(savedUserOpt.isPresent());
        User savedUser = savedUserOpt.get();
        assertEquals(Role.PATIENT, savedUser.getRole());
        assertTrue(savedUser.isActive());

        Optional<Patient> savedPatientOpt = patientRepository.findByUserId(savedUser.getId());
        assertTrue(savedPatientOpt.isPresent());

        Optional<UserOAuthAccount> savedOAuthOpt = userOAuthAccountRepository.findByProviderAndProviderUserId("GOOGLE", sub);
        assertTrue(savedOAuthOpt.isPresent());
        assertEquals(savedUser.getId(), savedOAuthOpt.get().getUser().getId());
        assertEquals(email, savedOAuthOpt.get().getEmail());

        // Verify JWT extract email
        assertEquals(email, jwtService.extractEmail(authResponse.getToken()));
    }

    @Test
    @DisplayName("Existing Google-linked user signs in without creating duplicate users")
    void testExistingGoogleUserLogin_doesNotCreateDuplicateRecords() {
        String sub = "google-sub-existing-999";
        String email = "existing.oauth@caresync.com";
        String name = "Existing OAuth User";

        AuthResponse firstLogin = authService.processOAuth2Login("GOOGLE", sub, email, name, true);
        assertNotNull(firstLogin);

        long userCountBefore = userRepository.count();
        long oauthCountBefore = userOAuthAccountRepository.count();

        // Second login with same provider and subject
        AuthResponse secondLogin = authService.processOAuth2Login("GOOGLE", sub, email, "Changed Name Should Not Blindly Overwrite", true);
        assertNotNull(secondLogin);
        assertEquals(firstLogin.getUser().getId(), secondLogin.getUser().getId());

        // Profile and counts remain consistent
        assertEquals(userCountBefore, userRepository.count());
        assertEquals(oauthCountBefore, userOAuthAccountRepository.count());
        assertEquals(name, userRepository.findByEmail(email).get().getFullName());
    }

    @Test
    @DisplayName("Unlinked password-based user with matching email fails safely without silent linking")
    void testUnlinkedExistingEmailConflict_throwsExceptionAndPreventsSilentLinking() {
        String email = "conflict.existing@caresync.com";

        // Register standard password user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(email)
                .password("Password123!")
                .fullName("Local Password User")
                .role(Role.PATIENT)
                .build();
        authService.register(registerRequest);

        // Attempt OAuth2 login with same email but no prior link
        String sub = "google-sub-conflict-888";
        OAuth2AccountConflictException ex = assertThrows(OAuth2AccountConflictException.class, () ->
                authService.processOAuth2Login("GOOGLE", sub, email, "Conflict User", true)
        );

        assertTrue(ex.getMessage().contains("already exists with password authentication"));
        assertFalse(userOAuthAccountRepository.existsByProviderAndProviderUserId("GOOGLE", sub));
    }

    @Test
    @DisplayName("Unverified Google email claim is rejected")
    void testUnverifiedEmail_throwsProcessingException() {
        String sub = "google-sub-unverified";
        String email = "unverified@caresync.com";

        OAuth2AuthenticationProcessingException ex = assertThrows(OAuth2AuthenticationProcessingException.class, () ->
                authService.processOAuth2Login("GOOGLE", sub, email, "Unverified User", false)
        );

        assertTrue(ex.getMessage().toLowerCase().contains("not verified"));
        assertFalse(userRepository.existsByEmail(email));
    }

    @Test
    @DisplayName("Deactivated OAuth user is rejected from signing in")
    void testDeactivatedAccount_throwsProcessingException() {
        String sub = "google-sub-deactivated";
        String email = "deactivated@caresync.com";

        AuthResponse authResponse = authService.processOAuth2Login("GOOGLE", sub, email, "Deactivated User", true);
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setActive(false);
        userRepository.save(user);

        OAuth2AuthenticationProcessingException ex = assertThrows(OAuth2AuthenticationProcessingException.class, () ->
                authService.processOAuth2Login("GOOGLE", sub, email, "Deactivated User", true)
        );

        assertTrue(ex.getMessage().toLowerCase().contains("deactivated"));
    }

    @Test
    @DisplayName("OAuth2 exchange code endpoint performs single-use token exchange")
    void testOAuth2ExchangeCodeEndpoint_singleUseWorkflow() throws Exception {
        String sub = "google-sub-exchange-777";
        String email = "exchange.user@caresync.com";

        AuthResponse authResponse = authService.processOAuth2Login("GOOGLE", sub, email, "Exchange User", true);
        String exchangeCode = exchangeCodeService.generateCode(authResponse);

        OAuthExchangeRequest exchangeRequest = OAuthExchangeRequest.builder()
                .code(exchangeCode)
                .build();

        // 1. First exchange attempt should succeed (200 OK)
        mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exchangeRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value(email));

        // 2. Second exchange attempt with SAME code must fail (single-use guarantee, 401 UNAUTHORIZED)
        mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exchangeRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("OAuth2 exchange endpoint with invalid code returns 401 Unauthorized")
    void testOAuth2ExchangeEndpoint_invalidCode_returnsUnauthorized() throws Exception {
        OAuthExchangeRequest invalidRequest = OAuthExchangeRequest.builder()
                .code("invalid-or-nonexistent-code-12345")
                .build();

        mockMvc.perform(post("/api/auth/oauth2/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication Failed"));
    }

    @Test
    @DisplayName("Standard email and password login continues to function cleanly")
    void testStandardEmailPasswordLoginAndRegistration_stillWorksUnchanged() throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email("classic.patient@caresync.com")
                .password("StrongPassword123!")
                .fullName("Classic Patient")
                .role(Role.PATIENT)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("classic.patient@caresync.com"));

        LoginRequest loginRequest = LoginRequest.builder()
                .email("classic.patient@caresync.com")
                .password("StrongPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("classic.patient@caresync.com"));
    }

    @Test
    @DisplayName("OAuth2 authorization initiation when unconfigured redirects to login without HTTP 500")
    void testOAuth2Authorization_whenUnconfigured_redirectsGracefullyToLoginWithout500() throws Exception {
        mockMvc.perform(get("/oauth2/authorization/google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost:5173/login?error=oauth2_failed"));
    }

    @Test
    @DisplayName("OAuth2 authorization with unknown provider redirects to login without HTTP 500")
    void testOAuth2Authorization_unknownProvider_redirectsGracefullyToLoginWithout500() throws Exception {
        mockMvc.perform(get("/oauth2/authorization/github"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost:5173/login?error=oauth2_failed"));
    }

    @Test
    @DisplayName("OAuth2 authorization with JSON Accept header returns 503 instead of HTTP 500")
    void testOAuth2Authorization_jsonRequest_returnsServiceUnavailable() throws Exception {
        mockMvc.perform(get("/oauth2/authorization/google")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.error").value("OAuth2 Unavailable"));
    }

    @Test
    @DisplayName("Non-existent static resource returns 404 Not Found rather than HTTP 500")
    void testNonExistentResource_returns404NotFoundInsteadOf500() throws Exception {
        mockMvc.perform(get("/api/auth/non-existent-endpoint-path"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Resource Not Found"));
    }
}
