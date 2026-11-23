package com.evcharge.session;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Reads "Authorization: Bearer <token>". A bad or revoked token just leaves the caller anonymous. */
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenService tokens;
    private final SessionService sessions;

    public TokenAuthenticationFilter(TokenService tokens, SessionService sessions) {
        this.tokens = tokens;
        this.sessions = sessions;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                var claims = tokens.parse(header.substring(7));
                UUID sessionId = UUID.fromString(claims.getId());
                if (sessions.isActive(sessionId)) {
                    var principal = new AuthenticatedCustomer(UUID.fromString(claims.getSubject()), sessionId);
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(principal, null, List.of()));
                }
            } catch (JwtException | IllegalArgumentException e) {
                // invalid token: stay anonymous; protected endpoints will answer 401
            }
        }
        chain.doFilter(request, response);
    }
}
