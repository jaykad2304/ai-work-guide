package com.evcharge.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.web.servlet.MockMvc;

import com.evcharge.TestcontainersConfiguration;

@SpringBootTest(properties = {"EVC_CLIENT_ID=client-a", "EVC_JWT_SECRET=test-only-signing-secret-at-least-32-bytes-long"})
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, OtpFlowTest.Clocks.class})
public class OtpFlowTest {

    private static final String PHONE = "+91 98765 43210";

    @TestConfiguration
    public static class Clocks {
        @Bean
        @Primary
        MutableClock mutableClock() {
            return new MutableClock(Instant.parse("2026-11-23T04:00:00Z"));
        }
    }

    /** A clock whose time the test moves forward by hand. */
    public static class MutableClock extends Clock {
        private Instant now;

        public MutableClock(Instant start) {
            this.now = start;
        }

        public void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @Autowired
    OtpService otp;
    @Autowired
    FakeSmsSender sms;
    @Autowired
    OtpChallengeRepository challenges;
    @Autowired
    CustomerRepository customers;
    @Autowired
    MutableClock clock;
    @Autowired
    MockMvc mvc;
    @Autowired
    org.springframework.jdbc.core.JdbcTemplate jdbc;

    private static final Pattern CODE = Pattern.compile("(\\d{6})");

    @BeforeEach
    void reset() {
        jdbc.execute("TRUNCATE audit_log, consent_record, auth_session, otp_challenge, customer CASCADE");
        sms.clear();
        clock.advance(Duration.ofMinutes(60));
    }

    private String lastCode() {
        Matcher m = CODE.matcher(sms.last().text());
        assertThat(m.find()).isTrue();
        return m.group(1);
    }

    private static String wrongCodeFor(String right) {
        return right.equals("000000") ? "111111" : "000000";
    }

    @Test
    void wrongCodeIncrementsAttemptsAndReturnsWrongCode() {
        otp.request(PHONE);
        String right = lastCode();
        var ex = assertThatThrownBy(() -> otp.verify(PHONE, wrongCodeFor(right)))
                .isInstanceOf(OtpException.class).actual();
        assertThat(((OtpException) ex).reason()).isEqualTo(OtpException.Reason.WRONG_CODE);
        assertThat(challenges.findAll().get(0).getAttempts()).isEqualTo(1);
    }

    @Test
    void codeIsRejectedAfterFiveMinutesEvenIfCorrect() {
        otp.request(PHONE);
        String right = lastCode();
        clock.advance(Duration.ofMinutes(5).plusSeconds(1));
        assertThatThrownBy(() -> otp.verify(PHONE, right))
                .isInstanceOfSatisfying(OtpException.class,
                        e -> assertThat(e.reason()).isEqualTo(OtpException.Reason.EXPIRED));
    }

    @Test
    void sixthAttemptAfterFiveWrongOnesReturnsTooManyAttempts() {
        otp.request(PHONE);
        String right = lastCode();
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> otp.verify(PHONE, wrongCodeFor(right)))
                    .isInstanceOfSatisfying(OtpException.class,
                            e -> assertThat(e.reason()).isEqualTo(OtpException.Reason.WRONG_CODE));
        }
        assertThatThrownBy(() -> otp.verify(PHONE, wrongCodeFor(right)))
                .isInstanceOfSatisfying(OtpException.class,
                        e -> assertThat(e.reason()).isEqualTo(OtpException.Reason.TOO_MANY_ATTEMPTS));
        assertThatThrownBy(() -> otp.verify(PHONE, right))
                .isInstanceOfSatisfying(OtpException.class,
                        e -> assertThat(e.reason()).isEqualTo(OtpException.Reason.TOO_MANY_ATTEMPTS));
    }

    @Test
    void fourthRequestWithinTenMinutesIsRateLimited() {
        otp.request(PHONE);
        otp.request(PHONE);
        otp.request(PHONE);
        assertThatThrownBy(() -> otp.request(PHONE))
                .isInstanceOfSatisfying(RateLimitedException.class,
                        e -> assertThat(e.retryAfterSeconds()).isBetween(1L, 600L));
    }

    @Test
    void invalidPhoneIsRejectedBeforeAnySmsIsSent() {
        assertThatThrownBy(() -> otp.request("98765 4321"))
                .isInstanceOf(InvalidPhoneException.class);
        assertThat(sms.sentCount()).isZero();
    }

    @Test
    void smsFailureLeavesNoOpenChallenge() {
        sms.failNextSend();
        assertThatThrownBy(() -> otp.request(PHONE)).isInstanceOf(SmsSendException.class);
        assertThat(challenges.findAll()).isEmpty();
    }

    @Test
    void newRequestInvalidatesPreviousCode() {
        otp.request(PHONE);
        String first = lastCode();
        otp.request(PHONE);
        String second = lastCode();
        if (first.equals(second)) {
            return; // same random code twice is possible but rare; nothing to check
        }
        assertThatThrownBy(() -> otp.verify(PHONE, first))
                .isInstanceOfSatisfying(OtpException.class,
                        e -> assertThat(e.reason()).isEqualTo(OtpException.Reason.WRONG_CODE));
    }

    @Test
    void correctCodeCreatesCustomerAndReturnsId() {
        otp.request(PHONE);
        String right = lastCode();
        var result = otp.verify(PHONE, right);
        assertThat(result.customerId()).isNotNull();
        assertThat(customers.findByPhoneE164("+919876543210")).isPresent();
    }

    @Test
    void httpRequestReturns202ThenRateLimitReturns429WithRetryAfter() throws Exception {
        mvc.perform(post("/api/auth/otp/request").contentType("application/json")
                        .content("{\"phone\":\"+91 98765 43210\"}"))
                .andExpect(status().isAccepted());
        mvc.perform(post("/api/auth/otp/request").contentType("application/json")
                        .content("{\"phone\":\"+91 98765 43210\"}"))
                .andExpect(status().isAccepted());
        mvc.perform(post("/api/auth/otp/request").contentType("application/json")
                        .content("{\"phone\":\"+91 98765 43210\"}"))
                .andExpect(status().isAccepted());
        mvc.perform(post("/api/auth/otp/request").contentType("application/json")
                        .content("{\"phone\":\"+91 98765 43210\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.retryAfterSeconds").isNumber());
    }

    @Test
    void httpVerifyWrongCodeReturns401WithReason() throws Exception {
        otp.request(PHONE);
        String right = lastCode();
        mvc.perform(post("/api/auth/otp/verify").contentType("application/json")
                        .content("{\"phone\":\"+91 98765 43210\",\"code\":\"" + wrongCodeFor(right) + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.reason").value("WRONG_CODE"));
    }
}
