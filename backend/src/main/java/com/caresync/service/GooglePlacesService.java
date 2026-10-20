package com.caresync.service;

import com.caresync.config.GooglePlacesProperties;
import com.caresync.dto.places.PlaceDetailDto;
import com.caresync.dto.places.PlaceSearchRequest;
import com.caresync.dto.places.PlaceSearchResponse;
import com.caresync.dto.places.PlaceSummaryDto;
import com.caresync.exception.GooglePlacesApiException;
import com.caresync.exception.GooglePlacesConfigurationException;
import com.caresync.exception.GooglePlacesDisabledException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service integrating with Google Places API (New).
 * Provides secure proxying for searching Indian hospitals, clinics, and medical facilities.
 * Enforces explicit field masks, strict parameter validation, cost protection quotas,
 * rate limits, and short-term performance caching in accordance with Google Places API policies.
 */
@Slf4j
@Service
public class GooglePlacesService {

    private final GooglePlacesProperties properties;
    private final GooglePlacesRateLimiterService rateLimiterService;
    private final GooglePlacesUsageGuardService usageGuardService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // In-memory cache for search results (30-minute expiration complying with Google's 30-day max policy)
    private final Cache<String, PlaceSearchResponse> searchCache;

    // Cache mapping photo references to their full Google Places photo names
    private final Cache<String, String> photoResourceNameCache;

    // In-memory cache for photo image bytes (24 hours)
    private final Cache<String, byte[]> photoByteCache;

    public static final String ATTRIBUTION_NOTICE =
            "Places data provided by Google Places (New). Powered by CareSync Healthcare Network.";

    public GooglePlacesService(
            GooglePlacesProperties properties,
            GooglePlacesRateLimiterService rateLimiterService,
            GooglePlacesUsageGuardService usageGuardService,
            RestTemplate restTemplate,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.rateLimiterService = rateLimiterService;
        this.usageGuardService = usageGuardService;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;

        this.searchCache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(30))
                .maximumSize(1000)
                .build();

