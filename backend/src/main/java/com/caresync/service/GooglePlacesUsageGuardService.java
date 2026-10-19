package com.caresync.service;

import com.caresync.config.GooglePlacesProperties;
import com.caresync.dto.places.GooglePlacesUsageDto;
import com.caresync.entity.GooglePlacesUsage;
import com.caresync.exception.GooglePlacesMonthlyLimitExceededException;
import com.caresync.repository.GooglePlacesUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;

/**
 * Durable, persistent, concurrency-safe monthly usage guard for Google Places API calls.
 * Protects against runaway costs and unauthorized automated traffic by persisting request
 * counts into the relational database across application restarts.
 *
 * NOTE: This counter is an application-level safeguard and does not represent official Google Cloud
 * billing counters, nor can it track usage by other apps using the same GCP project or API key.
 * Independent Google Cloud budget alerts and quotas must be maintained in Google Cloud Console.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GooglePlacesUsageGuardService {

    private final GooglePlacesUsageRepository usageRepository;
    private final GooglePlacesProperties properties;

    public static final String POLICY_DISCLAIMER =
            "This usage counter is an application-level safeguard enforcing CareSync cost protection budgets. " +
            "It does not guarantee zero billing from Google Cloud and should be paired with Google Cloud Console budget alerts.";

    /**
     * Atomically validates that the current month's hard limit has not been reached,
     * emits an alert if the warning threshold is reached, and increments the durable counter.
     *
     * @param operation description of the billable operation being guarded (e.g. "search", "details", "photo")
     * @throws GooglePlacesMonthlyLimitExceededException if hard cutoff has been reached
     */
    @Transactional
    public synchronized GooglePlacesUsage checkAndIncrementUsage(String operation) {
        String currentYearMonth = YearMonth.now().toString();
        long configuredWarning = properties.getMonthlyGuard().getWarningLimit();
        long configuredHard = properties.getMonthlyGuard().getHardLimit();

        GooglePlacesUsage usage = usageRepository.findByYearMonthForUpdate(currentYearMonth)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    GooglePlacesUsage newRecord = GooglePlacesUsage.builder()
                            .yearMonth(currentYearMonth)
                            .requestCount(0L)
                            .warningThreshold(configuredWarning)
                            .hardLimit(configuredHard)
                            .createdAt(now)
                            .updatedAt(now)
                            .build();
                    return usageRepository.saveAndFlush(newRecord);
                });

        // Check if hard cutoff has already been reached
        if (usage.getRequestCount() >= usage.getHardLimit()) {
            log.error("Google Places API hard limit exceeded for month {}: count={}/limit={}. Operation [{}] blocked.",
                    currentYearMonth, usage.getRequestCount(), usage.getHardLimit(), operation);
            throw new GooglePlacesMonthlyLimitExceededException(
                    "Monthly Google Places API request limit has been reached (" + usage.getHardLimit() +
                    " requests). Further requests are temporarily suspended to prevent unexpected charges. " +
                    "Please contact the system administrator.");
        }

        long nextCount = usage.getRequestCount() + 1;

        // Emit warning alert if warning threshold is reached
        if (nextCount >= usage.getWarningThreshold()) {
            log.warn("ALERT: Google Places API monthly usage warning threshold reached for {}: count={}/warning={}/hardLimit={}",
                    currentYearMonth, nextCount, usage.getWarningThreshold(), usage.getHardLimit());
        }

        usage.setRequestCount(nextCount);
        usage.setUpdatedAt(LocalDateTime.now());
        return usageRepository.save(usage);
    }

    /**
     * Retrieves current month's usage overview for administration and monitoring.
     */
    @Transactional(readOnly = true)
    public GooglePlacesUsageDto getUsageSummary() {
        String currentYearMonth = YearMonth.now().toString();
        GooglePlacesUsage usage = usageRepository.findById(currentYearMonth)
                .orElseGet(() -> GooglePlacesUsage.builder()
                        .yearMonth(currentYearMonth)
                        .requestCount(0L)
                        .warningThreshold(properties.getMonthlyGuard().getWarningLimit())
                        .hardLimit(properties.getMonthlyGuard().getHardLimit())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
                );

        String status = "NORMAL";
        if (usage.getRequestCount() >= usage.getHardLimit()) {
            status = "HARD_LIMIT_REACHED";
        } else if (usage.getRequestCount() >= usage.getWarningThreshold()) {
            status = "WARNING";
        }

        long remainingQuota = Math.max(0, usage.getHardLimit() - usage.getRequestCount());

        return GooglePlacesUsageDto.builder()
                .yearMonth(usage.getYearMonth())
                .requestCount(usage.getRequestCount())
                .warningThreshold(usage.getWarningThreshold())
                .hardLimit(usage.getHardLimit())
                .remainingQuota(remainingQuota)
                .status(status)
                .updatedAt(usage.getUpdatedAt())
                .policyDisclaimer(POLICY_DISCLAIMER)
                .build();
    }

    /**
     * Administrative reset of monthly usage for current month.
     */
    @Transactional
    public void resetMonthlyUsage(String yearMonth, String adminUsername) {
        log.warn("ADMIN AUDIT: Administrator [{}] manually reset Google Places monthly usage for [{}]",
                adminUsername, yearMonth);
        GooglePlacesUsage usage = usageRepository.findById(yearMonth)
                .orElseThrow(() -> new IllegalArgumentException("No usage record found for month: " + yearMonth));
        usage.setRequestCount(0L);
        usage.setUpdatedAt(LocalDateTime.now());
        usageRepository.save(usage);
    }
}
