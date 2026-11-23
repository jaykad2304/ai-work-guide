# EV Charging Platform: Technical Setup and Build Guide

This is the developer-level companion to `ARCHITECTURE.md`. It covers the tools, versions, commands and project layout. Items marked **(planned)** are defined in the build plan (`docs/superpowers/plans/2026-11-23-base-platform-phase1-2.md`) but do not exist yet.

Status as of 23 Nov 2026: no code has been written yet. The machine is missing Java, Maven and Flutter, and the current user cannot run Docker (not in the `docker` group). Sections 2–3 describe what to install.

---

## 1. Tool versions

| Tool | Version | Used for | Check command |
|---|---|---|---|
| **Java (JDK)** | 21 LTS | Compiles and runs the backend | `java -version` |
| **Maven** | 3.9.x | Builds the backend, runs its tests, manages libraries | `mvn -version` |
| **Spring Boot** | 4.0.x (current stable) | Backend framework (web, security, data) | set in `backend/pom.xml` |
| **PostgreSQL** | 16 | Database (local via Docker, cloud via Cloud SQL) | `docker compose ps` |
| **Docker Engine + Compose** | current | Runs PostgreSQL locally; runs Testcontainers in tests | `docker version`, `docker-compose version` (this machine has the standalone `docker-compose` v1 command; the `docker compose` plugin is not installed) |
| **Flutter SDK** | stable channel | Builds the Android and iOS customer app | `flutter --version` |
| **Dart** | ships with Flutter | Language for the app | `dart --version` |
| **Node.js** | 22 LTS | Only if the React admin portal is built | `node -v` |
| **Git** | any recent | Version control and CI | `git --version` |
| **gcloud CLI** | current | Deploy to Google Cloud (Task 8 onward) | `gcloud --version` |

Machine status today: Docker present (29.x); Node 22 present; Java, Maven, Flutter and gcloud **missing**; Docker needs group permission.

---

## 2. Installing the tools (Ubuntu 24.04)

### 2.1 Java 21 and Maven
```bash
sudo apt update
sudo apt install -y openjdk-21-jdk maven
java -version      # expect: openjdk version "21..."
mvn -version       # expect: Apache Maven 3.9.x, Java 21
```

### 2.2 Docker permissions (needed for PostgreSQL and tests)
```bash
sudo usermod -aG docker $USER
newgrp docker          # or log out and back in
docker run --rm hello-world
```
Tests use **Testcontainers**, which starts a real PostgreSQL in Docker. Without this step the database tests fail.

### 2.3 Flutter
Option A (snap, simplest):
```bash
sudo snap install flutter --classic
flutter doctor
```
Option B (manual): download the stable SDK from flutter.dev, unzip to `~/development/flutter`, and add `~/development/flutter/bin` to `PATH` in `~/.bashrc`.

Then run `flutter doctor` and fix what it reports. For Android builds you need Android Studio (or the Android SDK command-line tools) and the Android licences (`flutter doctor --android-licenses`). iOS builds need a Mac with Xcode and cannot be made on Linux.

### 2.4 Google Cloud CLI (later, for deployment)
Follow the official install for Ubuntu, then `gcloud init`. Choose the development project and region `asia-south1`.

---

## 3. Project layout (target)

```
projects/EVCharging/
├── backend/                  Spring Boot API (Java 21, Maven)   (planned)
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd        Maven wrapper: lets anyone build with the same Maven version
│   └── src/
│       ├── main/java/com/evcharge/...
│       ├── main/resources/application.yml
│       ├── main/resources/db/migration/V1__base_schema.sql   (Flyway)
│       └── test/java/com/evcharge/...
├── app/                      Flutter customer app                (planned)
│   ├── pubspec.yaml          Flutter dependencies
│   ├── lib/                  Dart code
│   ├── assets/client/        Client config copied in at build time
│   ├── l10n/                 app_en.arb, app_hi.arb, app_mr.arb
│   └── test/                 widget tests
├── clients/                  One JSON file per client (_template.json, client-a.json)  (planned)
├── deploy/                   Cloud Run YAML, budget-alert script                       (planned)
├── docker-compose.yml        Local PostgreSQL 16                                       (planned)
├── .github/workflows/ci.yml  Runs backend and app tests on every push                  (planned)
├── prototype/index.html      Clickable demo (no build step)                            (built)
└── docs/                     Architecture, this guide, specs and plans                 (built)
```

