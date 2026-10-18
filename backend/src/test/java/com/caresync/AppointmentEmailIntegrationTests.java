package com.caresync;

import com.caresync.dto.AppointmentResponse;
import com.caresync.dto.BookAppointmentRequest;
import com.caresync.dto.RescheduleAppointmentRequest;
import com.caresync.event.AppointmentEvent;
import com.caresync.event.AppointmentEventListener;
import com.caresync.event.AppointmentEventType;
import com.caresync.exception.ValidationException;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.DoctorAvailability;
import com.caresync.model.entity.Patient;
import com.caresync.model.entity.User;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.Role;
import com.caresync.repository.*;
import com.caresync.service.AdminService;
import com.caresync.service.AppointmentService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "mail.enabled=true")
class AppointmentEmailIntegrationTests {

    @MockBean
    private JavaMailSender javaMailSender;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private AppointmentEventListener eventListener;

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
    private User patientUser;
    private User doctorUser;

    @BeforeEach
    void setUp() {
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();

        eventListener.clearProcessedEvents();

        // Reset and re-stub JavaMailSender to produce clean in-memory MimeMessages
        reset(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenAnswer(inv -> new MimeMessage((Session) null));

        // 1. Create Patient User & Patient Entity
        patientUser = userRepository.save(User.builder()
                .email("alice.patient@caresync.com")
                .password("Password123!")
                .fullName("Alice Patient")
                .phoneNumber("+1 (555) 111-2222")
                .role(Role.PATIENT)
                .active(true)
                .build());

        patientEntity = patientRepository.save(Patient.builder()
                .user(patientUser)
                .build());

        // 2. Create Doctor User & Doctor Entity
        doctorUser = userRepository.save(User.builder()
                .email("dr.bob.doctor@caresync.com")
                .password("Password123!")
                .fullName("Dr. Bob Specialist")
                .phoneNumber("+1 (555) 333-4444")
                .role(Role.DOCTOR)
                .active(true)
                .build());

        doctorEntity = doctorRepository.save(Doctor.builder()
                .user(doctorUser)
                .specialization("Cardiology")
                .qualifications("MD, FACC")
                .consultationFee(new BigDecimal("150.00"))
                .build());

        // 3. Create Doctor Availability for tomorrow and 2 days out
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        availabilityRepository.save(DoctorAvailability.builder()
                .doctor(doctorEntity)
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(13, 0))
                .slotDurationMinutes(30)
                .active(true)
                .build());

        LocalDate dayAfterTomorrow = LocalDate.now().plusDays(2);
        availabilityRepository.save(DoctorAvailability.builder()
                .doctor(doctorEntity)
                .availableDate(dayAfterTomorrow)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(17, 0))
                .slotDurationMinutes(30)
                .active(true)
                .build());
    }

    @AfterEach
    void tearDown() throws Exception {
        Thread.sleep(100);
    }

    @Test
    @DisplayName("1. Successfully committed booking triggers confirmation emails to both patient and doctor")
    void testSuccessfulBookingTriggersPatientAndDoctorEmails() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .reason("Chest pain consultation")
                .build();

        AppointmentResponse response = appointmentService.bookAppointment(patientUser.getEmail(), request);

        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(AppointmentStatus.SCHEDULED, response.getStatus());

        // Verify that 2 emails were dispatched: 1 for patient, 1 for doctor
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(3000).times(2)).send(captor.capture());

        List<MimeMessage> sentMessages = captor.getAllValues();
        assertEquals(2, sentMessages.size());

        boolean patientReceived = false;
        boolean doctorReceived = false;

        for (MimeMessage msg : sentMessages) {
            String recipient = msg.getAllRecipients()[0].toString();
            String subject = msg.getSubject();

            assertTrue(subject.contains("CareSync"), "Subject should have CareSync branding");
            assertTrue(subject.contains("CS-APP-" + response.getId()), "Subject should contain appointment reference");

            if (recipient.contains(patientUser.getEmail())) {
                patientReceived = true;
                assertTrue(subject.contains("Confirmation"));
            } else if (recipient.contains(doctorUser.getEmail())) {
                doctorReceived = true;
                assertTrue(subject.contains("New Patient Appointment"));
            }
        }

        assertTrue(patientReceived, "Patient must receive confirmation email");
        assertTrue(doctorReceived, "Doctor must receive appointment notification");
    }

    @Test
    @DisplayName("2. Failed booking transaction does NOT trigger any confirmation email")
    void testFailedBookingDoesNotTriggerEmails() {
        // Attempt booking in the past
        LocalDate yesterday = LocalDate.now().minusDays(1);
        BookAppointmentRequest pastRequest = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(yesterday)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .reason("Past Date Consult")
                .build();

        assertThrows(ValidationException.class, () ->
                appointmentService.bookAppointment(patientUser.getEmail(), pastRequest));

        // Zero emails should be sent
        verify(javaMailSender, after(1000).never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("3. Appointment cancellation triggers notification to patient and doctor")
    void testAppointmentCancellationSendsNotifications() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .reason("Checkup")
                .build();

        AppointmentResponse booked = appointmentService.bookAppointment(patientUser.getEmail(), request);
        verify(javaMailSender, timeout(3000).times(2)).send(any(MimeMessage.class));
        clearInvocations(javaMailSender);

        // Cancel the appointment
        AppointmentResponse cancelled = appointmentService.cancelAppointment(booked.getId(), patientUser.getEmail());
        assertEquals(AppointmentStatus.CANCELLED, cancelled.getStatus());

        // Verify cancellation emails dispatched to patient and doctor
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(3000).times(2)).send(captor.capture());

        for (MimeMessage msg : captor.getAllValues()) {
            assertTrue(msg.getSubject().contains("Cancelled"));
            assertTrue(msg.getSubject().contains("CS-APP-" + booked.getId()));
        }
    }

    @Test
    @DisplayName("4. Appointment rescheduling sends notifications with new and previous slot details")
    void testAppointmentReschedulingSendsNotifications() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .reason("Initial consultation")
                .build();

        AppointmentResponse booked = appointmentService.bookAppointment(patientUser.getEmail(), request);
        verify(javaMailSender, timeout(3000).times(2)).send(any(MimeMessage.class));
        clearInvocations(javaMailSender);

        // Reschedule to day after tomorrow 14:00 - 14:30
        LocalDate dayAfterTomorrow = LocalDate.now().plusDays(2);
        RescheduleAppointmentRequest rescheduleRequest = RescheduleAppointmentRequest.builder()
                .newAppointmentDate(dayAfterTomorrow)
                .newStartTime(LocalTime.of(14, 0))
                .newEndTime(LocalTime.of(14, 30))
                .reason("Schedule conflict")
                .build();

        AppointmentResponse rescheduled = appointmentService.rescheduleAppointment(
                booked.getId(), patientUser.getEmail(), rescheduleRequest);

        assertEquals(dayAfterTomorrow, rescheduled.getAppointmentDate());
        assertEquals(LocalTime.of(14, 0), rescheduled.getStartTime());

        // Verify reschedule emails sent
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(3000).times(2)).send(captor.capture());

        for (MimeMessage msg : captor.getAllValues()) {
            assertTrue(msg.getSubject().contains("Rescheduled"));
            assertTrue(msg.getSubject().contains("CS-APP-" + booked.getId()));
        }
    }

    @Test
    @DisplayName("5. Admin updating status to CONFIRMED sends confirmation notice")
    void testAdminConfirmAppointmentSendsNotice() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(12, 0))
                .endTime(LocalTime.of(12, 30))
                .reason("General consult")
                .build();

        AppointmentResponse booked = appointmentService.bookAppointment(patientUser.getEmail(), request);
        verify(javaMailSender, timeout(3000).times(2)).send(any(MimeMessage.class));
        clearInvocations(javaMailSender);

        // Admin updates status to CONFIRMED
        AppointmentResponse confirmed = adminService.updateAppointmentStatus(booked.getId(), AppointmentStatus.CONFIRMED);
        assertEquals(AppointmentStatus.CONFIRMED, confirmed.getStatus());

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(3000).times(2)).send(captor.capture());

        for (MimeMessage msg : captor.getAllValues()) {
            assertTrue(msg.getSubject().contains("Confirmed"));
        }
    }

    @Test
    @DisplayName("6. Email delivery failure (SMTP down) does NOT roll back a successful booking")
    void testEmailDeliveryFailureDoesNotRollbackBooking() {
        doThrow(new MailSendException("SMTP server connection timeout"))
                .when(javaMailSender).send(any(MimeMessage.class));

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .doctorId(doctorEntity.getId())
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(9, 30))
                .endTime(LocalTime.of(10, 0))
                .reason("Urgent Consult")
                .build();

        AppointmentResponse response = assertDoesNotThrow(() ->
                appointmentService.bookAppointment(patientUser.getEmail(), request));

        assertNotNull(response);
        assertNotNull(response.getId());

        // Verify appointment was successfully persisted in the database
        Appointment savedInDb = appointmentRepository.findById(response.getId()).orElse(null);
        assertNotNull(savedInDb);
        assertEquals(AppointmentStatus.SCHEDULED, savedInDb.getStatus());

        // Wait for async task to attempt send so no background tasks leak into other tests
        verify(javaMailSender, timeout(3000).times(2)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("7. Duplicate event processing does not send duplicate notifications")
    void testDuplicateEventProcessingDoesNotSendDuplicateNotifications() {
        AppointmentEvent testEvent = AppointmentEvent.builder()
                .eventId("TEST_IDEMPOTENT_EVENT_1001")
                .eventType(AppointmentEventType.BOOKED)
                .appointmentId(999L)
                .patientEmail("alice.patient@caresync.com")
                .patientName("Alice Patient")
                .doctorEmail("dr.bob.doctor@caresync.com")
                .doctorName("Dr. Bob Specialist")
                .doctorSpecialization("Cardiology")
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .status(AppointmentStatus.SCHEDULED)
                .build();

        // 1st processing run
        eventListener.onAppointmentEvent(testEvent);
        verify(javaMailSender, timeout(2000).times(2)).send(any(MimeMessage.class));

        // 2nd processing run with the identical event ID
        eventListener.onAppointmentEvent(testEvent);

        // Verification: Still only 2 emails dispatched, second run skipped
        verify(javaMailSender, times(2)).send(any(MimeMessage.class));
        assertTrue(eventListener.isEventProcessed("TEST_IDEMPOTENT_EVENT_1001"));
    }

    @Test
    @DisplayName("8. Disabled email functionality does not break appointment booking or attempt delivery")
    void testDisabledEmailFunctionalityDoesNotAttemptDelivery() {
        // Temporarily disable email on service
        com.caresync.service.EmailService emailService = 
                (com.caresync.service.EmailService) ReflectionTestUtils.getField(eventListener, "emailService");
        assertNotNull(emailService);

        boolean originalState = (boolean) ReflectionTestUtils.getField(emailService, "mailEnabled");
        ReflectionTestUtils.setField(emailService, "mailEnabled", false);

        try {
            LocalDate tomorrow = LocalDate.now().plusDays(1);
            BookAppointmentRequest request = BookAppointmentRequest.builder()
                    .doctorId(doctorEntity.getId())
                    .appointmentDate(tomorrow)
                    .startTime(LocalTime.of(10, 30))
                    .endTime(LocalTime.of(11, 0))
                    .reason("Routine checkup")
                    .build();

            AppointmentResponse response = assertDoesNotThrow(() ->
                    appointmentService.bookAppointment(patientUser.getEmail(), request));

            assertNotNull(response);
            assertNotNull(response.getId());

            // Email sender should not be called at all
            verify(javaMailSender, after(1000).never()).send(any(MimeMessage.class));
        } finally {
            ReflectionTestUtils.setField(emailService, "mailEnabled", originalState);
        }
    }
}
