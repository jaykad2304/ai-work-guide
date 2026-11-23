package com.evcharge.auth;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Records messages instead of sending them. Used in tests and the local profile. */
@Component
@Profile("!prod")
public class FakeSmsSender implements SmsSender {

    private static final Logger log = LoggerFactory.getLogger(FakeSmsSender.class);

    public record SentSms(String to, String text) {}

    private final List<SentSms> sent = new ArrayList<>();
    private boolean failNext;

    @Override
    public synchronized void send(PhoneNumber to, String text) {
        if (failNext) {
            failNext = false;
            throw new SmsSendException("fake provider failure", null);
        }
        sent.add(new SentSms(to.e164(), text));
        // Local development only: nothing is really sent, so print the message to the console.
        log.info("FAKE SMS to {}: {}", to.e164(), text);
    }

    public synchronized SentSms last() {
        return sent.get(sent.size() - 1);
    }

    public synchronized int sentCount() {
        return sent.size();
    }

    public synchronized void clear() {
        sent.clear();
        failNext = false;
    }

    public synchronized void failNextSend() {
        failNext = true;
    }
}
