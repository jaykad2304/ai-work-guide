package com.evcharge.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = AuthController.class)
public class AuthExceptionHandler {

    @ExceptionHandler(InvalidPhoneException.class)
    ResponseEntity<Map<String, Object>> invalidPhone(InvalidPhoneException e) {
        return ResponseEntity.badRequest().body(Map.of("reason", "INVALID_PHONE", "message", e.getMessage()));
    }

    @ExceptionHandler(RateLimitedException.class)
    ResponseEntity<Map<String, Object>> rateLimited(RateLimitedException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("reason", "RATE_LIMITED", "retryAfterSeconds", e.retryAfterSeconds()));
    }

    @ExceptionHandler(OtpException.class)
    ResponseEntity<Map<String, Object>> otp(OtpException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("reason", e.reason().name()));
    }

    @ExceptionHandler(SmsSendException.class)
    ResponseEntity<Map<String, Object>> sms(SmsSendException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("reason", "SMS_UNAVAILABLE", "message", "Could not send the code. Please try again."));
    }
}
