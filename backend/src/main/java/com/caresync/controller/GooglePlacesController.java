package com.caresync.controller;

import com.caresync.config.GooglePlacesProperties;
import com.caresync.dto.places.GooglePlacesUsageDto;
import com.caresync.dto.places.PlaceDetailDto;
import com.caresync.dto.places.PlaceSearchRequest;
import com.caresync.dto.places.PlaceSearchResponse;
import com.caresync.service.GooglePlacesRateLimiterService;
import com.caresync.service.GooglePlacesService;
import com.caresync.service.GooglePlacesUsageGuardService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller exposing secure Google Places API (New) proxy endpoints.
 * Protects against key leakage, abuse, and excessive billing by enforcing
 * authentication, rate limiting, and persistent monthly cost guards.
 */
@Slf4j
@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class GooglePlacesController {

    private final GooglePlacesService googlePlacesService;
    private final GooglePlacesRateLimiterService rateLimiterService;
    private final GooglePlacesUsageGuardService usageGuardService;
    private final GooglePlacesProperties properties;

    /**
     * Search Indian hospitals, clinics, and medical facilities.
     */
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PlaceSearchResponse> searchPlaces(
            @Valid PlaceSearchRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        String clientIp = rateLimiterService.resolveClientIp(servletRequest);

        PlaceSearchResponse response = googlePlacesService.searchPlaces(request, userId, clientIp);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve place details for a specific Place ID.
     */
    @GetMapping("/{placeId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PlaceDetailDto> getPlaceDetails(
            @PathVariable String placeId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        String clientIp = rateLimiterService.resolveClientIp(servletRequest);

        PlaceDetailDto detail = googlePlacesService.getPlaceDetails(placeId, userId, clientIp);
        return ResponseEntity.ok(detail);
    }

    /**
     * Safe backend photo proxy: streams image bytes without exposing upstream Google API key.
     */
    @GetMapping("/photos/{photoReference}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> getPlacePhoto(
            @PathVariable String photoReference,
            @RequestParam(required = false) Integer maxHeightPx,
            @RequestParam(required = false) Integer maxWidthPx,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        String clientIp = rateLimiterService.resolveClientIp(servletRequest);

        byte[] photoBytes = googlePlacesService.getPlacePhoto(photoReference, maxHeightPx, maxWidthPx, userId, clientIp);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(photoBytes);
    }

    /**
     * Safe status endpoint reporting feature availability and policy information.
     * Never exposes secrets.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPlacesStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("enabled", properties.isEnabled());
        status.put("attribution", GooglePlacesService.ATTRIBUTION_NOTICE);
        status.put("rateLimits", Map.of(
                "perUserPerMinute", properties.getRateLimit().getPerUserPerMinute(),
                "perIpPerMinute", properties.getRateLimit().getPerIpPerMinute(),
                "photoPerMinute", properties.getRateLimit().getPhotoPerUserPerMinute()
        ));
        return ResponseEntity.ok(status);
    }

    /**
     * Administrative endpoint to inspect persistent monthly usage and cost guards.
     */
    @GetMapping("/admin/usage")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GooglePlacesUsageDto> getMonthlyUsage() {
        return ResponseEntity.ok(usageGuardService.getUsageSummary());
    }

    /**
     * Administrative endpoint to reset monthly usage counter for current month.
     */
    @PostMapping("/admin/usage/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> resetMonthlyUsage(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String yearMonth = YearMonth.now().toString();
        String adminUser = userDetails != null ? userDetails.getUsername() : "ADMIN";
        usageGuardService.resetMonthlyUsage(yearMonth, adminUser);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Monthly usage counter successfully reset for " + yearMonth);
        result.put("yearMonth", yearMonth);
        return ResponseEntity.ok(result);
    }
}
