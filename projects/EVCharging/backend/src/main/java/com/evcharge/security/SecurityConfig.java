package com.evcharge.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.evcharge.session.SessionService;
import com.evcharge.session.TokenAuthenticationFilter;
import com.evcharge.session.TokenService;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

/**
 * Public endpoints are listed here explicitly. Everything else needs a valid token.
 * The API is stateless: no session cookies, no CSRF token (the apps send bearer tokens).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, TokenService tokens, SessionService sessions) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(new TokenAuthenticationFilter(tokens, sessions),
                        UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health", "/api/config", "/api/auth/otp/**").permitAll()
                        .anyRequest().authenticated());
        return http.build();
    }
}
