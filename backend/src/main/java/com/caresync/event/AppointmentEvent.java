package com.caresync.event;

import com.caresync.model.enums.AppointmentStatus;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalTime;

@Builder
public record AppointmentEvent(
        String eventId,
        AppointmentEventType eventType,
        Long appointmentId,
        String patientEmail,
        String patientName,
        String doctorEmail,
        String doctorName,
        String doctorSpecialization,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        AppointmentStatus status,
        String reason,
        LocalDate previousDate,
        LocalTime previousStartTime,
        LocalTime previousEndTime
) {
}
