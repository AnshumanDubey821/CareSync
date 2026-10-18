package com.caresync.service;

import com.caresync.dto.AdminStatsResponse;
import com.caresync.dto.AppointmentResponse;
import com.caresync.dto.DoctorResponse;
import com.caresync.dto.PatientResponse;
import com.caresync.event.AppointmentEvent;
import com.caresync.event.AppointmentEventPublisher;
import com.caresync.event.AppointmentEventType;
import com.caresync.exception.ResourceNotFoundException;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Patient;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorService doctorService;
    private final AppointmentService appointmentService;
    private final AppointmentEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public AdminStatsResponse getSystemStats() {
        long totalDoctors = doctorRepository.count();
        long totalPatients = patientRepository.count();
        long totalAppointments = appointmentRepository.count();
        long completed = appointmentRepository.countByStatus(AppointmentStatus.COMPLETED);
        long cancelled = appointmentRepository.countByStatus(AppointmentStatus.CANCELLED);
        long scheduled = totalAppointments - completed - cancelled;

        return AdminStatsResponse.builder()
                .totalDoctors(totalDoctors)
                .totalPatients(totalPatients)
                .totalAppointments(totalAppointments)
                .completedAppointments(completed)
                .cancelledAppointments(cancelled)
                .scheduledAppointments(scheduled > 0 ? scheduled : 0)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(doctorService::mapToDoctorResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::mapToPatientResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .sorted((a, b) -> b.getAppointmentDate().compareTo(a.getAppointmentDate()))
                .map(appointmentService::mapToAppointmentResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long appointmentId, AppointmentStatus newStatus) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + appointmentId));
        appointment.setStatus(newStatus);
        Appointment updated = appointmentRepository.save(appointment);

        if (newStatus == AppointmentStatus.CONFIRMED || newStatus == AppointmentStatus.CANCELLED) {
            AppointmentEventType eventType = (newStatus == AppointmentStatus.CONFIRMED)
                    ? AppointmentEventType.CONFIRMED
                    : AppointmentEventType.CANCELLED;

            AppointmentEvent event = AppointmentEvent.builder()
                    .eventId(eventType.name() + "_" + updated.getId() + "_" + System.currentTimeMillis())
                    .eventType(eventType)
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
        }

        return appointmentService.mapToAppointmentResponse(updated);
    }

    public PatientResponse mapToPatientResponse(Patient p) {
        return PatientResponse.builder()
                .id(p.getId())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .fullName(p.getUser() != null ? p.getUser().getFullName() : null)
                .email(p.getUser() != null ? p.getUser().getEmail() : null)
                .phoneNumber(p.getUser() != null ? p.getUser().getPhoneNumber() : null)
                .dateOfBirth(p.getDateOfBirth())
                .gender(p.getGender())
                .bloodGroup(p.getBloodGroup())
                .emergencyContact(p.getEmergencyContact())
                .medicalHistory(p.getMedicalHistory())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
