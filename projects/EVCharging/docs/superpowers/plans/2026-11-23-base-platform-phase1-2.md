# Base Platform Phase 1-2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation of the white-label EV charging base platform: repository and environments, the per-client configuration, the database schema, tenant resolution, phone-OTP login, and a customer app login flow that is branded from the client configuration.

**Architecture:** A Spring Boot modular monolith (one deployable) serves the REST API and reads one JSON configuration file per client. PostgreSQL stores tenant-scoped data. A Flutter customer app is built once per client ("flavour") and bundles that client's configuration. Each client has its own cloud project and database, so no tenant ID is needed to isolate data across clients, but the code still resolves the client from configuration to keep behaviour identical.

**Tech Stack:** Java 21 LTS, Spring Boot 4.0.x (current stable; Spring Initializr no longer offers 3.x), Spring Security, Flyway, PostgreSQL 16, Testcontainers, JUnit 5; Flutter (stable channel) with `flutter_localizations`; GitHub Actions; Docker for local Postgres.

**Spec:** `docs/superpowers/specs/2026-11-23-white-label-base-design.md`, `docs/superpowers/specs/2026-11-23-prototype-design.md`, and the draft requirements (FR-001 to FR-003 for this phase).

## Global Constraints

- Hosting region for India: `asia-south1` (Mumbai). No data stored outside India.
- No client name, logo or colour hard-coded in shared code. All branding comes from the client configuration.
- No secrets in the repository or the configuration file. Secrets come from environment variables or the cloud secret manager.
- Currency is INR. GST rate is 18%, held in configuration.
- Supported languages in code: `en`, `hi`, `mr`. A client enables a subset.
- Our brand ("Evoltsoft") must not appear in any shared code or client build.

## Review Focus

1. **Wrong or expired OTP:** a wrong code increments the attempt count, and after 5 wrong attempts the code is rejected. An expired code (older than 5 minutes) is rejected even if it is correct.
2. **OTP abuse:** more than 3 OTP requests for one phone number in 10 minutes are refused, with a clear retry time.
3. **Invalid phone number:** numbers without a valid country code, or of the wrong length for that country, are rejected before any SMS is sent.
4. **Unknown or misconfigured client:** a request that resolves to no client, or a configuration file missing a required field, fails at startup or with a clear 404, never with a default client's branding.
5. **SMS provider failure:** if the SMS provider errors, the user sees a "try again" message and no OTP record is left that could be verified with a code nobody received.

## Task 1: Repository scaffold and local environment

**Files:**
- Create: `backend/pom.xml`, `backend/src/main/java/com/evcharge/EvChargeApplication.java`, `backend/src/main/resources/application.yml`
- Create: `backend/src/test/java/com/evcharge/HealthEndpointTest.java`
- Create: `docker-compose.yml` (PostgreSQL 16 for local development)
- Create: `app/` (Flutter project, created with `flutter create --org com.evcharge customer_app`)
- Create: `.github/workflows/ci.yml`
- Create: `.gitignore`, `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `GET /api/health` returns `200` with body `{"status":"UP"}`. Local database at `localhost:5432`, database `evcharge`, user `evcharge`.

- [ ] **Step 1: Write the failing test** for `GET /api/health` returning `200` and `{"status":"UP"}` (`@SpringBootTest` with `MockMvc`).
- [ ] **Step 2: Run it and confirm it fails** (no application class yet). Run: `cd backend && ./mvnw test -Dtest=HealthEndpointTest`. Expected: compile or context failure.
- [ ] **Step 3: Create the Spring Boot application and the health controller** until the test passes.
- [ ] **Step 4: Add `docker-compose.yml`** and confirm `docker compose up -d` starts Postgres 16 and the application connects to it.
- [ ] **Step 5: Create the Flutter project** under `app/` and confirm `flutter test` runs the default test.
- [ ] **Step 6: Add the CI workflow** that runs `./mvnw verify` and `flutter test`. Expected: both jobs pass on push.
- [ ] **Step 7: Commit** with `feat: scaffold backend, customer app and CI`.

## Task 2: Client configuration model and loader

**Files:**
- Create: `backend/src/main/java/com/evcharge/config/ClientConfig.java` (record)
- Create: `backend/src/main/java/com/evcharge/config/ClientConfigLoader.java`
- Create: `clients/_template.json`, `clients/client-a.json`
- Test: `backend/src/test/java/com/evcharge/config/ClientConfigLoaderTest.java`

**Interfaces:**
- Produces: `ClientConfig` record with fields `clientId`, `displayName`, `mark`, `primaryColor`, `accentColor`, `languages` (list of `en`/`hi`/`mr`), `defaultLanguage`, `country` (ISO code), `currency`, `gstRate` (decimal, e.g. `0.18`), `gatewayName`, `features` (wallet, reservations, faults booleans), `supportEmail`.
- Produces: `ClientConfigLoader.load(Path file) -> ClientConfig`, throws `InvalidClientConfigException` with the field name in the message.

- [ ] **Step 1: Write failing tests:** a valid `client-a.json` loads all fields; a file without `displayName` throws naming `displayName`; `languages` containing `fr` throws; `gstRate` above `0.5` throws; `defaultLanguage` not in `languages` throws.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement the record and the loader** (Jackson with validation annotations) until they pass.
- [ ] **Step 4: Create `clients/_template.json`** with every field and placeholder values, and `clients/client-a.json` using the sample values from the prototype.
- [ ] **Step 5: Commit** with `feat: add client configuration model and validation`.

## Task 3: Database schema v1 with migrations

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__base_schema.sql`
- Test: `backend/src/test/java/com/evcharge/db/MigrationTest.java`