---

## 4. Backend (Spring Boot + Maven)

### 4.1 Creating the project (first time only)
The plan's Task 1 creates it. Easiest route: open https://start.spring.io and choose: Maven, Java 21, Spring Boot 4.0.x, dependencies: Spring Web, Spring Security, Validation, Flyway Migration, PostgreSQL Driver, Spring Data JPA. Add test dependencies: Testcontainers (PostgreSQL module) and JUnit 5 (included by Spring Boot's test starter).

Then add the Maven wrapper so every machine uses the same Maven:
```bash
cd backend && mvn wrapper:wrapper
```

### 4.2 Key Maven libraries and what they do

| Library | Purpose |
|---|---|
| `spring-boot-starter-web` | REST API (controllers, JSON) |
| `spring-boot-starter-security` | Login protection, token checks, role rules |
| `spring-boot-starter-validation` | Checks request fields (for example phone format) |
| `spring-boot-starter-data-jpa` | Maps Java objects to database tables |
| `flyway-core` | Applies numbered SQL migrations (`V1__…sql`) in order |
| `postgresql` (JDBC driver) | Connects Java to PostgreSQL |
| JWT library (for example `jjwt`) | Creates and verifies login tokens **(planned, Task 6)** |
| `testcontainers` + `postgresql` module | Starts a throwaway PostgreSQL in Docker for tests |
| `spring-boot-starter-test` | JUnit 5, MockMvc, assertions |

### 4.3 Configuration
`backend/src/main/resources/application.yml` holds non-secret settings. Secrets come from environment variables.

| Variable | Purpose | Example |
|---|---|---|
| `EVC_CLIENT_ID` | Which client file to load at startup | `client-a` |
| `SPRING_DATASOURCE_URL` | Database address | `jdbc:postgresql://localhost:5432/evcharge` |
| `SPRING_DATASOURCE_USERNAME` / `PASSWORD` | Database login | local: `evcharge` / dev password |
| `SMS_API_KEY` | SMS provider key (prod profile only) | from Secret Manager |
| `SPRING_PROFILES_ACTIVE` | `local` uses the fake SMS sender; `prod` uses MSG91 | `local` |

### 4.4 Everyday commands
```bash
docker-compose up -d                       # start PostgreSQL 16 locally (from repo root; or `docker compose` if the plugin is installed)
cd backend
./mvnw clean verify                        # compile, run all tests, package
./mvnw test -Dtest=HealthEndpointTest      # run one test class
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # run the API on port 8080
curl -s localhost:8080/api/health          # expect {"status":"UP"}
```

### 4.5 Database migrations
- Add a new file `V2__something.sql` for every schema change. Never edit a migration that has already run.
- Flyway runs pending migrations at startup and records them in the `flyway_schema_history` table.

---

## 5. Customer app (Flutter)

### 5.1 Creating the project (first time only)
```bash
flutter create --org com.evcharge --platforms android,ios customer_app
mv customer_app app
```

### 5.2 Key dependencies (in `pubspec.yaml`)

| Package | Purpose |
|---|---|
| `flutter_localizations` + `intl` | English, Hindi and Marathi text (from `.arb` files) |
| `http` or `dio` | Calls the backend API |
| `flutter_secure_storage` | Stores the login token securely on the phone |
| `maplibre_gl` | Map screen (free OpenStreetMap-based tiles) **(planned, later phase)** |
| `firebase_messaging` | Push notifications **(planned, later phase)** |

### 5.3 Client flavours (one build per client)
The app reads `assets/client/<client>.json`, which the build script copies from `clients/`. The name, colours, languages and features come from that file.

```bash
# Run for client A on an Android emulator (the script copies the client file first)
cp ../clients/client-a.json assets/client/client-a.json
flutter run --dart-define=CLIENT_ID=client-a
```

