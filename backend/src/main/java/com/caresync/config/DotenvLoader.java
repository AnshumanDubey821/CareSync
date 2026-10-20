package com.caresync.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Lightweight, dependency-free utility to load environment variables from a local .env file.
 * Safely sets configuration properties for local development without exposing keys to Git,
 * logs, test reports, or frontend code.
 */
public final class DotenvLoader {

    private static final Logger log = LoggerFactory.getLogger(DotenvLoader.class);

    private DotenvLoader() {
        // Prevent instantiation of utility class
    }

    /**
     * Finds and parses the .env file from standard candidate locations.
     *
     * @return an unmodifiable map of parsed key-value pairs (empty if no .env file found).
     */
    public static Map<String, Object> load() {
        Path envPath = resolveEnvPath();
        if (envPath == null || !Files.isRegularFile(envPath)) {
            log.debug("No local .env file discovered in standard candidate paths.");
            return Collections.emptyMap();
        }

        Map<String, Object> properties = new HashMap<>();
        try (BufferedReader reader = Files.newBufferedReader(envPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();

                // Ignore blank lines and comments
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("//")) {
                    continue;
                }

                // Strip optional POSIX "export " prefix
                if (line.startsWith("export ") && line.length() > 7) {
                    line = line.substring(7).trim();
                }

                int separatorIndex = line.indexOf('=');
                if (separatorIndex <= 0) {
                    continue;
                }

                String key = line.substring(0, separatorIndex).trim();
                String rawValue = line.substring(separatorIndex + 1).trim();

                // Strip enclosing single or double quotes
                String value = unquote(rawValue);

                if (!key.isEmpty()) {
                    properties.put(key, value);
                }
            }

            log.info("Loaded {} environment setting(s) from local .env at [{}] for development",
                    properties.size(), envPath.toAbsolutePath());
        } catch (IOException e) {
            log.warn("Failed to read local .env file at [{}]: {}", envPath, e.getMessage());
        }

        return Collections.unmodifiableMap(properties);
    }

    /**
     * Loads .env key-value pairs into JVM System Properties if they are not already set
     * in the host OS environment or existing System Properties.
     * This preserves OS environment variable precedence.
     */
    public static void loadSystemProperties() {
        Map<String, Object> properties = load();
        for (Map.Entry<String, Object> entry : properties.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue() != null ? entry.getValue().toString() : "";

            // OS environment variables and pre-existing system properties always take precedence
            if ((System.getenv(key) == null || System.getenv(key).isBlank()) &&
                (System.getProperty(key) == null || System.getProperty(key).isBlank())) {
                System.setProperty(key, value);
            }
        }
    }

    /**
     * Resolves the candidate path for the local .env file:
     * 1. System property 'dotenv.file' if provided
     * 2. 'backend/.env' (project root working directory)
     * 3. '.env' (backend working directory)
     * 4. '../backend/.env' (subfolder execution)
     * 5. Relative to 'user.dir'
     */
    public static Path resolveEnvPath() {
        String explicitPath = System.getProperty("dotenv.file");
        if (explicitPath != null && !explicitPath.isBlank()) {
            Path p = Paths.get(explicitPath);
            if (Files.isRegularFile(p)) {
                return p;
            }
        }

        String userDir = System.getProperty("user.dir", ".");
        Path[] candidates = new Path[] {
                Paths.get("backend", ".env"),
                Paths.get(".env"),
                Paths.get("..", "backend", ".env"),
                Paths.get(userDir, ".env"),
                Paths.get(userDir, "backend", ".env"),
                Paths.get(userDir, "..", "backend", ".env")
        };

        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) {
                return candidate.normalize();
            }
        }

        return null;
    }

    private static String unquote(String val) {
        if (val == null || val.length() < 2) {
            return val;
        }
        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
            return val.substring(1, val.length() - 1);
        }
        return val;
    }
}
