-- Base schema v1: customers, phone-OTP challenges, consent, audit log, client config snapshots.

CREATE TABLE customer (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_e164      VARCHAR(16)  NOT NULL UNIQUE,
    display_name    VARCHAR(120),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE otp_challenge (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_e164      VARCHAR(16)  NOT NULL,
    code_hash       VARCHAR(128) NOT NULL,
    attempts        INTEGER      NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    expires_at      TIMESTAMPTZ  NOT NULL,
    consumed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_challenge_phone_created ON otp_challenge (phone_e164, created_at);

CREATE TABLE consent_record (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID         NOT NULL REFERENCES customer (id),
    consent_type    VARCHAR(40)  NOT NULL,
    version         VARCHAR(20)  NOT NULL,
    accepted_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_consent_customer ON consent_record (customer_id);

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor           VARCHAR(120) NOT NULL,
    action          VARCHAR(80)  NOT NULL,
    object_ref      VARCHAR(160),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    details         JSONB
);
CREATE INDEX idx_audit_log_created ON audit_log (created_at);

CREATE TABLE client_config_snapshot (
    client_id       VARCHAR(60)  NOT NULL,
    version         INTEGER      NOT NULL,
    config          JSONB        NOT NULL,
    loaded_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (client_id, version)
);