**Interfaces:**
- Produces tables: `customer` (id uuid, phone_e164 unique, display_name, status, created_at), `otp_challenge` (id, phone_e164, code_hash, attempts, expires_at, consumed_at), `consent_record` (id, customer_id, consent_type, version, accepted_at), `audit_log` (id, actor, action, object_ref, created_at, details jsonb), `client_config_snapshot` (client_id, version, config jsonb, loaded_at).

- [ ] **Step 1: Write a failing Testcontainers test** that applies migrations to an empty PostgreSQL 16 and asserts all five tables exist with the primary keys above.
- [ ] **Step 2: Run it and confirm it fails.**
- [ ] **Step 3: Write `V1__base_schema.sql`** until the test passes. Index `otp_challenge (phone_e164, created_at)`.
- [ ] **Step 4: Commit** with `feat: add base database schema`.

## Task 4: Tenant resolution from configuration

**Files:**
- Create: `backend/src/main/java/com/evcharge/config/ActiveClient.java`, `backend/src/main/java/com/evcharge/config/ClientConfigController.java`
- Test: `backend/src/test/java/com/evcharge/config/ClientConfigControllerTest.java`

**Interfaces:**
- Consumes: `ClientConfig`, `ClientConfigLoader` (Task 2).
- Produces: the server loads one client from the environment variable `EVC_CLIENT_ID` at startup. `GET /api/config` returns the public part of that client's config as JSON (no `gatewayName` secrets, no internal fields). If the variable is missing or points at no file, startup fails with a clear message.

- [ ] **Step 1: Write failing tests:** `GET /api/config` returns `displayName` and `languages` for `client-a`; a startup with a missing `EVC_CLIENT_ID` fails with the message "EVC_CLIENT_ID is not set".
- [ ] **Step 2: Run and confirm failure.**
- [ ] **Step 3: Implement `ActiveClient` and the controller** until they pass.
- [ ] **Step 4: Commit** with `feat: serve active client configuration`.

## Task 5: Phone-OTP request and verify

**Files:**
- Create: `backend/src/main/java/com/evcharge/auth/PhoneNumber.java`, `OtpService.java`, `SmsSender.java` (interface), `FakeSmsSender.java` (test and local profile), `AuthController.java`
- Test: `backend/src/test/java/com/evcharge/auth/OtpServiceTest.java`, `AuthControllerTest.java`

**Interfaces:**
- Produces: `PhoneNumber.parse(String raw, String defaultCountry) -> PhoneNumber` (E.164), throws `InvalidPhoneException`.
- Produces: `POST /api/auth/otp/request` body `{"phone":"..."}` returns `202`, or `429` with `retryAfterSeconds`. `POST /api/auth/otp/verify` body `{"phone":"...","code":"..."}` returns `200` with a token, or `401` with `reason` of `WRONG_CODE`, `EXPIRED`, `TOO_MANY_ATTEMPTS`.
- `SmsSender.send(PhoneNumber to, String text)`; the real implementation (MSG91 or equivalent) is added in Task 8 when the provider is chosen.

Rules to implement: codes are 6 digits, stored only as a hash, valid 5 minutes, maximum 5 wrong attempts, a new request invalidates the previous open code, at most 3 requests per phone per 10 minutes.

- [ ] **Step 1: Write failing tests** for each Review Focus item that belongs here: wrong code increments attempts; code rejected after 5 minutes; sixth wrong attempt returns `TOO_MANY_ATTEMPTS`; fourth request within 10 minutes returns `429`; `+91 98765 43210` and `98765 43210` both parse to `+919876543210`; a 9-digit Indian number is rejected before `SmsSender` is called; if `SmsSender` throws, no open `otp_challenge` row remains.
- [ ] **Step 2: Run and confirm failure.**
- [ ] **Step 3: Implement** the classes above until the tests pass.
- [ ] **Step 4: Commit** with `feat: phone OTP login with rate limits and attempt limits`.

## Task 6: Sessions, logout and consent recording

**Files:**
- Create: `backend/src/main/java/com/evcharge/auth/TokenService.java`, `ConsentController.java`
- Test: `backend/src/test/java/com/evcharge/auth/SessionTest.java`

**Interfaces:**
- Produces: the token from Task 5 is a signed JWT with `sub` = customer id, `exp` = 7 days. `POST /api/auth/logout` revokes the token. `POST /api/consent` body `{"consentType":"TERMS","version":"1"}` requires a valid token and writes a `consent_record` and an `audit_log` row.

