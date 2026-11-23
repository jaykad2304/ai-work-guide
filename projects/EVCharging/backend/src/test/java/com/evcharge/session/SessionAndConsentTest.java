package com.evcharge.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.evcharge.TestcontainersConfiguration;
import com.evcharge.auth.FakeSmsSender;
import com.evcharge.auth.OtpFlowTest;

@SpringBootTest(properties = {"EVC_CLIENT_ID=client-a", "EVC_JWT_SECRET=test-only-signing-secret-at-least-32-bytes-long"})
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, OtpFlowTest.Clocks.class})
class SessionAndConsentTest {

    private static final String PHONE = "+919876543210";
    private static final Pattern CODE = Pattern.compile("(\\d{6})");

    @Autowired MockMvc mvc;
    @Autowired FakeSmsSender sms;
    @Autowired JdbcTemplate jdbc;
    @Autowired OtpFlowTest.MutableClock clock;

    @BeforeEach
    void reset() {
        jdbc.execute("TRUNCATE audit_log, consent_record, auth_session, otp_challenge, customer CASCADE");
        sms.clear();
        clock.advance(Duration.ofMinutes(60));
    }

    /** Logs in through the real OTP flow and returns the bearer token. */
    private String login() throws Exception {
        mvc.perform(post("/api/auth/otp/request").contentType("application/json")
                .content("{\"phone\":\"" + PHONE + "\"}")).andExpect(status().isAccepted());
        Matcher m = CODE.matcher(sms.last().text());
        assertThat(m.find()).isTrue();
        MvcResult r = mvc.perform(post("/api/auth/otp/verify").contentType("application/json")
                .content("{\"phone\":\"" + PHONE + "\",\"code\":\"" + m.group(1) + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn();
        return com.jayway.jsonpath.JsonPath.read(r.getResponse().getContentAsString(), "$.token");
    }

    private static final String CONSENT = "{\"consentType\":\"TERMS\",\"version\":\"1\"}";

    @Test
    void validTokenCanRecordConsentAndWritesAuditEntry() throws Exception {
        String token = login();
        mvc.perform(post("/api/consent").header("Authorization", "Bearer " + token)
                .contentType("application/json").content(CONSENT))
                .andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM consent_record", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_log WHERE action = 'CONSENT_ACCEPTED'",
                Integer.class)).isEqualTo(1);
    }

    @Test
    void consentWithoutTokenIsUnauthorized() throws Exception {
        mvc.perform(post("/api/consent").contentType("application/json").content(CONSENT))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesTheToken() throws Exception {
        String token = login();
        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/consent").header("Authorization", "Bearer " + token)
                .contentType("application/json").content(CONSENT))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownConsentTypeIsBadRequest() throws Exception {
        String token = login();
        mvc.perform(post("/api/consent").header("Authorization", "Bearer " + token)
                .contentType("application/json").content("{\"consentType\":\"SHOPPING\",\"version\":\"1\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void expiredTokenIsUnauthorized() throws Exception {
        String token = login();
        clock.advance(Duration.ofDays(7).plusMinutes(1));
        mvc.perform(post("/api/consent").header("Authorization", "Bearer " + token)
                .contentType("application/json").content(CONSENT))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tamperedTokenIsUnauthorized() throws Exception {
        String token = login();
        // Change a character in the middle of the signature. The last base64 character can carry
        // unused bits, so changing it might leave the signature bytes identical.
        int i = token.length() - 10;
        char c = token.charAt(i);
        String tampered = token.substring(0, i) + (c == 'A' ? 'B' : 'A') + token.substring(i + 1);
        mvc.perform(post("/api/consent").header("Authorization", "Bearer " + tampered)
                .contentType("application/json").content(CONSENT))
                .andExpect(status().isUnauthorized());
    }
}
