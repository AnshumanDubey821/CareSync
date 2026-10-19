package com.caresync.service;

import com.caresync.config.GooglePlacesProperties;
import com.caresync.exception.GooglePlacesRateLimitException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Server-side rate limiter for Google Places API proxy endpoints using Bucket4j.
 * Enforces per-authenticated-user limits, per-client-IP limits, and specialized photo limits.
 *
 * NOTE: This is an in-memory (per-JVM node) rate limiter backed by high-performance Caffeine cache.
 * In a multi-node horizontal cluster behind a load balancer, sticky sessions can be used or
 * Bucket4j distributed extensions (e.g. Bucket4j Redis/Hazelcast) can be plugged in without changing
 * the service contract.
 */
@Slf4j
@Service
public class GooglePlacesRateLimiterService {

    private final GooglePlacesProperties properties;

    // In-memory Caffeine-backed token bucket caches with 10-minute idle expiration
    private final Cache<String, Bucket> userSearchBuckets;
    private final Cache<String, Bucket> ipSearchBuckets;
    private final Cache<String, Bucket> userPhotoBuckets;

    private static final Pattern IPV4_PATTERN =
            Pattern.compile("^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.){3}(25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)$");

    public GooglePlacesRateLimiterService(GooglePlacesProperties properties) {
        this.properties = properties;

        this.userSearchBuckets = Caffeine.newBuilder()
                .expireAfterAccess(Duration.ofMinutes(10))
                .maximumSize(50_000)
                .build();

        this.ipSearchBuckets = Caffeine.newBuilder()
                .expireAfterAccess(Duration.ofMinutes(10))
                .maximumSize(100_000)
                .build();

        this.userPhotoBuckets = Caffeine.newBuilder()
                .expireAfterAccess(Duration.ofMinutes(10))
                .maximumSize(50_000)
                .build();
    }

    /**
     * Enforces rate limits for Google Places requests.
     *
     * @param userId authenticated user identity or null if unauthenticated
     * @param clientIp client IP address resolved via secure proxy rules
     * @param isPhotoRequest whether this is an expensive photo detail request
     * @throws GooglePlacesRateLimitException if any bucket limit is exceeded
     */
    public void checkRateLimit(String userId, String clientIp, boolean isPhotoRequest) {
        // 1. Photo requests per authenticated user
        if (isPhotoRequest && userId != null && !userId.isBlank()) {
            Bucket photoBucket = userPhotoBuckets.get(userId, k -> createBucket(properties.getRateLimit().getPhotoPerUserPerMinute()));
            ConsumptionProbe probe = photoBucket.tryConsumeAndReturnRemaining(1);
            if (!probe.isConsumed()) {
                long waitSeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000L);
                log.warn("Rate limit exceeded for user [{}] on Places Photo request. Retry after {}s", userId, waitSeconds);
                throw new GooglePlacesRateLimitException(waitSeconds, "Photo detail request rate limit exceeded. Please try again in " + waitSeconds + " seconds.");
            }
        }

        // 2. Search requests per authenticated user
        if (userId != null && !userId.isBlank()) {
            Bucket userBucket = userSearchBuckets.get(userId, k -> createBucket(properties.getRateLimit().getPerUserPerMinute()));
            ConsumptionProbe probe = userBucket.tryConsumeAndReturnRemaining(1);
            if (!probe.isConsumed()) {
                long waitSeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000L);
                log.warn("Rate limit exceeded for user [{}] on Places Search request. Retry after {}s", userId, waitSeconds);
                throw new GooglePlacesRateLimitException(waitSeconds, "User search rate limit exceeded. Please try again in " + waitSeconds + " seconds.");
            }
        }

        // 3. Search requests per client IP (secondary defense against abuse & unauthenticated requests)
        if (clientIp != null && !clientIp.isBlank()) {
            Bucket ipBucket = ipSearchBuckets.get(clientIp, k -> createBucket(properties.getRateLimit().getPerIpPerMinute()));
            ConsumptionProbe probe = ipBucket.tryConsumeAndReturnRemaining(1);
            if (!probe.isConsumed()) {
                long waitSeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000L);
                log.warn("Rate limit exceeded for client IP [{}] on Places request. Retry after {}s", clientIp, waitSeconds);
                throw new GooglePlacesRateLimitException(waitSeconds, "Client IP rate limit exceeded. Please try again in " + waitSeconds + " seconds.");
            }
        }
    }

    private Bucket createBucket(int tokensPerMinute) {
        int safeTokens = Math.max(1, tokensPerMinute);
        Bandwidth limit = Bandwidth.builder()
                .capacity(safeTokens)
                .refillGreedy(safeTokens, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Resolves client IP securely.
     * Forwarded headers (X-Forwarded-For) are ONLY inspected if the direct remote address
     * is in the configured trustedProxies list, preventing arbitrary client header spoofing.
     */
    public String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        String remoteAddr = request.getRemoteAddr();
        List<String> trusted = properties.getTrustedProxies();

        // If direct remoteAddr is not a trusted proxy, return it directly
        if (trusted == null || trusted.isEmpty() || !trusted.contains(remoteAddr)) {
            return remoteAddr != null ? remoteAddr : "127.0.0.1";
        }

        // Remote address is trusted proxy; safely parse X-Forwarded-For
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] ips = xff.split(",");
            for (String ip : ips) {
                String candidate = ip.trim();
                if (isValidIp(candidate) && !isPrivateIp(candidate)) {
                    return candidate;
                }
            }
            if (ips.length > 0 && isValidIp(ips[0].trim())) {
                return ips[0].trim();
            }
        }

        return remoteAddr != null ? remoteAddr : "127.0.0.1";
    }

    private boolean isValidIp(String ip) {
        return ip != null && (IPV4_PATTERN.matcher(ip).matches() || ip.contains(":"));
    }

    private boolean isPrivateIp(String ip) {
        return ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.")
                || ip.startsWith("127.") || ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1");
    }
}
