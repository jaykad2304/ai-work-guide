package com.evcharge.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfiguration {

    /** All time-dependent rules (code expiry, rate limits) read this clock, so tests can move time. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
