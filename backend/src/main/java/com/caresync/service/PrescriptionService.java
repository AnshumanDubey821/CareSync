package com.caresync.service;

import com.caresync.dto.CreatePrescriptionRequest;
import com.caresync.dto.PrescriptionResponse;
import com.caresync.exception.ResourceNotFoundException;
import com.caresync.exception.ValidationException;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.Patient;
import com.caresync.model.entity.Prescription;
import com.caresync.model.entity.User;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.Role;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.PrescriptionRepository;
import com.caresync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public PrescriptionResponse createPrescription(String doctorEmail, CreatePrescriptionRequest request) {
        // 1. Authenticate doctor
        User user = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + doctorEmail));

        if (user.getRole() != Role.DOCTOR) {
            throw new AccessDeniedException("Only registered doctors can create digital prescriptions.");
        }

        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not registered for this user account."));

        // 2. Validate appointment
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + request.getAppointmentId()));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ValidationException("Cannot issue a prescription for a cancelled appointment.");
        }

        // 3. Verify doctor authorization for this specific appointment
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException("You are not authorized to create a prescription for another doctor's appointment.");
        }

        // 4. Verify patient match
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + request.getPatientId()));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new ValidationException("Patient ID does not match the patient assigned to this appointment.");
        }

        // 5. Prevent duplicate prescription for the same appointment
        if (prescriptionRepository.existsByAppointmentId(appointment.getId())) {
            throw new ValidationException("A prescription has already been created for this appointment.");
        }

        // 6. Build and save prescription
        Prescription prescription = Prescription.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .diagnosis(request.getDiagnosis().trim())
                .medicines(request.getMedicines().trim())
                .dosage(request.getDosage() != null ? request.getDosage().trim() : null)
                .frequency(request.getFrequency() != null ? request.getFrequency().trim() : null)
                .duration(request.getDuration() != null ? request.getDuration().trim() : null)
                .instructions(request.getInstructions() != null ? request.getInstructions().trim() : null)
                .doctorNotes(request.getDoctorNotes() != null ? request.getDoctorNotes().trim() : null)
                .build();

        Prescription saved = prescriptionRepository.save(prescription);
        log.info("Doctor ID {} successfully created Prescription ID {} for Appointment ID {}", doctor.getId(), saved.getId(), appointment.getId());

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long prescriptionId, String currentUserEmail) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + prescriptionId));

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + currentUserEmail));

        // Strict Server-Side IDOR Authorization Protection
        boolean isPatientOwner = user.getRole() == Role.PATIENT &&
                prescription.getPatient().getUser().getEmail().equalsIgnoreCase(currentUserEmail);

        boolean isDoctorIssuer = user.getRole() == Role.DOCTOR &&
                prescription.getDoctor().getUser().getEmail().equalsIgnoreCase(currentUserEmail);

        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isPatientOwner && !isDoctorIssuer && !isAdmin) {
            log.warn("IDOR attempt blocked: User {} attempted to access Prescription ID {}", currentUserEmail, prescriptionId);
            throw new AccessDeniedException("You are not authorized to access this prescription.");
        }

        return mapToResponse(prescription);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPatientPrescriptions(String patientEmail) {
        User user = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + patientEmail));

        if (user.getRole() != Role.PATIENT) {
            throw new AccessDeniedException("Only patients can access their prescription records.");
        }

        Patient patient = patientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for this user."));

        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getDoctorPrescriptions(String doctorEmail) {
        User user = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + doctorEmail));

        if (user.getRole() != Role.DOCTOR) {
            throw new AccessDeniedException("Only doctors can access their issued prescriptions.");
        }

        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for this user."));

        return prescriptionRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PrescriptionResponse mapToResponse(Prescription p) {
        return PrescriptionResponse.builder()
                .id(p.getId())
                .appointmentId(p.getAppointment().getId())
                .patientId(p.getPatient().getId())
                .patientName(p.getPatient().getUser().getFullName())
                .doctorId(p.getDoctor().getId())
                .doctorName(p.getDoctor().getUser().getFullName())
                .doctorSpecialization(p.getDoctor().getSpecialization())
                .diagnosis(p.getDiagnosis())
                .medicines(p.getMedicines())
                .dosage(p.getDosage())
                .frequency(p.getFrequency())
                .duration(p.getDuration())
                .instructions(p.getInstructions())
                .doctorNotes(p.getDoctorNotes())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
