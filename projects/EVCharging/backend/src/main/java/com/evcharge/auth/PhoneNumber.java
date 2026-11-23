package com.evcharge.auth;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberFormat;

/** A validated phone number in E.164 form, for example +919876543210. */
public record PhoneNumber(String e164) {

    public static PhoneNumber parse(String raw, String defaultRegion) {
        if (raw == null || raw.isBlank()) {
            throw new InvalidPhoneException("Phone number is required");
        }
        PhoneNumberUtil util = PhoneNumberUtil.getInstance();
        try {
            var parsed = util.parse(raw, defaultRegion);
            if (!util.isValidNumber(parsed)) {
                throw new InvalidPhoneException("Phone number is not valid for " + defaultRegion);
            }
            return new PhoneNumber(util.format(parsed, PhoneNumberFormat.E164));
        } catch (NumberParseException e) {
            throw new InvalidPhoneException("Phone number could not be read");
        }
    }
}
