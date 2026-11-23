package com.evcharge.config;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/** Reads one client file and checks every field before the app uses it. */
public class ClientConfigLoader {

    static final Set<String> SUPPORTED_LANGUAGES = Set.of("en", "hi", "mr");
    private static final BigDecimal MAX_GST_RATE = new BigDecimal("0.5");

    private final ObjectMapper mapper = JsonMapper.builder().build();

    public ClientConfig load(Path file) {
        ClientConfig c;
        try {
            c = mapper.readValue(file.toFile(), ClientConfig.class);
        } catch (RuntimeException e) {
            throw new InvalidClientConfigException("file", "cannot read " + file + ": " + e.getMessage());
        }
        validate(c);
        return c;
    }

    private void validate(ClientConfig c) {
        required(c.clientId(), "clientId");
        required(c.displayName(), "displayName");
        required(c.mark(), "mark");
        required(c.primaryColor(), "primaryColor");
        required(c.accentColor(), "accentColor");
        required(c.defaultLanguage(), "defaultLanguage");
        required(c.country(), "country");
        required(c.currency(), "currency");
        required(c.gatewayName(), "gatewayName");
        required(c.supportEmail(), "supportEmail");

        if (c.languages() == null || c.languages().isEmpty()) {
            throw new InvalidClientConfigException("languages", "at least one language is required");
        }
        for (String lang : c.languages()) {
            if (!SUPPORTED_LANGUAGES.contains(lang)) {
                throw new InvalidClientConfigException("languages",
                        "'" + lang + "' is not supported (allowed: " + SUPPORTED_LANGUAGES + ")");
            }
        }
        if (!c.languages().contains(c.defaultLanguage())) {
            throw new InvalidClientConfigException("defaultLanguage",
                    "'" + c.defaultLanguage() + "' must be one of languages " + c.languages());
        }
        if (c.gstRate() == null || c.gstRate().signum() < 0 || c.gstRate().compareTo(MAX_GST_RATE) > 0) {
            throw new InvalidClientConfigException("gstRate", "must be between 0 and 0.5, got " + c.gstRate());
        }
        if (c.features() == null) {
            throw new InvalidClientConfigException("features", "is required");
        }
    }

    private static void required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidClientConfigException(field, "is required");
        }
    }
}
