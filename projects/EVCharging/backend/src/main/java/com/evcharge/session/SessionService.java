package com.evcharge.session;

import java.time.Clock;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {

    private final AuthSessionRepository sessions;
    private final TokenService tokens;
    private final Clock clock;

    public SessionService(AuthSessionRepository sessions, TokenService tokens, Clock clock) {
        this.sessions = sessions;
        this.tokens = tokens;
        this.clock = clock;
    }

    @Transactional
    public TokenService.IssuedToken start(UUID customerId) {
        TokenService.IssuedToken issued = tokens.issue(customerId);
        sessions.save(new AuthSession(issued.sessionId(), customerId, clock.instant(), issued.expiresAt()));
        return issued;
    }

    @Transactional
    public void revoke(UUID sessionId) {
        sessions.findById(sessionId).ifPresent(s -> s.revoke(clock.instant()));
    }

    @Transactional(readOnly = true)
    public boolean isActive(UUID sessionId) {
        return sessions.findById(sessionId).map(s -> s.isActive(clock.instant())).orElse(false);
    }
}
