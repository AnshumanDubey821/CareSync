package com.caresync.security;

import com.caresync.dto.AuthResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class OAuth2ExchangeCodeService {

    private static final int CODE_BYTE_LENGTH = 48; // 64 Base64 URL-safe characters
    private static final long EXPIRATION_SECONDS = 60; // 60 seconds TTL

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, CodeEntry> codeStore = new ConcurrentHashMap<>();

    private record CodeEntry(AuthResponse authResponse, Instant expiresAt) {}

    public String generateCode(AuthResponse authResponse) {
        cleanExpiredCodes();

        byte[] randomBytes = new byte[CODE_BYTE_LENGTH];
        secureRandom.nextBytes(randomBytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        Instant expiresAt = Instant.now().plusSeconds(EXPIRATION_SECONDS);
        codeStore.put(code, new CodeEntry(authResponse, expiresAt));
        log.debug("Generated single-use OAuth exchange code with TTL {}s", EXPIRATION_SECONDS);
        return code;
    }

    public Optional<AuthResponse> exchangeCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }

        // Atomic removal ensures single-use guarantee
        CodeEntry entry = codeStore.remove(code);
        if (entry == null) {
            log.warn("OAuth exchange code not found or already consumed");
            return Optional.empty();
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            log.warn("OAuth exchange code expired");
            return Optional.empty();
        }

        return Optional.of(entry.authResponse());
    }

    private void cleanExpiredCodes() {
        Instant now = Instant.now();
        codeStore.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
    }
}
