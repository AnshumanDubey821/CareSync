package com.caresync;

import com.caresync.dto.AvailabilityRequest;
import com.caresync.dto.RegisterRequest;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.Patient;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.Role;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorAvailabilityRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.PrescriptionRepository;
import com.caresync.repository.UserRepository;
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
import java.time.LocalTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SlotGeneratorIntegrationTests {

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
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    private String doctorToken;
    private Doctor doctorEntity;
    private Patient patientEntity;

    @BeforeEach
    void setUp() throws Exception {
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Doctor
        RegisterRequest docReg = RegisterRequest.builder()
                .email("dr.slot@caresync.com")
                .password("docPass123")
                .fullName("Dr. Slot Test")
                .phoneNumber("+1112223333")
                .role(Role.DOCTOR)
                .specialization("General Practice")
                .qualifications("MBBS")
                .consultationFee(new BigDecimal("100.00"))
                .build();

        String docResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        doctorToken = objectMapper.readTree(docResponse).get("token").asText();
        Long docUserId = objectMapper.readTree(docResponse).get("user").get("id").asLong();
        doctorEntity = doctorRepository.findByUserId(docUserId).orElseThrow();

        // 2. Register Patient
        RegisterRequest patReg = RegisterRequest.builder()
                .email("patient.slot@caresync.com")
                .password("patPass123")
                .fullName("Patient Slot Test")
                .role(Role.PATIENT)
                .build();

        String patResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patReg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long patUserId = objectMapper.readTree(patResponse).get("user").get("id").asLong();
        patientEntity = patientRepository.findByUserId(patUserId).orElseThrow();
    }

    @Test
    @DisplayName("Should generate basic 30-minute time slots (09:00 -> 12:00 = 6 slots)")
    void testBasicSlotGeneration() throws Exception {
        LocalDate testDate = LocalDate.now().plusDays(2);
        AvailabilityRequest req = AvailabilityRequest.builder()
                .availableDate(testDate)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/doctors/" + doctorEntity.getId() + "/available-slots")
                        .param("date", testDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(6)))
                .andExpect(jsonPath("$[0].startTime").value("09:00:00"))
                .andExpect(jsonPath("$[0].endTime").value("09:30:00"))
                .andExpect(jsonPath("$[5].startTime").value("11:30:00"))
                .andExpect(jsonPath("$[5].endTime").value("12:00:00"));
    }

    @Test
    @DisplayName("Should correctly generate slots for different durations (15 mins vs 60 mins)")
    void testDifferentSlotDurations() throws Exception {
        LocalDate testDate = LocalDate.now().plusDays(3);

        // 15-minute slots: 09:00 -> 10:00 = 4 slots
        AvailabilityRequest req = AvailabilityRequest.builder()
                .availableDate(testDate)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .slotDurationMinutes(15)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/doctors/" + doctorEntity.getId() + "/available-slots")
                        .param("date", testDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].startTime").value("09:00:00"))
                .andExpect(jsonPath("$[0].endTime").value("09:15:00"))
                .andExpect(jsonPath("$[3].startTime").value("09:45:00"))
                .andExpect(jsonPath("$[3].endTime").value("10:00:00"));
    }

    @Test
    @DisplayName("Should filter out booked appointment slots from available slots list")
    void testBookedSlotFiltering() throws Exception {
        LocalDate testDate = LocalDate.now().plusDays(4);

        // Availability 09:00 -> 12:00 (6 slots total)
        AvailabilityRequest req = AvailabilityRequest.builder()
                .availableDate(testDate)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Book slot 10:00 -> 10:30
        Appointment app = Appointment.builder()
                .doctor(doctorEntity)
                .patient(patientEntity)
                .appointmentDate(testDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .status(AppointmentStatus.CONFIRMED)
                .reason("Regular checkup")
                .build();
        appointmentRepository.save(app);

        // Fetch available slots: Should now return 5 slots (10:00 slot excluded)
        mockMvc.perform(get("/api/doctors/" + doctorEntity.getId() + "/available-slots")
                        .param("date", testDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[*].startTime", not(hasItem("10:00:00"))));
    }

    @Test
    @DisplayName("Should return empty list when doctor has no availability schedule for date")
    void testNoAvailabilityReturnsEmptyList() throws Exception {
        LocalDate testDate = LocalDate.now().plusDays(5);

        mockMvc.perform(get("/api/doctors/" + doctorEntity.getId() + "/available-slots")
                        .param("date", testDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Should reject requests for past dates with 400 Bad Request")
    void testPastDateRejection() throws Exception {
        LocalDate pastDate = LocalDate.now().minusDays(1);

        mockMvc.perform(get("/api/doctors/" + doctorEntity.getId() + "/available-slots")
                        .param("date", pastDate.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").value("Cannot retrieve available slots for a past date."));
    }

    @Test
    @DisplayName("Should return 404 Not Found for non-existent doctor ID")
    void testDoctorNotFound() throws Exception {
        LocalDate testDate = LocalDate.now().plusDays(1);

        mockMvc.perform(get("/api/doctors/999999/available-slots")
                        .param("date", testDate.toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Resource Not Found"));
    }
}
