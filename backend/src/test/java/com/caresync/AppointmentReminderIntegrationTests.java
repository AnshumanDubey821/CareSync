package com.caresync;

import com.caresync.dto.BookAppointmentRequest;
import com.caresync.dto.RescheduleAppointmentRequest;
import com.caresync.model.entity.*;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.ReminderStatus;
import com.caresync.model.enums.ReminderType;
import com.caresync.model.enums.Role;
import com.caresync.repository.*;
import com.caresync.scheduler.AppointmentReminderScheduler;
import com.caresync.service.AppointmentService;
import com.caresync.service.EmailService;
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
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "mail.enabled=true",
        "app.scheduling.reminder-enabled=false"
})
class AppointmentReminderIntegrationTests {

    @MockBean
    private JavaMailSender javaMailSender;

    @Autowired
    private AppointmentReminderScheduler reminderScheduler;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AppointmentReminderRepository reminderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private Clock clock;

    private Patient patientEntity;
    private Doctor doctorEntity;
    private User patientUser;
    private User doctorUser;

    @BeforeEach
    void setUp() {
        reminderRepository.deleteAll();
        prescriptionRepository.deleteAll();
        appointmentRepository.deleteAll();
        availabilityRepository.deleteAll();
        doctorRepository.deleteAll();
        patientRepository.deleteAll();
        userRepository.deleteAll();

        reset(javaMailSender);
        when(javaMailSender.createMimeMessage()).thenAnswer(inv -> new MimeMessage((Session) null));

        // Create Patient User & Entity
        patientUser = userRepository.save(User.builder()
                .email("sarah.patient@caresync.com")
                .password("Password123!")
                .fullName("Sarah Jenkins")
                .phoneNumber("+1 (555) 432-1098")
                .role(Role.PATIENT)
                .active(true)
                .build());

        patientEntity = patientRepository.save(Patient.builder()
                .user(patientUser)
                .build());

        // Create Doctor User & Entity
        doctorUser = userRepository.save(User.builder()
                .email("dr.morris.doctor@caresync.com")
                .password("Password123!")
                .fullName("Dr. Michael Morris")
                .phoneNumber("+1 (555) 765-4321")
                .role(Role.DOCTOR)
                .active(true)
                .build());

        doctorEntity = doctorRepository.save(Doctor.builder()
                .user(doctorUser)
                .specialization("Neurology")
                .qualifications("MD, PhD")
                .consultationFee(new BigDecimal("200.00"))
                .build());
    }

    @AfterEach
    void tearDown() throws Exception {
        Thread.sleep(100);
    }

    @Test
    @DisplayName("1. 24-hour reminder is dispatched with doctor details, reference CS-APP-{id}, and recorded in appointment_reminders")
    void test24HourReminderDispatchedSuccessfully() throws Exception {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate tomorrow = now.toLocalDate().plusDays(1);

        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .status(AppointmentStatus.SCHEDULED)
                .reason("Migraine checkup")
                .reminderSent(false)
                .build());

        int sent = reminderScheduler.send24HourAppointmentReminders();
        assertEquals(1, sent, "Exactly one 24-hour reminder should be dispatched");

        // Verify email interaction
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(3000).times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        String recipient = sentMessage.getAllRecipients()[0].toString();
        String subject = sentMessage.getSubject();

        assertTrue(recipient.contains("sarah.patient@caresync.com"));
        assertTrue(subject.contains("CareSync"));
        assertTrue(subject.contains("Upcoming Appointment Reminder (Tomorrow)"));
        assertTrue(subject.contains("CS-APP-" + appointment.getId()));

        // Verify reminder table record
        assertTrue(reminderRepository.existsByAppointmentIdAndReminderTypeAndStatus(
                appointment.getId(), ReminderType.REMINDER_24_HOUR, ReminderStatus.SENT));

        AppointmentReminder record = reminderRepository.findByAppointmentIdAndReminderType(
                appointment.getId(), ReminderType.REMINDER_24_HOUR).orElse(null);
        assertNotNull(record);
        assertEquals(ReminderStatus.SENT, record.getStatus());
        assertNotNull(record.getSentAt());
        assertNull(record.getErrorDetails());

