# EV Charging Platform: Roadmap and Resume Point

> **For a new Claude session:** read this file first, then `docs/ARCHITECTURE.md` and `docs/TECH-SETUP.md`.
> Ticked items are finished and verified. Unticked items are not started. Do not redo a ticked item.
> Last updated: 23 Nov 2026.

## Resume here

- **Next task:** Milestone A, step A1 (stations in the backend). Nothing in Milestone A is started.
- **Uncommitted work:** Tasks 2–8, the app's login flow, the VS Code setup and the docs are not committed.
  Branch `feature/base-platform-foundation` has commit `a318e7e` (prototype and plans only).
  The same content was pushed to `main` of `github.com/jaykad2304/EVCharging` as `4e92d89`.
  Do **not** push or commit without the user's go-ahead.
- **Latest verified state:** backend `./mvnw verify` passes with 42 tests. App `flutter test` passes with 5 tests.
  Local login was checked end to end through the API (request code, check code, consent, logout).

## Status checklist

### Foundation
- [x] Clickable prototype with client switch, EN/HI/MR (`prototype/index.html`)
- [x] White-label design approved (`docs/superpowers/specs/2026-11-23-white-label-base-design.md`)
- [x] Base platform plan, phases 1–2 (`docs/superpowers/plans/2026-11-23-base-platform-phase1-2.md`)
- [x] Plan Task 1: repository, backend skeleton, Flutter app, local database, CI file
- [x] Plan Task 2: client settings model, loader and validation (`clients/`)
- [x] Plan Task 3: database schema V1 (`db/migration/V1__base_schema.sql`)
- [x] Plan Task 4: active client from `EVC_CLIENT_ID`, public config endpoint, security rules
- [x] Plan Task 5: phone-code login with rate limits and wrong-code lockout
- [x] Plan Task 6: login tokens, logout, consent with audit (`V2__auth_session.sql`)
- [x] Plan Task 7: customer app login flow, branded and in EN/HI/MR
- [x] Plan Task 8: MSG91 sender (production profile, stub-tested only), Cloud Run file, budget script, deploy guide

### Local running
- [x] Database in Docker (`docker-compose.yml`), verified accepting connections
- [x] VS Code run buttons (`.vscode/launch.json`, `.vscode/tasks.json`)
- [x] Linux desktop build of the app (`app/linux/`)
- [x] Local login verified through the API

### Cloud (blocked)
- [x] Cloud SQL connector added to the backend (`postgres-socket-factory` 1.31.0). Not yet run against a real database.
- [x] gcloud CLI installed at `~/google-cloud-sdk/bin/gcloud`
- [x] Google Cloud project `evc-client-a-dev` created
- [ ] Enable APIs: run, sqladmin, artifactregistry, secretmanager (user action)
- [ ] Billing account linked (user action, starts charges, ask first)
- [ ] Dry run of `deploy/cloudrun-service.yaml` passes
- [ ] MSG91 request format confirmed (user needs to provide redacted API example)
- [ ] MSG91 KYC and DLT registration (needs the client's registered company)

### Milestone A: stations on a map
- [ ] A1: backend stores stations and chargers (migration V3, entities, admin-only create endpoint)
- [ ] A2: public endpoint lists stations near a point
- [ ] A3: seed script with sample stations for local runs
- [ ] A4: app map screen (MapLibre with OpenStreetMap tiles) replaces the home placeholder
- [ ] A5: station detail screen from the map
- [ ] A6: tests for A1–A5 added to the earlier suites

### Milestone B: charging with a simulated charger
- [ ] B1: OCPP 1.6J gateway (WebSocket) with a simulator
- [ ] B2: start and stop charging from the app
- [ ] B3: live energy and cost in the app
- [ ] B4: session record and receipt

### Milestone C: payments and wallet
- [ ] C1: Razorpay test mode (UPI, card, net banking)
- [ ] C2: wallet balance and transaction history
- [ ] C3: GST on receipts

### Milestone D: admin portal (React)
- [ ] D1: stations and chargers
- [ ] D2: tariffs and price history
- [ ] D3: sessions, tickets and reports

### Milestone E: cloud deployment
- [ ] E1: backend and database running on Cloud Run and Cloud SQL
- [ ] E2: live SMS (needs company registration)
- [ ] E3: app build for the client's store accounts

### Milestone F: pilot
- [ ] F1: real charger connected and tested with power
- [ ] F2: client pilot

## Environment facts (so a new session does not repeat setup)

- **Java 21** (`openjdk 21`) and **Maven 3.8.7** are installed. The project uses the Maven wrapper (`./mvnw`, Maven 3.10.1).
- **Spring Boot 4.0.0.** Spring Initializr no longer offers 3.x. Package names changed: `org.springframework.boot.webmvc.test.autoconfigure.*`, Jackson 3 uses `tools.jackson.*`.
- **Docker:** the user is in the `docker` group, but the shell session started before that. Use `sg docker -c "<command>"` until the user logs out and back in. This machine has `docker-compose` (v1), not `docker compose`.
- **Tests that need Docker** (Testcontainers) must run through `sg docker -c ...`.
- **Flutter 3.50.1** (snap). Desktop build works after `clang`, `ninja-build`, `pkg-config`, `libgtk-3-dev` were installed.
- **Flutter Material** is `package:material_ui/material_ui.dart`. `package:flutter/material.dart` is deprecated in this SDK. Do not remove `material_ui` from `pubspec.yaml`.
- **Localisation delegates:** use `GlobalMaterialLocalizations.delegates` from `material_ui`. The Cupertino delegate from `flutter_localizations` does not cover Marathi here.
- **Local run:** `docker-compose up -d`, then the backend with the env vars in `.vscode/launch.json`, then the app with `--dart-define=API_BASE_URL=http://localhost:8080` on Linux.
- **Local login codes** are printed to the backend console by `FakeSmsSender` (only active outside the `prod` profile).

## Decisions made

- Base platform is one codebase, one deployment per client, one client settings file.
- Database is PostgreSQL 16. Do not switch to MySQL. The schema uses PostgreSQL types.
- Hosting region is `asia-south1` (Mumbai). No data outside India.
- SMS: MSG91 behind the `SmsSender` interface, so the provider can be swapped.
- OCPP VM is added only when real chargers are connected.
- Client owns its app-store and SMS accounts by default.
- Gateway: Razorpay by default.
- Currency INR, GST 18%.
- Languages: English, Hindi, Marathi for customers. Admin portal in English.

## Rules for working on this project

- Ask before committing, pushing, linking billing, or any step that starts charges.
- Never put secrets in the repository. The local JWT secret in `.vscode/launch.json` is for development only.
- Use the Maven wrapper and the Flutter SDK, not system copies, when a version matters.
- Write the failing test first, then the code, as the plan says.
- Do not invent MSG91 request formats. Use the account's own API example.

## Open decisions

- Charger hardware and OCPP version (1.6J or 2.0.1).
- Payment model: wallet, or pay per session directly.
- First client's country and currency.
- Map provider: OpenStreetMap-based (planned) or Google Maps.
- First pilot platform: Android, iOS, or both.
