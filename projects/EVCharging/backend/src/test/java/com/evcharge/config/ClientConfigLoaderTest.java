package com.evcharge.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ClientConfigLoaderTest {

    private static final String VALID = """
        {
          "clientId": "test-client",
          "displayName": "Test Client EV",
          "mark": "T",
          "primaryColor": "#0a6cff",
          "accentColor": "#14a86b",
          "languages": ["en", "hi", "mr"],
          "defaultLanguage": "en",
          "country": "IN",
          "currency": "INR",
          "gstRate": 0.18,
          "gatewayName": "Razorpay",
          "features": {"wallet": true, "reservations": true, "faults": true},
          "supportEmail": "help@example.com"
        }
        """;

    private final ClientConfigLoader loader = new ClientConfigLoader();

    @TempDir
    Path dir;

    private Path write(String json) throws Exception {
        Path f = dir.resolve("client.json");
        Files.writeString(f, json);
        return f;
    }

    @Test
    void loadsSampleClientA() {
        ClientConfig c = loader.load(Path.of("../clients/client-a.json"));
        assertEquals("client-a", c.clientId());
        assertEquals("Client A EV", c.displayName());
        assertEquals(List.of("en", "hi", "mr"), c.languages());
        assertEquals(new BigDecimal("0.18"), c.gstRate());
        assertTrue(c.features().wallet());
    }

    @Test
    void loadsValidConfig() throws Exception {
        ClientConfig c = loader.load(write(VALID));
        assertEquals("Test Client EV", c.displayName());
        assertEquals("INR", c.currency());
    }

    @Test
    void missingDisplayNameIsNamedInError() throws Exception {
        Path f = write(VALID.replace("\"displayName\": \"Test Client EV\",", ""));
        var ex = assertThrows(InvalidClientConfigException.class, () -> loader.load(f));
        assertTrue(ex.getMessage().contains("displayName"), ex.getMessage());
    }

    @Test
    void unsupportedLanguageIsRejected() throws Exception {
        Path f = write(VALID.replace("[\"en\", \"hi\", \"mr\"]", "[\"en\", \"fr\"]"));
        var ex = assertThrows(InvalidClientConfigException.class, () -> loader.load(f));
        assertTrue(ex.getMessage().contains("languages"), ex.getMessage());
    }

    @Test
    void gstRateAboveHalfIsRejected() throws Exception {
        Path f = write(VALID.replace("\"gstRate\": 0.18", "\"gstRate\": 0.9"));
        var ex = assertThrows(InvalidClientConfigException.class, () -> loader.load(f));
        assertTrue(ex.getMessage().contains("gstRate"), ex.getMessage());
    }

    @Test
    void defaultLanguageMustBeEnabled() throws Exception {
        Path f = write(VALID.replace("\"defaultLanguage\": \"en\"", "\"defaultLanguage\": \"mr\"")
                .replace("[\"en\", \"hi\", \"mr\"]", "[\"en\", \"hi\"]"));
        var ex = assertThrows(InvalidClientConfigException.class, () -> loader.load(f));
        assertTrue(ex.getMessage().contains("defaultLanguage"), ex.getMessage());
    }
}
