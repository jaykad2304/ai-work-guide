package com.evcharge.consent;

import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.evcharge.session.AuthenticatedCustomer;

@RestController
public class ConsentController {

    static final Set<String> CONSENT_TYPES = Set.of("TERMS", "PRIVACY", "MARKETING");

    public record ConsentRequest(String consentType, String version) {}

    private final ConsentService consents;

    public ConsentController(ConsentService consents) {
        this.consents = consents;
    }

    @PostMapping("/api/consent")
    public org.springframework.http.ResponseEntity<Void> record(@AuthenticationPrincipal AuthenticatedCustomer caller,
                                                                @RequestBody ConsentRequest body) {
        if (body.consentType() == null || !CONSENT_TYPES.contains(body.consentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "consentType must be one of " + CONSENT_TYPES);
        }
        if (body.version() == null || body.version().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "version is required");
        }
        consents.record(caller.customerId(), body.consentType(), body.version());
        return org.springframework.http.ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
