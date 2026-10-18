package com.caresync;

import com.caresync.dto.AppointmentResponse;
import com.caresync.dto.BookAppointmentRequest;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.DoctorAvailability;
import com.caresync.model.entity.Patient;
import com.caresync.model.entity.User;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.Role;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorAvailabilityRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.PrescriptionRepository;
import com.caresync.repository.UserRepository;
import com.caresync.scheduler.AppointmentReminderScheduler;
import com.caresync.service.AppointmentService;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "mail.enabled=true")
@Transactional
class EmailAndReminderIntegrationTests {

    @MockBean
    private JavaMailSender javaMailSender;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentReminderScheduler reminderScheduler;

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

    private Patient patientEntity;
    private Doctor doctorEntity;

    @BeforeEach
    void setUp() {
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();

        reset(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // 1. Create Patient
        User patientUser = userRepository.save(User.builder()
                .email("patient.email@caresync.com")
                .password("password123")
                .fullName("Test Patient Email")
                .phoneNumber("+1234567")
                .role(Role.PATIENT)
                .active(true)
                .build());

        patientEntity = patientRepository.save(Patient.builder()
                .user(patientUser)
                .build());

        // 2. Create Doctor
        User doctorUser = userRepository.save(User.builder()
                .email("doctor.email@caresync.com")
                .password("password123")
                .fullName("Dr. Email Specialist")
                .phoneNumber("+9876543")
                .role(Role.DOCTOR)
                .active(true)
                .build());

        doctorEntity = doctorRepository.save(Doctor.builder()
                .user(doctorUser)
                .specialization("Pediatrics")
                .qualifications("MD")
                .consultationFee(new BigDecimal("120.00"))
                .build());

        // 3. Create Doctor Availability for tomorrow
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        availabilityRepository.save(DoctorAvailability.builder()
                .doctor(doctorEntity)
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .active(true)
                .build());
    }

    @Test
    @DisplayName("Booking an appointment sends a confirmation email successfully")
    void testConfirmationEmailSentOnBooking() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        BookAppointmentRequest bookingRequest = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .reason("General Checkup")
                .build();

        AppointmentResponse response = appointmentService.bookAppointment("patient.email@caresync.com", bookingRequest);

        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(AppointmentStatus.SCHEDULED, response.getStatus());

        // Verify JavaMailSender attempt
        verify(javaMailSender, timeout(2000).atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("24-Hour Reminder Scheduler identifies upcoming appointments and marks reminderSent = true")
    void test24HourReminderScheduler() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .status(AppointmentStatus.SCHEDULED)
                .reason("Follow up")
                .reminderSent(false)
                .build());

        assertFalse(appointment.getReminderSent());

        // Execute scheduler
        int remindersSent = reminderScheduler.send24HourAppointmentReminders();

        assertEquals(1, remindersSent);

        Appointment updated = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertTrue(updated.getReminderSent());

        // Re-run scheduler to verify idempotency
        int secondRunSent = reminderScheduler.send24HourAppointmentReminders();
        assertEquals(0, secondRunSent);
    }

    @Test
    @DisplayName("Email failure (SMTP down) does NOT cause appointment transaction to fail or rollback")
    void testEmailFailureDoesNotRollbackAppointmentBooking() {
        // Simulate SMTP server error
        doThrow(new MailSendException("SMTP connection refused")).when(javaMailSender).send(any(MimeMessage.class));

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        BookAppointmentRequest bookingRequest = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .reason("Urgent Consult")
                .build();

        // Must succeed without throwing MailSendException
        AppointmentResponse response = assertDoesNotThrow(() ->
                appointmentService.bookAppointment("patient.email@caresync.com", bookingRequest));

        assertNotNull(response);
        assertNotNull(response.getId());

        // Verify appointment was successfully committed in DB
        assertTrue(appointmentRepository.findById(response.getId()).isPresent());

        // Wait for async notification attempt to complete before test teardown
        verify(javaMailSender, timeout(3000).times(2)).send(any(MimeMessage.class));
    }
}
