package com.caresync;

import com.caresync.dto.LoginRequest;
import com.caresync.dto.RegisterRequest;
import com.caresync.model.entity.User;
import com.caresync.model.enums.Role;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorAvailabilityRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.PrescriptionRepository;
import com.caresync.repository.UserRepository;
import com.caresync.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthenticationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully register a Patient user")
    void testPatientRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("patient@caresync.com")
                .password("securePass123")
                .fullName("John Patient")
                .phoneNumber("+1234567890")
                .role(Role.PATIENT)
                .dateOfBirth(LocalDate.of(1990, 5, 15))
                .gender("Male")
                .bloodGroup("O+")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("patient@caresync.com"))
                .andExpect(jsonPath("$.user.role").value("PATIENT"))
                .andExpect(jsonPath("$.user.patientId").isNumber());
    }

    @Test
    @DisplayName("Should successfully register a Doctor user")
    void testDoctorRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("doctor@caresync.com")
                .password("doctorSecret123")
                .fullName("Dr. Sarah Smith")
                .phoneNumber("+1987654321")
                .role(Role.DOCTOR)
                .specialization("Cardiology")
                .qualifications("MD, FACC")
                .experienceYears(12)
                .consultationFee(new BigDecimal("150.00"))
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("doctor@caresync.com"))
                .andExpect(jsonPath("$.user.role").value("DOCTOR"))
                .andExpect(jsonPath("$.user.doctorId").isNumber());
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void testSuccessfulLogin() throws Exception {
        RegisterRequest regRequest = RegisterRequest.builder()
                .email("user@caresync.com")
                .password("mySecretPass")
                .fullName("Alice Walker")
                .role(Role.PATIENT)
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regRequest)));

        LoginRequest loginRequest = LoginRequest.builder()
                .email("user@caresync.com")
                .password("mySecretPass")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("user@caresync.com"));
    }

    @Test
    @DisplayName("Should reject login with invalid credentials")
    void testInvalidCredentialsLogin() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("nonexistent@caresync.com")
                .password("wrongPass")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication Failed"));
    }

    @Test
    @DisplayName("Should allow access to protected endpoint with valid JWT")
    void testProtectedEndpointWithValidJwt() throws Exception {
        RegisterRequest regRequest = RegisterRequest.builder()
                .email("patient2@caresync.com")
                .password("pass123")
                .fullName("Bob Patient")
                .role(Role.PATIENT)
                .build();

        String responseJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(responseJson).get("token").asText();

        mockMvc.perform(get("/api/patient/ping")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Patient Access Granted"));
    }

    @Test
    @DisplayName("Should reject request with invalid JWT token")
    void testInvalidJwtToken() throws Exception {
        mockMvc.perform(get("/api/patient/ping")
                        .header("Authorization", "Bearer invalid.jwt.token.string"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Should reject request with expired or malformed JWT token")
    void testExpiredJwtToken() throws Exception {
        String fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJleHBpcmVkQGNhcmVzeW5jLmNvbSIsImV4cCI6MTYwMDAwMDAwMH0.invalidSignature";

        mockMvc.perform(get("/api/patient/ping")
                        .header("Authorization", "Bearer " + fakeToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Should reject request when user has wrong role access (403 Forbidden)")
    void testWrongRoleAccess() throws Exception {
        RegisterRequest regRequest = RegisterRequest.builder()
                .email("patient3@caresync.com")
                .password("pass123")
                .fullName("Charlie Patient")
                .role(Role.PATIENT)
                .build();

        String responseJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String patientToken = objectMapper.readTree(responseJson).get("token").asText();

        mockMvc.perform(get("/api/admin/ping")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access Forbidden"));
    }
}
