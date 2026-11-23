package com.evcharge.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;

import com.evcharge.session.SessionService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    public record PhoneRequest(String phone) {}
    public record VerifyRequest(String phone, String code) {}

    private final OtpService otp;
    private final SessionService sessions;

    public AuthController(OtpService otp, SessionService sessions) {
        this.otp = otp;
        this.sessions = sessions;
    }

    @PostMapping("/api/auth/otp/request")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void request(@RequestBody PhoneRequest body) {
        otp.request(body.phone());
    }

    @PostMapping("/api/auth/otp/verify")
    public Map<String, Object> verify(@RequestBody VerifyRequest body) {
        var result = otp.verify(body.phone(), body.code());
        var issued = sessions.start(result.customerId());
        return Map.of("customerId", result.customerId().toString(),
                "token", issued.token(),
                "expiresAt", issued.expiresAt().toString());
    }
}
