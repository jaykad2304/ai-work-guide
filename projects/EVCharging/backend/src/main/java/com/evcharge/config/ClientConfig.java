package com.evcharge.config;

import java.math.BigDecimal;
import java.util.List;

/** One client's branding, region, payment and feature settings. Loaded from clients/<id>.json. */
public record ClientConfig(
        String clientId,
        String displayName,
        String mark,
        String primaryColor,
        String accentColor,
        List<String> languages,
        String defaultLanguage,
        String country,
        String currency,
        BigDecimal gstRate,
        String gatewayName,
        Features features,
        String supportEmail) {

    public record Features(boolean wallet, boolean reservations, boolean faults) {}
}
