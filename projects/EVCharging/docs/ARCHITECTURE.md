# EV Charging Platform: Architecture and Infrastructure (Basic Guide)

This document explains what the platform is made of, what each piece does, and why we chose it. It is written for the project owner, not for a specialist. It describes the plan as of 23 Nov 2026. Items marked **(planned)** are not built yet.

---

## 1. The big picture

The platform lets people find and use EV chargers, pay for charging, and lets the company that owns the chargers manage them.

It is one **base platform** that we copy and brand for each client. The client gets its own name, logo, colours, languages, tariffs and features, set in one configuration file. The code does not change per client.

```
  Customer phone                 Browser (no app needed)          Operator's office
  ┌───────────────┐              ┌──────────────────┐             ┌────────────────────┐
  │ Customer app  │              │ Ad-hoc charging  │             │ Admin web portal   │
  │ (Flutter)     │              │ page (QR code)   │             │ (React)            │
  └──────┬────────┘              └────────┬─────────┘             └─────────┬──────────┘
         │  HTTPS (REST)                  │  HTTPS                          │  HTTPS
         └──────────────────┬─────────────┴─────────────────────────────────┘
                            ▼
                ┌──────────────────────────────┐
                │ Backend API (Spring Boot)    │──── SMS provider (OTP)
                │ login, stations, sessions,   │──── Payment gateway (Razorpay)
                │ payments, tariffs, reports   │──── Push notifications (Firebase)
                └──────┬──────────────┬────────┘
                       │              │
                       ▼              ▼
              ┌──────────────┐  ┌─────────────────────────┐
              │ PostgreSQL   │  │ OCPP gateway (planned)  │◄── WebSocket ──► EV chargers
              │ (database)   │  │ talks to the chargers   │
              └──────────────┘  └─────────────────────────┘
```

**Read it this way:** customers and staff use apps or web pages. Those talk to one backend. The backend stores data in a database, sends SMS and takes payments through outside services, and (once built) talks to the physical chargers through the OCPP gateway.

---

## 2. Glossary (the terms you will hear)

| Term | Plain meaning |
|---|---|
| **CPO** (Charge Point Operator) | The company that owns and runs the chargers. Our client. |
| **EMSP** | A company that gives drivers access to many networks with one app (for example, a roaming partner). |
| **Charger / EVSE** | The physical charging unit. One charger can have several connectors. |
| **Connector** | The plug end (for example CCS2 or Type 2). |
| **OCPP** | The standard language chargers use to talk to a central system. We use version 1.6J first; 2.0.1 later. |
| **OCPI** | The standard used between networks, for roaming. Later phase. |
| **Tenant / client** | One CPO we deploy the platform for. |
| **Flavour** | One branded build of the customer app for one client. |
| **OTP** | One-time code sent by SMS to log in. |
| **DLT** | Indian telecom registration needed before we can send SMS commercially. |

---

## 3. Components

### 3.1 Customer mobile app (Flutter)
- **What it does:** login with phone and OTP, find chargers on a map, start and stop charging, pay from a wallet or directly, see history and receipts, report faults, reserve slots.
- **Why Flutter:** one code base produces both Android and iOS apps. Lower cost than writing two apps.
- **Branding:** each client build reads its own configuration file, so the name, logo, colours and languages change without changing the code.
- **Languages:** English, Hindi and Marathi for customers (more can be added).

### 3.2 Admin web portal (React)
- **What it does:** operators manage stations and chargers, tariffs, customers, payments and refunds, fault tickets, firmware updates, reports, and the audit log.
- **Why React:** a common choice for dashboards. Easy to hire for and well supported.

### 3.3 Ad-hoc charging web page
- **What it does:** a browser page reached by scanning a QR code on a charger. The driver pays and charges without installing the app.
- **Why a web page:** many drivers will not install an app for one charge. A web page works on any phone.

### 3.4 Backend API (Spring Boot, Java 21)
- **What it does:** the single place where business rules live. It handles authentication, tenant configuration, sessions, payments, tariffs, notifications and reports.
- **Why Spring Boot:** mature, widely used, strong security and database support. We start as one deployable application (a "modular monolith") and split it only if the load requires it.
- **Configuration:** at startup it reads the one client file named by the environment variable `EVC_CLIENT_ID`.

### 3.5 PostgreSQL database
- **What it stores:** customers, OTP challenges (only hashed codes), consent records, charging sessions, tariffs, transactions, tickets, audit log.
- **Why PostgreSQL:** reliable, free, handles money-related data safely, and supports the JSON fields we need for configuration snapshots.
- **Versions:** PostgreSQL 16 locally and in the cloud.
- **Schema changes** are made through numbered migration files (Flyway), so every environment changes in the same order.

### 3.6 OCPP gateway (planned, later phase)
- **What it does:** keeps a live connection open to each charger, receives status and meter readings, and sends start and stop commands.
- **Why it is separate:** charger connections stay open for long periods and must be reliable. It is kept apart from the main API so a problem with one does not stop the other.
- **Where it runs:** one small virtual machine per client, added once real chargers are connected. Not needed before that.

### 3.7 Caching (Redis) — not used yet
- Planned only if needed for live charger status at scale. Not used in the first phases because a managed Redis instance has a fixed monthly cost, and PostgreSQL is enough at this stage.

### 3.8 External services

