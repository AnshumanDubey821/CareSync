package com.caresync.controller;

import com.caresync.dto.HealthCheckResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<HealthCheckResponse> getHealth() {
        HealthCheckResponse response = HealthCheckResponse.builder()
                .status("UP")
                .appName("CareSync Healthcare System")
                .version("1.0.0-phase1")
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}
