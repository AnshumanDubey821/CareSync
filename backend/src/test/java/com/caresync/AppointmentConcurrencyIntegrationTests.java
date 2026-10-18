package com.caresync;

import com.caresync.dto.AvailabilityRequest;
import com.caresync.dto.BookAppointmentRequest;
import com.caresync.dto.RegisterRequest;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
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
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AppointmentConcurrencyIntegrationTests {

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

    private Doctor doctorEntity;
    private final List<String> patientTokens = new ArrayList<>();
    private final int NUMBER_OF_PATIENTS = 8;
    private final LocalDate targetDate = LocalDate.now().plusDays(5);
    private final LocalTime slotStartTime = LocalTime.of(10, 0);
    private final LocalTime slotEndTime = LocalTime.of(10, 30);

    @BeforeEach
    void setUp() throws Exception {
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();
        patientTokens.clear();

        // 1. Create Doctor
        RegisterRequest docReg = RegisterRequest.builder()
                .email("dr.concurrency@caresync.com")
                .password("docPass123")
                .fullName("Dr. Concurrency Specialist")
                .phoneNumber("+1110009999")
                .role(Role.DOCTOR)
                .specialization("Surgeon")
                .qualifications("MD")
                .consultationFee(new BigDecimal("300.00"))
                .build();

        String docResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docReg)))
                .andReturn().getResponse().getContentAsString();

        String doctorToken = objectMapper.readTree(docResponse).get("token").asText();
        Long docUserId = objectMapper.readTree(docResponse).get("user").get("id").asLong();
        doctorEntity = doctorRepository.findByUserId(docUserId).orElseThrow();

        // 2. Create Available Slot (10:00 -> 10:30)
        AvailabilityRequest availReq = AvailabilityRequest.builder()
                .availableDate(targetDate)
                .startTime(slotStartTime)
                .endTime(slotEndTime)
                .slotDurationMinutes(30)
                .build();

        mockMvc.perform(post("/api/availability")
                .header("Authorization", "Bearer " + doctorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(availReq)));

        // 3. Register N Patients
        for (int i = 1; i <= NUMBER_OF_PATIENTS; i++) {
            RegisterRequest patReg = RegisterRequest.builder()
                    .email("concurrent.patient" + i + "@caresync.com")
                    .password("patPass123")
                    .fullName("Patient " + i)
                    .role(Role.PATIENT)
                    .build();

            String patRes = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(patReg)))
                    .andReturn().getResponse().getContentAsString();

            String token = objectMapper.readTree(patRes).get("token").asText();
            patientTokens.add(token);
        }
    }

    @Test
    @DisplayName("STRICT CONCURRENCY TEST: Multiple patients attempting to book the exact same slot simultaneously — Exactly ONE succeeds, remaining fail with 409 Conflict")
    void testConcurrentSlotBookingRaceCondition() throws Exception {
        ExecutorService executorService = Executors.newFixedThreadPool(NUMBER_OF_PATIENTS);
        CountDownLatch readyLatch = new CountDownLatch(NUMBER_OF_PATIENTS);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        AtomicInteger otherErrorCount = new AtomicInteger(0);

        BookAppointmentRequest bookingRequest = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(targetDate)
                .startTime(slotStartTime)
                .endTime(slotEndTime)
                .reason("Concurrent booking test request")
                .notes("Testing pessimistic locking & DB unique constraint protection")
                .build();

        String requestBodyJson = objectMapper.writeValueAsString(bookingRequest);

        List<Future<Integer>> futures = new ArrayList<>();

        for (int i = 0; i < NUMBER_OF_PATIENTS; i++) {
            final String token = patientTokens.get(i);
            futures.add(executorService.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Wait for simultaneous release trigger
                    MvcResult result = mockMvc.perform(post("/api/appointments")
                                    .header("Authorization", "Bearer " + token)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(requestBodyJson))
                            .andReturn();

                    int status = result.getResponse().getStatus();
                    if (status == 201) {
                        successCount.incrementAndGet();
                    } else if (status == 409) {
                        conflictCount.incrementAndGet();
                    } else {
                        otherErrorCount.incrementAndGet();
                    }
                    return status;
                } catch (Exception e) {
                    otherErrorCount.incrementAndGet();
                    return 500;
                }
            }));
        }

        readyLatch.await(); // Wait for all threads to be ready
        startLatch.countDown(); // Fire all concurrent requests simultaneously!

        executorService.shutdown();
        executorService.awaitTermination(15, TimeUnit.SECONDS);

        // VERIFICATIONS
        assertEquals(1, successCount.get(), "EXACTLY ONE concurrent booking request must succeed!");
        assertEquals(NUMBER_OF_PATIENTS - 1, conflictCount.get(), "All other concurrent requests MUST fail with 409 CONFLICT!");
        assertEquals(0, otherErrorCount.get(), "No unexpected internal server errors should occur!");

        // DATABASE CONSISTENCY VERIFICATION
        List<Appointment> dbAppointments = appointmentRepository.findByDoctorIdAndAppointmentDate(doctorEntity.getId(), targetDate);
        assertEquals(1, dbAppointments.size(), "Database MUST contain EXACTLY ONE appointment record for that slot!");
    }
}
