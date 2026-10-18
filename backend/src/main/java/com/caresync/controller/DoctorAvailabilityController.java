package com.caresync.controller;

import com.caresync.dto.AvailabilityRequest;
import com.caresync.dto.AvailabilityResponse;
import com.caresync.service.DoctorAvailabilityService;
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
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class DoctorAvailabilityController {

    private final DoctorAvailabilityService availabilityService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AvailabilityResponse> addAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AvailabilityRequest request) {
        AvailabilityResponse response = availabilityService.addAvailability(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<AvailabilityResponse>> getMyAvailability(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AvailabilityResponse> response = availabilityService.getDoctorAvailability(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AvailabilityResponse> updateAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityRequest request) {
        AvailabilityResponse response = availabilityService.updateAvailability(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> deleteAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        availabilityService.deleteAvailability(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
