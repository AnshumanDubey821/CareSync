package com.caresync.controller;

import com.caresync.dto.AppointmentResponse;
import com.caresync.dto.BookAppointmentRequest;
import com.caresync.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookAppointmentRequest request) {
        AppointmentResponse response = appointmentService.bookAppointment(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        AppointmentResponse response = appointmentService.getAppointmentById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AppointmentResponse> response = appointmentService.getPatientAppointments(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctor/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AppointmentResponse> response = appointmentService.getDoctorAppointments(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        AppointmentResponse response = appointmentService.cancelAppointment(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponse> rescheduleAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody com.caresync.dto.RescheduleAppointmentRequest request) {
        AppointmentResponse response = appointmentService.rescheduleAppointment(id, userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }
}
