# GG Partner — Developer Guide

## This edition

The original Google login is restored using Firebase Authentication. PostgreSQL stores application data; Firestore is not used. No Firebase project is connected in this package. Public Firebase configuration is blank, and no service-account key is included.

You can start the server and use guest mode before configuring Firebase. The Google button shows a setup message until configuration is supplied. It cannot authenticate real Google users while Firebase is disconnected.

## Structure and flow

```text
frontend/                 HTML, CSS, app.js, api.js and Google login UI
backend/src/app.js        HTTP API; verifies identity before data access
backend/src/server.js     PostgreSQL and Firebase Admin initialization
backend/src/data.js       Resource authorization and database writes
backend/test/             Local integration tests
backend/.env.example      Native development settings
database/001_init.sql     PostgreSQL schema
compose.yaml              Local app + PostgreSQL
compose.firebase.yaml     Optional server credential mount
.env.example              Docker Compose settings
README.md                 End-user instructions
README1.md                This developer guide
```

```text
Google button -> Firebase Authentication -> Firebase ID token
Browser sends Bearer token -> Node backend verifies token and Google provider
Verified Firebase UID -> google_accounts row -> PostgreSQL application data
```

The Firebase browser SDK retains authentication locally and obtains fresh ID tokens. Each API request gets a token through `getIdToken()`. The backend uses Admin SDK `verifyIdToken(token, true)` to verify it and check revocation/disabled users. There is no custom password database or seven-day app cookie in this edition.

