package com.evcharge.consent;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_log")
public class AuditEntry {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String actor;

    @Column(nullable = false)
    private String action;

    @Column(name = "object_ref")
    private String objectRef;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AuditEntry() {}

    public AuditEntry(String actor, String action, String objectRef, Instant createdAt) {
        this.id = UUID.randomUUID();
        this.actor = actor;
        this.action = action;
        this.objectRef = objectRef;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getAction() { return action; }
}
