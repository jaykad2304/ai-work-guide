package com.evcharge.session;

import java.util.UUID;

/** The logged-in caller, taken from a valid, unrevoked token. */
public record AuthenticatedCustomer(UUID customerId, UUID sessionId) {}
