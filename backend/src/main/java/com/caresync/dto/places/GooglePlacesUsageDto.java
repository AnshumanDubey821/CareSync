package com.caresync.dto.places;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GooglePlacesUsageDto {

    private String yearMonth;
    private long requestCount;
    private long warningThreshold;
    private long hardLimit;
    private long remainingQuota;
    private String status; // "NORMAL", "WARNING", "HARD_LIMIT_REACHED"
    private LocalDateTime updatedAt;
    private String policyDisclaimer;
}
