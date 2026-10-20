package com.caresync;

import com.caresync.config.DotenvLoader;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class DotenvLoaderTests {

    @Test
    @DisplayName("DotenvLoader locates and loads variables from existing local .env file")
    void testDotenvLoader_loadsExistingFile() {
        Path resolved = DotenvLoader.resolveEnvPath();
        assertNotNull(resolved, "DotenvLoader should resolve the local .env path");
        assertTrue(Files.exists(resolved), "Resolved .env file should exist on disk");

        Map<String, Object> props = DotenvLoader.load();
        assertFalse(props.isEmpty(), "Loaded properties map should not be empty");
        assertTrue(props.containsKey("GOOGLE_PLACES_API_KEY"), "Should contain GOOGLE_PLACES_API_KEY key");
        assertTrue(props.containsKey("GOOGLE_PLACES_ENABLED"), "Should contain GOOGLE_PLACES_ENABLED key");

        assertEquals("true", props.get("GOOGLE_PLACES_ENABLED").toString(),
                "GOOGLE_PLACES_ENABLED should be parsed as 'true'");
        assertFalse(props.get("GOOGLE_PLACES_API_KEY").toString().isBlank(),
                "GOOGLE_PLACES_API_KEY value should be present");
    }

    @Test
    @DisplayName("DotenvLoader correctly handles comments, quotes, and whitespace in temporary file")
    void testDotenvLoader_parsesComplexEnvFile() throws IOException {
        Path tempFile = Files.createTempFile("test-dotenv", ".env");
        try {
            String content = """
                    # Database settings comment
                    DB_PORT=5432
                    // Another comment style
                    
                    export API_KEY="my-secret-key-123"
                    FEATURE_FLAG='true'
                    UNQUOTED_VAL=unquoted_value
                    EMPTY_VAL=
                    # End of file
                    """;
            Files.writeString(tempFile, content);

            System.setProperty("dotenv.file", tempFile.toAbsolutePath().toString());
            Map<String, Object> parsed = DotenvLoader.load();

            assertEquals("5432", parsed.get("DB_PORT"));
            assertEquals("my-secret-key-123", parsed.get("API_KEY"));
            assertEquals("true", parsed.get("FEATURE_FLAG"));
            assertEquals("unquoted_value", parsed.get("UNQUOTED_VAL"));
            assertFalse(parsed.containsKey("# Database settings comment"));
            assertFalse(parsed.containsKey("// Another comment style"));
        } finally {
            System.clearProperty("dotenv.file");
            Files.deleteIfExists(tempFile);
        }
    }
}
