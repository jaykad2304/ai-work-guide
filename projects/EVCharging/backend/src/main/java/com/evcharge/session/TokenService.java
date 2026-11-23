package com.evcharge.session;

import static java.nio.charset.StandardCharsets.UTF_8;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** Issues and checks signed login tokens (HS256). The token id ("jti") is the session id. */
@Service
public class TokenService {

    public static final Duration TTL = Duration.ofDays(7);

    public record IssuedToken(String token, UUID sessionId, Instant expiresAt) {}

    private final SecretKey key;
    private final Clock clock;

    public TokenService(@Value("${EVC_JWT_SECRET:}") String secret, Clock clock) {
        byte[] bytes = secret == null ? new byte[0] : secret.getBytes(UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("EVC_JWT_SECRET must be set and at least 32 bytes long");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.clock = clock;
    }

    public IssuedToken issue(UUID customerId) {
        UUID sessionId = UUID.randomUUID();
        Instant now = clock.instant();
        Instant expiresAt = now.plus(TTL);
        String token = Jwts.builder()
                .id(sessionId.toString())
                .subject(customerId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(key)
                .compact();
        return new IssuedToken(token, sessionId, expiresAt);
    }

    /** Throws a JwtException if the signature is wrong or the token has expired. */
    public Claims parse(String token) {
        return Jwts.parser()
                .clock(() -> Date.from(clock.instant()))
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
