-- Login sessions. Each token carries the session id as its "jti" claim; logout sets revoked_at.
CREATE TABLE auth_session (
    id              UUID PRIMARY KEY,
    customer_id     UUID         NOT NULL REFERENCES customer (id),
    created_at      TIMESTAMPTZ  NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    revoked_at      TIMESTAMPTZ
);
CREATE INDEX idx_auth_session_customer ON auth_session (customer_id);