        this.photoResourceNameCache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofHours(2))
                .maximumSize(5000)
                .build();

        this.photoByteCache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofHours(24))
                .maximumSize(500)
                .build();
    }

    /**
     * Searches for hospitals and medical clinics in India using Google Places API (New) Text Search.
     */
    public PlaceSearchResponse searchPlaces(PlaceSearchRequest request, String userId, String clientIp) {
        validateConfiguration();

        // 1. Check Rate Limits (per-user and per-IP)
        rateLimiterService.checkRateLimit(userId, clientIp, false);

        // 2. Check Cache
        String cacheKey = buildSearchCacheKey(request);
        PlaceSearchResponse cachedResponse = searchCache.getIfPresent(cacheKey);
        if (cachedResponse != null) {
            log.debug("Returning cached Google Places search results for key [{}]", cacheKey);
            return PlaceSearchResponse.builder()
                    .places(cachedResponse.getPlaces())
                    .totalFound(cachedResponse.getTotalFound())
                    .cached(true)
                    .attribution(ATTRIBUTION_NOTICE)
                    .build();
        }

        // 3. Atomically check and increment monthly usage guard
        usageGuardService.checkAndIncrementUsage("search");

        // 4. Construct Upstream Google Places API (New) Request
        String url = properties.getBaseUrl() + "/places:searchText";
        HttpHeaders headers = createSecureHeaders(
                "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.primaryType,places.googleMapsUri,places.photos"
        );

        // Formulate target text query focused on Indian healthcare
        String textQuery = buildTextQuery(request);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("textQuery", textQuery);
        requestBody.put("pageSize", Math.min(20, Math.max(1, request.getPageSize())));

        if (StringUtils.hasText(request.getPlaceType())) {
            requestBody.put("includedType", request.getPlaceType());
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Dispatching outbound Google Places API search query [term='{}', city='{}']",
                    sanitizeLogString(request.getQuery()), sanitizeLogString(request.getCity()));

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            PlaceSearchResponse result = parseSearchResponse(response.getBody());

            // Cache successful result
            searchCache.put(cacheKey, result);
            return result;
        } catch (HttpClientErrorException ex) {
            handleClientError(ex, "search");
            throw new GooglePlacesApiException(HttpStatus.valueOf(ex.getStatusCode().value()), "Google Places API search failed.");
        } catch (HttpServerErrorException ex) {
            log.error("Google Places upstream server error: HTTP {}", ex.getStatusCode().value());
            throw new GooglePlacesApiException(HttpStatus.BAD_GATEWAY, "Google Places upstream service temporarily unavailable.");
        } catch (ResourceAccessException ex) {
            log.error("Google Places API timeout or connection failure: {}", ex.getMessage());
            throw new GooglePlacesApiException(HttpStatus.GATEWAY_TIMEOUT, "Connection to Google Places service timed out. Please try again.");
        } catch (Exception ex) {
            log.error("Unexpected error executing Google Places search: {}", ex.getMessage());
            throw new GooglePlacesApiException(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while communicating with Google Places.");
        }
    }

    /**
     * Retrieves details for a specific Place ID using explicit field masks.
     */
    public PlaceDetailDto getPlaceDetails(String placeId, String userId, String clientIp) {
        validateConfiguration();

        if (!StringUtils.hasText(placeId) || !placeId.matches("^[a-zA-Z0-9_.-]{5,150}$")) {
            throw new IllegalArgumentException("Invalid Place ID format.");
        }

        rateLimiterService.checkRateLimit(userId, clientIp, false);
        usageGuardService.checkAndIncrementUsage("details");

        String url = properties.getBaseUrl() + "/places/" + placeId;
        HttpHeaders headers = createSecureHeaders(
                "id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,userRatingCount,location,primaryType,googleMapsUri,photos"
        );

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            log.info("Dispatching outbound Google Places API detail lookup for place ID [{}]", placeId);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            return parseDetailResponse(response.getBody());
        } catch (HttpClientErrorException ex) {
            handleClientError(ex, "details");
            throw new GooglePlacesApiException(HttpStatus.valueOf(ex.getStatusCode().value()), "Failed to fetch place details.");
        } catch (Exception ex) {
            log.error("Error retrieving place details for [{}]: {}", placeId, ex.getMessage());
            throw new GooglePlacesApiException(HttpStatus.BAD_GATEWAY, "Unable to retrieve place details from upstream service.");
        }
    }

    /**
     * Proxies photo media requests so the frontend never directly calls Google with the API key.
     */
    public byte[] getPlacePhoto(String photoReference, String placeId, Integer maxHeightPx, Integer maxWidthPx, String userId, String clientIp) {
        validateConfiguration();

        if (!StringUtils.hasText(photoReference) || photoReference.contains("..")) {
            throw new IllegalArgumentException("Invalid photo reference format.");
        }

        String cacheKey = (StringUtils.hasText(placeId) ? placeId + ":" : "") + photoReference + ":" + maxHeightPx + ":" + maxWidthPx;
        byte[] cachedBytes = photoByteCache.getIfPresent(cacheKey);
        if (cachedBytes != null) {
            return cachedBytes;
        }

        // Apply strict photo-specific rate limiting (5 per minute per IP / user)
        rateLimiterService.checkRateLimit(userId, clientIp, true);
        usageGuardService.checkAndIncrementUsage("photo");

        int h = maxHeightPx != null ? Math.min(800, Math.max(50, maxHeightPx)) : 400;
        int w = maxWidthPx != null ? Math.min(800, Math.max(50, maxWidthPx)) : 400;

        String resourceName = null;
        if (StringUtils.hasText(placeId)) {
            resourceName = photoResourceNameCache.getIfPresent(placeId + ":" + photoReference);
            if (resourceName == null) {
                resourceName = "places/" + placeId + "/photos/" + photoReference;
            }
        }
        if (resourceName == null) {
            resourceName = photoResourceNameCache.getIfPresent(photoReference);
        }
        if (resourceName == null) {
            resourceName = photoReference;
        }

        String url = properties.getBaseUrl() + "/" + resourceName + "/media?maxHeightPx=" + h + "&maxWidthPx=" + w + "&skipHttpRedirect=true";
        HttpHeaders headers = createSecureHeaders(null);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            String photoUri = root.path("photoUri").asText();

            if (StringUtils.hasText(photoUri)) {
                // Fetch actual photo bytes from Google's CDN photoUri (which does not require the API key)
                ResponseEntity<byte[]> imageResponse = restTemplate.getForEntity(photoUri, byte[].class);
                byte[] bytes = imageResponse.getBody();
                if (bytes != null) {
                    photoByteCache.put(cacheKey, bytes);
                }
                return bytes;
            }
            throw new GooglePlacesApiException(HttpStatus.NOT_FOUND, "Photo not available.");
        } catch (HttpClientErrorException ex) {
            handleClientError(ex, "photo");
            throw new GooglePlacesApiException(HttpStatus.valueOf(ex.getStatusCode().value()), "Failed to load place photo.");
        } catch (Exception ex) {
            log.error("Error retrieving place photo [{}]: {}", photoReference, ex.getMessage());
            throw new GooglePlacesApiException(HttpStatus.BAD_GATEWAY, "Unable to load photo from upstream service.");
        }
    }

    public byte[] getPlacePhoto(String photoReference, Integer maxHeightPx, Integer maxWidthPx, String userId, String clientIp) {
        return getPlacePhoto(photoReference, null, maxHeightPx, maxWidthPx, userId, clientIp);
    }

    private void validateConfiguration() {
        if (!properties.isEnabled()) {
            throw new GooglePlacesDisabledException(
                    "Google Places integration is currently disabled. Please contact the administrator.");
        }
        if (!StringUtils.hasText(properties.getApiKey())) {
            log.error("Google Places is enabled but GOOGLE_PLACES_API_KEY environment variable is empty.");
            throw new GooglePlacesConfigurationException(
                    "Google Places service is temporarily misconfigured. Please contact support.");
        }
    }

    private HttpHeaders createSecureHeaders(String fieldMask) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Goog-Api-Key", properties.getApiKey());
        if (StringUtils.hasText(fieldMask)) {
            headers.set("X-Goog-FieldMask", fieldMask);
        }
        return headers;
    }

    private String buildTextQuery(PlaceSearchRequest request) {
        StringBuilder query = new StringBuilder(request.getQuery().trim());
        if (StringUtils.hasText(request.getCity())) {
            query.append(" in ").append(request.getCity().trim()).append(", India");
        } else if (!query.toString().toLowerCase().contains("india")) {
            query.append(", India");
        }
        return query.toString();
    }

    private String buildSearchCacheKey(PlaceSearchRequest request) {
        return (request.getQuery() + ":" +
                (request.getCity() != null ? request.getCity() : "") + ":" +
                (request.getPlaceType() != null ? request.getPlaceType() : "") + ":" +
                request.getPageSize()).toLowerCase();
    }

    private PlaceSearchResponse parseSearchResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode placesNode = root.path("places");
            List<PlaceSummaryDto> places = new ArrayList<>();

            if (placesNode.isArray()) {
                for (JsonNode node : placesNode) {
                    places.add(mapJsonToPlaceSummary(node));
                }
            }

            return PlaceSearchResponse.builder()
                    .places(places)
                    .totalFound(places.size())
                    .cached(false)
                    .attribution(ATTRIBUTION_NOTICE)
                    .build();
        } catch (Exception ex) {
            log.error("Error parsing Google Places search response JSON: {}", ex.getMessage());
            return PlaceSearchResponse.builder()
                    .places(Collections.emptyList())
                    .totalFound(0)
                    .cached(false)
                    .attribution(ATTRIBUTION_NOTICE)
                    .build();
        }
    }

    private PlaceSummaryDto mapJsonToPlaceSummary(JsonNode node) {
        String id = node.path("id").asText("");
        String displayName = node.path("displayName").path("text").asText("");
        String formattedAddress = node.path("formattedAddress").asText("");
        Double rating = node.has("rating") ? node.path("rating").asDouble() : null;
        Integer userRatingCount = node.has("userRatingCount") ? node.path("userRatingCount").asInt() : null;

        Double lat = null;
        Double lng = null;
        if (node.has("location")) {
            lat = node.path("location").path("latitude").asDouble();
            lng = node.path("location").path("longitude").asDouble();
        }

        String primaryType = node.path("primaryType").asText(null);
        String googleMapsUri = node.path("googleMapsUri").asText(null);

        // Safe proxy photo URLs
        List<String> photoUrls = new ArrayList<>();
        JsonNode photosNode = node.path("photos");
        if (photosNode.isArray()) {
            for (JsonNode photo : photosNode) {
                String photoName = photo.path("name").asText(); // format: places/{placeId}/photos/{photoId}
                if (StringUtils.hasText(photoName)) {
                    String photoRef = photoName.substring(photoName.lastIndexOf('/') + 1);
                    photoResourceNameCache.put(photoRef, photoName);
                    if (StringUtils.hasText(id)) {
                        photoResourceNameCache.put(id + ":" + photoRef, photoName);
                    }
                    photoUrls.add("/api/places/photos/" + photoRef);
                }
            }
        }

        return PlaceSummaryDto.builder()
                .id(id)
                .displayName(displayName)
                .formattedAddress(formattedAddress)
                .rating(rating)
                .userRatingCount(userRatingCount)
                .latitude(lat)
                .longitude(lng)
                .primaryType(primaryType)
                .googleMapsUri(googleMapsUri)
                .photoUrls(photoUrls)
                .build();
    }

    private PlaceDetailDto parseDetailResponse(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            PlaceSummaryDto summary = mapJsonToPlaceSummary(node);

            return PlaceDetailDto.builder()
                    .id(summary.getId())
                    .displayName(summary.getDisplayName())
                    .formattedAddress(summary.getFormattedAddress())
                    .nationalPhoneNumber(node.path("nationalPhoneNumber").asText(null))
                    .internationalPhoneNumber(node.path("internationalPhoneNumber").asText(null))
                    .websiteUri(node.path("websiteUri").asText(null))
                    .rating(summary.getRating())
                    .userRatingCount(summary.getUserRatingCount())
                    .latitude(summary.getLatitude())
                    .longitude(summary.getLongitude())
                    .primaryType(summary.getPrimaryType())
                    .googleMapsUri(summary.getGoogleMapsUri())
                    .photoUrls(summary.getPhotoUrls())
                    .attribution(ATTRIBUTION_NOTICE)
                    .build();
        } catch (Exception ex) {
            log.error("Error parsing Google Places detail response JSON: {}", ex.getMessage());
            throw new GooglePlacesApiException(HttpStatus.BAD_GATEWAY, "Failed to parse place details response.");
        }
    }

    private void handleClientError(HttpClientErrorException ex, String operation) {
        int status = ex.getStatusCode().value();
        if (status == 429) {
            log.warn("Google Places API upstream rate limit exceeded (HTTP 429) during [{}]", operation);
            throw new GooglePlacesApiException(HttpStatus.TOO_MANY_REQUESTS, "Google Places upstream rate limit reached. Please retry in a few moments.");
        } else if (status == 403) {
            log.error("Google Places API billing or permission error (HTTP 403) during [{}]. Check GCP API enablement & billing.", operation);
            throw new GooglePlacesApiException(HttpStatus.FORBIDDEN, "Google Places API authorization or quota error. Please contact administrator.");
        } else if (status == 400) {
            log.warn("Google Places API bad request (HTTP 400) during [{}].", operation);
            throw new GooglePlacesApiException(HttpStatus.BAD_REQUEST, "Invalid search criteria supplied.");
        } else {
            log.error("Google Places API client error: HTTP {}", status);
        }
    }

    private String sanitizeLogString(String input) {
        if (input == null) return "";
        return input.replaceAll("[\r\n]", "").trim();
    }
}
