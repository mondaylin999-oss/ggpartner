# GG Partner

**Find the person who is free when you are.**

A partner-finder for the things you actually want company for — a ranked duo at
9pm, a gym partner at the same gym, someone to sit across from in the library.
It shows you who is nearby and free *right now*, and gets you talking.

**Live:** [ggpartner.netlify.app](https://ggpartner.netlify.app)

University web project · Team of 4

---

## The idea

Most plans die in the gap between "free" and "free at the same time as you".
GG Partner treats a useful match as four signals that all have to line up:

| Signal | Means |
| --- | --- |
| **Interest** | You both want the same activity |
| **Time** | Your free windows actually overlap |
| **Place** | Close enough to turn up |
| **Fit** | Rank, level and pace that work together |

Every card shows a match score *and the four reasons behind it*, so the number is
never a black box.

## What it does

- **Eight categories** — game, gym, study, hangout, projects, language, hobbies,
  travel. One profile per thing you're into, each asking its own questions:
  Game wants rank and role, Study wants subject and level, Travel wants dates
  and a destination.
- **A live map** with presence, showing who is nearby and available now.
- **Ghost mode** — disappear from the map in one switch while staying in
  Discover and keeping your profile browsable.
- **Event lobbies** for when a pair isn't enough: a five-stack, a running group,
  four for a study table. Open a lobby with slots and watch it fill.
- **Text, voice notes and peer-to-peer voice calls**, plus links out to Discord,
  Instagram, Telegram or Facebook if you'd rather move the conversation.
- **Verified members** via phone number, with a filter for verified only.

## Privacy

The app is built to hand out as little as possible:

- Your public card carries a point **rounded to about a kilometre**, never an
  address. Your exact position is readable only by people you have matched with.
- **Location sharing expires** on a timer you set — 15 minutes or an hour — and
  stops itself.
- **Blocking is instant and mutual**: they leave your list and you leave theirs.
- GG Partner never asks for a password, a code, or payment details.

## Built with

Plain **HTML, CSS and JavaScript** — no front-end framework, no bundler, no build
step beyond copying files.

| | |
| --- | --- |
| Auth | Firebase Authentication (Google sign-in) |
| Data | Cloud Firestore |
| Map | Leaflet + OpenStreetMap / CARTO tiles |
| Calls | WebRTC, peer to peer, Firestore used only for signalling |
| Icons | Lucide |
| Hosting | Netlify |

The interface is themed as a pixel arcade — gold and violet on near-black, with
Press Start 2P and Silkscreen for chrome. Body copy stays in a normal sans on
purpose: a pixel face at 14px is not readable across a paragraph.

## Layout

```
src/
  index.html        markup
  styles.css        all styling, including the pixel theme layer
  app.js            the whole application
  firestore.rules   security rules — paste into the Firebase console
build.sh            copies src/ into dist/ and writes a version stamp
_headers            Netlify cache rules
```

Two scripts stay inline in `index.html` deliberately: the JSON-LD block, and a
nine-line script that sets `app-mode` before first paint so returning members
don't watch the landing page flash past.

## Running it

Any static server will do — there is nothing to install and nothing to compile.

```sh
./build.sh
cd dist && python3 -m http.server 8000
```

Then open `http://localhost:8000`.

To point it at your own Firebase project, replace `FIREBASE_CONFIG` near the top
of `src/app.js`, then in the Firebase console:

1. **Authentication → Sign-in method** — enable Google.
2. **Authentication → Settings → Authorised domains** — add your domain.
3. **Firestore Database** — create the database.
4. **Firestore Database → Rules** — paste `src/firestore.rules` and publish.

Step 4 matters: the app reads six collections (`profiles`, `users`, `threads`,
`precise`, `calls`, `events`), and rules that miss any of them make the matching,
calls or map fail silently.

The Firebase web config in the source is public on purpose — it identifies the
project and grants nothing. The real gate is Authentication plus the Firestore
rules.

## Deploying

`build.sh` writes a version stamp hashed from all three source files together, so
the app only prompts a reload when something actually changed.

```sh
./build.sh
netlify deploy --dir=dist --prod
```
