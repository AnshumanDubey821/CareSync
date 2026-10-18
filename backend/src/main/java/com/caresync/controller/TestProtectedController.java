package com.caresync.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestProtectedController {

    @GetMapping("/api/patient/ping")
    public ResponseEntity<Map<String, String>> patientPing() {
        return ResponseEntity.ok(Map.of("message", "Patient Access Granted"));
    }

    @GetMapping("/api/doctor/ping")
    public ResponseEntity<Map<String, String>> doctorPing() {
        return ResponseEntity.ok(Map.of("message", "Doctor Access Granted"));
    }

    @GetMapping("/api/admin/ping")
    public ResponseEntity<Map<String, String>> adminPing() {
        return ResponseEntity.ok(Map.of("message", "Admin Access Granted"));
    }
}
