package com.evcharge.web;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class HealthEndpointTest {

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new HealthController()).build();

    @Test
    void healthReturnsUp() throws Exception {
        var result = mvc.perform(get("/api/health")).andReturn().getResponse();
        assertEquals(200, result.getStatus());
        assertEquals("{\"status\":\"UP\"}", result.getContentAsString());
    }
}
