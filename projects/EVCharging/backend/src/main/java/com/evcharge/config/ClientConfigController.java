package com.evcharge.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ClientConfigController {

    private final ClientConfig config;

    public ClientConfigController(ClientConfig config) {
        this.config = config;
    }

    @GetMapping("/api/config")
    public PublicClientConfig config() {
        return PublicClientConfig.from(config);
    }
}
