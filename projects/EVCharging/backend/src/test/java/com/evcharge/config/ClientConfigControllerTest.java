package com.evcharge.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ClientConfigControllerTest {

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(
            new ClientConfigController(new ClientConfigLoader().load(Path.of("../clients/client-a.json")))).build();

    @Test
    void returnsPublicSettingsOfActiveClient() throws Exception {
        String body = mvc.perform(get("/api/config")).andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("\"displayName\":\"Client A EV\""), body);
        assertTrue(body.contains("\"languages\":[\"en\",\"hi\",\"mr\"]"), body);
    }

    @Test
    void doesNotExposeGatewayName() throws Exception {
        String body = mvc.perform(get("/api/config")).andReturn().getResponse().getContentAsString();
        assertFalse(body.contains("gatewayName"), body);
        assertFalse(body.contains("Razorpay"), body);
    }
}
