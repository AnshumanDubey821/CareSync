package com.caresync.controller;

import com.caresync.dto.*;
import com.caresync.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getSystemStats() {
        AdminStatsResponse stats = adminService.getSystemStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {
        List<DoctorResponse> doctors = adminService.getAllDoctors();
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PatientResponse>> getAllPatients() {
        List<PatientResponse> patients = adminService.getAllPatients();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {
        List<AppointmentResponse> appointments = adminService.getAllAppointments();
        return ResponseEntity.ok(appointments);
    }

    @PutMapping("/appointments/{id}/status")
    public ResponseEntity<AppointmentResponse> updateAppointmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request) {
        AppointmentResponse updated = adminService.updateAppointmentStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }
}
