package com.caresync;

import com.caresync.dto.AvailabilityRequest;
import com.caresync.dto.BookAppointmentRequest;
import com.caresync.dto.CreatePrescriptionRequest;
import com.caresync.dto.RegisterRequest;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.DoctorAvailability;
import com.caresync.model.entity.Patient;
import com.caresync.model.entity.Prescription;
import com.caresync.model.entity.User;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.Role;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorAvailabilityRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.PrescriptionRepository;
import com.caresync.repository.UserRepository;
import com.caresync.security.JwtService;
import com.caresync.service.AppointmentService;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PrescriptionIntegrationTests {

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
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AppointmentService appointmentService;

    private User doctorUser;
    private Doctor doctorEntity;
    private String doctorToken;

    private User doctorUser2;
    private Doctor doctorEntity2;
    private String doctorToken2;

    private User patientUserA;
    private Patient patientEntityA;
    private String patientTokenA;

    private User patientUserB;
    private Patient patientEntityB;
    private String patientTokenB;

    private Appointment appointmentA;

    @BeforeEach
    void setUp() throws Exception {
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();

        when(javaMailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // 1. Create Doctor 1
        doctorUser = userRepository.save(User.builder()
                .email("dr.smith@caresync.com")
                .password("docPass123")
                .fullName("Dr. Smith")
                .role(Role.DOCTOR)
                .active(true)
                .build());
        doctorEntity = doctorRepository.save(Doctor.builder()
                .user(doctorUser)
                .specialization("Cardiology")
                .qualifications("MD")
                .consultationFee(new BigDecimal("150.00"))
                .build());
        doctorToken = jwtService.generateToken(doctorUser);

        // 2. Create Doctor 2
        doctorUser2 = userRepository.save(User.builder()
                .email("dr.jones@caresync.com")
                .password("docPass123")
                .fullName("Dr. Jones")
                .role(Role.DOCTOR)
                .active(true)
                .build());
        doctorEntity2 = doctorRepository.save(Doctor.builder()
                .user(doctorUser2)
                .specialization("Dermatology")
                .qualifications("MBBS")
                .consultationFee(new BigDecimal("100.00"))
                .build());
        doctorToken2 = jwtService.generateToken(doctorUser2);

        // 3. Create Patient A
        patientUserA = userRepository.save(User.builder()
                .email("patientA@caresync.com")
                .password("patPass123")
                .fullName("Patient Alice")
                .role(Role.PATIENT)
                .active(true)
                .build());
        patientEntityA = patientRepository.save(Patient.builder()
                .user(patientUserA)
                .build());
        patientTokenA = jwtService.generateToken(patientUserA);

        // 4. Create Patient B
        patientUserB = userRepository.save(User.builder()
                .email("patientB@caresync.com")
                .password("patPass123")
                .fullName("Patient Bob")
                .role(Role.PATIENT)
                .active(true)
                .build());
        patientEntityB = patientRepository.save(Patient.builder()
                .user(patientUserB)
                .build());
        patientTokenB = jwtService.generateToken(patientUserB);

        // 5. Create Doctor 1 Availability & Appointment for Patient A
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        availabilityRepository.save(DoctorAvailability.builder()
                .doctor(doctorEntity)
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .active(true)
                .build());

        appointmentA = appointmentRepository.save(Appointment.builder()
                .patient(patientEntityA)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .status(AppointmentStatus.SCHEDULED)
                .reason("Chest pain evaluation")
                .build());
    }

    @Test
    @DisplayName("Doctor can successfully create a prescription for their appointment")
    void testDoctorCreatesPrescriptionSuccessfully() throws Exception {
        CreatePrescriptionRequest request = CreatePrescriptionRequest.builder()
                .appointmentId(appointmentA.getId())
                .patientId(patientEntityA.getId())
                .diagnosis("Hypertension Stage 1")
                .medicines("Amlodipine 5mg, Lisinopril 10mg")
                .dosage("1 tablet daily")
                .frequency("Once daily in the morning")
                .duration("30 days")
                .instructions("Take after meals with water")
                .doctorNotes("Follow up in 1 month")
                .build();

        mockMvc.perform(post("/api/prescriptions")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.appointmentId").value(appointmentA.getId()))
                .andExpect(jsonPath("$.patientId").value(patientEntityA.getId()))
                .andExpect(jsonPath("$.patientName").value("Patient Alice"))
                .andExpect(jsonPath("$.doctorName").value("Dr. Smith"))
                .andExpect(jsonPath("$.diagnosis").value("Hypertension Stage 1"))
                .andExpect(jsonPath("$.medicines").value("Amlodipine 5mg, Lisinopril 10mg"));
    }

    @Test
    @DisplayName("Patient can view their own prescription")
    void testPatientViewsOwnPrescription() throws Exception {
        Prescription prescription = prescriptionRepository.save(Prescription.builder()
                .patient(patientEntityA)
                .doctor(doctorEntity)
                .appointment(appointmentA)
                .diagnosis("Seasonal Allergy")
                .medicines("Cetirizine 10mg")
                .build());

        mockMvc.perform(get("/api/prescriptions/" + prescription.getId())
                        .header("Authorization", "Bearer " + patientTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(prescription.getId()))
                .andExpect(jsonPath("$.patientName").value("Patient Alice"))
                .andExpect(jsonPath("$.diagnosis").value("Seasonal Allergy"));
    }

    @Test
    @DisplayName("IDOR Security Test: Patient B cannot access Patient A's prescription")
    void testPatientCannotAccessAnotherPatientsPrescription() throws Exception {
        Prescription prescriptionA = prescriptionRepository.save(Prescription.builder()
                .patient(patientEntityA)
                .doctor(doctorEntity)
                .appointment(appointmentA)
                .diagnosis("Private Condition")
                .medicines("Medication X")
                .build());

        // Patient B attempts to access Patient A's prescription (IDOR Attack)
        mockMvc.perform(get("/api/prescriptions/" + prescriptionA.getId())
                        .header("Authorization", "Bearer " + patientTokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthorized users (no token) are blocked from accessing prescriptions")
    void testUnauthorizedUserBlocked() throws Exception {
        mockMvc.perform(get("/api/prescriptions/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Doctor cannot create prescription for another doctor's appointment")
    void testDoctorCannotPrescribeForAnotherDoctorsAppointment() throws Exception {
        CreatePrescriptionRequest request = CreatePrescriptionRequest.builder()
                .appointmentId(appointmentA.getId()) // Appointment belongs to Doctor 1
                .patientId(patientEntityA.getId())
                .diagnosis("Attempted Override")
                .medicines("Medication Y")
                .build();

        // Doctor 2 attempts to issue prescription for Doctor 1's appointment
        mockMvc.perform(post("/api/prescriptions")
                        .header("Authorization", "Bearer " + doctorToken2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Reject prescription creation if patient ID does not match appointment patient")
    void testRejectMismatchedPatientId() throws Exception {
        CreatePrescriptionRequest request = CreatePrescriptionRequest.builder()
                .appointmentId(appointmentA.getId())
                .patientId(patientEntityB.getId()) // Wrong patient ID!
                .diagnosis("Wrong Patient Test")
                .medicines("Medication Z")
                .build();

        mockMvc.perform(post("/api/prescriptions")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
