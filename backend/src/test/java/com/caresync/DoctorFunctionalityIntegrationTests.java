package com.caresync;

import com.caresync.dto.AvailabilityRequest;
import com.caresync.dto.RegisterRequest;
import com.caresync.dto.UpdateDoctorProfileRequest;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.User;
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
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DoctorFunctionalityIntegrationTests {

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

    private String doctorToken;
    private String doctor2Token;
    private String patientToken;
    private Doctor doctorEntity;

    @BeforeEach
    void setUp() throws Exception {
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Doctor 1
        RegisterRequest docReg = RegisterRequest.builder()
                .email("dr.john@caresync.com")
                .password("docPass123")
                .fullName("Dr. John Watson")
                .phoneNumber("+1112223333")
                .role(Role.DOCTOR)
                .specialization("Neurology")
                .qualifications("MD, PhD")
                .experienceYears(10)
                .location("New York Medical Center")
                .consultationFee(new BigDecimal("200.00"))
                .build();

        String docResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        doctorToken = objectMapper.readTree(docResponse).get("token").asText();
        Long docUserId = objectMapper.readTree(docResponse).get("user").get("id").asLong();
        doctorEntity = doctorRepository.findByUserId(docUserId).orElseThrow();

        // 2. Register Doctor 2
        RegisterRequest doc2Reg = RegisterRequest.builder()
                .email("dr.greg@caresync.com")
                .password("docPass123")
                .fullName("Dr. Gregory House")
                .phoneNumber("+1999888777")
                .role(Role.DOCTOR)
                .specialization("Diagnostics")
                .qualifications("MD")
                .experienceYears(15)
                .location("Princeton-Plainsboro")
                .consultationFee(new BigDecimal("350.00"))
                .build();

        String doc2Response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doc2Reg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        doctor2Token = objectMapper.readTree(doc2Response).get("token").asText();

        // 3. Register Patient
        RegisterRequest patientReg = RegisterRequest.builder()
                .email("patient.mary@caresync.com")
                .password("patPass123")
                .fullName("Mary Jane")
                .role(Role.PATIENT)
                .build();

        String patResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patientReg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        patientToken = objectMapper.readTree(patResponse).get("token").asText();
    }

    @Test
    @DisplayName("Should allow public searching of doctors by specialization, name, or location")
    void testPublicDoctorSearch() throws Exception {
        mockMvc.perform(get("/api/doctors")
                        .param("specialization", "Neurology"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fullName").value("Dr. John Watson"));

        mockMvc.perform(get("/api/doctors")
                        .param("location", "Princeton"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fullName").value("Dr. Gregory House"));
    }

    @Test
    @DisplayName("Should allow authenticated doctor to update profile")
    void testDoctorProfileUpdate() throws Exception {
        UpdateDoctorProfileRequest updateReq = UpdateDoctorProfileRequest.builder()
                .specialization("Pediatric Neurology")
                .qualifications("MD, PhD, FRCP")
                .experienceYears(12)
                .bio("Specialist in pediatric neurology with over 12 years experience.")
                .location("Manhattan Children Hospital")
                .consultationFee(new BigDecimal("250.00"))
                .build();

        mockMvc.perform(put("/api/doctors/me")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.specialization").value("Pediatric Neurology"))
                .andExpect(jsonPath("$.consultationFee").value(250.00));
    }

    @Test
    @DisplayName("Should successfully add valid availability schedule for doctor")
    void testAddAvailabilitySuccess() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.startTime").value("09:00:00"))
                .andExpect(jsonPath("$.endTime").value("12:00:00"));
    }

    @Test
    @DisplayName("Should reject availability when end time is before or equal to start time")
    void testRejectInvalidTimeOrder() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(10, 0)) // End time before start time
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").value("End time must be after start time."));
    }

    @Test
    @DisplayName("Should reject availability scheduled for a past date")
    void testRejectPastDate() throws Exception {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(yesterday)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").value("Cannot schedule availability for a past date."));
    }

    @Test
    @DisplayName("Should reject overlapping availability slots for the same doctor")
    void testRejectOverlappingAvailability() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        // 1. Add first slot 09:00 to 12:00
        AvailabilityRequest slot1 = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slot1)))
                .andExpect(status().isCreated());

        // 2. Attempt overlapping slot 10:30 to 13:30
        AvailabilityRequest slot2 = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(10, 30))
                .endTime(LocalTime.of(13, 30))
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slot2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").value("The requested time range overlaps with an existing availability slot."));
    }

    @Test
    @DisplayName("Should forbid Patients from creating doctor availability (403 Forbidden)")
    void testPatientCannotAddAvailability() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access Forbidden"));
    }

    @Test
    @DisplayName("Should forbid Doctor from deleting another doctor's availability slot (403 Forbidden)")
    void testDoctorCannotDeleteOtherDoctorAvailability() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest slot1 = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .build();

        String slotRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slot1)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long slotId = objectMapper.readTree(slotRes).get("id").asLong();

        // Doctor 2 attempts to delete Doctor 1's availability
        mockMvc.perform(delete("/api/availability/" + slotId)
                        .header("Authorization", "Bearer " + doctor2Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access Forbidden"));
    }

    @Test
    @DisplayName("Should allow Doctor to view own profile")
    void testDoctorViewOwnProfile() throws Exception {
        mockMvc.perform(get("/api/doctor/me")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("dr.john@caresync.com"))
                .andExpect(jsonPath("$.fullName").value("Dr. John Watson"))
                .andExpect(jsonPath("$.specialization").value("Neurology"));
    }

    @Test
    @DisplayName("Should forbid Patient from updating doctor profile")
    void testPatientCannotUpdateDoctorProfile() throws Exception {
        UpdateDoctorProfileRequest updateReq = UpdateDoctorProfileRequest.builder()
                .specialization("Faker")
                .qualifications("None")
                .consultationFee(BigDecimal.ZERO)
                .build();

        mockMvc.perform(put("/api/doctors/me")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access Forbidden"));
    }

    @Test
    @DisplayName("Should allow Doctor to view own availability schedule")
    void testDoctorViewOwnAvailability() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(17, 0))
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/availability/me")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].startTime").value("14:00:00"))
                .andExpect(jsonPath("$[0].endTime").value("17:00:00"));
    }

    @Test
    @DisplayName("Should allow Doctor to update own availability schedule")
    void testDoctorUpdateOwnAvailability() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .build();

        String createRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long slotId = objectMapper.readTree(createRes).get("id").asLong();

        AvailabilityRequest updateReq = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(13, 0))
                .slotDurationMinutes(45)
                .build();

        mockMvc.perform(put("/api/availability/" + slotId)
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.startTime").value("10:00:00"))
                .andExpect(jsonPath("$.endTime").value("13:00:00"))
                .andExpect(jsonPath("$.slotDurationMinutes").value(45));
    }

    @Test
    @DisplayName("Should allow Doctor to soft delete own availability schedule")
    void testDoctorDeleteOwnAvailability() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .build();

        String createRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long slotId = objectMapper.readTree(createRes).get("id").asLong();

        mockMvc.perform(delete("/api/availability/" + slotId)
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/availability/me")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Should forbid Doctor from updating another doctor's availability schedule (IDOR 403 Forbidden)")
    void testDoctorCannotUpdateOtherDoctorAvailability() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .build();

        String createRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long slotId = objectMapper.readTree(createRes).get("id").asLong();

        AvailabilityRequest updateReq = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(13, 0))
                .build();

        mockMvc.perform(put("/api/availability/" + slotId)
                        .header("Authorization", "Bearer " + doctor2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access Forbidden"));
    }

    @Test
    @DisplayName("Should reject negative or zero slot duration")
    void testRejectInvalidSlotDuration() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        AvailabilityRequest request = AvailabilityRequest.builder()
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(-15)
                .build();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").value("Slot duration must be a positive number of minutes."));
    }

    @Test
    @DisplayName("Should allow viewing public doctor profile by ID")
    void testGetDoctorByIdPublic() throws Exception {
        mockMvc.perform(get("/api/doctors/" + doctorEntity.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Dr. John Watson"))
                .andExpect(jsonPath("$.specialization").value("Neurology"));
    }
}
