package com.caresync.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

@Slf4j
@Configuration
public class OAuth2ClientConfig {

    @Value("${app.oauth2.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    @Value("${app.oauth2.google.client-secret:${GOOGLE_CLIENT_SECRET:}}")
    private String googleClientSecret;

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        if (googleClientId != null && !googleClientId.trim().isEmpty() &&
            googleClientSecret != null && !googleClientSecret.trim().isEmpty()) {
            log.info("Configuring Google OAuth2 client registration [clientId: {}...]", 
                    googleClientId.substring(0, Math.min(googleClientId.length(), 8)));

            ClientRegistration googleRegistration = CommonOAuth2Provider.GOOGLE.getBuilder("google")
                    .clientId(googleClientId.trim())
                    .clientSecret(googleClientSecret.trim())
                    .scope("openid", "profile", "email")
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build();

            return new InMemoryClientRegistrationRepository(googleRegistration);
        }

        log.info("Google OAuth2 client credentials not configured. OAuth2 login is disabled.");
        return registrationId -> null;
    }
}