Store builds (planned, Task 8 onward):
```bash
flutter build appbundle --dart-define=CLIENT_ID=client-a   # Android (Play Store)
flutter build ipa --dart-define=CLIENT_ID=client-a         # iOS (needs a Mac)
```

### 5.4 Everyday commands
```bash
cd app
flutter pub get          # download dependencies (after editing pubspec.yaml)
flutter analyze          # static checks
flutter test             # run widget tests
flutter gen-l10n         # regenerate translation code after editing .arb files
flutter run              # run on the connected device or emulator
```

### 5.5 Translations
Each language is one file: `l10n/app_en.arb`, `app_hi.arb`, `app_mr.arb`. A missing key in Hindi or Marathi falls back to English.

---

## 6. Local database

`docker-compose.yml` (planned) defines one service:

- Image: `postgres:16`
- Database `evcharge`, user `evcharge`, port `5432`
- Data kept in a named Docker volume so it survives restarts

```bash
docker compose up -d        # start
docker compose down         # stop (keeps data)
docker compose down -v      # stop and delete data (careful)
docker exec -it <container> psql -U evcharge evcharge   # open a SQL shell
```

---

## 7. Tests

| Layer | Tool | Command | Needs |
|---|---|---|---|
| Backend unit and API tests | JUnit 5, MockMvc | `cd backend && ./mvnw test` | nothing extra |
| Database tests | Testcontainers + Docker | same command | Docker running, user in `docker` group |
| App widget tests | `flutter_test` | `cd app && flutter test` | Flutter installed |
| Prototype | browser | open `prototype/index.html` | a browser (Chrome is installed) |

Rule from the plan: write the failing test first, see it fail, then write the code that makes it pass.

---

## 8. Continuous integration (GitHub Actions) **(planned, Task 1)**

On every push, `.github/workflows/ci.yml` should:
1. Set up Java 21 and run `./mvnw verify` in `backend/`.
2. Set up Flutter (stable) and run `flutter analyze` and `flutter test` in `app/`.

Free for a small private repository. Failing checks block merging.

---

## 9. Deployment (planned, Task 8 onward)

| Step | Command or file | Notes |
|---|---|---|
| Build the backend container | `./mvnw spring-boot:build-image` (Buildpacks) or a Dockerfile | Produces an image Cloud Run can run |
| Push the image | Artifact Registry in `asia-south1` | |
| Deploy | `gcloud run services replace deploy/cloudrun-service.yaml` | Min instances 0, max 3 by default |
| Database | Cloud SQL PostgreSQL 16, one per client, `asia-south1` | Password in Secret Manager |
| Budget alert | `deploy/set-budget-alert.sh` | 50%, 80%, 100% of the monthly budget |
| Dry run first | `gcloud run services replace --dry-run` | No spend until the real run |

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `java: command not found` | JDK not installed | Section 2.1 |
| `mvn: command not found` | Maven not installed | Section 2.1 (or use `./mvnw` once the wrapper exists) |
| `Cannot connect to the Docker daemon` / permission denied on `docker.sock` | User not in `docker` group | `sudo usermod -aG docker $USER`, then re-login |
| Tests fail with Testcontainers errors | Docker not running | `sudo systemctl start docker` |
| `Port 5432 already in use` | A local PostgreSQL is running | Stop it, or change the port in `docker-compose.yml` |
| `EVC_CLIENT_ID is not set` at startup | Environment variable missing | `export EVC_CLIENT_ID=client-a` |
| Flyway: "Migration checksum mismatch" | A migration file was edited after it ran | Restore the original file; add a new `V#__` migration instead |
| `flutter doctor` shows Android licence errors | Licences not accepted | `flutter doctor --android-licenses` |
| Hindi or Marathi text shows as boxes | Font missing on the device | Add a font that covers Devanagari (for example Noto Sans Devanagari) |

---

## 11. Quick start (once tools are installed)

```bash
cd /home/jaykumar/Jay/ai-work-guide/projects/EVCharging
docker compose up -d                         # database  (after Task 1 creates the file)
cd backend && ./mvnw verify                  # backend build and tests
cd ../app && flutter test                    # app tests
```

Until Task 1 is complete, the only runnable part is the prototype: open `prototype/index.html` in a browser.
