package com.caresync.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity tracking persistent monthly usage counts for Google Places API calls.
 * Ensures usage limits are enforced across application restarts and cluster instances.
 */
@Entity
@Table(name = "google_places_usage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GooglePlacesUsage {

    /**
     * Year and Month formatted as 'YYYY-MM' (e.g. '2026-10').
     */
    @Id
    @Column(name = "year_month", length = 7, nullable = false)
    private String yearMonth;

    @Column(name = "request_count", nullable = false)
    private long requestCount;

    @Column(name = "warning_threshold", nullable = false)
    private long warningThreshold;

    @Column(name = "hard_limit", nullable = false)
    private long hardLimit;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
