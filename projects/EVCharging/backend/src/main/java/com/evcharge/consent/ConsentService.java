package com.evcharge.consent;

import java.time.Clock;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsentService {

    private final ConsentRecordRepository consents;
    private final AuditEntryRepository audit;
    private final Clock clock;

    public ConsentService(ConsentRecordRepository consents, AuditEntryRepository audit, Clock clock) {
        this.consents = consents;
        this.audit = audit;
        this.clock = clock;
    }

    /** Stores the consent and an audit entry together, or neither. */
    @Transactional
    public void record(UUID customerId, String consentType, String version) {
        var now = clock.instant();
        consents.save(new ConsentRecord(customerId, consentType, version, now));
        audit.save(new AuditEntry("customer:" + customerId, "CONSENT_ACCEPTED", consentType + ":" + version, now));
    }
}
