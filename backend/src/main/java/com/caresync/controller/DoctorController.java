package com.caresync.controller;

import com.caresync.dto.AvailabilityResponse;
import com.caresync.dto.DoctorResponse;
import com.caresync.dto.TimeSlotResponse;
import com.caresync.dto.UpdateDoctorProfileRequest;
import com.caresync.service.DoctorAvailabilityService;
import com.caresync.service.DoctorService;
import com.caresync.service.SlotGeneratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/doctors", "/api/doctor"})
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final DoctorAvailabilityService availabilityService;
    private final SlotGeneratorService slotGeneratorService;

    @GetMapping
    public ResponseEntity<List<DoctorResponse>> searchDoctors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String location) {
        List<DoctorResponse> doctors = doctorService.searchDoctors(name, specialization, location);
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorResponse> getDoctorById(@PathVariable Long id) {
        DoctorResponse doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(doctor);
    }

    @GetMapping("/{doctorId}/available-slots")
    public ResponseEntity<List<TimeSlotResponse>> getAvailableSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TimeSlotResponse> slots = slotGeneratorService.getAvailableSlots(doctorId, date);
        return ResponseEntity.ok(slots);
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<List<AvailabilityResponse>> getDoctorAvailability(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<AvailabilityResponse> availability = availabilityService.getDoctorAvailabilityByDoctorId(id, date);
        return ResponseEntity.ok(availability);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        DoctorResponse response = doctorService.getDoctorProfileByEmail(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateDoctorProfileRequest request) {
        DoctorResponse response = doctorService.updateDoctorProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }
}
