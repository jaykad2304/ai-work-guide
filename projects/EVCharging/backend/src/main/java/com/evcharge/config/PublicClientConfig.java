package com.evcharge.config;

import java.math.BigDecimal;
import java.util.List;

/** The part of a client's configuration that the apps may see. Internal fields such as the gateway name are left out. */
public record PublicClientConfig(
        String clientId,
        String displayName,
        String mark,
        String primaryColor,
        String accentColor,
        List<String> languages,
        String defaultLanguage,
        String currency,
        BigDecimal gstRate,
        ClientConfig.Features features,
        String supportEmail) {

    public static PublicClientConfig from(ClientConfig c) {
        return new PublicClientConfig(c.clientId(), c.displayName(), c.mark(), c.primaryColor(), c.accentColor(),
                c.languages(), c.defaultLanguage(), c.currency(), c.gstRate(), c.features(), c.supportEmail());
    }
}
