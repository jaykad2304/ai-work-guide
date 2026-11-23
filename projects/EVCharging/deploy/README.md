# Deploying one client to Google Cloud

Each client gets its own Google Cloud project, database and Cloud Run service (see docs/ARCHITECTURE.md).
Region: `asia-south1` (Mumbai). Nothing here has been run against a real project yet.

## Before the first deploy (blockers)

1. **Cloud SQL connector: done.** `com.google.cloud.sql:postgres-socket-factory:1.31.0` is in `backend/pom.xml`.
   Its class `com.google.cloud.sql.postgres.SocketFactory` matches the database URL in `cloudrun-service.yaml`.
   Not yet tested against a real Cloud SQL instance.
2. **SMS provider: open.** `Msg91SmsSender` uses the legacy GET `sendhttp.php` pattern. MSG91's recommended path is the
   v5 Flow API (`https://api.msg91.com/api/v5/flow/`), where the DLT template is stored in the MSG91 dashboard.
   The MSG91 help pages checked so far do not give the request format, so the sender must be rewritten once the
   account's API example is available. Needed: the API version your MSG91 account uses and one sample request from
   the MSG91 SMS logs (secret values removed).
3. **DLT registration: open (user action).** The sender ID, message template and principal entity must be approved on
   the telecom DLT portal before live SMS works.
4. **gcloud: installed, not logged in.** The CLI is at `~/google-cloud-sdk/bin/gcloud`. Log in and set a project before
   any real command (see below). The `services replace --dry-run` and `billing budgets create` flags were checked
   against the installed CLI.

## Log in to Google Cloud (once per machine)

```bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH"   # or add this line to ~/.bashrc
gcloud auth login                                  # opens a browser; sign in with the project owner account
gcloud auth application-default login              # lets local tools use the same credentials
gcloud config set project REPLACE_ME_PROJECT
```

## One-time setup per client project

```bash
gcloud config set project REPLACE_ME_PROJECT
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create evc --repository-format=docker --location=asia-south1

# Database: smallest shared-core PostgreSQL 16 instance in Mumbai
gcloud sql instances create evc-db --database-version=POSTGRES_16 \
  --tier=db-f1-micro --region=asia-south1
gcloud sql databases create evcharge --instance=evc-db
gcloud sql users create evcharge --instance=evc-db --password="$(openssl rand -base64 24)"

# Secrets (values are typed or piped in, never committed)
printf '%s' "$DB_PASSWORD"  | gcloud secrets create evc-db-password --data-file=-
printf '%s' "$JWT_SECRET"   | gcloud secrets create evc-jwt-secret --data-file=-
printf '%s' "$SMS_API_KEY"  | gcloud secrets create evc-sms-api-key --data-file=-
```

Note: `db-f1-micro` is a shared-core tier; check current pricing before choosing it for production.

## Build and push the backend image

```bash
cd backend
./mvnw spring-boot:build-image \
  -Dspring-boot.build-image.imageName=asia-south1-docker.pkg.dev/REPLACE_ME_PROJECT/evc/backend:REPLACE_ME_TAG
docker push asia-south1-docker.pkg.dev/REPLACE_ME_PROJECT/evc/backend:REPLACE_ME_TAG
```

## Deploy

1. Copy `cloudrun-service.yaml`, replace every `REPLACE_ME_*` value, and keep the copy out of git.
2. Validate first: `gcloud run services replace deploy/cloudrun-service.yaml --region=asia-south1 --dry-run`
   (the CLI has this flag; it needs login and a project).
3. Deploy:
   ```bash
   gcloud run services replace deploy/cloudrun-service.yaml --region=asia-south1
   ```
4. Check the service:
   ```bash
   URL=$(gcloud run services describe evc-api --region=asia-south1 --format='value(status.url)')
   curl -s "$URL/api/health"   # expect {"status":"UP"}
   curl -s "$URL/api/config"   # expect the client's public settings
   ```

## Budget alert (cost control)

```bash
BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX PROJECT_NUMBER=123456789012 \
PROJECT_ID=evc-client-a AMOUNT=5000 ./deploy/set-budget-alert.sh
```
The flags were checked against the installed CLI (`--filter-projects`, `--threshold-rule`, `--budget-amount`).
