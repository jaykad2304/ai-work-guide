package com.evcharge.config;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Loads the one client this server serves. Startup fails if the client is not configured. */
@Configuration
public class ClientConfigConfiguration {

    @Bean
    ClientConfig activeClientConfig(@Value("${EVC_CLIENT_ID:}") String clientId,
                                    @Value("${evc.clients-dir:../clients}") String clientsDir) {
        return resolve(clientId, Path.of(clientsDir), new ClientConfigLoader());
    }

    static ClientConfig resolve(String clientId, Path dir, ClientConfigLoader loader) {
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException("EVC_CLIENT_ID is not set. Set it to a client id such as client-a.");
        }
        if (!clientId.matches("[a-z0-9-]+")) {
            throw new IllegalStateException(
                    "EVC_CLIENT_ID must contain only lowercase letters, digits and hyphens, got '" + clientId + "'");
        }
        Path file = dir.resolve(clientId + ".json");
        if (!Files.exists(file)) {
            throw new IllegalStateException(
                    "No client file for EVC_CLIENT_ID='" + clientId + "' at " + file.toAbsolutePath());
        }
        return loader.load(file);
    }
}
