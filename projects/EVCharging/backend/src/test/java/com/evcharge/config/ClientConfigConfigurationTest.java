package com.evcharge.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class ClientConfigConfigurationTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(ClientConfigConfiguration.class)
            .withPropertyValues("evc.clients-dir=../clients");

    @Test
    void startupFailsWhenClientIdIsNotSet() {
        runner.run(ctx -> assertThat(ctx).hasFailed());
        runner.run(ctx -> assertThat(ctx.getStartupFailure()).rootCause()
                .hasMessageContaining("EVC_CLIENT_ID is not set"));
    }

    @Test
    void startupFailsWhenClientFileIsMissing() {
        runner.withPropertyValues("EVC_CLIENT_ID=no-such-client").run(ctx -> {
            assertThat(ctx).hasFailed();
            assertThat(ctx.getStartupFailure()).rootCause()
                    .hasMessageContaining("no-such-client");
        });
    }

    @Test
    void loadsActiveClientWhenIdIsSet() {
        runner.withPropertyValues("EVC_CLIENT_ID=client-a").run(ctx -> {
            assertThat(ctx).hasNotFailed();
            assertThat(ctx.getBean(ClientConfig.class).displayName()).isEqualTo("Client A EV");
        });
    }

    @Test
    void rejectsClientIdWithPathCharacters() {
        runner.withPropertyValues("EVC_CLIENT_ID=../secrets").run(ctx -> {
            assertThat(ctx).hasFailed();
            assertThat(ctx.getStartupFailure()).rootCause()
                    .hasMessageContaining("lowercase letters, digits and hyphens");
        });
    }
}
