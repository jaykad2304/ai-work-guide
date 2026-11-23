package com.evcharge.auth;

/** The SMS provider failed. The caller should tell the user to try again. */
public class SmsSendException extends RuntimeException {
    public SmsSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
