package com.caresync.controller;

import com.caresync.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Fallback controller for OAuth2 authorization endpoints.
 * When a requested OAuth2 client registration is not active or credentials are unconfigured,
 * requests that pass through Spring Security are handled here gracefully rather than
 * resulting in NoResourceFoundException or HTTP 500 errors.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class OAuth2AuthorizationFallbackController {

    private final ObjectMapper objectMapper;

    @Value("${app.oauth2.frontend-login-uri:http://localhost:5173/login}")
    private String frontendLoginUri;

    @GetMapping({"/oauth2/authorization", "/oauth2/authorization/{registrationId}"})
    public void handleUnconfiguredOAuth2(
            @PathVariable(required = false) String registrationId,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        String provider = registrationId != null ? registrationId : "unknown";
        log.warn("OAuth2 authorization initiated for [{}] but client registration is not active or unconfigured.", provider);

        String acceptHeader = request.getHeader("Accept");
        if (acceptHeader != null && acceptHeader.contains(MediaType.APPLICATION_JSON_VALUE) && !acceptHeader.contains(MediaType.TEXT_HTML_VALUE)) {
            response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ErrorResponse error = ErrorResponse.builder()
                    .status(HttpStatus.SERVICE_UNAVAILABLE.value())
                    .error("OAuth2 Unavailable")
                    .message("OAuth2 authentication is not configured for provider: " + provider)
                    .timestamp(LocalDateTime.now())
                    .build();
            response.getWriter().write(objectMapper.writeValueAsString(error));
            return;
        }

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendLoginUri)
                .queryParam("error", "oauth2_failed")
                .build().toUriString();
        response.sendRedirect(redirectUrl);
    }
}