| Service | Used for | Why this one | Status |
|---|---|---|---|
| **MSG91** (SMS) | Sending login codes | Low cost in India. Behind an interface so it can be swapped. Needs DLT registration before live use. | Chosen; not yet connected |
| **Razorpay** (payments) | Card, UPI and net banking; wallet top-ups | No monthly fee, per-transaction fee only, strong in India | Planned |
| **Firebase Cloud Messaging** (push) | Charging complete, faults, offers | Free | Planned |
| **OpenStreetMap-based maps** (MapLibre) | The map screen | No charge per map view | Planned |
| **GitHub Actions** (CI) | Runs tests on every change | Free tier is enough for our size | Planned in Task 1 |

### 3.9 Google Cloud (hosting)

| Piece | Choice | Why |
|---|---|---|
| Region | **asia-south1 (Mumbai)** | Keeps data in India, close to users, low delay |
| API hosting | **Cloud Run** | Runs the backend in containers. Scales to zero, so an idle client costs almost nothing. |
| Database | **Cloud SQL for PostgreSQL**, smallest shared tier | Managed backups and updates. This is the largest fixed cost per client. |
| Secrets | **Secret Manager** | API keys and passwords are not stored in code or config files |
| Logs and monitoring | **Cloud Logging and Monitoring** | Central logs; alerts on errors |
| Budget control | **Budget alerts** at 50%, 80% and 100% per client project | Warns before costs surprise us |
| OCPP VM (later) | One small Compute Engine VM per client | Long-lived charger connections |

**Per-client isolation:** every client has its own Google Cloud project, its own database and its own app store listing. One client's data is never mixed with another's.

---

## 4. Key flows (what happens, step by step)

### 4.1 Customer logs in
1. The app asks the backend for the client's public settings (`GET /api/config`) and shows the client's name and colours.
2. The customer enters a phone number. The backend checks the number is valid, that the customer has not asked for too many codes, creates a 6-digit code, stores only its hash, and asks the SMS provider to send it.
3. The customer enters the code. The backend checks the attempt count and the 5-minute expiry, then returns a signed login token (valid 7 days).
4. The customer accepts the terms. The consent and an audit entry are stored.

### 4.2 Customer charges (later phase, planned)
1. The customer picks a charger and connector, and sees the estimated cost including GST.
2. The backend holds the estimated amount with the payment gateway (or the wallet).
3. The backend sends a "start" command to the charger through the OCPP gateway, and waits for the charger to confirm.
4. Meter readings arrive through the gateway and are shown live in the app.
5. The customer stops charging. The backend sends a "stop" command, works out the final amount, captures the payment, and creates the receipt.

### 4.3 Operator manages a charger (later phase, planned)
- The portal shows live status from the gateway. Operators can restart a charger, schedule a firmware update for off-peak hours, or open a fault ticket. Each action is written to the audit log.

---

## 5. Security basics

- **Login codes** are never stored in plain text. Only a hash is kept.
- **Rate limits** stop someone from requesting or guessing codes repeatedly.
- **HTTPS everywhere** for the apps and the web pages. Charger connections use secure WebSockets (WSS).
- **Secrets** (API keys, database passwords) live in Secret Manager, not in code.
- **Role-based access** in the admin portal: admin, operations, technician, finance.
- **Audit log** for every change made by staff.
- **Personal data** is kept in India and collected with consent, in line with India's Digital Personal Data Protection Act, 2023. The exact obligations need checking with the client's legal advisers.

---

## 6. Environments

| Environment | Purpose | Who uses it | Cost approach |
|---|---|---|---|
| **Local** | Developer machine with Docker running PostgreSQL | Developers | Free |
| **Dev / staging** | One shared cloud project for testing | Our team and the client's testers | Scale to zero; shared by all clients |
| **Production (per client)** | One cloud project per client | The client's real customers | Budget alerts; small database tier |

---

## 7. Cost picture (estimates only)

- **Fixed cost per live client:** mainly the small database instance, plus minimal hosting. Expect a few thousand rupees a month.
- **Variable cost:** SMS per login, payment fees per transaction, and Cloud Run usage as traffic grows.
- **Where we save:** scale-to-zero hosting, no Redis yet, free map tiles, no monthly payment-gateway fee, one shared non-production project.
- **Verify before launch:** current Google Cloud prices (pricing calculator), MSG91 and Razorpay price sheets. These numbers are not quotes.

---

## 8. What is built and what is not (as of 23 Nov 2026)

| Area | Status |
|---|---|
| Clickable prototype (customer, ad-hoc, admin, client switch, EN/HI/MR) | **Built** (`prototype/index.html`), mock data only |
| White-label design | **Approved** (`docs/superpowers/specs/`) |
| Base platform plan, phases 1–2 | **Written** (`docs/superpowers/plans/`) |
| Backend, database, customer app code | **Not started.** Waiting for Java 21, Maven, Flutter and Docker access on the development machine. |
| OCPP gateway, payments, wallet, sessions, admin portal (real) | **Planned** in later phases |
| Cloud project, SMS DLT registration | **Not started** |

---

## 9. Glossary of files in this folder

- `docs/ARCHITECTURE.md` — this document.
- `docs/superpowers/specs/` — design decisions (white-label model, prototype design).
- `docs/superpowers/plans/` — step-by-step build plan for the base platform.
- `prototype/index.html` — the clickable demo.
- `clients/` — client configuration files (added when Task 2 of the plan is built).
- `backend/`, `app/`, `deploy/` — code and deployment files (added in the plan's tasks).
