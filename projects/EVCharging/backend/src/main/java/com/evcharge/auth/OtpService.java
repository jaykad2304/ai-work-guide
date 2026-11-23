package com.evcharge.auth;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.evcharge.auth.OtpException.Reason;

/**
 * Phone-OTP login. Rules: 6-digit code, stored as a hash only, valid 5 minutes,
 * 5 wrong attempts then locked, at most 3 requests per phone per 10 minutes,
 * and a new request replaces any open code.
 */
@Service
public class OtpService {

    static final String DEFAULT_REGION = "IN";
    static final Duration CODE_TTL = Duration.ofMinutes(5);
    static final Duration RATE_WINDOW = Duration.ofMinutes(10);
    static final int MAX_REQUESTS_PER_WINDOW = 3;
    static final int MAX_WRONG_ATTEMPTS = 5;

    public record VerifyResult(java.util.UUID customerId) {}

    private final OtpChallengeRepository challenges;
    private final CustomerRepository customers;
    private final SmsSender sms;
    private final Clock clock;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpChallengeRepository challenges, CustomerRepository customers, SmsSender sms, Clock clock) {
        this.challenges = challenges;
        this.customers = customers;
        this.sms = sms;
        this.clock = clock;
    }

    /**
     * Rolls back fully if the SMS fails, so no open code is left that the user never received.
     */
    @Transactional
    public void request(String rawPhone) {
        PhoneNumber phone = PhoneNumber.parse(rawPhone, DEFAULT_REGION);
        Instant now = clock.instant();

        List<OtpChallenge> recent = challenges.findByPhoneE164AndCreatedAtAfterOrderByCreatedAtAsc(
                phone.e164(), now.minus(RATE_WINDOW));
        if (recent.size() >= MAX_REQUESTS_PER_WINDOW) {
            Instant retryAt = recent.get(0).getCreatedAt().plus(RATE_WINDOW);
            long seconds = Math.max(1, Duration.between(now, retryAt).toSeconds());
            throw new RateLimitedException(seconds);
        }

        for (OtpChallenge open : challenges.findByPhoneE164AndConsumedAtIsNull(phone.e164())) {
            open.setConsumedAt(now);
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        challenges.save(new OtpChallenge(phone.e164(), encoder.encode(code), now.plus(CODE_TTL), now));
        sms.send(phone, "Your EV Charging code is " + code + ". It is valid for 5 minutes.");
    }

    /**
     * Wrong-code and locked results must still be saved (the attempt counter), so this
     * method does not roll back on OtpException.
     */
    @Transactional(noRollbackFor = OtpException.class)
    public VerifyResult verify(String rawPhone, String code) {
        PhoneNumber phone = PhoneNumber.parse(rawPhone, DEFAULT_REGION);
        Instant now = clock.instant();

        OtpChallenge challenge = challenges
                .findFirstByPhoneE164AndConsumedAtIsNullOrderByCreatedAtDesc(phone.e164())
                .orElseThrow(() -> new OtpException(Reason.EXPIRED));

        if (!now.isBefore(challenge.getExpiresAt())) {
            throw new OtpException(Reason.EXPIRED);
        }
        if (challenge.getAttempts() >= MAX_WRONG_ATTEMPTS) {
            throw new OtpException(Reason.TOO_MANY_ATTEMPTS);
        }
        if (!encoder.matches(code, challenge.getCodeHash())) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            throw new OtpException(Reason.WRONG_CODE);
        }

        challenge.setConsumedAt(now);
        Customer customer = customers.findByPhoneE164(phone.e164())
                .orElseGet(() -> customers.save(new Customer(phone.e164(), now)));
        return new VerifyResult(customer.getId());
    }
}
