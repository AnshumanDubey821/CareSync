package com.caresync;

import com.caresync.config.GooglePlacesProperties;
import com.caresync.model.enums.Role;
import com.caresync.model.entity.User;
import com.caresync.repository.UserRepository;
import com.caresync.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.SocketTimeoutException;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "google.places.enabled=true",
        "google.places.api-key=test-secret-places-key-do-not-expose",
        "google.places.base-url=https://places.googleapis.com/v1",
        "google.places.rate-limit.per-user-per-minute=10",
        "google.places.rate-limit.per-ip-per-minute=30",
        "google.places.monthly-guard.warning-limit=100",
        "google.places.monthly-guard.hard-limit=120"
})
@Transactional
public class GooglePlacesIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GooglePlacesProperties googlePlacesProperties;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RestTemplate restTemplate;

    @MockBean
    private JavaMailSender javaMailSender;

    private MockRestServiceServer mockServer;
    private String patientToken;
    private String doctorToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.bindTo(restTemplate).build();

        User patientUser = userRepository.save(User.builder()
                .email("places_patient@caresync.com")
                .password("password123")
                .fullName("Test Patient")
                .role(Role.PATIENT)
                .active(true)
                .build());

        User doctorUser = userRepository.save(User.builder()
                .email("places_doctor@caresync.com")
                .password("password123")
                .fullName("Dr. Test")
                .role(Role.DOCTOR)
                .active(true)
                .build());

        User adminUser = userRepository.save(User.builder()
                .email("places_admin@caresync.com")
                .password("password123")
                .fullName("Test Admin")
                .role(Role.ADMIN)
                .active(true)
                .build());

        patientToken = "Bearer " + jwtService.generateToken(patientUser);
        doctorToken = "Bearer " + jwtService.generateToken(doctorUser);
        adminToken = "Bearer " + jwtService.generateToken(adminUser);
    }

    @Test
    @DisplayName("Unauthenticated request to /api/places/search returns 401 Unauthorized")
    void testSearchPlaces_whenUnauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/places/search")
                        .param("query", "Apollo Hospital"))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(401))
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Public status endpoint /api/places/status returns enabled state and rate limits without secrets")
    void testPlacesStatus_returnsConfigWithoutExposingSecret() throws Exception {
        mockMvc.perform(get("/api/places/status"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.enabled").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.attribution").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$.rateLimits.perUserPerMinute").value(10))
                .andExpect(MockMvcResultMatchers.jsonPath("$.apiKey").doesNotExist())
                .andExpect(MockMvcResultMatchers.content().string(not(containsString("test-secret-places-key-do-not-expose"))));
    }

    @Test
    @DisplayName("Authenticated search returns mapped place summaries and NEVER leaks API key")
    void testSearchPlaces_whenAuthenticated_returnsMappedPlaces() throws Exception {
        String upstreamGoogleJson = """
        {
          "places": [
            {
              "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
              "displayName": { "text": "Apollo Hospital Bengaluru", "languageCode": "en" },
              "formattedAddress": "154/11, Bannerghatta Main Rd, Bengaluru, Karnataka 560076",
              "rating": 4.5,
              "userRatingCount": 3200,
              "location": { "latitude": 12.8945, "longitude": 77.5989 },
              "primaryType": "hospital",
              "googleMapsUri": "https://maps.google.com/?cid=12345",
              "photos": [
                { "name": "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/photoRef123" }
              ]
            }
          ]
        }
        """;

        mockServer.expect(ExpectedCount.once(), MockRestRequestMatchers.requestTo("https://places.googleapis.com/v1/places:searchText"))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.POST))
                .andExpect(MockRestRequestMatchers.header("X-Goog-Api-Key", "test-secret-places-key-do-not-expose"))
                .andExpect(MockRestRequestMatchers.header("X-Goog-FieldMask", containsString("places.displayName")))
                .andRespond(MockRestResponseCreators.withSuccess(upstreamGoogleJson, MediaType.APPLICATION_JSON));

        mockMvc.perform(get("/api/places/search")
                        .header("Authorization", patientToken)
                        .param("query", "Apollo Hospital")
                        .param("city", "Bengaluru")
                        .param("placeType", "hospital")
                        .param("pageSize", "10"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.totalFound").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.places[0].id").value("ChIJN1t_tDeuEmsRUsoyG83frY4"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.places[0].displayName").value("Apollo Hospital Bengaluru"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.places[0].formattedAddress").value("154/11, Bannerghatta Main Rd, Bengaluru, Karnataka 560076"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.places[0].rating").value(4.5))
                .andExpect(MockMvcResultMatchers.jsonPath("$.places[0].userRatingCount").value(3200))
                .andExpect(MockMvcResultMatchers.jsonPath("$.places[0].latitude").value(12.8945))
                .andExpect(MockMvcResultMatchers.jsonPath("$.places[0].longitude").value(77.5989))
                .andExpect(MockMvcResultMatchers.jsonPath("$.places[0].photoUrls[0]").value("/api/places/photos/photoRef123"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.attribution").value(containsString("Google Places (New)")))
                .andExpect(MockMvcResultMatchers.content().string(not(containsString("test-secret-places-key-do-not-expose"))));

        mockServer.verify();
    }

    @Test
    @DisplayName("Validation rejection on invalid query length or characters")
    void testSearchPlaces_invalidQuery_returns400() throws Exception {
        mockMvc.perform(get("/api/places/search")
                        .header("Authorization", patientToken)
                        .param("query", "A")) // Too short (< 2)
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(400))
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @DisplayName("When Google upstream returns 429 Too Many Requests, proxy safely responds with 429")
    void testSearchPlaces_upstream429_returns429() throws Exception {
        mockServer.expect(ExpectedCount.once(), MockRestRequestMatchers.requestTo("https://places.googleapis.com/v1/places:searchText"))
                .andRespond(MockRestResponseCreators.withStatus(HttpStatus.TOO_MANY_REQUESTS).body("{\"error\": {\"code\": 429, \"message\": \"Quota exceeded\"}}"));

        mockMvc.perform(get("/api/places/search")
                        .header("Authorization", patientToken)
                        .param("query", "Fortis Hospital"))
                .andExpect(MockMvcResultMatchers.status().isTooManyRequests())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(429))
                .andExpect(MockMvcResultMatchers.content().string(not(containsString("test-secret-places-key-do-not-expose"))));

        mockServer.verify();
    }

    @Test
    @DisplayName("When Google upstream returns 403 Billing/Permission Error, proxy safely responds with 403")
    void testSearchPlaces_upstream403_returns403() throws Exception {
        mockServer.expect(ExpectedCount.once(), MockRestRequestMatchers.requestTo("https://places.googleapis.com/v1/places:searchText"))
                .andRespond(MockRestResponseCreators.withStatus(HttpStatus.FORBIDDEN).body("{\"error\": {\"code\": 403, \"message\": \"Places API has not been used or billing disabled\"}}"));

        mockMvc.perform(get("/api/places/search")
                        .header("Authorization", patientToken)
                        .param("query", "Max Healthcare"))
                .andExpect(MockMvcResultMatchers.status().isForbidden())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(403))
                .andExpect(MockMvcResultMatchers.content().string(not(containsString("test-secret-places-key-do-not-expose"))));

        mockServer.verify();
    }

    @Test
    @DisplayName("When Google upstream times out, proxy safely responds with 504 Gateway Timeout")
    void testSearchPlaces_upstreamTimeout_returns504() throws Exception {
        mockServer.expect(ExpectedCount.once(), MockRestRequestMatchers.requestTo("https://places.googleapis.com/v1/places:searchText"))
                .andRespond(request -> {
                    throw new org.springframework.web.client.ResourceAccessException("Read timed out", new SocketTimeoutException("timeout"));
                });

        mockMvc.perform(get("/api/places/search")
                        .header("Authorization", patientToken)
                        .param("query", "Manipal Hospital"))
                .andExpect(MockMvcResultMatchers.status().isGatewayTimeout())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(504))
                .andExpect(MockMvcResultMatchers.content().string(not(containsString("test-secret-places-key-do-not-expose"))));

        mockServer.verify();
    }

    @Test
    @DisplayName("When feature disabled, returns 503 Service Unavailable")
    void testSearchPlaces_whenDisabled_returns503() throws Exception {
        googlePlacesProperties.setEnabled(false);
        try {
            mockMvc.perform(get("/api/places/search")
                            .header("Authorization", patientToken)
                            .param("query", "Apollo Hospital"))
                    .andExpect(MockMvcResultMatchers.status().isServiceUnavailable())
                    .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(503))
                    .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(containsString("Google Places integration is currently disabled")));
        } finally {
            googlePlacesProperties.setEnabled(true);
        }
    }

    @Test
    @DisplayName("When API key missing, returns 500 Configuration Error without exposing secret")
    void testSearchPlaces_whenKeyMissing_returns500() throws Exception {
        String originalKey = googlePlacesProperties.getApiKey();
        googlePlacesProperties.setApiKey("");
        try {
            mockMvc.perform(get("/api/places/search")
                            .header("Authorization", patientToken)
                            .param("query", "Apollo Hospital"))
                    .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                    .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(500))
                    .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(containsString("Google Places service is temporarily misconfigured")));
        } finally {
            googlePlacesProperties.setApiKey(originalKey);
        }
    }

    @Test
    @DisplayName("Photo proxy streams JPEG bytes from Google CDN and shields API key")
    void testGetPlacePhoto_streamsBytesSafely() throws Exception {
        String googleMediaJson = """
        {
          "name": "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/photoRef123/media",
          "photoUri": "https://lh3.googleusercontent.com/test-cdn-photo-url"
        }
        """;
        byte[] dummyImageBytes = new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x11 };

        // 1. Upstream call to Google Places photo media endpoint
        mockServer.expect(ExpectedCount.once(), MockRestRequestMatchers.requestTo(containsString("/photoRef123/media")))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.GET))
                .andExpect(MockRestRequestMatchers.header("X-Goog-Api-Key", "test-secret-places-key-do-not-expose"))
                .andRespond(MockRestResponseCreators.withSuccess(googleMediaJson, MediaType.APPLICATION_JSON));

        // 2. Outbound call to Google's CDN photoUri (which does not carry the API key)
        mockServer.expect(ExpectedCount.once(), MockRestRequestMatchers.requestTo("https://lh3.googleusercontent.com/test-cdn-photo-url"))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.GET))
                .andRespond(MockRestResponseCreators.withSuccess(dummyImageBytes, MediaType.IMAGE_JPEG));

        mockMvc.perform(get("/api/places/photos/photoRef123")
                        .param("maxHeightPx", "400")
                        .param("maxWidthPx", "400"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.header().string("Content-Type", "image/jpeg"))
                .andExpect(MockMvcResultMatchers.header().string("Cache-Control", containsString("max-age=86400")))
                .andExpect(MockMvcResultMatchers.content().bytes(dummyImageBytes));

        mockServer.verify();
    }
}
