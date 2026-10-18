package com.caresync.security;

import com.caresync.dto.AuthResponse;
import com.caresync.exception.OAuth2AccountConflictException;
import com.caresync.exception.OAuth2AuthenticationProcessingException;
import com.caresync.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final OAuth2ExchangeCodeService exchangeCodeService;

    public OAuth2AuthenticationSuccessHandler(@Lazy AuthService authService, OAuth2ExchangeCodeService exchangeCodeService) {
        this.authService = authService;
        this.exchangeCodeService = exchangeCodeService;
    }

    @Value("${app.oauth2.authorized-redirect-uri:http://localhost:5173/oauth2/callback}")
    private String authorizedRedirectUri;

    @Value("${app.oauth2.frontend-login-uri:http://localhost:5173/login}")
    private String frontendLoginUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        if (!(authentication.getPrincipal() instanceof OAuth2User oAuth2User)) {
            log.error("Authentication principal is not an OAuth2User: {}", authentication.getPrincipal());
            redirectToLoginWithError(response, "oauth2_failed", null);
            return;
        }

        try {
            String sub = oAuth2User.getAttribute("sub");
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            Object emailVerifiedObj = oAuth2User.getAttribute("email_verified");
            boolean emailVerified = emailVerifiedObj != null &&
                    (Boolean.TRUE.equals(emailVerifiedObj) || "true".equalsIgnoreCase(emailVerifiedObj.toString()));

            log.info("Processing Google OAuth2 login for subject ID [{}]", sub != null && sub.length() > 6 ? sub.substring(0, 6) + "..." : "unknown");

            AuthResponse authResponse = authService.processOAuth2Login("GOOGLE", sub, email, name, emailVerified);

            // Generate single-use exchange code (never put JWT in URL)
            String exchangeCode = exchangeCodeService.generateCode(authResponse);

            String targetUrl = UriComponentsBuilder.fromUriString(authorizedRedirectUri)
                    .queryParam("code", exchangeCode)
                    .build().toUriString();

            response.sendRedirect(targetUrl);
        } catch (OAuth2AccountConflictException ex) {
            log.warn("OAuth2 account conflict: {}", ex.getMessage());
            redirectToLoginWithError(response, "account_exists_unlinked", null);
        } catch (OAuth2AuthenticationProcessingException ex) {
            log.warn("OAuth2 processing error: {}", ex.getMessage());
            if (ex.getMessage() != null && ex.getMessage().contains("deactivated")) {
                redirectToLoginWithError(response, "account_deactivated", null);
            } else if (ex.getMessage() != null && ex.getMessage().contains("verified")) {
                redirectToLoginWithError(response, "unverified_email", null);
            } else {
                redirectToLoginWithError(response, "oauth2_failed", null);
            }
        } catch (Exception ex) {
            log.error("Unexpected error during OAuth2 authentication processing", ex);
            redirectToLoginWithError(response, "oauth2_failed", null);
        }
    }

    private void redirectToLoginWithError(HttpServletResponse response, String error, String email) throws IOException {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(frontendLoginUri)
                .queryParam("error", error);
        if (email != null && !email.isBlank()) {
            builder.queryParam("email", URLEncoder.encode(email, StandardCharsets.UTF_8));
        }
        response.sendRedirect(builder.build().toUriString());
    }
}
