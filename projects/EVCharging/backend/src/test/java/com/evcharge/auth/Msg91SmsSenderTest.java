package com.evcharge.auth;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

class Msg91SmsSenderTest {

    private static HttpServer server;
    private static String baseUrl;
    private static final AtomicReference<String> lastQuery = new AtomicReference<>();
    private static final AtomicReference<String> lastAuthKey = new AtomicReference<>();
    private static final AtomicInteger status = new AtomicInteger(200);
    private static final AtomicReference<String> body = new AtomicReference<>("{\"type\":\"success\"}");

    @BeforeAll
    static void startStubProvider() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/sendhttp.php", exchange -> {
            lastQuery.set(exchange.getRequestURI().getRawQuery());
            lastAuthKey.set(exchange.getRequestHeaders().getFirst("authkey"));
            byte[] out = body.get().getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status.get(), out.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(out);
            }
        });
        server.start();
        baseUrl = "http://127.0.0.1:" + server.getAddress().getPort() + "/api/sendhttp.php";
    }

    @AfterAll
    static void stopStubProvider() {
        server.stop(0);
    }

    @BeforeEach
    void reset() {
        status.set(200);
        body.set("{\"type\":\"success\"}");
    }

    private Msg91SmsSender sender() {
        return new Msg91SmsSender(baseUrl, "TEST-KEY", "EVCHRG", "1207000000000000001");
    }

    @Test
    void sendsNumberTextSenderAndDltTemplateWithKeyHeader() {
        sender().send(PhoneNumber.parse("+91 98765 43210", "IN"), "Your code is 123456");

        assertEquals("TEST-KEY", lastAuthKey.get());
        String q = lastQuery.get();
        assertTrue(q.contains("mobiles=919876543210"), q);
        assertTrue(q.contains("sender=EVCHRG"), q);
        assertTrue(q.contains("DLT_TE_ID=1207000000000000001"), q);
        assertTrue(q.contains("message=Your+code+is+123456"), q);
    }

    @Test
    void httpErrorRaisesSmsSendException() {
        status.set(500);
        body.set("server error");
        assertThrows(SmsSendException.class,
                () -> sender().send(PhoneNumber.parse("+91 98765 43210", "IN"), "x"));
    }

    @Test
    void providerErrorInsideSuccessfulResponseRaisesSmsSendException() {
        body.set("{\"type\":\"error\",\"message\":\"Template not found\"}");
        assertThrows(SmsSendException.class,
                () -> sender().send(PhoneNumber.parse("+91 98765 43210", "IN"), "x"));
    }

    @Test
    void missingApiKeyFailsFast() {
        assertThrows(IllegalStateException.class,
                () -> new Msg91SmsSender(baseUrl, "", "EVCHRG", "1207000000000000001"));
    }
}
