package com.evcharge.config;

/** Thrown when a client configuration file is missing a field or has an invalid value. */
public class InvalidClientConfigException extends RuntimeException {

    private final String field;

    public InvalidClientConfigException(String field, String message) {
        super("Invalid client config, field '" + field + "': " + message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
