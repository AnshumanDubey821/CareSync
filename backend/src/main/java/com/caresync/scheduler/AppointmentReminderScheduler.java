package com.caresync.scheduler;

import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.AppointmentReminder;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.ReminderStatus;
import com.caresync.model.enums.ReminderType;
import com.caresync.repository.AppointmentReminderRepository;
import com.caresync.repository.AppointmentRepository;
import com.caresync.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentReminderRepository reminderRepository;
    private final EmailService emailService;
    private final Clock clock;

    @Value("${app.scheduling.reminder-enabled:true}")
    private boolean schedulerEnabled;

    private static final List<AppointmentStatus> ELIGIBLE_STATUSES = List.of(
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED
    );

    /**
     * Periodic background execution to process due 24-hour and 1-hour appointment reminders.
     * Controlled by app.scheduling.reminder-interval-ms (default 60 seconds).
     */
    @Scheduled(
            fixedRateString = "${app.scheduling.reminder-interval-ms:60000}",
            initialDelayString = "${app.scheduling.reminder-initial-delay-ms:10000}"
    )
    public void runScheduledReminders() {
        if (!schedulerEnabled) {
            log.trace("Appointment reminder scheduler is disabled by configuration");
            return;
        }

        try {
            processAllReminders();
        } catch (Exception e) {
            log.error("Unhandled error during reminder scheduler execution: {}", e.getMessage(), e);
        }
    }

    /**
     * Process both 24-hour and 1-hour appointment reminders.
     *
     * @return total count of reminders successfully dispatched
     */
    @Transactional
    public int processAllReminders() {
        int sent24h = send24HourAppointmentReminders();
        int sent1h = send1HourAppointmentReminders();
        return sent24h + sent1h;
    }

    /**
     * Evaluates and dispatches 24-hour reminders for upcoming appointments.
     *
     * @return count of 24-hour reminders sent
     */
    @Transactional
    public int send24HourAppointmentReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        LocalDate tomorrow = today.plusDays(1);
        log.info("Running 24-hour appointment reminder scheduler (reference time: {})", now);

        // Query appointments for today and tomorrow with eligible status
        List<Appointment> upcomingAppointments = appointmentRepository.findUpcomingAppointmentsByDateRange(
                today, tomorrow, ELIGIBLE_STATUSES);

        if (upcomingAppointments.isEmpty()) {
            log.debug("No candidate appointments found for 24-hour reminder check");
            return 0;
        }

        int sentCount = 0;
        for (Appointment appointment : upcomingAppointments) {
            try {
                if (!isEligibleFor24HourReminder(appointment, now)) {
                    continue;
                }

                // Verify patient has a valid email address
                String recipientEmail = getPatientEmail(appointment);
                if (isInvalidEmail(recipientEmail)) {
                    log.warn("Skipping 24h reminder for appointment ID {}: Missing or invalid patient email", appointment.getId());
                    continue;
                }

                // Dispatch 24-hour reminder email
                emailService.send24HourAppointmentReminder(appointment);

                // Record delivery in dedicated appointment_reminders table
                recordReminderSuccess(appointment, ReminderType.REMINDER_24_HOUR, now);

                // Update legacy reminder_sent flag for backward compatibility
                appointment.setReminderSent(true);
                appointmentRepository.save(appointment);

                sentCount++;
                log.info("Successfully sent 24-hour reminder for appointment ID {}", appointment.getId());
            } catch (Exception e) {
                log.error("Error processing 24-hour reminder for appointment ID {}: {}", appointment.getId(), e.getMessage());
                recordReminderFailure(appointment, ReminderType.REMINDER_24_HOUR, e.getMessage());
            }
        }

        log.info("Finished 24-hour appointment reminder check. Total sent: {}", sentCount);
        return sentCount;
    }

    /**
     * Evaluates and dispatches 1-hour reminders for appointments starting within the next hour.
     *
     * @return count of 1-hour reminders sent
     */
    @Transactional
    public int send1HourAppointmentReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        LocalDate tomorrow = today.plusDays(1);
        log.info("Running 1-hour appointment reminder scheduler (reference time: {})", now);

        List<Appointment> upcomingAppointments = appointmentRepository.findUpcomingAppointmentsByDateRange(
                today, tomorrow, ELIGIBLE_STATUSES);

        if (upcomingAppointments.isEmpty()) {
            log.debug("No candidate appointments found for 1-hour reminder check");
            return 0;
        }

        int sentCount = 0;
        for (Appointment appointment : upcomingAppointments) {
            try {
                if (!isEligibleFor1HourReminder(appointment, now)) {
                    continue;
                }

                String recipientEmail = getPatientEmail(appointment);
                if (isInvalidEmail(recipientEmail)) {
                    log.warn("Skipping 1h reminder for appointment ID {}: Missing or invalid patient email", appointment.getId());
                    continue;
                }

                // Dispatch 1-hour reminder email
                emailService.send1HourAppointmentReminder(appointment);

                // Record delivery in dedicated appointment_reminders table
                recordReminderSuccess(appointment, ReminderType.REMINDER_1_HOUR, now);

                sentCount++;
                log.info("Successfully sent 1-hour reminder for appointment ID {}", appointment.getId());
            } catch (Exception e) {
                log.error("Error processing 1-hour reminder for appointment ID {}: {}", appointment.getId(), e.getMessage());
                recordReminderFailure(appointment, ReminderType.REMINDER_1_HOUR, e.getMessage());
            }
        }

        log.info("Finished 1-hour appointment reminder check. Total sent: {}", sentCount);
        return sentCount;
    }

    // ==========================================
    // ELIGIBILITY CHECKS
    // ==========================================

    private boolean isEligibleFor24HourReminder(Appointment appointment, LocalDateTime now) {
        // 1. Status eligibility (SCHEDULED or CONFIRMED)
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            return false;
        }

        LocalDateTime appStart = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime());

        // 2. Late policy: Must be strictly in the future
        if (!appStart.isAfter(now)) {
            return false;
        }

        // 3. Must not have already received 24-hour reminder successfully
        if (reminderRepository.existsByAppointmentIdAndReminderTypeAndStatus(
                appointment.getId(), ReminderType.REMINDER_24_HOUR, ReminderStatus.SENT)) {
            return false;
        }

        // Check legacy flag as well
        if (Boolean.TRUE.equals(appointment.getReminderSent())) {
            return false;
        }

        // 4. Timing window:
        // Must be due: either tomorrow's date or between now + 1 hour and now + 36 hours
        boolean isTomorrow = appointment.getAppointmentDate().equals(now.toLocalDate().plusDays(1));
        boolean isIn24HourWindow = !appStart.isAfter(now.plusHours(36)) && appStart.isAfter(now.plusHours(1));

        return isTomorrow || isIn24HourWindow;
    }

    private boolean isEligibleFor1HourReminder(Appointment appointment, LocalDateTime now) {
        // 1. Status eligibility (SCHEDULED or CONFIRMED)
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            return false;
        }

        LocalDateTime appStart = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime());

        // 2. Strict start check: Avoid sending after the appointment begins
        if (!appStart.isAfter(now)) {
            return false;
        }

        // 3. 1-hour window check: Must start within approximately 1 hour (<= now + 65 minutes to prevent edge loss)
        if (appStart.isAfter(now.plusMinutes(65))) {
            return false;
        }

        // 4. Must not have already received 1-hour reminder successfully
        return !reminderRepository.existsByAppointmentIdAndReminderTypeAndStatus(
                appointment.getId(), ReminderType.REMINDER_1_HOUR, ReminderStatus.SENT);
    }

    // ==========================================
    // TRACKING & RECORDING
    // ==========================================

    private void recordReminderSuccess(Appointment appointment, ReminderType type, LocalDateTime sentAt) {
        AppointmentReminder record = reminderRepository.findByAppointmentIdAndReminderType(appointment.getId(), type)
                .orElse(AppointmentReminder.builder()
                        .appointment(appointment)
                        .reminderType(type)
                        .build());

        record.setStatus(ReminderStatus.SENT);
        record.setSentAt(sentAt);
        record.setErrorDetails(null);
        reminderRepository.save(record);
    }

    private void recordReminderFailure(Appointment appointment, ReminderType type, String error) {
        try {
            AppointmentReminder record = reminderRepository.findByAppointmentIdAndReminderType(appointment.getId(), type)
                    .orElse(AppointmentReminder.builder()
                            .appointment(appointment)
                            .reminderType(type)
                            .build());

            record.setStatus(ReminderStatus.FAILED);
            record.setErrorDetails(error != null && error.length() > 500 ? error.substring(0, 500) : error);
            reminderRepository.save(record);
        } catch (Exception ex) {
            log.warn("Could not record reminder failure for appointment ID {}: {}", appointment.getId(), ex.getMessage());
        }
    }

    private String getPatientEmail(Appointment appointment) {
        if (appointment.getPatient() != null && appointment.getPatient().getUser() != null) {
            return appointment.getPatient().getUser().getEmail();
        }
        return null;
    }

    private boolean isInvalidEmail(String email) {
        return email == null || email.trim().isEmpty() || !email.contains("@");
    }
}