The public Web App configuration is returned by `/api/config`. Admin credentials remain on the server. Both configurations must belong to the same Firebase project. See [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

## Run now without Firebase

Requirements: Docker Desktop with Compose enabled.

```powershell
Copy-Item .env.example .env
# Edit POSTGRES_PASSWORD: use a unique long alphanumeric password.
docker compose up --build -d
```

Open http://localhost:3000. Select **Continue with Google** to see the setup message, or **Continue without signing in** to use guest mode. Private API access returns HTTP 503 until the authentication verifier is configured. No authentication bypass is enabled.

## Connect Firebase later

### 1. Prepare the Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/). Choose your original project to retain its Google account identities, or create a new project for a fresh installation.
2. Open **Authentication**, initialize it if necessary, then **Sign-in method**. Enable **Google**, select the required project support email, and save.
3. Open Authentication **Settings > Authorized domains**. Add `localhost` for local testing and your actual hosting domain for deployment. Do not assume localhost is already listed.
4. In **Project settings > General > Your apps**, register a Web App if needed. Copy `apiKey`, `authDomain`, `projectId`, and `appId` from its configuration.

Use the Firebase-generated configuration. A generic Google Cloud API key by itself is insufficient. This app uses the Firebase Google provider rather than a standalone OAuth implementation. See [Firebase Google sign-in setup](https://firebase.google.com/docs/auth/web/google-signin).

### 2. Set public Web App configuration

For Docker, edit the root `.env`. For native development, edit `backend/.env`:

```dotenv
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-firebase-web-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_APP_ID=your-web-app-id
APP_ORIGIN=http://localhost:3000
```

These four Firebase values configure the browser and are intentionally public. Never paste an Admin private key into these fields or into frontend files. No Firestore database or Firestore rules are required for this edition.

### 3. Configure server credentials

In Firebase **Project settings > Service accounts**, generate an Admin SDK private key for local/server development, or use an appropriately authorized Application Default Credentials identity on managed hosting. Keep a downloaded JSON private and outside `frontend/`. The server requires permission to look up Firebase Auth users for its revocation check. See [Firebase Admin setup](https://firebase.google.com/docs/admin/setup).

For Docker:

1. Create a `secrets` folder in the project root.
2. Save the JSON as `secrets/firebase-admin.json`.
3. Start with the optional overlay:

```powershell
docker compose -f compose.yaml -f compose.firebase.yaml up --build -d
```

The overlay mounts the key read-only at `/run/secrets/firebase-admin.json` and sets `GOOGLE_APPLICATION_CREDENTIALS` inside the container. `secrets/` is excluded from Git and the Docker build context. Do not share it in future ZIPs. For subsequent Compose commands on this configured deployment, use both `-f` flags consistently.

For native development, set the absolute path in `backend/.env`:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=C:/private/gg-partner/firebase-admin.json
```

Managed hosting can supply Application Default Credentials instead of a downloaded key. Do not set `FIREBASE_AUTH_EMULATOR_HOST` on a real deployment; this package does not use an emulator or accept test tokens in its server entry point.

### 4. Verify the connection

1. Restart the backend after editing environment variables.
2. Open http://localhost:3000 and choose **Continue with Google**. Allow the popup.
3. Select a Google account. The app should open with that account's name/photo.
4. Confirm the account appears in Firebase Authentication's user list.
5. Edit a profile, reload, and confirm its data remains in PostgreSQL.
6. Test a second Google account in a separate browser profile; confirm private data remains separated.
7. Sign out and confirm the Google sign-in screen is available again.

`GET /api/config` shows `configured: true` when all public fields and the verifier are initialized. This flag does not prove that credentials, provider settings, or authorized domains are valid. A successful real sign-in plus authenticated API request is the final connection test.

## Native development

Requirements: Node.js 22.9+ and PostgreSQL 17. Create a database/login you control, then:

```powershell
Copy-Item backend/.env.example backend/.env
# Set DATABASE_URL and, when ready, the Firebase values above.
cd backend
npm ci
npm run dev
```

Use `npm start` without file watching. Example connection:

```dotenv
DATABASE_URL=postgresql://ggpartner:your-password@localhost:5432/ggpartner
```

URL-encode reserved characters in a native connection password. Compose's sample URL interpolation expects an alphanumeric password. Startup applies the idempotent `001_init.sql`; it does not create the database itself in native mode.

## Identity and existing data

`google_accounts` stores an internal UUID, unique `firebase_uid`, email, name, photo URL, and creation time. Firebase UID is the external identity key; the internal UUID keeps existing document paths and conversation IDs compatible. Email is never used to automatically merge accounts.

`documents` stores path, collection, JSONB data, and update timestamp. Profiles, private state, messages, locations, events, reports, and call signaling retain the previous PostgreSQL document model. The backend checks ownership, conversation participants, location recipients, blocks, and event membership/capacity.

If you previously ran the email/password ZIP, the new schema adds `google_accounts` without deleting old tables or documents. Old passwords/sessions are no longer accepted. Old app data is not automatically attached to a Google identity. Back up the database and plan an explicit, ownership-verified migration if needed. A fresh database is simplest for an unused prototype.

Existing Firebase identities remain available when using the same Firebase project. Existing Firestore app data is not imported. Moving to a new domain may require Google sign-in again. Guest data is not imported into signed-in accounts.

## API

All protected requests send `Authorization: Bearer <Firebase ID token>`. JSON POSTs also send `Content-Type: application/json` and `X-GG-Request: 1`. POST Origin is checked when present. The backend serves the frontend on the same origin.

| Endpoint | Purpose |
| --- | --- |
| GET /api/health | PostgreSQL connectivity |
| GET /api/config | Public Firebase configuration and configured flag |
| GET /api/auth/me | Verified Google identity mapped to local account |
| POST /api/data/read | `{path,document:true}` or collection `{path,filters,order,limit}` |
| POST /api/data/write | `{path,data,merge?,update?}` or `{path,remove:true}` |
| POST /api/data/batch | Atomic `{writes:[...]}` |

There are no password registration/login endpoints. Sign-out uses the Firebase browser SDK. Local sign-out is not global token revocation; an already issued token can remain valid until expiry unless the operator revokes sessions. The backend checks revocation on protected requests.

Filters support `[field,"==",value]` and `[field,"array-contains",value]`. Returned rows are capped at 500; batches at 500 writes; bodies at 3 MiB. Polling updates the UI about every two seconds. Calls to the Admin user lookup for revocation checks add network dependency and latency.

## Tests and validation status

```powershell
cd backend
npm ci
npm test
```

Tests use PGlite and an injected fake verifier only inside test code. They check verified identity mapping, forged-token rejection, rejection of non-Google providers, unconfigured behavior, private-data access, chat receipts, event capacity, blocking, and batch rollback. Tests do not contact Firebase. PGlite tests bypass advisory locks and do not prove real concurrent PostgreSQL behavior.

Headless browser checks cover the Google button, unconfigured setup message, guest entry, and a simulated Google sign-in with identity reload and profile rendering. The simulated flow uses a test-only browser stub; it is not proof of live Firebase connectivity. No live Google login or real Docker/PostgreSQL container test was performed for this package because no Firebase credentials were supplied. Complete the real connection checks above after configuration.

## Operations and limits

- Deploy behind HTTPS and set `APP_ORIGIN` to the exact public origin. Compose binds port 3000 to localhost by default. Microphone/location access needs HTTPS or localhost.
- Firebase handles login only. PostgreSQL holds app data. Phone verification, moderator UI, account deletion, and automatic Firestore migration are not implemented.
- Reports are saved for operator review. Example SQL: `SELECT path,data FROM documents WHERE collection='reports';`.
- Voice calls retain WebRTC/STUN; configure TURN for restrictive networks. Cross-device voice calls remain untested.
- External font, map, tile, place-search and Firebase SDK services require internet access.
- Collection reads scan/filter in application code. Add SQL pagination and push updates for larger deployments. Media remains JSON-embedded and size-limited.
- Browser cache is for continuity, not a durable offline write queue. Do not rely on offline changes automatically synchronizing later.
- Future numbered migrations require deliberate execution; only `001_init.sql` runs at startup.
- Account deletion requires explicit document cleanup; application documents have no account foreign keys.

Database console (add the Firebase overlay flag if you use it):

```sh
docker compose exec database psql -U ggpartner -d ggpartner
```

Backup without binary shell redirection:

```sh
docker compose exec database pg_dump -U ggpartner -d ggpartner -Fc -f /tmp/ggpartner.dump
docker compose cp database:/tmp/ggpartner.dump ./ggpartner.dump
```

Restore into a separately created database with `pg_restore`. `docker compose down` keeps the data volume; `down -v` deletes it permanently. Changing `.env` does not rotate the password of an initialized PostgreSQL volume.

## Firebase troubleshooting

- **Not configured:** fill all four Firebase fields and restart; check you edited the correct `.env`.
- **Unauthorized domain:** add the browser's actual hostname to Firebase Authentication authorized domains.
- **Popup blocked/closed:** allow popups and click the Google button again. This edition uses popup sign-in.
- **Google provider disabled:** enable Google in Authentication sign-in methods.
- **Invalid API key:** use the Web App configuration from the same Firebase project, and review any API-key restrictions.
- **API returns 401 after Google succeeds:** check Admin credential project/permissions, disabled or revoked account status, server time, and outbound access to Google. Sign out and retry after correcting configuration.
- **Credential file error:** use an existing absolute path for native execution or both Compose files with the JSON in `secrets/firebase-admin.json`.
- **Missing old profiles:** authentication identity retention does not migrate Firestore or the previous password account's PostgreSQL data.
