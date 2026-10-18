package com.caresync;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "GOOGLE_CLIENT_ID=test-google-client-id-12345.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET=test-google-client-secret-abcde12345"
})
@Transactional
public class OAuth2ConfiguredClientIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JavaMailSender javaMailSender;

    @Test
    @DisplayName("When Google credentials configured, /oauth2/authorization/google redirects to Google accounts endpoint")
    void testOAuth2Authorization_whenConfigured_redirectsToGoogleAccounts() throws Exception {
        mockMvc.perform(get("/oauth2/authorization/google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", containsString("accounts.google.com/o/oauth2/v2/auth")))
                .andExpect(header().string("Location", containsString("client_id=test-google-client-id-12345.apps.googleusercontent.com")));
    }
}
