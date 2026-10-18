package com.caresync.service;

import com.caresync.dto.AvailabilityRequest;
import com.caresync.dto.AvailabilityResponse;
import com.caresync.exception.ResourceNotFoundException;
import com.caresync.exception.ValidationException;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.DoctorAvailability;
import com.caresync.model.entity.User;
import com.caresync.repository.DoctorAvailabilityRepository;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorAvailabilityService {

    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    @Transactional
    public AvailabilityResponse addAvailability(String doctorEmail, AvailabilityRequest request) {
        Doctor doctor = getDoctorByEmail(doctorEmail);
        validateAvailabilityRequest(request, doctor.getId(), null);

        DoctorAvailability availability = DoctorAvailability.builder()
                .doctor(doctor)
                .availableDate(request.getAvailableDate())
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .slotDurationMinutes(request.getSlotDurationMinutes() != null ? request.getSlotDurationMinutes() : 30)
                .active(true)
                .build();

        DoctorAvailability saved = availabilityRepository.save(availability);
        return mapToAvailabilityResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getDoctorAvailability(String doctorEmail) {
        Doctor doctor = getDoctorByEmail(doctorEmail);
        List<DoctorAvailability> list = availabilityRepository.findByDoctorIdAndActiveTrue(doctor.getId());
        return list.stream().map(this::mapToAvailabilityResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getDoctorAvailabilityByDoctorId(Long doctorId, LocalDate date) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with ID: " + doctorId);
        }
        List<DoctorAvailability> list;
        if (date != null) {
            list = availabilityRepository.findByDoctorIdAndAvailableDateAndActiveTrue(doctorId, date);
        } else {
            list = availabilityRepository.findByDoctorIdAndActiveTrue(doctorId);
        }
        return list.stream().map(this::mapToAvailabilityResponse).collect(Collectors.toList());
    }

    @Transactional
    public AvailabilityResponse updateAvailability(String doctorEmail, Long availabilityId, AvailabilityRequest request) {
        Doctor doctor = getDoctorByEmail(doctorEmail);
        DoctorAvailability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability schedule not found with ID: " + availabilityId));

        if (!availability.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException("You are not authorized to modify another doctor's availability schedule.");
        }

        validateAvailabilityRequest(request, doctor.getId(), availabilityId);

        availability.setAvailableDate(request.getAvailableDate());
        availability.setDayOfWeek(request.getDayOfWeek());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        if (request.getSlotDurationMinutes() != null) {
            availability.setSlotDurationMinutes(request.getSlotDurationMinutes());
        }

        DoctorAvailability updated = availabilityRepository.save(availability);
        return mapToAvailabilityResponse(updated);
    }

    @Transactional
    public void deleteAvailability(String doctorEmail, Long availabilityId) {
        Doctor doctor = getDoctorByEmail(doctorEmail);
        DoctorAvailability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability schedule not found with ID: " + availabilityId));

        if (!availability.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException("You are not authorized to delete another doctor's availability schedule.");
        }

        availability.setActive(false);
        availabilityRepository.save(availability);
    }

    private Doctor getDoctorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found for email: " + email));
        return doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for this user account."));
    }

    private void validateAvailabilityRequest(AvailabilityRequest request, Long doctorId, Long excludeId) {
        LocalTime start = request.getStartTime();
        LocalTime end = request.getEndTime();

        if (start == null || end == null) {
            throw new ValidationException("Start time and end time are required.");
        }

        if (start.equals(end)) {
            throw new ValidationException("Start time cannot equal end time.");
        }

        if (!end.isAfter(start)) {
            throw new ValidationException("End time must be after start time.");
        }

        if (request.getSlotDurationMinutes() != null && request.getSlotDurationMinutes() <= 0) {
            throw new ValidationException("Slot duration must be a positive number of minutes.");
        }

        if (request.getAvailableDate() != null && request.getAvailableDate().isBefore(LocalDate.now())) {
            throw new ValidationException("Cannot schedule availability for a past date.");
        }

        if (request.getAvailableDate() == null && request.getDayOfWeek() == null) {
            throw new ValidationException("Either a specific available date or a day of week must be provided.");
        }

        boolean overlaps = availabilityRepository.existsOverlappingAvailability(
                doctorId,
                request.getAvailableDate(),
                request.getDayOfWeek(),
                start,
                end,
                excludeId
        );

        if (overlaps) {
            throw new ValidationException("The requested time range overlaps with an existing availability slot.");
        }
    }

    private AvailabilityResponse mapToAvailabilityResponse(DoctorAvailability availability) {
        return AvailabilityResponse.builder()
                .id(availability.getId())
                .doctorId(availability.getDoctor().getId())
                .doctorName(availability.getDoctor().getUser().getFullName())
                .availableDate(availability.getAvailableDate())
                .dayOfWeek(availability.getDayOfWeek())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .slotDurationMinutes(availability.getSlotDurationMinutes())
                .active(availability.isActive())
                .build();
    }
}
