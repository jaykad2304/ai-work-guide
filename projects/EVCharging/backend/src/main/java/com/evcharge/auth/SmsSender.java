package com.evcharge.auth;

/** Sends a text message to a phone number. Implementations: FakeSmsSender (local, tests), MSG91 (prod, Task 8). */
public interface SmsSender {
    void send(PhoneNumber to, String text);
}
