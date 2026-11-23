package com.evcharge.auth;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customer")
public class Customer {

    @Id
    private UUID id;

    @Column(name = "phone_e164", nullable = false, unique = true)
    private String phoneE164;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Customer() {}

    public Customer(String phoneE164, Instant createdAt) {
        this.id = UUID.randomUUID();
        this.phoneE164 = phoneE164;
        this.status = "ACTIVE";
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getPhoneE164() { return phoneE164; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