- [ ] **Step 1: Write failing tests:** a valid token reaches `/api/consent`; after logout the same token returns `401`; a consent write creates both rows; an unknown `consentType` returns `400`.
- [ ] **Step 2: Run and confirm failure.**
- [ ] **Step 3: Implement** until they pass.
- [ ] **Step 4: Commit** with `feat: sessions, logout and consent recording`.

## Task 7: Customer app login flow, branded from configuration

**Files:**
- Create: `app/lib/config/client_config.dart`, `app/lib/main.dart` (flavour-aware bootstrap), `app/lib/screens/login_screen.dart`, `app/lib/screens/otp_screen.dart`, `app/lib/screens/consent_screen.dart`
- Create: `app/assets/client/client-a.json` (copied from `clients/` by the build script), `app/l10n/app_en.arb`, `app/l10n/app_hi.arb`, `app/l10n/app_mr.arb`
- Test: `app/test/login_flow_test.dart`

**Interfaces:**
- Consumes: `GET /api/config`, `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`, `POST /api/consent` (Tasks 4–6).
- Produces: `ClientConfig.fromJson(Map)`, a `ThemeData` built from `primaryColor` and `accentColor`, and a language list filtered by the client's `languages`. The app title and the logo mark come from the config, not from code.

- [ ] **Step 1: Write failing widget tests:** the login screen shows the client's `displayName`; with `client-a` the language picker shows English, Hindi and Marathi; with a config that enables only `en`, the picker shows English only; a wrong OTP shows the server's `WRONG_CODE` message in the selected language; the consent button stays disabled until the box is ticked.
- [ ] **Step 2: Run `flutter test` and confirm failure.**
- [ ] **Step 3: Implement the screens and the flavour bootstrap** until the tests pass. Translation keys come from the prototype's wording.
- [ ] **Step 4: Commit** with `feat: branded customer login flow in three languages`.

## Task 8: SMS provider and deployment template

**Files:**
- Create: `backend/src/main/java/com/evcharge/auth/Msg91SmsSender.java` (or the provider chosen; see decision below)
- Create: `deploy/cloudrun-service.yaml`, `deploy/README.md`, `deploy/set-budget-alert.sh`
- Test: `backend/src/test/java/com/evcharge/auth/Msg91SmsSenderTest.java` (uses a stubbed HTTP server)

**Interfaces:**
- Consumes: `SmsSender` (Task 5). Produces: a production `SmsSender` activated by the `prod` profile, reading the API key from `SMS_API_KEY`.
- Deployment: Cloud Run service in `asia-south1`, `minInstances: 0`, `maxInstances: 3` by default, one Cloud SQL PostgreSQL instance per client on the smallest shared-core tier that runs the app. A monthly budget alert per client project at 50%, 80% and 100%.

- [ ] **Step 1: Write a failing test** that the sender posts the phone and text to the provider with the API key in the header, and that a provider error surfaces as an exception (Review Focus item 5).
- [ ] **Step 2: Run and confirm failure.**
- [ ] **Step 3: Implement the sender** until the test passes.
- [ ] **Step 4: Write the deployment files.** Verify with `gcloud run services replace --dry-run` against a test project (no real spend).
- [ ] **Step 5: Commit** with `feat: production SMS sender and Cloud Run deployment template`.

## Cost Plan (per client, estimated)

These are planning estimates, not quotes. Confirm current prices in the Google Cloud pricing calculator and the SMS and payment providers' price sheets before the first client goes live.

| Item | Choice | Why |
|---|---|---|
| API hosting | Cloud Run, scale to zero | Pay only for requests. Idle clients cost almost nothing. |
| Database | Cloud SQL PostgreSQL, smallest shared-core instance | Smallest Cloud SQL tier is the main fixed cost per client. |
| Redis | Not used in phases 1–2 | Memorystore has a fixed minimum cost. Postgres is enough for OTP limits at this stage. |
| Charger connection (OCPP, later phase) | One small VM per client, added only once chargers are connected | Charger connections are long-lived. A VM is more reliable than Cloud Run request timeouts. Not needed before real chargers exist. |
| Maps | MapLibre with OpenStreetMap-based tiles | No per-map-load charge. Geocoding can be added later with usage limits. |
| SMS OTP | MSG91 behind the `SmsSender` interface | Low per-message cost. Requires telecom DLT registration before live sending. Swappable: switching provider means writing one new class, not changing the login code. |
| Payments | Razorpay | No monthly fee. Per-transaction fee only. |
| Push notifications | Firebase Cloud Messaging | Free. |
| CI | GitHub Actions | Free tier is enough for a small private repo. |
| Non-production | One shared dev and staging project | Avoid a full set of costs for every client during development. |

Rough baseline for one live client before traffic: in the low thousands of rupees per month, plus per-message and per-transaction fees. Fees grow with usage. Set budget alerts from day one.

**Decisions (recorded):**
- SMS provider: MSG91 for now, because it is the cheaper option for India. It sits behind the `SmsSender` interface so it can be replaced later without changing the login code.
- OCPP VM: not provisioned until chargers are connected to the platform.

## Out of scope for this plan

Charging sessions, OCPP gateway, payments, wallet, reservations, the admin portal, and the ad-hoc web page. These belong to later phases.
