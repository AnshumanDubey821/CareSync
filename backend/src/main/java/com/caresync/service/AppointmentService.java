package com.caresync.service;

import com.caresync.dto.AppointmentResponse;
import com.caresync.dto.BookAppointmentRequest;
import com.caresync.dto.RescheduleAppointmentRequest;
import com.caresync.event.AppointmentEvent;
import com.caresync.event.AppointmentEventPublisher;
import com.caresync.event.AppointmentEventType;
import com.caresync.exception.ResourceNotFoundException;
import com.caresync.exception.SlotAlreadyBookedException;
import com.caresync.exception.ValidationException;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.DoctorAvailability;
import com.caresync.model.entity.Patient;
import com.caresync.model.entity.User;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.Role;
import com.caresync.repository.AppointmentReminderRepository;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorAvailabilityRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentEventPublisher eventPublisher;
    private final AppointmentReminderRepository reminderRepository;

    @Transactional
    public AppointmentResponse bookAppointment(String patientEmail, BookAppointmentRequest request) {
        // 1. Authenticate patient
        User user = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + patientEmail));

        Patient patient = patientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for this user account."));

        // 2. Validate doctor
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + request.getDoctorId()));

        // 3. Validate appointment date & time
        if (request.getAppointmentDate() == null || request.getStartTime() == null || request.getEndTime() == null) {
            throw new ValidationException("Appointment date, start time, and end time are required.");
        }
        if (request.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new ValidationException("Cannot book an appointment for a past date.");
        }
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new ValidationException("End time must be after start time.");
        }

        // 4. Validate that the requested slot falls within doctor's active availability schedule
        List<DoctorAvailability> availabilities = availabilityRepository.findByDoctorIdAndActiveTrue(doctor.getId());
        boolean matchesAvailability = availabilities.stream().anyMatch(a ->
                ((a.getAvailableDate() != null && a.getAvailableDate().equals(request.getAppointmentDate())) ||
                 (a.getAvailableDate() == null && a.getDayOfWeek() != null && a.getDayOfWeek() == request.getAppointmentDate().getDayOfWeek())) &&
                !request.getStartTime().isBefore(a.getStartTime()) &&
                !request.getEndTime().isAfter(a.getEndTime())
        );

        if (!matchesAvailability) {
            throw new ValidationException("The selected slot does not fall within the doctor's published availability schedule.");
        }

        // 5. Check if patient has a conflicting appointment at the exact same date & time
        boolean patientHasConflict = appointmentRepository.existsByPatientIdAndAppointmentDateAndStartTimeAndStatusNot(
                patient.getId(), request.getAppointmentDate(), request.getStartTime(), AppointmentStatus.CANCELLED);
        if (patientHasConflict) {
            throw new ValidationException("You already have an active appointment scheduled at this time.");
        }

        // 6. Pessimistic lock check & DB unique constraint protection
        Optional<Appointment> existingBooking = appointmentRepository.findSlotForBookingWithLock(
                doctor.getId(), request.getAppointmentDate(), request.getStartTime());
        if (existingBooking.isPresent()) {
            throw new SlotAlreadyBookedException("This appointment slot is no longer available.");
        }

        boolean isSlotOccupied = appointmentRepository.existsByDoctorIdAndAppointmentDateAndStartTimeAndStatusNot(
                doctor.getId(), request.getAppointmentDate(), request.getStartTime(), AppointmentStatus.CANCELLED);
        if (isSlotOccupied) {
            throw new SlotAlreadyBookedException("This appointment slot is no longer available.");
        }

        // 7. Create appointment entity
        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(AppointmentStatus.SCHEDULED)
                .reason(request.getReason())
                .notes(request.getNotes())
                .build();

        try {
            Appointment saved = appointmentRepository.saveAndFlush(appointment);

            // Publish appointment event safely (dispatched AFTER transaction commit)
            AppointmentEvent event = AppointmentEvent.builder()
                    .eventId("BOOKED_" + saved.getId() + "_" + System.currentTimeMillis())
                    .eventType(AppointmentEventType.BOOKED)
                    .appointmentId(saved.getId())
                    .patientEmail(patient.getUser() != null ? patient.getUser().getEmail() : null)
                    .patientName(patient.getUser() != null ? patient.getUser().getFullName() : "Patient")
                    .doctorEmail(doctor.getUser() != null ? doctor.getUser().getEmail() : null)
                    .doctorName(doctor.getUser() != null ? doctor.getUser().getFullName() : "Your Doctor")
                    .doctorSpecialization(doctor.getSpecialization())
                    .appointmentDate(saved.getAppointmentDate())
                    .startTime(saved.getStartTime())
                    .endTime(saved.getEndTime())
                    .status(saved.getStatus())
                    .reason(saved.getReason())
                    .build();

            eventPublisher.publishEvent(event);

            return mapToAppointmentResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Concurrent slot booking race condition caught by DB unique constraint: {}", ex.getMessage());
            throw new SlotAlreadyBookedException("This appointment slot is no longer available.");
        }
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long appointmentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + appointmentId));

        // Security check: ensure requesting user is involved in the appointment or is ADMIN
        boolean isPatient = user.getRole() == Role.PATIENT && appointment.getPatient().getUser().getId().equals(user.getId());
        boolean isDoctor = user.getRole() == Role.DOCTOR && appointment.getDoctor().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to view this appointment record.");
        }

        return mapToAppointmentResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(String patientEmail) {
        User user = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + patientEmail));
        Patient patient = patientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for this user account."));

        List<Appointment> list = appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(patient.getId());
        return list.stream().map(this::mapToAppointmentResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(String doctorEmail) {
        User user = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + doctorEmail));
        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for this user account."));

        List<Appointment> list = appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctor.getId());
        return list.stream().map(this::mapToAppointmentResponse).collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + appointmentId));

        boolean isPatient = user.getRole() == Role.PATIENT && appointment.getPatient().getUser().getId().equals(user.getId());
        boolean isDoctor = user.getRole() == Role.DOCTOR && appointment.getDoctor().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to cancel this appointment.");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ValidationException("This appointment is already cancelled.");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new ValidationException("Completed appointments cannot be cancelled.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment updated = appointmentRepository.save(appointment);

        // Publish cancellation event (dispatched AFTER transaction commit)
        AppointmentEvent event = AppointmentEvent.builder()
                .eventId("CANCELLED_" + updated.getId() + "_" + System.currentTimeMillis())
                .eventType(AppointmentEventType.CANCELLED)
                .appointmentId(updated.getId())
                .patientEmail(updated.getPatient().getUser() != null ? updated.getPatient().getUser().getEmail() : null)
                .patientName(updated.getPatient().getUser() != null ? updated.getPatient().getUser().getFullName() : "Patient")
                .doctorEmail(updated.getDoctor().getUser() != null ? updated.getDoctor().getUser().getEmail() : null)
                .doctorName(updated.getDoctor().getUser() != null ? updated.getDoctor().getUser().getFullName() : "Your Doctor")
                .doctorSpecialization(updated.getDoctor().getSpecialization())
                .appointmentDate(updated.getAppointmentDate())
                .startTime(updated.getStartTime())
                .endTime(updated.getEndTime())
                .status(updated.getStatus())
                .reason(updated.getReason())
                .build();

        eventPublisher.publishEvent(event);

        return mapToAppointmentResponse(updated);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, String userEmail, RescheduleAppointmentRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + appointmentId));

        boolean isPatient = user.getRole() == Role.PATIENT && appointment.getPatient().getUser().getId().equals(user.getId());
        boolean isDoctor = user.getRole() == Role.DOCTOR && appointment.getDoctor().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to reschedule this appointment.");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ValidationException("Cancelled appointments cannot be rescheduled.");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new ValidationException("Completed appointments cannot be rescheduled.");
        }

        if (request.getNewAppointmentDate() == null || request.getNewStartTime() == null || request.getNewEndTime() == null) {
            throw new ValidationException("New appointment date, start time, and end time are required.");
        }
        if (request.getNewAppointmentDate().isBefore(LocalDate.now())) {
            throw new ValidationException("Cannot reschedule an appointment to a past date.");
        }
        if (!request.getNewEndTime().isAfter(request.getNewStartTime())) {
            throw new ValidationException("End time must be after start time.");
        }

        Doctor doctor = appointment.getDoctor();

        // Validate doctor availability for the new slot
        List<DoctorAvailability> availabilities = availabilityRepository.findByDoctorIdAndActiveTrue(doctor.getId());
        boolean matchesAvailability = availabilities.stream().anyMatch(a ->
                ((a.getAvailableDate() != null && a.getAvailableDate().equals(request.getNewAppointmentDate())) ||
                 (a.getAvailableDate() == null && a.getDayOfWeek() != null && a.getDayOfWeek() == request.getNewAppointmentDate().getDayOfWeek())) &&
                !request.getNewStartTime().isBefore(a.getStartTime()) &&
                !request.getNewEndTime().isAfter(a.getEndTime())
        );

        if (!matchesAvailability) {
            throw new ValidationException("The selected slot does not fall within the doctor's published availability schedule.");
        }

        // Check slot occupancy (excluding the appointment itself if date/time unchanged)
        boolean isSlotOccupied = appointmentRepository.existsByDoctorIdAndAppointmentDateAndStartTimeAndStatusNot(
                doctor.getId(), request.getNewAppointmentDate(), request.getNewStartTime(), AppointmentStatus.CANCELLED);
        if (isSlotOccupied && (!request.getNewAppointmentDate().equals(appointment.getAppointmentDate()) ||
                               !request.getNewStartTime().equals(appointment.getStartTime()))) {
            throw new SlotAlreadyBookedException("This appointment slot is already booked.");
        }

        LocalDate oldDate = appointment.getAppointmentDate();
        LocalTime oldStart = appointment.getStartTime();
        LocalTime oldEnd = appointment.getEndTime();

        appointment.setAppointmentDate(request.getNewAppointmentDate());
        appointment.setStartTime(request.getNewStartTime());
        appointment.setEndTime(request.getNewEndTime());
        if (request.getReason() != null && !request.getReason().isBlank()) {
            appointment.setReason(request.getReason());
        }

        // Reset reminder status so patient receives reminders for the newly rescheduled slot
        boolean slotChanged = !request.getNewAppointmentDate().equals(oldDate) || !request.getNewStartTime().equals(oldStart);
        if (slotChanged) {
            appointment.setReminderSent(false);
            if (reminderRepository != null) {
                reminderRepository.deleteByAppointmentId(appointment.getId());
            }
        }

        Appointment updated = appointmentRepository.save(appointment);

        // Publish reschedule event (dispatched AFTER transaction commit)
        AppointmentEvent event = AppointmentEvent.builder()
                .eventId("RESCHEDULED_" + updated.getId() + "_" + System.currentTimeMillis())
                .eventType(AppointmentEventType.RESCHEDULED)
                .appointmentId(updated.getId())
                .patientEmail(updated.getPatient().getUser() != null ? updated.getPatient().getUser().getEmail() : null)
                .patientName(updated.getPatient().getUser() != null ? updated.getPatient().getUser().getFullName() : "Patient")
                .doctorEmail(doctor.getUser() != null ? doctor.getUser().getEmail() : null)
                .doctorName(doctor.getUser() != null ? doctor.getUser().getFullName() : "Your Doctor")
                .doctorSpecialization(doctor.getSpecialization())
                .appointmentDate(updated.getAppointmentDate())
                .startTime(updated.getStartTime())
                .endTime(updated.getEndTime())
                .status(updated.getStatus())
                .reason(updated.getReason())
                .previousDate(oldDate)
                .previousStartTime(oldStart)
                .previousEndTime(oldEnd)
                .build();

        eventPublisher.publishEvent(event);

        return mapToAppointmentResponse(updated);
    }

    public AppointmentResponse mapToAppointmentResponse(Appointment app) {
        return AppointmentResponse.builder()
                .id(app.getId())
                .patientId(app.getPatient().getId())
                .patientName(app.getPatient().getUser().getFullName())
                .doctorId(app.getDoctor().getId())
                .doctorName(app.getDoctor().getUser().getFullName())
                .specialization(app.getDoctor().getSpecialization())
                .appointmentDate(app.getAppointmentDate())
                .startTime(app.getStartTime())
                .endTime(app.getEndTime())
                .status(app.getStatus())
                .reason(app.getReason())
                .notes(app.getNotes())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }
}
