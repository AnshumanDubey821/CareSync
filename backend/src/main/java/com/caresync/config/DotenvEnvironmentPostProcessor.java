package com.caresync.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.util.Arrays;
import java.util.Map;

/**
 * Spring Boot EnvironmentPostProcessor that seamlessly injects local .env properties
 * into Spring's ConfigurableEnvironment before application context creation.
 * Automatically active for local development and suppressed during automated test suites.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Logger log = LoggerFactory.getLogger(DotenvEnvironmentPostProcessor.class);
    public static final String PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Skip in test profiles to preserve test suite hermeticity and mock configurations
        String[] activeProfiles = environment.getActiveProfiles();
        if (Arrays.asList(activeProfiles).contains("test")) {
            return;
        }

        Map<String, Object> envProperties = DotenvLoader.load();
        if (envProperties.isEmpty()) {
            return;
        }

        // Add dotenv properties with priority directly after OS environment variables.
        // This ensures OS environment variables take precedence, while .env overrides defaults in application.yml.
        if (environment.getPropertySources().contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
            environment.getPropertySources().addAfter(
                    StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                    new MapPropertySource(PROPERTY_SOURCE_NAME, envProperties)
            );
        } else {
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, envProperties));
        }

        log.info("Registered {} local environment properties from .env into Spring Environment", envProperties.size());
    }

    @Override
    public int getOrder() {
        // Run after SystemEnvironmentPropertySource is registered
        return Ordered.LOWEST_PRECEDENCE - 100;
    }
}
