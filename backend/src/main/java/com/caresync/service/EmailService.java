package com.caresync.service;

import com.caresync.event.AppointmentEvent;
import com.caresync.event.AppointmentEventType;
import com.caresync.model.entity.Appointment;
import com.caresync.model.enums.AppointmentStatus;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${mail.from:${spring.mail.username:noreply@caresync.com}}")
    private String fromEmail;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Dispatch notification emails based on appointment lifecycle events.
     * Non-blocking and fail-safe: failures do not disrupt appointment workflows.
     */
    @Async
    public void sendAppointmentEventNotifications(AppointmentEvent event) {
        if (event == null) {
            log.warn("Cannot process null appointment event");
            return;
        }

        switch (event.eventType()) {
            case BOOKED -> {
                try { sendBookingConfirmationToPatient(event); } catch (Exception e) { log.error("Failed to send booking confirmation to patient: {}", e.getMessage()); }
                try { sendBookingNotificationToDoctor(event); } catch (Exception e) { log.error("Failed to send booking notification to doctor: {}", e.getMessage()); }
            }
            case CONFIRMED -> {
                try { sendConfirmationNoticeToPatient(event); } catch (Exception e) { log.error("Failed to send confirmation notice to patient: {}", e.getMessage()); }
                try { sendConfirmationNoticeToDoctor(event); } catch (Exception e) { log.error("Failed to send confirmation notice to doctor: {}", e.getMessage()); }
            }
            case CANCELLED -> {
                try { sendCancellationNoticeToPatient(event); } catch (Exception e) { log.error("Failed to send cancellation notice to patient: {}", e.getMessage()); }
                try { sendCancellationNoticeToDoctor(event); } catch (Exception e) { log.error("Failed to send cancellation notice to doctor: {}", e.getMessage()); }
            }
            case RESCHEDULED -> {
                try { sendRescheduleNoticeToPatient(event); } catch (Exception e) { log.error("Failed to send reschedule notice to patient: {}", e.getMessage()); }
                try { sendRescheduleNoticeToDoctor(event); } catch (Exception e) { log.error("Failed to send reschedule notice to doctor: {}", e.getMessage()); }
            }
        }
    }

    // ==========================================
    // 1. BOOKED NOTIFICATIONS
    // ==========================================

    private void sendBookingConfirmationToPatient(AppointmentEvent event) {
        String patientEmail = event.patientEmail();
        if (isInvalidEmail(patientEmail)) {
            log.warn("Cannot send booking confirmation: patient email is missing");
            return;
        }

        String ref = "CS-APP-" + event.appointmentId();
        String subject = "CareSync — Appointment Booking Confirmation (" + ref + ")";
        String dateStr = formatDate(event.appointmentDate());
        String timeStr = formatTimeRange(event.startTime(), event.endTime());
        String safePatient = escapeHtml(event.patientName());
        String safeDoctor = escapeHtml(event.doctorName());
        String safeSpec = escapeHtml(event.doctorSpecialization());
        String safeStatus = escapeHtml(event.status() != null ? event.status().name() : "SCHEDULED");
        String safeReason = escapeHtml(event.reason());

        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Booking Confirmation

                Hello %s,

                Your appointment has been successfully scheduled.

                Appointment Reference: %s
                Doctor: %s (%s)
                Date: %s
                Time: %s
                Status: %s
                Reason: %s

                Instructions:
                - Please arrive 10 minutes prior to your scheduled time.
                - Bring prior medical records, test reports, or prescriptions.
                - If you need to reschedule or cancel, notify us at least 24 hours in advance.

                Thank you for choosing CareSync.
                """, safePatient, ref, safeDoctor, safeSpec, dateStr, timeStr, safeStatus, safeReason.isBlank() ? "N/A" : safeReason);

        String htmlContent = buildEmailTemplate(
                "Appointment Confirmed",
                "#0284c7",
                String.format("Hello <strong>%s</strong>, your appointment has been successfully scheduled.", safePatient),
                ref,
                new String[][]{
                        {"Doctor", safeDoctor + " (" + safeSpec + ")"},
                        {"Date", dateStr},
                        {"Time", timeStr},
                        {"Status", "<span style=\"color:#0284c7; font-weight:bold;\">" + safeStatus + "</span>"},
                        {"Reason for Visit", safeReason.isBlank() ? "General Consultation" : safeReason}
                },
                """
                <li>Please arrive 10 minutes prior to your scheduled time.</li>
                <li>Bring any relevant prior medical records, reports, or current medications.</li>
                <li>You can manage or cancel your appointment through your CareSync dashboard.</li>
                """
        );

        sendEmailSafely(patientEmail, subject, plainText, htmlContent);
    }

    private void sendBookingNotificationToDoctor(AppointmentEvent event) {
        String doctorEmail = event.doctorEmail();
        if (isInvalidEmail(doctorEmail)) {
            log.warn("Cannot send doctor booking notification: doctor email is missing");
            return;
        }

        String ref = "CS-APP-" + event.appointmentId();
        String subject = "CareSync — New Patient Appointment Scheduled (" + ref + ")";
        String dateStr = formatDate(event.appointmentDate());
        String timeStr = formatTimeRange(event.startTime(), event.endTime());
        String safePatient = escapeHtml(event.patientName());
        String safeDoctor = escapeHtml(event.doctorName());
        String safeStatus = escapeHtml(event.status() != null ? event.status().name() : "SCHEDULED");
        String safeReason = escapeHtml(event.reason());

        String plainText = String.format("""
                CareSync Healthcare System
                New Appointment Notification

                Hello %s,

                A new patient appointment has been scheduled in your calendar.

                Appointment Reference: %s
                Patient: %s
                Date: %s
                Time: %s
                Status: %s
                Reason: %s

                Access your CareSync Doctor Portal to review patient medical history and notes.
                """, safeDoctor, ref, safePatient, dateStr, timeStr, safeStatus, safeReason.isBlank() ? "N/A" : safeReason);

        String htmlContent = buildEmailTemplate(
                "New Patient Appointment",
                "#0d9488",
                String.format("Hello <strong>%s</strong>, a new patient has booked an appointment with you.", safeDoctor),
                ref,
                new String[][]{
                        {"Patient", safePatient},
                        {"Date", dateStr},
                        {"Time", timeStr},
                        {"Status", "<span style=\"color:#0d9488; font-weight:bold;\">" + safeStatus + "</span>"},
                        {"Reason for Visit", safeReason.isBlank() ? "General Consultation" : safeReason}
                },
                """
                <li>Patient information and clinical history are available in your doctor dashboard.</li>
                <li>Digital prescriptions can be issued immediately following the consultation.</li>
                """
        );

        sendEmailSafely(doctorEmail, subject, plainText, htmlContent);
    }

    // ==========================================
    // 2. CONFIRMED NOTIFICATIONS
    // ==========================================

    private void sendConfirmationNoticeToPatient(AppointmentEvent event) {
        String patientEmail = event.patientEmail();
        if (isInvalidEmail(patientEmail)) return;

        String ref = "CS-APP-" + event.appointmentId();
        String subject = "CareSync — Appointment Confirmed (" + ref + ")";
        String dateStr = formatDate(event.appointmentDate());
        String timeStr = formatTimeRange(event.startTime(), event.endTime());
        String safePatient = escapeHtml(event.patientName());
        String safeDoctor = escapeHtml(event.doctorName());
        String safeSpec = escapeHtml(event.doctorSpecialization());

        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Confirmed

                Hello %s,

                Your appointment with %s (%s) on %s at %s has been marked as CONFIRMED.
                Reference: %s

                Thank you,
                CareSync Healthcare
                """, safePatient, safeDoctor, safeSpec, dateStr, timeStr, ref);

        String htmlContent = buildEmailTemplate(
                "Appointment Confirmed",
                "#16a34a",
                String.format("Hello <strong>%s</strong>, your upcoming appointment is confirmed.", safePatient),
                ref,
                new String[][]{
                        {"Doctor", safeDoctor + " (" + safeSpec + ")"},
                        {"Date", dateStr},
                        {"Time", timeStr},
                        {"Status", "<span style=\"color:#16a34a; font-weight:bold;\">CONFIRMED</span>"}
                },
                "<li>Please be present 10 minutes prior to your consultation time.</li>"
        );

        sendEmailSafely(patientEmail, subject, plainText, htmlContent);
    }

    private void sendConfirmationNoticeToDoctor(AppointmentEvent event) {
        String doctorEmail = event.doctorEmail();
        if (isInvalidEmail(doctorEmail)) return;

        String ref = "CS-APP-" + event.appointmentId();
        String subject = "CareSync — Appointment Confirmed (" + ref + ")";
        String dateStr = formatDate(event.appointmentDate());
        String timeStr = formatTimeRange(event.startTime(), event.endTime());
        String safeDoctor = escapeHtml(event.doctorName());
        String safePatient = escapeHtml(event.patientName());

        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Confirmed

                Hello %s,

                Appointment %s with patient %s on %s at %s is now CONFIRMED.
                """, safeDoctor, ref, safePatient, dateStr, timeStr);

        String htmlContent = buildEmailTemplate(
                "Appointment Confirmed",
                "#16a34a",
                String.format("Hello <strong>%s</strong>, appointment with patient %s is confirmed.", safeDoctor, safePatient),
                ref,
                new String[][]{
                        {"Patient", safePatient},
                        {"Date", dateStr},
                        {"Time", timeStr},
                        {"Status", "<span style=\"color:#16a34a; font-weight:bold;\">CONFIRMED</span>"}
                },
                "<li>Appointment is confirmed and locked in your clinical schedule.</li>"
        );

        sendEmailSafely(doctorEmail, subject, plainText, htmlContent);
    }

    // ==========================================
    // 3. CANCELLED NOTIFICATIONS
    // ==========================================

    private void sendCancellationNoticeToPatient(AppointmentEvent event) {
        String patientEmail = event.patientEmail();
        if (isInvalidEmail(patientEmail)) return;

        String ref = "CS-APP-" + event.appointmentId();
        String subject = "CareSync — Appointment Cancelled (" + ref + ")";
        String dateStr = formatDate(event.appointmentDate());
        String timeStr = formatTimeRange(event.startTime(), event.endTime());
        String safePatient = escapeHtml(event.patientName());
        String safeDoctor = escapeHtml(event.doctorName());
        String safeSpec = escapeHtml(event.doctorSpecialization());

        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Cancelled

                Hello %s,

                Your appointment with %s (%s) scheduled for %s at %s has been CANCELLED.
                Reference: %s

                If you would like to book a new appointment, please visit our portal.
                """, safePatient, safeDoctor, safeSpec, dateStr, timeStr, ref);

        String htmlContent = buildEmailTemplate(
                "Appointment Cancelled",
                "#dc2626",
                String.format("Hello <strong>%s</strong>, your appointment has been cancelled.", safePatient),
                ref,
                new String[][]{
                        {"Doctor", safeDoctor + " (" + safeSpec + ")"},
                        {"Cancelled Date", dateStr},
                        {"Cancelled Time", timeStr},
                        {"Status", "<span style=\"color:#dc2626; font-weight:bold;\">CANCELLED</span>"}
                },
                "<li>You can schedule a new consultation anytime via the CareSync patient dashboard.</li>"
        );

        sendEmailSafely(patientEmail, subject, plainText, htmlContent);
    }

    private void sendCancellationNoticeToDoctor(AppointmentEvent event) {
        String doctorEmail = event.doctorEmail();
        if (isInvalidEmail(doctorEmail)) return;

        String ref = "CS-APP-" + event.appointmentId();
        String subject = "CareSync — Appointment Cancelled (" + ref + ")";
        String dateStr = formatDate(event.appointmentDate());
        String timeStr = formatTimeRange(event.startTime(), event.endTime());
        String safeDoctor = escapeHtml(event.doctorName());
        String safePatient = escapeHtml(event.patientName());

        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Cancellation Notification

                Hello %s,

                Appointment %s with patient %s scheduled for %s at %s has been cancelled.
                The time slot is now reopened in your calendar.
                """, safeDoctor, ref, safePatient, dateStr, timeStr);

        String htmlContent = buildEmailTemplate(
                "Appointment Cancelled",
                "#dc2626",
                String.format("Hello <strong>%s</strong>, appointment with patient %s has been cancelled.", safeDoctor, safePatient),
                ref,
                new String[][]{
                        {"Patient", safePatient},
                        {"Cancelled Date", dateStr},
                        {"Cancelled Time", timeStr},
                        {"Status", "<span style=\"color:#dc2626; font-weight:bold;\">CANCELLED</span>"}
                },
                "<li>This time slot is now released and available for other patients.</li>"
        );

        sendEmailSafely(doctorEmail, subject, plainText, htmlContent);
    }

    // ==========================================
    // 4. RESCHEDULED NOTIFICATIONS
    // ==========================================

    private void sendRescheduleNoticeToPatient(AppointmentEvent event) {
        String patientEmail = event.patientEmail();
        if (isInvalidEmail(patientEmail)) return;

        String ref = "CS-APP-" + event.appointmentId();
        String subject = "CareSync — Appointment Rescheduled (" + ref + ")";
        String newDateStr = formatDate(event.appointmentDate());
        String newTimeStr = formatTimeRange(event.startTime(), event.endTime());
        String oldDateStr = formatDate(event.previousDate());
        String oldTimeStr = formatTimeRange(event.previousStartTime(), event.previousEndTime());
        String safePatient = escapeHtml(event.patientName());
        String safeDoctor = escapeHtml(event.doctorName());
        String safeSpec = escapeHtml(event.doctorSpecialization());

        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Rescheduled

                Hello %s,

                Your appointment with %s (%s) has been successfully rescheduled.

                Appointment Reference: %s
                New Date: %s
                New Time: %s
                Previous Date & Time: %s at %s
                Status: %s

                Instructions:
                - Please arrive 10 minutes prior to your new scheduled time.
                """, safePatient, safeDoctor, safeSpec, ref, newDateStr, newTimeStr, oldDateStr, oldTimeStr, event.status());

        String htmlContent = buildEmailTemplate(
                "Appointment Rescheduled",
                "#d97706",
                String.format("Hello <strong>%s</strong>, your appointment has been rescheduled to a new time.", safePatient),
                ref,
                new String[][]{
                        {"Doctor", safeDoctor + " (" + safeSpec + ")"},
                        {"New Date", "<strong style=\"color:#d97706;\">" + newDateStr + "</strong>"},
                        {"New Time", "<strong style=\"color:#d97706;\">" + newTimeStr + "</strong>"},
                        {"Previous Slot", "<span style=\"color:#94a3b8; text-decoration:line-through;\">" + oldDateStr + " (" + oldTimeStr + ")</span>"},
                        {"Status", "<span style=\"color:#d97706; font-weight:bold;\">" + event.status() + "</span>"}
                },
                """
                <li>Please update your calendar with your new appointment time.</li>
                <li>Arrive 10 minutes prior to your consultation.</li>
                """
        );

        sendEmailSafely(patientEmail, subject, plainText, htmlContent);
    }

    private void sendRescheduleNoticeToDoctor(AppointmentEvent event) {
        String doctorEmail = event.doctorEmail();
        if (isInvalidEmail(doctorEmail)) return;

        String ref = "CS-APP-" + event.appointmentId();
        String subject = "CareSync — Appointment Rescheduled (" + ref + ")";
        String newDateStr = formatDate(event.appointmentDate());
        String newTimeStr = formatTimeRange(event.startTime(), event.endTime());
        String oldDateStr = formatDate(event.previousDate());
        String oldTimeStr = formatTimeRange(event.previousStartTime(), event.previousEndTime());
        String safeDoctor = escapeHtml(event.doctorName());
        String safePatient = escapeHtml(event.patientName());

        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Rescheduled Notification

                Hello %s,

                Appointment %s with patient %s has been rescheduled.

                New Date: %s
                New Time: %s
                Previous Slot: %s at %s
                """, safeDoctor, ref, safePatient, newDateStr, newTimeStr, oldDateStr, oldTimeStr);

        String htmlContent = buildEmailTemplate(
                "Appointment Rescheduled",
                "#d97706",
                String.format("Hello <strong>%s</strong>, appointment with patient %s has been rescheduled.", safeDoctor, safePatient),
                ref,
                new String[][]{
                        {"Patient", safePatient},
                        {"New Date", "<strong style=\"color:#d97706;\">" + newDateStr + "</strong>"},
                        {"New Time", "<strong style=\"color:#d97706;\">" + newTimeStr + "</strong>"},
                        {"Previous Slot", "<span style=\"color:#94a3b8; text-decoration:line-through;\">" + oldDateStr + " (" + oldTimeStr + ")</span>"}
                },
                "<li>Your schedule has been updated automatically with this new time slot.</li>"
        );

        sendEmailSafely(doctorEmail, subject, plainText, htmlContent);
    }

    // ==========================================
    // BACKWARD COMPATIBLE CONVENIENCE METHODS
    // ==========================================

    @Async
    public void sendAppointmentConfirmation(String recipientEmail, String patientName, String doctorName,
                                            LocalDate appointmentDate, LocalTime startTime, LocalTime endTime,
                                            AppointmentStatus status) {
        if (isInvalidEmail(recipientEmail)) {
            log.warn("Cannot send confirmation email: Missing recipient email");
            return;
        }

        AppointmentEvent event = AppointmentEvent.builder()
                .eventId("LEGACY_CONFIRMATION_" + System.currentTimeMillis())
                .eventType(AppointmentEventType.BOOKED)
                .appointmentId(0L)
                .patientEmail(recipientEmail)
                .patientName(patientName)
                .doctorName(doctorName)
                .doctorSpecialization("General Medicine")
                .appointmentDate(appointmentDate)
                .startTime(startTime)
                .endTime(endTime)
                .status(status != null ? status : AppointmentStatus.SCHEDULED)
                .build();

        sendBookingConfirmationToPatient(event);
    }

    @Transactional(readOnly = true)
    public void sendAppointmentConfirmation(Appointment appointment) {
        if (appointment == null || appointment.getPatient() == null || appointment.getPatient().getUser() == null) {
            log.warn("Cannot send confirmation email: Invalid appointment payload");
            return;
        }

        String recipientEmail = appointment.getPatient().getUser().getEmail();
        String patientName = appointment.getPatient().getUser().getFullName();
        String doctorName = (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null)
                ? appointment.getDoctor().getUser().getFullName() : "Your Doctor";

        sendAppointmentConfirmation(recipientEmail, patientName, doctorName,
                appointment.getAppointmentDate(), appointment.getStartTime(), appointment.getEndTime(), appointment.getStatus());
    }

    @Async
    public void sendAppointmentReminder(String recipientEmail, String patientName, String doctorName,
                                         LocalDate appointmentDate, LocalTime startTime, LocalTime endTime,
                                         AppointmentStatus status) {
        if (isInvalidEmail(recipientEmail)) {
            log.warn("Cannot send reminder email: Missing recipient email");
            return;
        }

        String safePatient = escapeHtml(patientName != null && !patientName.isBlank() ? patientName : "Patient");
        String safeDoctor = escapeHtml(doctorName != null && !doctorName.isBlank() ? doctorName : "Your Doctor");
        String dateStr = formatDate(appointmentDate);
        String timeStr = formatTimeRange(startTime, endTime);
        String statusStr = escapeHtml(status != null ? status.name() : "SCHEDULED");

        String subject = "CareSync — Upcoming Appointment Reminder (Tomorrow)";
        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Reminder

                Hello %s,

                This is a friendly reminder for your upcoming medical appointment scheduled for tomorrow.

                Doctor: %s
                Date: %s
                Time: %s
                Status: %s

                Please remember to arrive 10 minutes early. Contact your care provider if you need to modify your booking.

                CareSync Healthcare Scheduler
                """, safePatient, safeDoctor, dateStr, timeStr, statusStr);

        String htmlContent = buildEmailTemplate(
                "Appointment Reminder",
                "#0d9488",
                String.format("Hello <strong>%s</strong>, this is a reminder for your medical appointment tomorrow.", safePatient),
                "REMINDER",
                new String[][]{
                        {"Doctor", safeDoctor},
                        {"Date", dateStr},
                        {"Time", timeStr},
                        {"Status", "<span style=\"color:#0d9488; font-weight:bold;\">" + statusStr + "</span>"}
                },
                "<li>Please arrive 10 minutes early with any relevant medical history documents.</li>"
        );

        sendEmailSafely(recipientEmail, subject, plainText, htmlContent);
    }

    @Transactional(readOnly = true)
    public void sendAppointmentReminder(Appointment appointment) {
        send24HourAppointmentReminder(appointment);
    }

    public void send24HourAppointmentReminder(Appointment appointment) {
        if (appointment == null || appointment.getPatient() == null || appointment.getPatient().getUser() == null) {
            log.warn("Cannot send 24-hour reminder email: Invalid appointment payload");
            return;
        }

        String recipientEmail = appointment.getPatient().getUser().getEmail();
        if (isInvalidEmail(recipientEmail)) {
            log.warn("Cannot send 24-hour reminder email: Missing recipient email for appointment ID {}", appointment.getId());
            return;
        }

        String ref = "CS-APP-" + appointment.getId();
        String safePatient = escapeHtml(appointment.getPatient().getUser().getFullName());
        String safeDoctor = escapeHtml(appointment.getDoctor() != null && appointment.getDoctor().getUser() != null
                ? appointment.getDoctor().getUser().getFullName() : "Your Doctor");
        String safeSpec = escapeHtml(appointment.getDoctor() != null && appointment.getDoctor().getSpecialization() != null
                ? appointment.getDoctor().getSpecialization() : "General Medicine");
        String dateStr = formatDate(appointment.getAppointmentDate());
        String timeStr = formatTimeRange(appointment.getStartTime(), appointment.getEndTime());
        String statusStr = escapeHtml(appointment.getStatus() != null ? appointment.getStatus().name() : "SCHEDULED");

        String subject = "CareSync — Upcoming Appointment Reminder (Tomorrow) (" + ref + ")";
        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Reminder (24 Hours Notice)

                Hello %s,

                This is a friendly reminder that you have an upcoming medical appointment scheduled for tomorrow.

                Appointment Reference: %s
                Doctor: %s (%s)
                Date: %s
                Time: %s
                Status: %s

                Instructions:
                - Please arrive 10 minutes prior to your scheduled consultation time.
                - Bring prior medical records, test reports, or prescriptions if needed.
                - If you need to reschedule or cancel, please do so via your CareSync patient dashboard.

                Thank you for choosing CareSync.
                """, safePatient, ref, safeDoctor, safeSpec, dateStr, timeStr, statusStr);

        String htmlContent = buildEmailTemplate(
                "Appointment Reminder (Tomorrow)",
                "#0d9488",
                String.format("Hello <strong>%s</strong>, this is a reminder for your upcoming medical consultation tomorrow.", safePatient),
                ref,
                new String[][]{
                        {"Doctor", safeDoctor + " (" + safeSpec + ")"},
                        {"Date", dateStr},
                        {"Time", timeStr},
                        {"Status", "<span style=\"color:#0d9488; font-weight:bold;\">" + statusStr + "</span>"}
                },
                """
                <li>Please arrive 10 minutes prior to your scheduled consultation time.</li>
                <li>Bring any relevant prior medical records, test results, or medications.</li>
                <li>You can review or manage your booking directly from your CareSync dashboard.</li>
                """
        );

        sendEmailSafely(recipientEmail, subject, plainText, htmlContent);
    }

    public void send1HourAppointmentReminder(Appointment appointment) {
        if (appointment == null || appointment.getPatient() == null || appointment.getPatient().getUser() == null) {
            log.warn("Cannot send 1-hour reminder email: Invalid appointment payload");
            return;
        }

        String recipientEmail = appointment.getPatient().getUser().getEmail();
        if (isInvalidEmail(recipientEmail)) {
            log.warn("Cannot send 1-hour reminder email: Missing recipient email for appointment ID {}", appointment.getId());
            return;
        }

        String ref = "CS-APP-" + appointment.getId();
        String safePatient = escapeHtml(appointment.getPatient().getUser().getFullName());
        String safeDoctor = escapeHtml(appointment.getDoctor() != null && appointment.getDoctor().getUser() != null
                ? appointment.getDoctor().getUser().getFullName() : "Your Doctor");
        String safeSpec = escapeHtml(appointment.getDoctor() != null && appointment.getDoctor().getSpecialization() != null
                ? appointment.getDoctor().getSpecialization() : "General Medicine");
        String dateStr = formatDate(appointment.getAppointmentDate());
        String timeStr = formatTimeRange(appointment.getStartTime(), appointment.getEndTime());
        String statusStr = escapeHtml(appointment.getStatus() != null ? appointment.getStatus().name() : "SCHEDULED");

        String subject = "CareSync — Appointment Reminder: Starting in 1 Hour (" + ref + ")";
        String plainText = String.format("""
                CareSync Healthcare System
                Appointment Reminder (Starting in 1 Hour)

                Hello %s,

                This is a reminder that your medical appointment is scheduled to begin in approximately 1 hour.

                Appointment Reference: %s
                Doctor: %s (%s)
                Date: %s
                Time: %s
                Status: %s

                Instructions:
                - Your consultation begins shortly. Please ensure you are ready or at the clinic.
                - Have your appointment reference %s ready.

                Thank you for choosing CareSync.
                """, safePatient, ref, safeDoctor, safeSpec, dateStr, timeStr, statusStr, ref);

        String htmlContent = buildEmailTemplate(
                "Appointment Reminder: Starting Soon",
                "#ea580c",
                String.format("Hello <strong>%s</strong>, your appointment is scheduled to begin in approximately 1 hour.", safePatient),
                ref,
                new String[][]{
                        {"Doctor", safeDoctor + " (" + safeSpec + ")"},
                        {"Date", dateStr},
                        {"Time", timeStr},
                        {"Status", "<span style=\"color:#ea580c; font-weight:bold;\">" + statusStr + "</span>"}
                },
                """
                <li>Your appointment begins in approximately 1 hour.</li>
                <li>Please ensure you are at the consultation room or logged in if virtual.</li>
                <li>Keep your appointment reference available for check-in.</li>
                """
        );

        sendEmailSafely(recipientEmail, subject, plainText, htmlContent);
    }

    // ==========================================
    // INTERNAL DELIVERY HELPER
    // ==========================================

    private void sendEmailSafely(String to, String subject, String plainText, String htmlBody) {
        if (!mailEnabled) {
            log.info("Email delivery disabled by configuration (mail.enabled=false). Skipping email to '{}' [Subject: '{}']", to, subject);
            return;
        }

        if (mailSender == null) {
            log.warn("JavaMailSender bean is not available. Skipping email to '{}'", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            if (message == null) {
                log.warn("JavaMailSender.createMimeMessage() returned null, skipping email to '{}'", to);
                return;
            }
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "noreply@caresync.com";
            helper.setFrom(sender);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plainText, htmlBody);

            mailSender.send(message);
            log.info("Successfully sent email to '{}' with subject '{}'", to, subject);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send email to '{}' [Subject: '{}']: {}", to, subject, e.getMessage());
            throw (e instanceof MailException me) ? me : new MailSendException("Failed to send email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending email to '{}' [Subject: '{}']: {}", to, subject, e.getMessage());
            throw new MailSendException("Unexpected error sending email: " + e.getMessage(), e);
        }
    }

    // ==========================================
    // TEMPLATE & FORMATTING HELPERS
    // ==========================================

    private String buildEmailTemplate(String bannerTitle, String bannerColor, String introMessage,
                                      String refBadge, String[][] detailRows, String additionalInstructions) {
        StringBuilder tableRows = new StringBuilder();
        for (String[] row : detailRows) {
            tableRows.append(String.format("""
                <tr>
                    <td style="padding: 10px 12px; font-weight: 600; color: #475569; width: 35%%; border-bottom: 1px solid #e2e8f0;">%s</td>
                    <td style="padding: 10px 12px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">%s</td>
                </tr>
                """, row[0], row[1]));
        }

        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }
                    .wrapper { width: 100%%; padding: 24px 0; background-color: #f1f5f9; }
                    .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                    .banner { background-color: %s; color: #ffffff; padding: 24px; text-align: center; }
                    .banner h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; }
                    .banner p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
                    .content { padding: 24px; }
                    .intro { font-size: 15px; margin-bottom: 20px; }
                    .badge-box { text-align: right; margin-bottom: 12px; }
                    .ref-badge { display: inline-block; background-color: #e2e8f0; color: #334155; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 4px; }
                    .table-box { width: 100%%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
                    .instructions-box { background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 16px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; color: #166534; }
                    .instructions-box ul { margin: 6px 0 0; padding-left: 18px; }
                    .footer { text-align: center; padding: 20px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; background-color: #f8fafc; }
                    .footer a { color: #0284c7; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="card">
                        <div class="banner">
                            <h1>%s</h1>
                            <p>CareSync Healthcare Appointment Scheduler</p>
                        </div>
                        <div class="content">
                            <div class="badge-box">
                                <span class="ref-badge">REF: %s</span>
                            </div>
                            <div class="intro">
                                %s
                            </div>
                            <table class="table-box">
                                %s
                            </table>
                            <div class="instructions-box">
                                <strong>Important Information:</strong>
                                <ul>
                                    %s
                                </ul>
                            </div>
                        </div>
                        <div class="footer">
                            <p>This is an automated operational notification from CareSync Healthcare.</p>
                            <p>&copy; %d CareSync Healthcare System. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """, bannerColor, bannerTitle, refBadge, introMessage, tableRows, additionalInstructions, LocalDate.now().getYear());
    }

    private boolean isInvalidEmail(String email) {
        return email == null || email.trim().isEmpty() || !email.contains("@");
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : "N/A";
    }

    private String formatTimeRange(LocalTime start, LocalTime end) {
        if (start == null || end == null) return "N/A";
        return start.format(TIME_FORMATTER) + " - " + end.format(TIME_FORMATTER);
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
