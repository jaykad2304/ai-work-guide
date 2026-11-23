package com.evcharge.db;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers
class MigrationTest {

    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    /** Expected tables and their primary-key columns (in order). */
    private static final Map<String, List<String>> EXPECTED = Map.of(
            "customer", List.of("id"),
            "otp_challenge", List.of("id"),
            "consent_record", List.of("id"),
            "audit_log", List.of("id"),
            "client_config_snapshot", List.of("client_id", "version"));

    private Connection connect() throws Exception {
        return DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }

    @Test
    void migrationCreatesBaseTablesWithPrimaryKeys() throws Exception {
        Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .load()
                .migrate();

        try (Connection c = connect()) {
            for (var entry : EXPECTED.entrySet()) {
                assertTrue(tableExists(c, entry.getKey()), "missing table " + entry.getKey());
                assertEquals(entry.getValue(), primaryKeyColumns(c, entry.getKey()),
                        "primary key of " + entry.getKey());
            }
        }
    }

    @Test
    void customerPhoneIsUnique() throws Exception {
        Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .load()
                .migrate();

        try (Connection c = connect();
             PreparedStatement insert = c.prepareStatement(
                     "INSERT INTO customer (id, phone_e164, display_name, status, created_at) "
                             + "VALUES (gen_random_uuid(), ?, 'Test', 'ACTIVE', now())")) {
            insert.setString(1, "+919876543210");
            insert.executeUpdate();
            insert.setString(1, "+919876543210");
            var ex = org.junit.jupiter.api.Assertions.assertThrows(java.sql.SQLException.class, insert::executeUpdate);
            assertTrue(ex.getMessage().contains("duplicate key"), ex.getMessage());
        }
    }

    private static boolean tableExists(Connection c, String table) throws Exception {
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private static List<String> primaryKeyColumns(Connection c, String table) throws Exception {
        List<String> cols = new ArrayList<>();
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT kcu.column_name FROM information_schema.table_constraints tc "
                        + "JOIN information_schema.key_column_usage kcu "
                        + "ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema "
                        + "WHERE tc.table_schema = 'public' AND tc.table_name = ? AND tc.constraint_type = 'PRIMARY KEY' "
                        + "ORDER BY kcu.ordinal_position")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    cols.add(rs.getString(1));
                }
            }
        }
        return cols;
    }
}
