package com.evcharge.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class PhoneNumberTest {

    @Test
    void parsesNumberWithCountryCodeAndSpaces() {
        assertEquals("+919876543210", PhoneNumber.parse("+91 98765 43210", "IN").e164());
    }

    @Test
    void parsesNationalNumberUsingDefaultCountry() {
        assertEquals("+919876543210", PhoneNumber.parse("98765 43210", "IN").e164());
    }

    @Test
    void rejectsNineDigitIndianNumber() {
        assertThrows(InvalidPhoneException.class, () -> PhoneNumber.parse("98765 4321", "IN"));
    }

    @Test
    void rejectsEmptyInput() {
        assertThrows(InvalidPhoneException.class, () -> PhoneNumber.parse("  ", "IN"));
    }
}