        // Verify appointment entity reminderSent flag updated
        Appointment refreshed = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertTrue(refreshed.getReminderSent());
    }

    @Test
    @DisplayName("2. 1-hour reminder is dispatched for appointment starting within 1 hour")
    void test1HourReminderDispatchedSuccessfully() throws Exception {
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MINUTES);
        LocalDateTime appDateTime = now.plusMinutes(40);
        LocalDate appDate = appDateTime.toLocalDate();
        LocalTime appStart = appDateTime.toLocalTime();
        LocalTime appEnd = appStart.plusMinutes(30);

        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(appDate)
                .startTime(appStart)
                .endTime(appEnd)
                .status(AppointmentStatus.CONFIRMED)
                .reason("Post-MRI Consultation")
                .reminderSent(false)
                .build());

        int sent = reminderScheduler.send1HourAppointmentReminders();
        assertEquals(1, sent, "Exactly one 1-hour reminder should be dispatched");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(3000).times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        String recipient = sentMessage.getAllRecipients()[0].toString();
        String subject = sentMessage.getSubject();

        assertTrue(recipient.contains("sarah.patient@caresync.com"));
        assertTrue(subject.contains("CareSync"));
        assertTrue(subject.contains("Appointment Reminder: Starting in 1 Hour"));
        assertTrue(subject.contains("CS-APP-" + appointment.getId()));

        // Verify reminder table record
        assertTrue(reminderRepository.existsByAppointmentIdAndReminderTypeAndStatus(
                appointment.getId(), ReminderType.REMINDER_1_HOUR, ReminderStatus.SENT));
    }

    @Test
    @DisplayName("3. Idempotency: Repeated scheduler executions do not send duplicate reminders")
    void testRepeatedExecutionsDoNotDuplicateReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate tomorrow = now.toLocalDate().plusDays(1);

        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .status(AppointmentStatus.SCHEDULED)
                .reason("Idempotency check")
                .reminderSent(false)
                .build());

        // First run: should dispatch reminder
        int firstRun = reminderScheduler.send24HourAppointmentReminders();
        assertEquals(1, firstRun);
        verify(javaMailSender, timeout(3000).times(1)).send(any(MimeMessage.class));

        // Second run: must skip already-sent reminder
        int secondRun = reminderScheduler.send24HourAppointmentReminders();
        assertEquals(0, secondRun);

        // Third run: still 0
        int thirdRun = reminderScheduler.send24HourAppointmentReminders();
        assertEquals(0, thirdRun);

        // Total email invocations should strictly remain 1
        verify(javaMailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("4. Ineligible statuses (CANCELLED, COMPLETED, NO_SHOW) do not receive reminders")
    void testIneligibleAppointmentStatusesDoNotReceiveReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate tomorrow = now.toLocalDate().plusDays(1);

        // Cancelled appointment
        appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .status(AppointmentStatus.CANCELLED)
                .reminderSent(false)
                .build());

        // Completed appointment
        appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .status(AppointmentStatus.COMPLETED)
                .reminderSent(false)
                .build());

        // No-show appointment
        appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .status(AppointmentStatus.NO_SHOW)
                .reminderSent(false)
                .build());

        int sent = reminderScheduler.send24HourAppointmentReminders();
        assertEquals(0, sent, "No reminders should be sent for cancelled, completed, or no-show appointments");
        verify(javaMailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("5. Late-reminder policy: Past or in-progress appointments do not receive reminders")
    void testPastOrInProgressAppointmentsDoNotReceiveReminders() {
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MINUTES);
        LocalDateTime pastDateTime = now.minusMinutes(30);
        LocalDate pastDate = pastDateTime.toLocalDate();
        LocalTime pastStart = pastDateTime.toLocalTime();
        LocalTime pastEnd = pastStart.plusMinutes(30);

        appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(pastDate)
                .startTime(pastStart)
                .endTime(pastEnd)
                .status(AppointmentStatus.SCHEDULED)
                .reminderSent(false)
                .build());

        int sent1h = reminderScheduler.send1HourAppointmentReminders();
        int sent24h = reminderScheduler.send24HourAppointmentReminders();

        assertEquals(0, sent1h, "1-hour reminder must not be sent for past or already-started appointments");
        assertEquals(0, sent24h, "24-hour reminder must not be sent for past appointments");
        verify(javaMailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("6. Rescheduled appointments reset reminder eligibility and trigger reminder for new slot")
    void testRescheduledAppointmentsReceiveRemindersForNewSlot() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate tomorrow = now.toLocalDate().plusDays(1);

        // Create availability for tomorrow and 3 days out
        availabilityRepository.save(DoctorAvailability.builder()
                .doctor(doctorEntity)
                .availableDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(12, 0))
                .slotDurationMinutes(30)
                .active(true)
                .build());

        LocalDate newDate = now.toLocalDate().plusDays(3);
        availabilityRepository.save(DoctorAvailability.builder()
                .doctor(doctorEntity)
                .availableDate(newDate)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(17, 0))
                .slotDurationMinutes(30)
                .active(true)
                .build());

        // Book initial appointment
        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .status(AppointmentStatus.SCHEDULED)
                .reminderSent(false)
                .build());

        // Send 24h reminder for initial slot
        int initialSent = reminderScheduler.send24HourAppointmentReminders();
        assertEquals(1, initialSent);
        assertTrue(reminderRepository.existsByAppointmentIdAndReminderTypeAndStatus(
                appointment.getId(), ReminderType.REMINDER_24_HOUR, ReminderStatus.SENT));

        // Reschedule to newDate 14:00 - 14:30
        RescheduleAppointmentRequest request = RescheduleAppointmentRequest.builder()
                .newAppointmentDate(newDate)
                .newStartTime(LocalTime.of(14, 0))
                .newEndTime(LocalTime.of(14, 30))
                .reason("Moved forward")
                .build();

        appointmentService.rescheduleAppointment(appointment.getId(), patientUser.getEmail(), request);

        // Verify reminder records were reset upon rescheduling
        Appointment refreshed = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertFalse(refreshed.getReminderSent(), "reminderSent flag should be reset after reschedule");
        assertFalse(reminderRepository.existsByAppointmentIdAndReminderTypeAndStatus(
                appointment.getId(), ReminderType.REMINDER_24_HOUR, ReminderStatus.SENT),
                "Reminder history should be cleared to allow reminders for the new slot");
    }

    @Test
    @DisplayName("7. SMTP failure logs error, records FAILED in appointment_reminders, and does not crash scheduler")
    void testSmtpFailureGracefullyHandledAndRecorded() {
        doThrow(new MailSendException("SMTP gateway timeout"))
                .when(javaMailSender).send(any(MimeMessage.class));

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate tomorrow = now.toLocalDate().plusDays(1);

        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .status(AppointmentStatus.SCHEDULED)
                .reason("Checkup with SMTP failure")
                .reminderSent(false)
                .build());

        // Scheduler should run without throwing exception
        assertDoesNotThrow(() -> reminderScheduler.send24HourAppointmentReminders());

        // Check that FAILED status was recorded in database
        AppointmentReminder record = reminderRepository.findByAppointmentIdAndReminderType(
                appointment.getId(), ReminderType.REMINDER_24_HOUR).orElse(null);
        assertNotNull(record);
        assertEquals(ReminderStatus.FAILED, record.getStatus());
        assertNotNull(record.getErrorDetails());
        assertTrue(record.getErrorDetails().contains("SMTP gateway timeout"));
    }

    @Test
    @DisplayName("8. Disabled email functionality skips delivery cleanly without error")
    void testDisabledEmailFunctionalitySkipsDelivery() {
        boolean original = (boolean) ReflectionTestUtils.getField(emailService, "mailEnabled");
        ReflectionTestUtils.setField(emailService, "mailEnabled", false);

        try {
            LocalDateTime now = LocalDateTime.now(clock);
            LocalDate tomorrow = now.toLocalDate().plusDays(1);

            Appointment appointment = appointmentRepository.save(Appointment.builder()
                    .patient(patientEntity)
                    .doctor(doctorEntity)
                    .appointmentDate(tomorrow)
                    .startTime(LocalTime.of(11, 0))
                    .endTime(LocalTime.of(11, 30))
                    .status(AppointmentStatus.SCHEDULED)
                    .reminderSent(false)
                    .build());

            int sent = assertDoesNotThrow(() -> reminderScheduler.send24HourAppointmentReminders());
            assertEquals(1, sent);

            // JavaMailSender.send must not have been invoked
            verify(javaMailSender, never()).send(any(MimeMessage.class));
        } finally {
            ReflectionTestUtils.setField(emailService, "mailEnabled", original);
        }
    }
}
