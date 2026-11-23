package com.evcharge.auth;

public class OtpException extends RuntimeException {

    public enum Reason { WRONG_CODE, EXPIRED, TOO_MANY_ATTEMPTS }

    private final Reason reason;

    public OtpException(Reason reason) {
        super(reason.name());
        this.reason = reason;
    }

    public Reason reason() {
        return reason;
    }
}
