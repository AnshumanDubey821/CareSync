package com.caresync;

import com.caresync.config.GooglePlacesProperties;
import com.caresync.dto.places.GooglePlacesUsageDto;
import com.caresync.entity.GooglePlacesUsage;
import com.caresync.exception.GooglePlacesMonthlyLimitExceededException;
import com.caresync.model.enums.Role;
import com.caresync.model.entity.User;
import com.caresync.repository.GooglePlacesUsageRepository;
import com.caresync.repository.UserRepository;
import com.caresync.security.JwtService;
import com.caresync.service.GooglePlacesUsageGuardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class GooglePlacesUsageGuardTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GooglePlacesProperties properties;

    @Autowired
    private GooglePlacesUsageGuardService usageGuardService;

    @Autowired
    private GooglePlacesUsageRepository usageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private JavaMailSender javaMailSender;

    private String adminToken;
    private String patientToken;
    private String currentYearMonth;

    @BeforeEach
    void setUp() {
        currentYearMonth = YearMonth.now().toString();

        User patientUser = userRepository.save(User.builder()
                .email("guard_patient_" + System.currentTimeMillis() + "@caresync.com")
                .password("password123")
                .fullName("Guard Patient")
                .role(Role.PATIENT)
                .active(true)
                .build());

        User adminUser = userRepository.save(User.builder()
                .email("guard_admin_" + System.currentTimeMillis() + "@caresync.com")
                .password("password123")
                .fullName("Guard Admin")
                .role(Role.ADMIN)
                .active(true)
                .build());

        adminToken = "Bearer " + jwtService.generateToken(adminUser);
        patientToken = "Bearer " + jwtService.generateToken(patientUser);

        properties.getMonthlyGuard().setWarningLimit(5);
        properties.getMonthlyGuard().setHardLimit(8);

        // Reset repository record for clean test state
        usageRepository.deleteAll();
    }

    @Test
    @DisplayName("Usage guard creates monthly record and increments counter per operation")
    void testUsageGuard_incrementsCounter() {
        GooglePlacesUsage u1 = usageGuardService.checkAndIncrementUsage("search");
        assertEquals(1, u1.getRequestCount());
        assertEquals(currentYearMonth, u1.getYearMonth());

        GooglePlacesUsage u2 = usageGuardService.checkAndIncrementUsage("details");
        assertEquals(2, u2.getRequestCount());

        GooglePlacesUsageDto summary = usageGuardService.getUsageSummary();
        assertEquals(2, summary.getRequestCount());
        assertEquals("NORMAL", summary.getStatus());
        assertEquals(6, summary.getRemainingQuota()); // 8 - 2 = 6
    }

    @Test
    @DisplayName("Warning limit emits alert status but allows requests to proceed")
    void testUsageGuard_warningLimit_allowsRequests() {
        // Increment up to warning limit (5)
        for (int i = 0; i < 5; i++) {
            usageGuardService.checkAndIncrementUsage("search");
        }

        GooglePlacesUsageDto summary = usageGuardService.getUsageSummary();
        assertEquals(5, summary.getRequestCount());
        assertEquals("WARNING", summary.getStatus());
        assertEquals(3, summary.getRemainingQuota());

        // Next request within hard limit still succeeds
        assertDoesNotThrow(() -> usageGuardService.checkAndIncrementUsage("search"));
    }

    @Test
    @DisplayName("Hard limit cutoff blocks further requests and throws exception")
    void testUsageGuard_hardLimitCutoff_blocksRequests() {
        // Increment up to hard limit (8)
        for (int i = 0; i < 8; i++) {
            usageGuardService.checkAndIncrementUsage("search");
        }

        GooglePlacesUsageDto summary = usageGuardService.getUsageSummary();
        assertEquals(8, summary.getRequestCount());
        assertEquals("HARD_LIMIT_REACHED", summary.getStatus());
        assertEquals(0, summary.getRemainingQuota());

        // 9th request must be blocked
        GooglePlacesMonthlyLimitExceededException ex = assertThrows(
                GooglePlacesMonthlyLimitExceededException.class,
                () -> usageGuardService.checkAndIncrementUsage("search")
        );

        assertTrue(ex.getMessage().contains("Monthly Google Places API request limit has been reached"));
    }

    @Test
    @DisplayName("Concurrent requests cannot exceed the configured application-level limit")
    void testUsageGuard_concurrencyProtection_enforcesLimit() throws InterruptedException {
        int threads = 15;
        usageRepository.deleteAll();
        properties.getMonthlyGuard().setHardLimit(5); // Hard limit 5, but 15 concurrent threads try to consume

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        AtomicInteger successfulRequests = new AtomicInteger(0);
        AtomicInteger blockedRequests = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    usageGuardService.checkAndIncrementUsage("concurrent-test");
                    successfulRequests.incrementAndGet();
                } catch (GooglePlacesMonthlyLimitExceededException e) {
                    blockedRequests.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertEquals(5, successfulRequests.get(), "Exactly 5 requests should succeed up to the hard limit");
        assertEquals(10, blockedRequests.get(), "Remaining 10 concurrent requests must be rejected");

        GooglePlacesUsageDto summary = usageGuardService.getUsageSummary();
        assertEquals(5, summary.getRequestCount());
        assertEquals("HARD_LIMIT_REACHED", summary.getStatus());
    }

    @Test
    @DisplayName("Admin usage endpoint /api/places/admin/usage requires ROLE_ADMIN")
    void testAdminUsageEndpoint_authorization() throws Exception {
        // Patient gets 403 Forbidden
        mockMvc.perform(get("/api/places/admin/usage")
                        .header("Authorization", patientToken))
                .andExpect(status().isForbidden());

        // Admin gets 200 OK
        mockMvc.perform(get("/api/places/admin/usage")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.yearMonth").value(currentYearMonth))
                .andExpect(jsonPath("$.policyDisclaimer").exists());
    }

    @Test
    @DisplayName("Admin usage reset endpoint /api/places/admin/usage/reset resets monthly counter")
    void testAdminResetEndpoint_resetsUsage() throws Exception {
        usageGuardService.checkAndIncrementUsage("search");
        usageGuardService.checkAndIncrementUsage("search");
        assertEquals(2, usageGuardService.getUsageSummary().getRequestCount());

        mockMvc.perform(post("/api/places/admin/usage/reset")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("successfully reset")));

        assertEquals(0, usageGuardService.getUsageSummary().getRequestCount());
    }
}
