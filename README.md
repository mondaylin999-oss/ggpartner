# GG Partner — User Guide

Find a partner for games, gym, study, projects, language exchange, hobbies, hangouts, or travel. This edition keeps the supplied app's visual design and uses a PostgreSQL-backed server for signed-in accounts.

## Open the app

If someone is hosting GG Partner for you, open the address they provide. You do not need to install Node.js or PostgreSQL on your device.

To run your own local copy:

1. Install Docker Desktop and start it.
2. Extract this entire ZIP. Open a terminal in the `gg-partner` folder containing `compose.yaml`.
3. Copy `.env.example` to `.env`. On Windows PowerShell: `Copy-Item .env.example .env`.
4. Edit `.env` and replace `POSTGRES_PASSWORD` with a unique long alphanumeric password. Keep the local address settings as supplied.
5. Run `docker compose up --build -d`.
6. Open **http://localhost:3000**. The first startup downloads container images and may take several minutes. Google login starts unconfigured; follow `README1.md` to connect Firebase, or choose guest mode.

Stop with `docker compose down`. Application data remains in the Docker volume; Google identities are managed by Firebase Authentication. Start again with `docker compose up -d`. Do not add `-v` to the stop command unless you intend to erase all database data.

## Your first session

1. Select **Continue with Google**.
2. Choose your Google account in the popup. No separate app password is needed. If sign-in is not configured, the operator must complete the Firebase setup in `README1.md`; you can use guest mode in the meantime.
3. Open **Profile** and complete your information. Add a category profile for each activity you want partners for.
4. Set your availability and relevant category fields, such as a game/rank or study subject.
5. Open **Discover**, choose a category, and use the search and filters. A new installation starts empty; other real accounts must join before you can find them.
6. Open a person's profile to like, connect, or chat using the available buttons. **Matches** shows your matches and **Chats** shows conversations.

Example: Make a Study profile with “Networking exam revision”, add “TCP/IP and subnetting” to your description, and choose your available evenings. Another student can find you in Study and send “Library at 5 pm?” in chat.

## Events

Switch Discover to events and choose the host/create-event action. Enter a title, category, schedule, capacity, visibility, and optional meeting stops. Other eligible members can join while slots remain. Hosts can start or end the session. Participants can leave; the host controls the event.

Example: Create “Saturday gym session”, set four places, and choose a meeting location. The server checks the latest capacity when someone joins so an outdated screen cannot overfill the event.

## Location and privacy

Location sharing starts off. You can decline the location prompt and still use the app. When you enable sharing, the public profile uses a rounded location; matched people you allow can receive your precise location. Ghost mode switches sharing off. A category's meeting place is also visible as part of that category profile, so choose a public venue.

Private account state and chats require sign-in. Blocking someone hides profiles and denies communication/location access between those accounts. Reports are saved for the operator; there is no automatic moderation or moderator dashboard in this package.

## Messages and calls

Text messages and short voice notes are saved on the server. Updates normally arrive within about two seconds. Allow microphone access to record or call. Voice calls use WebRTC and may fail on restrictive networks because a TURN relay is not included. Microphone and location access require localhost or HTTPS.

Google sign-in is available after the operator connects Firebase. Phone verification and an account-deletion screen are not implemented. Google manages your Google account password and recovery.

## Guest use

**Continue without signing in** opens local browsing. Guest edits stay in that browser and are not shared with other users. Clearing site data removes them. Guest data is not imported when you create an account. Sign out before letting another person use the same browser.

## Troubleshooting

- **Cannot open the page:** check Docker Desktop, then run `docker compose ps` and `docker compose logs backend` in the project folder.
- **No people:** sign in with a second Google account in a private browser window and add a category profile. No sample users are seeded.
- **Not syncing:** check your connection, wait a few seconds, and sign in again if your Firebase session expired or was revoked. Unsaved local changes are not a guaranteed offline queue.
- **Map/fonts missing:** the original interface loads map libraries, map tiles, place search and fonts from external services. These require internet access.
- **Cannot access your Google account:** use Google account recovery. This app does not store a Google password.

For development, API details, database operations, and deployment notes, read `README1.md`.
