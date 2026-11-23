package com.evcharge.auth;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Production SMS through MSG91 (cheapest option for India; see the cost plan).
 * Endpoint, sender ID and DLT template ID come from configuration, so the provider
 * can be swapped by adding another SmsSender and changing the profile.
 * Indian SMS needs a DLT-approved template; the message text must match it.
 */
@Component
@Profile("prod")
public class Msg91SmsSender implements SmsSender {

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final String baseUrl;
    private final String authKey;
    private final String senderId;
    private final String dltTemplateId;

    public Msg91SmsSender(@Value("${evc.sms.msg91.base-url:https://api.msg91.com/api/sendhttp.php}") String baseUrl,
                          @Value("${SMS_API_KEY:}") String authKey,
                          @Value("${MSG91_SENDER_ID:}") String senderId,
                          @Value("${MSG91_DLT_TEMPLATE_ID:}") String dltTemplateId) {
        if (authKey == null || authKey.isBlank()) {
            throw new IllegalStateException("SMS_API_KEY is not set");
        }
        this.baseUrl = baseUrl;
        this.authKey = authKey;
        this.senderId = senderId;
        this.dltTemplateId = dltTemplateId;
    }

    @Override
    public void send(PhoneNumber to, String text) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("mobiles", to.e164().substring(1)); // MSG91 takes digits without the leading +
        params.put("message", text);
        params.put("sender", senderId);
        params.put("route", "4");
        params.put("DLT_TE_ID", dltTemplateId);

        String query = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "?" + query))
                .header("authkey", authKey)
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();
        try {
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 || response.body().contains("\"type\":\"error\"")) {
                throw new SmsSendException("SMS provider rejected the message (HTTP " + response.statusCode() + ")", null);
            }
        } catch (IOException e) {
            throw new SmsSendException("SMS provider unreachable", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SmsSendException("SMS send interrupted", e);
        }
    }
}
