package com.evcharge.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import com.evcharge.config.ClientConfig;
import com.evcharge.config.ClientConfigController;
import com.evcharge.config.ClientConfigLoader;
import com.evcharge.web.HealthController;
import com.evcharge.session.SessionService;
import com.evcharge.session.TokenService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(controllers = {HealthController.class, ClientConfigController.class})
@Import(SecurityConfig.class)
class PublicEndpointsTest {

    @TestConfiguration
    static class Beans {
        @Bean
        ClientConfig clientConfig() {
            return new ClientConfigLoader().load(Path.of("../clients/client-a.json"));
        }
    }

    @MockitoBean
    TokenService tokenService;

    @MockitoBean
    SessionService sessionService;

    @Autowired
    MockMvc mvc;

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk());
    }

    @Test
    void clientConfigIsPublic() throws Exception {
        mvc.perform(get("/api/config")).andExpect(status().isOk());
    }

    @Test
    void unknownEndpointRequiresLogin() throws Exception {
        mvc.perform(get("/api/anything-private")).andExpect(status().isUnauthorized());
    }
}
