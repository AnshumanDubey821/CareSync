package com.caresync.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration properties for Google Places API (New) integration.
 * Securely binds properties with prefix "google.places".
 * Never prints or exposes the API key in toString() or logs.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "google.places")
public class GooglePlacesProperties {

    /**
     * API key for Google Places (New).
     * Supplied via environment variable GOOGLE_PLACES_API_KEY.
     */
    private String apiKey = "";

    /**
     * Flag indicating whether Google Places integration is active.
     */
    private boolean enabled = false;

    /**
     * Base URL for Google Places API (New).
     */
    private String baseUrl = "https://places.googleapis.com/v1";

    /**
     * Connection timeout in milliseconds.
     */
    private int connectTimeoutMs = 3000;

    /**
     * Read timeout in milliseconds.
     */
    private int readTimeoutMs = 5000;

    /**
     * Rate limiting configuration.
     */
    private RateLimit rateLimit = new RateLimit();

    /**
     * Persistent monthly usage and cost guard configuration.
     */
    private MonthlyGuard monthlyGuard = new MonthlyGuard();

    /**
     * Comma-separated list of trusted reverse proxy IP addresses.
     * When configured, X-Forwarded-For headers from these IPs are accepted.
     */
    private List<String> trustedProxies = new ArrayList<>();

    @Getter
    @Setter
    public static class RateLimit {
        private int perUserPerMinute = 10;
        private int perIpPerMinute = 30;
        private int photoPerUserPerMinute = 5;
    }

    @Getter
    @Setter
    public static class MonthlyGuard {
        private long warningLimit = 68000;
        private long hardLimit = 69000;
    }

    /**
     * Safe toString() implementation that prevents accidental leakage
     * of the Google Places API key in logs, actuator dumps, or debug traces.
     */
    @Override
    public String toString() {
        return "GooglePlacesProperties{" +
                "enabled=" + enabled +
                ", apiKey=" + (apiKey != null && !apiKey.isBlank() ? "[CONFIGURED-MASKED]" : "[NOT_CONFIGURED]") +
                ", baseUrl='" + baseUrl + '\'' +
                ", connectTimeoutMs=" + connectTimeoutMs +
                ", readTimeoutMs=" + readTimeoutMs +
                ", rateLimit=[perUser=" + rateLimit.getPerUserPerMinute() +
                ", perIp=" + rateLimit.getPerIpPerMinute() +
                ", photo=" + rateLimit.getPhotoPerUserPerMinute() + "]" +
                ", monthlyGuard=[warning=" + monthlyGuard.getWarningLimit() +
                ", hard=" + monthlyGuard.getHardLimit() + "]" +
                '}';
    }
}
