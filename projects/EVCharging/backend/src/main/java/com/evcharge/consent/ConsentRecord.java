package com.evcharge.consent;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "consent_record")
public class ConsentRecord {

    @Id
    private UUID id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "consent_type", nullable = false)
    private String consentType;

    @Column(nullable = false)
    private String version;

    @Column(name = "accepted_at", nullable = false)
    private Instant acceptedAt;

    protected ConsentRecord() {}

    public ConsentRecord(UUID customerId, String consentType, String version, Instant acceptedAt) {
        this.id = UUID.randomUUID();
        this.customerId = customerId;
        this.consentType = consentType;
        this.version = version;
        this.acceptedAt = acceptedAt;
    }

    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public String getConsentType() { return consentType; }
    public String getVersion() { return version; }
}
