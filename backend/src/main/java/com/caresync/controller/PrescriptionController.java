package com.caresync.controller;

import com.caresync.dto.CreatePrescriptionRequest;
import com.caresync.dto.PrescriptionResponse;
import com.caresync.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    /**
     * Doctor issues a digital prescription for a valid patient & appointment.
     */
    @PostMapping("/prescriptions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @Valid @RequestBody CreatePrescriptionRequest request,
            Principal principal) {
        PrescriptionResponse response = prescriptionService.createPrescription(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * View prescription by ID (Protected against IDOR: only the patient owner, issuing doctor, or admin can access).
     */
    @GetMapping("/prescriptions/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PrescriptionResponse> getPrescriptionById(
            @PathVariable Long id,
            Principal principal) {
        PrescriptionResponse response = prescriptionService.getPrescriptionById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Patient retrieves their own digital prescription history.
     */
    @GetMapping("/patients/me/prescriptions")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<PrescriptionResponse>> getMyPatientPrescriptions(Principal principal) {
        List<PrescriptionResponse> response = prescriptionService.getPatientPrescriptions(principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Doctor retrieves all digital prescriptions issued by them.
     */
    @GetMapping("/doctors/me/prescriptions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<PrescriptionResponse>> getMyDoctorPrescriptions(Principal principal) {
        List<PrescriptionResponse> response = prescriptionService.getDoctorPrescriptions(principal.getName());
        return ResponseEntity.ok(response);
    }
}
