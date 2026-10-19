package com.caresync;

import com.caresync.config.GooglePlacesProperties;
import com.caresync.exception.GooglePlacesRateLimitException;
import com.caresync.security.JwtService;
import com.caresync.service.GooglePlacesRateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class GooglePlacesRateLimiterTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GooglePlacesProperties properties;

    @Autowired
    private GooglePlacesRateLimiterService rateLimiterService;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        properties.getRateLimit().setPerUserPerMinute(3);
        properties.getRateLimit().setPerIpPerMinute(5);
        properties.getRateLimit().setPhotoPerUserPerMinute(2);
    }

    @Test
    @DisplayName("Per-user rate limit enforces maximum allowed requests per minute")
    void testPerUserRateLimit_exceedsCapacity_throwsRateLimitException() {
        String testUser = "rate-limit-user-" + System.currentTimeMillis() + "@caresync.com";
        String ip = "192.168.1.100";

        // First 3 requests succeed
        assertDoesNotThrow(() -> rateLimiterService.checkRateLimit(testUser, ip, false));
        assertDoesNotThrow(() -> rateLimiterService.checkRateLimit(testUser, ip, false));
        assertDoesNotThrow(() -> rateLimiterService.checkRateLimit(testUser, ip, false));

        // 4th request must be rejected with 429
        GooglePlacesRateLimitException ex = assertThrows(
                GooglePlacesRateLimitException.class,
                () -> rateLimiterService.checkRateLimit(testUser, ip, false)
        );

        assertTrue(ex.getRetryAfterSeconds() > 0);
        assertTrue(ex.getMessage().contains("User search rate limit exceeded"));
    }

    @Test
    @DisplayName("Per-IP rate limit protects against unauthenticated or distributed key abuse")
    void testPerIpRateLimit_exceedsCapacity_throwsRateLimitException() {
        String testIp = "203.0.113." + (System.currentTimeMillis() % 250);

        // 5 requests from different users on the same IP
        for (int i = 0; i < 5; i++) {
            String u = "user-ip-test-" + i + "-" + System.currentTimeMillis();
            assertDoesNotThrow(() -> rateLimiterService.checkRateLimit(u, testIp, false));
        }

        // 6th request from same IP must be rejected
        GooglePlacesRateLimitException ex = assertThrows(
                GooglePlacesRateLimitException.class,
                () -> rateLimiterService.checkRateLimit("another-user", testIp, false)
        );

        assertTrue(ex.getRetryAfterSeconds() > 0);
        assertTrue(ex.getMessage().contains("Client IP rate limit exceeded"));
    }

    @Test
    @DisplayName("Photo detail request tier enforces stricter limit (2 per minute)")
    void testPhotoRateLimit_exceedsCapacity_throwsRateLimitException() {
        String testUser = "photo-user-" + System.currentTimeMillis() + "@caresync.com";
        String ip = "10.0.0.50";

        assertDoesNotThrow(() -> rateLimiterService.checkRateLimit(testUser, ip, true));
        assertDoesNotThrow(() -> rateLimiterService.checkRateLimit(testUser, ip, true));

        // 3rd photo request must be rejected
        GooglePlacesRateLimitException ex = assertThrows(
                GooglePlacesRateLimitException.class,
                () -> rateLimiterService.checkRateLimit(testUser, ip, true)
        );

        assertTrue(ex.getRetryAfterSeconds() > 0);
        assertTrue(ex.getMessage().contains("Photo detail request rate limit exceeded"));
    }

    @Test
    @DisplayName("Client IP resolution ignores X-Forwarded-For when direct remoteAddr is not a trusted proxy")
    void testResolveClientIp_untrustedProxy_ignoresXForwardedFor() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.5"); // Untrusted direct client IP
        request.addHeader("X-Forwarded-For", "203.0.113.99, 10.0.0.1"); // Spoofed header

        properties.setTrustedProxies(List.of("127.0.0.1", "10.10.10.1"));

        String resolvedIp = rateLimiterService.resolveClientIp(request);
        assertEquals("198.51.100.5", resolvedIp, "Must ignore X-Forwarded-For from untrusted remote address");
    }

    @Test
    @DisplayName("Client IP resolution accepts valid X-Forwarded-For when direct remoteAddr IS a trusted proxy")
    void testResolveClientIp_trustedProxy_acceptsXForwardedFor() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.10.10.1"); // Trusted proxy IP
        request.addHeader("X-Forwarded-For", "203.0.113.88");

        properties.setTrustedProxies(List.of("10.10.10.1"));

        String resolvedIp = rateLimiterService.resolveClientIp(request);
        assertEquals("203.0.113.88", resolvedIp, "Must safely use forwarded IP when from a trusted proxy");
    }

    @Test
    @DisplayName("Existing auth endpoints are NOT affected by Places rate limiter")
    void testAuthEndpoints_areNotRateLimitedByPlacesLimiter() throws Exception {
        // Repeated requests to /api/auth/login with invalid credentials should receive 401, never 429
        for (int i = 0; i < 6; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType("application/json")
                            .content("{\"email\":\"nonexistent@caresync.com\",\"password\":\"wrongpwd\"}"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
