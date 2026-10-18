package com.caresync.service;

import com.caresync.dto.TimeSlotResponse;
import com.caresync.exception.ResourceNotFoundException;
import com.caresync.exception.ValidationException;
import com.caresync.model.entity.Appointment;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.DoctorAvailability;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.repository.AppointmentRepository;
import com.caresync.repository.DoctorAvailabilityRepository;
import com.caresync.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotGeneratorService {

    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");

    @Transactional(readOnly = true)
    public List<TimeSlotResponse> getAvailableSlots(Long doctorId, LocalDate date) {
        if (date == null) {
            throw new ValidationException("Query parameter 'date' is required (format YYYY-MM-DD).");
        }

        if (date.isBefore(LocalDate.now())) {
            throw new ValidationException("Cannot retrieve available slots for a past date.");
        }

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + doctorId));

        // 1. Fetch doctor's active availability for the target date or day of week
        List<DoctorAvailability> allAvailabilities = availabilityRepository.findByDoctorIdAndActiveTrue(doctor.getId());
        List<DoctorAvailability> matchingAvailabilities = allAvailabilities.stream()
                .filter(a -> (a.getAvailableDate() != null && a.getAvailableDate().equals(date)) ||
                             (a.getAvailableDate() == null && a.getDayOfWeek() != null && a.getDayOfWeek() == date.getDayOfWeek()))
                .collect(Collectors.toList());

        if (matchingAvailabilities.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Fetch existing non-cancelled appointments for this doctor on target date
        List<Appointment> bookedAppointments = appointmentRepository.findByDoctorIdAndAppointmentDate(doctor.getId(), date)
                .stream()
                .filter(app -> app.getStatus() != AppointmentStatus.CANCELLED)
                .collect(Collectors.toList());

        List<TimeSlotResponse> slots = new ArrayList<>();
        LocalTime now = LocalTime.now();
        boolean isToday = date.equals(LocalDate.now());

        // 3. Dynamic time-slot generation loop
        for (DoctorAvailability availability : matchingAvailabilities) {
            int duration = (availability.getSlotDurationMinutes() != null && availability.getSlotDurationMinutes() > 0)
                    ? availability.getSlotDurationMinutes()
                    : 30;

            LocalTime current = availability.getStartTime();
            LocalTime windowEnd = availability.getEndTime();

            while (!current.plusMinutes(duration).isAfter(windowEnd)) {
                LocalTime slotEnd = current.plusMinutes(duration);
                LocalTime slotStart = current;

                // Check if slot overlaps with any active appointment
                boolean isBooked = bookedAppointments.stream().anyMatch(app ->
                        slotStart.isBefore(app.getEndTime()) && slotEnd.isAfter(app.getStartTime())
                );

                // Check if slot is already in the past for today's date
                boolean isPastTime = isToday && slotStart.isBefore(now);

                if (!isBooked && !isPastTime) {
                    String formatted = slotStart.format(TIME_FORMATTER) + " - " + slotEnd.format(TIME_FORMATTER);
                    slots.add(TimeSlotResponse.builder()
                            .startTime(slotStart)
                            .endTime(slotEnd)
                            .available(true)
                            .formattedTime(formatted)
                            .build());
                }

                current = slotEnd;
            }
        }

        // Sort generated slots chronologically
        slots.sort(Comparator.comparing(TimeSlotResponse::getStartTime));
        return slots;
    }
}
