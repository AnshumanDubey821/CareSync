package com.caresync;

import com.caresync.dto.UpdateAppointmentStatusRequest;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.Patient;
import com.caresync.model.entity.User;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.Role;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.UserRepository;
import com.caresync.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JavaMailSender javaMailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private String adminToken;

    private User doctorUser;
    private Doctor doctorEntity;
    private String doctorToken;

    private User patientUser;
    private Patient patientEntity;
    private String patientToken;

    private Appointment appointmentEntity;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();

        when(javaMailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Create Admin
        adminUser = userRepository.save(User.builder()
                .email("admin@caresync.com")
                .password("adminPass123")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .active(true)
                .build());
        adminToken = jwtService.generateToken(adminUser);

        // Create Doctor
        doctorUser = userRepository.save(User.builder()
                .email("doctor@caresync.com")
                .password("docPass123")
                .fullName("Dr. AdminTest")
                .role(Role.DOCTOR)
                .active(true)
                .build());
        doctorEntity = doctorRepository.save(Doctor.builder()
                .user(doctorUser)
                .specialization("Neurology")
                .qualifications("MD, PhD")
                .consultationFee(new BigDecimal("200.00"))
                .build());
        doctorToken = jwtService.generateToken(doctorUser);

        // Create Patient
        patientUser = userRepository.save(User.builder()
                .email("patient@caresync.com")
                .password("patPass123")
                .fullName("John AdminTest")
                .role(Role.PATIENT)
                .active(true)
                .build());
        patientEntity = patientRepository.save(Patient.builder()
                .user(patientUser)
                .bloodGroup("O+")
                .build());
        patientToken = jwtService.generateToken(patientUser);

        // Create Appointment
        appointmentEntity = appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .status(AppointmentStatus.SCHEDULED)
                .reason("General Checkup")
                .build());
    }

    @Test
    @DisplayName("Admin can fetch system statistics")
    void testAdminGetSystemStats() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDoctors").value(1))
                .andExpect(jsonPath("$.totalPatients").value(1))
                .andExpect(jsonPath("$.totalAppointments").value(1))
                .andExpect(jsonPath("$.scheduledAppointments").value(1));
    }

    @Test
    @DisplayName("Admin can fetch all doctors, patients, and appointments")
    void testAdminFetchAllDirectories() throws Exception {
        mockMvc.perform(get("/api/admin/doctors")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fullName").value("Dr. AdminTest"));

        mockMvc.perform(get("/api/admin/patients")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fullName").value("John AdminTest"));

        mockMvc.perform(get("/api/admin/appointments")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].reason").value("General Checkup"));
    }

    @Test
    @DisplayName("Patient is denied access to admin endpoints (403 Forbidden)")
    void testPatientDeniedAdminAccess() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/doctors")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Doctor is denied access to admin endpoints (403 Forbidden)")
    void testDoctorDeniedAdminAccess() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/patients")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request to admin endpoints returns 401 Unauthorized")
    void testUnauthenticatedAdminAccess() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin can update appointment status")
    void testAdminUpdateAppointmentStatus() throws Exception {
        UpdateAppointmentStatusRequest request = UpdateAppointmentStatusRequest.builder()
                .status(AppointmentStatus.COMPLETED)
                .build();

        mockMvc.perform(put("/api/admin/appointments/" + appointmentEntity.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appointmentEntity.getId()))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}
