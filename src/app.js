(function () {
"use strict";

/* ==================================================================
   MAP
   The map uses Leaflet with OpenStreetMap tiles. There is no API key,
   no Google Cloud project and no billing account involved — it simply
   works when the page is online. Tile servers are chosen below.
   ================================================================== */
var TILES = {
  /* Satellite imagery, free and keyless, from Esri. A second
     transparent layer draws place names and roads on top, which is
     what makes Snapchat's satellite view readable rather than a
     featureless green blur. */
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 19,
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
  },
  /* OpenStreetMap's own tiles: the most place names and shop labels of
     the free sets, which is what makes the map feel like a maps app
     rather than an outline of the coast. */
  light: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    retina: false
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

/* ==================================================================
   FIREBASE
   Sign in with Google, and keep your profile, likes, matches and
   chats on Google's servers instead of only in this browser.

   Where these values come from:
     Firebase console -> Project settings -> General -> Your apps ->
     the web app -> "SDK setup and configuration" -> Config.
   They are public on purpose: they identify the project, they do not
   grant access. The real gate is Firebase Authentication plus the
   Firestore security rules.

   Before it will work you must also:
     1. Authentication -> Sign-in method -> enable Google.
     2. Authentication -> Settings -> Authorised domains -> add the
        domain you serve this page from (localhost is already there).
     3. Firestore Database -> Create database.
     4. Firestore Database -> Rules -> paste the contents of
        firestore.rules (next to this file) and press Publish.

   Collections used:
     profiles/{uid}                   public member card (the directory)
     users/{uid}                      your private state: likes, matches
     threads/{a__b}/messages/{id}     a conversation between two members

   Leave FIREBASE_CONFIG.apiKey empty to turn all of this off; the app
   then runs exactly as before, saving only to this browser.
   ================================================================== */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyA7P-dMbGSnJwYCpSXsXUo08aQr1TISx4g",
  authDomain: "gg-partner-f8d94.firebaseapp.com",
  projectId: "gg-partner-f8d94",
  storageBucket: "gg-partner-f8d94.firebasestorage.app",
  messagingSenderId: "107058983330",
  appId: "1:107058983330:web:6390529fb76df8b2ba02fb"
};

/* ==================================================================
   1. STATIC DATA
   ================================================================== */

/* `placeHint` is the prompt shown in the place picker, and `placeTerms`
   are what we search OpenStreetMap for when you tap "near me". */
/* ==================================================================
   1b. GAMES

   The ladders, lanes and rosters below are the real ones, checked in
   September 2026 against each game's own material and the references
   noted per game. They drive three things at once: the game block in a
   profile, the smart filters in Discover, and the rank badge on a card.
   `stars` marks a ladder where the top tiers are counted in stars or
   points rather than divisions (MLBB Mythic, Honor of Kings Grandmaster).
   Ranks are listed low to high \u2014 the order is what "this rank or above"
   filtering compares.
   ================================================================== */

var REGIONS = ["SEA", "East Asia", "South Asia", "MENA", "Europe",
               "North America", "LATAM", "Brazil", "Oceania", "Africa"];

var GAMES = [
  /* Wikipedia: Mobile Legends: Bang Bang (lanes, classes, 133 heroes).
     Roster from mlbbhub.com, September 2026. */
  { id:"mlbb", name:"Mobile Legends: Bang Bang", short:"MLBB",
    stars:true, starLabel:"Stars",
    ranks:["Warrior","Elite","Master","Grandmaster","Epic","Legend",
           "Mythic","Mythical Honor","Mythical Glory","Mythical Immortal"],
    roles:["Roamer","Jungler","Mid laner","Gold laner","EXP laner"],
    heroLabel:"Main heroes",
    heroes:[
      "Aamon","Akai","Aldous","Alice","Alpha","Alucard","Angela","Argus","Arlott","Atlas",
      "Aulus","Aurora","Badang","Balmond","Bane","Barats","Baxia","Beatrix","Belerick",
      "Benedetta","Brody","Bruno","Carmilla","Cecilion","Chang'e","Chip","Chou","Cici","Claude",
      "Clint","Cyclops","Diggie","Dyrroth","Edith","Esmeralda","Estes","Eudora","Fanny",
      "Faramis","Floryn","Franco","Fredrinn","Freya","Gatotkaca","Gloo","Gord","Granger",
      "Grock","Guinevere","Gusion","Hanabi","Hanzo","Harith","Harley","Hayabusa","Helcurt",
      "Hilda","Hirara","Hylos","Irithel","Ixia","Jawhead","Johnson","Joy","Julian","Kadita",
      "Kagura","Kaja","Kalea","Karina","Karrie","Khaleed","Khufra","Kimmy","Lancelot",
      "Lapu-Lapu","Layla","Leomord","Lesley","Ling","Lolita","Lukas","Lunox","Luo Yi","Lylia",
      "Marcel","Martis","Masha","Mathilda","Melissa","Minotaur","Minsitthar","Miya","Moskov",
      "Nana","Natalia","Natan","Nolan","Novaria","Obsidia","Odette","Paquito","Pharsa",
      "Phoveus","Popol and Kupa","Rafaela","Roger","Ruby","Saber","Selena","Silvanna","Sora",
      "Sun","Suyou","Terizla","Thamuz","Tigreal","Uranus","Vale","Valentina","Valir","Vexana",
      "Wanwan","X.Borg","Xavier","Yi Sun-shin","Yin","Yu Zhong","Yve","Zetian","Zhask","Zhuxin",
      "Zilong"
    ] },

  { id:"hok", name:"Honor of Kings", short:"HoK",
    stars:true, starLabel:"Stars",
    ranks:["Bronze","Silver","Gold","Platinum","Diamond","Master",
           "Grandmaster","Grandmaster Mythic","Grandmaster Epic","Grandmaster Legend"],
    roles:["Roam","Jungle","Mid lane","Farm lane","Clash lane"],
    heroLabel:"Main heroes", heroes:[] },

  /* Nine tiers, three sub-tiers each up to Ascendant; Radiant is the
     capped top of each region. 29 agents across four roles. */
  { id:"valorant", name:"Valorant", short:"VAL",
    stars:false,
    ranks:["Iron","Bronze","Silver","Gold","Platinum","Diamond",
           "Ascendant","Immortal","Radiant"],
    roles:["Duelist","Initiator","Controller","Sentinel","Flex"],
    heroLabel:"Main agents",
    heroes:[
      "Astra","Breach","Brimstone","Chamber","Clove","Cypher","Deadlock","Fade","Gekko",
      "Harbor","Iso","Jett","KAY/O","Killjoy","Miks","Neon","Omen","Phoenix","Raze","Reyna",
      "Sage","Skye","Sova","Tejo","Veto","Viper","Vyse","Waylay","Yoru"
    ] },

  { id:"lol", name:"League of Legends", short:"LoL",
    stars:false,
    ranks:["Iron","Bronze","Silver","Gold","Platinum","Emerald","Diamond",
           "Master","Grandmaster","Challenger"],
    roles:["Top","Jungle","Mid","Bot / ADC","Support"],
    heroLabel:"Main champions", heroes:[] },

  { id:"wildrift", name:"LoL: Wild Rift", short:"WR",
    stars:false,
    ranks:["Iron","Bronze","Silver","Gold","Platinum","Emerald","Diamond",
           "Master","Grandmaster","Challenger"],
    roles:["Baron lane","Jungle","Mid lane","Dragon lane","Support"],
    heroLabel:"Main champions", heroes:[] },

  /* Eight medals, five stars each below Immortal; positions 1\u20135. */
  { id:"dota2", name:"Dota 2", short:"Dota",
    stars:true, starLabel:"Stars",
    ranks:["Herald","Guardian","Crusader","Archon","Legend","Ancient","Divine","Immortal"],
    roles:["Pos 1 \u00b7 Carry","Pos 2 \u00b7 Mid","Pos 3 \u00b7 Offlane",
           "Pos 4 \u00b7 Soft support","Pos 5 \u00b7 Hard support"],
    heroLabel:"Signature heroes", heroes:[] },

  /* Premier is one rating split into seven colour tiers. */
  { id:"cs2", name:"Counter-Strike 2", short:"CS2",
    stars:false,
    ranks:["Grey \u00b7 under 5k","Light blue \u00b7 5k","Blue \u00b7 10k","Purple \u00b7 15k",
           "Pink \u00b7 20k","Red \u00b7 25k","Gold \u00b7 30k+"],
    roles:["Entry","AWPer","Lurker","Support","In-game leader"],
    heroLabel:"Best maps", heroes:[] },

  { id:"pubgm", name:"PUBG Mobile", short:"PUBGM",
    stars:false,
    ranks:["Bronze","Silver","Gold","Platinum","Diamond","Crown",
           "Ace","Ace Master","Ace Dominator","Conqueror"],
    roles:["Fragger","Support","Sniper","Scout","In-game leader"],
    heroLabel:"Best maps", heroes:[] },

  { id:"freefire", name:"Free Fire", short:"FF",
    stars:false,
    ranks:["Bronze","Silver","Gold","Platinum","Diamond","Heroic","Master","Grandmaster"],
    roles:["Rusher","Support","Sniper","In-game leader"],
    heroLabel:"Main characters", heroes:[] },

  { id:"marvelrivals", name:"Marvel Rivals", short:"Rivals",
    stars:false,
    ranks:["Bronze","Silver","Gold","Platinum","Diamond","Grandmaster",
           "Celestial","Eternity","One Above All"],
    roles:["Vanguard","Duelist","Strategist"],
    heroLabel:"Main heroes", heroes:[] },

  { id:"ow2", name:"Overwatch 2", short:"OW2",
    stars:false,
    ranks:["Bronze","Silver","Gold","Platinum","Diamond","Master",
           "Grandmaster","Champion","Top 500"],
    roles:["Tank","Damage","Support"],
    heroLabel:"Main heroes", heroes:[] },

  { id:"apex", name:"Apex Legends", short:"Apex",
    stars:false,
    ranks:["Rookie","Bronze","Silver","Gold","Platinum","Diamond","Master","Apex Predator"],
    roles:["Fragger","In-game leader","Support","Recon"],
    heroLabel:"Main legends", heroes:[] },

  /* Anything not on the list still gets a profile and still shows up in
     search \u2014 it just has no ladder to compare against. */
  { id:"other", name:"Another game", short:"",
    stars:false, ranks:[], roles:[], heroLabel:"Mains", heroes:[] }
];

function gameByName(name) {
  for (var i = 0; i < GAMES.length; i++) if (GAMES[i].name === name) return GAMES[i];
  return null;
}
/* Where a rank sits on its ladder, so "Mythic or above" is one compare. */
function rankIndex(gameName, rank) {
  var g = gameByName(gameName);
  if (!g) return -1;
  return g.ranks.indexOf(rank);
}

var CATEGORIES = [
  { slug: "all",      label: "Everything", emoji: "✦", icon: "sparkles" },
  { slug: "gaming",   label: "Game",       emoji: "🎮", icon: "gamepad-2",
    /* "list" repeats a group of fields \u2014 one block per game. The rank,
       role, region and hero options come from GAMES, so picking Mobile
       Legends offers Mythical Immortal and Roamer, not Radiant. */
    fields: [
      { id: "games", label: "Games you play", type: "list", addLabel: "Add a game",
        item: [
          { id: "game",    label: "Game",         type: "game" },
          { id: "rank",    label: "Rank",         type: "select", from: "ranks" },
          { id: "stars",   label: "Stars",        type: "number", ph: "120", when: "stars" },
          { id: "role",    label: "Role",         type: "select", from: "roles" },
          { id: "region",  label: "Server",       type: "select", from: "regions" },
          { id: "heroes",  label: "Mains",        type: "tags",   from: "heroes",
            ph: "Fanny, Ling" },
          { id: "matches", label: "Matches",      type: "number", ph: "1200" },
          { id: "winrate", label: "Win rate %",   type: "number", ph: "58" },
          { id: "ign",     label: "In-game name", type: "text",   ph: "Ava#1234" },
          { id: "gid",     label: "Game ID",      type: "text",   ph: "Friend code / UID" }
        ] },
      { id: "platform", label: "Platform", type: "multi",
        options: ["PC", "PlayStation", "Xbox", "Mobile", "Switch"] },
      { id: "voice", label: "Voice chat", type: "select",
        options: ["Always", "Sometimes", "Text only"] },
      { id: "looking", label: "Looking for", type: "select",
        options: ["Ranked duo", "Full five-stack", "Scrims / tournaments",
                  "Casual games", "Coaching", "Someone to teach"] }
    ],
    placeHint: "Your usual internet caf\u00e9 or esports venue",
    placeTerms: ["internet cafe", "gaming cafe", "esports"] },
  { slug: "fitness",  label: "Gym",        emoji: "🏋", icon: "dumbbell",
    fields: [
      { id: "activity", label: "Activities", type: "multi",
        options: ["Weightlifting","Running","Cycling","Swimming","Climbing","Yoga","Boxing","Basketball","Football","Badminton","Tennis"] },
      { id: "level", label: "Level", type: "select",
        options: ["Just starting","Novice","Regular","Advanced","Athlete"] },
      { id: "goal", label: "Goal", type: "select",
        options: ["Lose weight","Build muscle","Endurance","Stay consistent","Compete"] },
      { id: "days", label: "Usual days", type: "text", ph: "Mon / Wed / Fri, early" }
    ],
    placeHint: "Your gym, park or pool",
    placeTerms: ["gym", "fitness centre", "park", "swimming pool"] },
  { slug: "study",    label: "Study",      emoji: "📚", icon: "book-open",
    fields: [
      { id: "subject", label: "Subject", type: "text", ph: "Data structures, Calculus II" },
      { id: "level", label: "Level", type: "select",
        options: ["High school","Undergraduate","Postgraduate","Self-taught"] },
      { id: "exam", label: "Exam or deadline", type: "text", ph: "Finals in May" },
      { id: "format", label: "Format", type: "select", options: ["Online calls","In person","Either"] },
      { id: "style", label: "Study style", type: "multi",
        options: ["Pomodoro","Silent co-working","Discussion","Quizzing","Past papers"] }
    ],
    placeHint: "Where you study \u2014 library, caf\u00e9, campus",
    placeTerms: ["library", "cafe", "university"] },
  { slug: "hangout",  label: "Hangout",    emoji: "☕", icon: "coffee",
    fields: [
      { id: "vibe", label: "What you are up for", type: "multi",
        options: ["Coffee","Food","Bar","Walk","Board games","Live music","Cinema","Markets"] },
      { id: "when", label: "Usually free", type: "select",
        options: ["Weekday evenings","Weekends","Daytime","Anytime"] }
    ],
    placeHint: "Your spot \u2014 caf\u00e9, bar, mall",
    placeTerms: ["cafe", "bar", "restaurant", "mall"] },
  { slug: "projects", label: "Projects",   emoji: "🛠", icon: "wrench",
    fields: [
      { id: "stack", label: "Stack / skills", type: "multi",
        options: ["HTML/CSS","JavaScript","TypeScript","React","Node.js","Python","PHP","Java","C#","Flutter","UI/UX design","Databases"] },
      { id: "role", label: "You cover", type: "select",
        options: ["Frontend","Backend","Full stack","Design","Product","Anything"] },
      { id: "looking", label: "Looking for", type: "select",
        options: ["Teammate","Mentor","Mentee","Co-founder","Hackathon squad"] },
      { id: "hours", label: "Hours per week", type: "select", options: ["1-5","5-10","10-20","20+"] }
    ],
    placeHint: "Coworking space or caf\u00e9 you build from",
    placeTerms: ["coworking", "cafe", "library"] },
  { slug: "language", label: "Language",   emoji: "🗣", icon: "languages",
    fields: [
      { id: "native", label: "You speak natively", type: "text", ph: "Filipino, English" },
      { id: "learning", label: "You want to learn", type: "text", ph: "Japanese" },
      { id: "level", label: "Your level in it", type: "select", options: ["A1","A2","B1","B2","C1+"] },
      { id: "practice", label: "Practise through", type: "multi",
        options: ["Voice calls","Video calls","Text chat","Meeting up"] }
    ],
    placeHint: "Where you like to meet and practise",
    placeTerms: ["cafe", "library", "community centre"] },
  { slug: "hobbies",  label: "Hobbies",    emoji: "🎨", icon: "palette",
    fields: [
      { id: "hobby", label: "Hobbies", type: "multi",
        options: ["Guitar","Piano","Singing","Chess","Board games","Photography","Drawing","Cooking","Reading","Film","Dancing"] },
      { id: "level", label: "Level", type: "select",
        options: ["Curious","Beginner","Hobbyist","Skilled","Serious"] },
      { id: "gear", label: "Gear / setup", type: "text", ph: "Optional" }
    ],
    placeHint: "Studio, club or shop you go to",
    placeTerms: ["music studio", "art studio", "community centre"] },
  { slug: "travel",   label: "Travel",     emoji: "✈", icon: "plane",
    fields: [
      { id: "destination", label: "Where to", type: "text", ph: "El Nido, Coron" },
      { id: "when", label: "Rough dates", type: "text", ph: "March 2027, flexible" },
      { id: "style", label: "Budget style", type: "select",
        options: ["Backpacker","Budget","Mid-range","Comfort"] }
    ],
    placeHint: "Where you are headed",
    placeTerms: ["attraction", "station", "airport"] }
];

/* Arcade palette: everyone lands somewhere in the gold-and-violet
   family, with a mint and a rose so faces still tell apart. */
var HUES = ["#7C4CBE", "#D19A23", "#A75FD0", "#E0A93C", "#2E9E86", "#5B2FA0", "#C4536B", "#8A5A10"];

/* Real members only. This starts empty and is filled from Firestore
   with the profiles of people who have signed in with Google. Nobody
   is invented — if the list is empty, nobody has joined yet. */
var PEOPLE = [];
var directoryLoaded = false;

/* ==================================================================
   2. STATE
   ================================================================== */

var STORE_KEY = "ggpartner.frontend.v1";
/* The app used to be called PairUp. Anything saved under the old key is
   carried over once, so a rename does not wipe somebody's local state. */
var LEGACY_STORE_KEY = "pairup.frontend.v1";

var defaultState = {
  theme: "dark",
  mapStyle: "map",      // "map" or "satellite"
  askedLocation: false, // have we offered the location prompt yet?
  filter: "all",
  seen: [],          // person ids already decided on
  passed: [],
  liked: [],
  matches: [],
  declined: [],      // invites you turned down, so they stop asking
  myEvents: [],      // lobbies you host or joined, kept for offline
  threads: {},       // id -> [{ id, from:"me"|"them", kind, text, audio, dur, t, delivered, seen }]
  read: {},          // id -> message count already read
  blocked: [],       // uids you have blocked; hidden both ways
  reported: [],      // uids you have already reported, so the button can say so
  me: {
    name: "Alex Rivera",
    age: 27,
    gender: "",
    height: "",
    career: "",
    city: "Lisbon",
    lat: 38.7223,
    lng: -9.1393,
    locLabel: "Lisbon (default)",
    sharing: true,     // ghost mode when false
    live: false,       // continuous tracking
    liveUntil: 0,      // 0 = until switched off, else a timestamp
    lastFix: 0,
    profiles: {},   // categorySlug -> { headline, bio, tags, avail }  (one each)
    headline: "Up for most things, good at showing up",
    bio: "Front-end dev by day. Looking for a gym partner and someone to practise Portuguese with. I reply fast and I don't flake.",
    tags: ["Fitness", "Language", "Projects"],
    notify: true,
    nearby: true,
    online: true,
    photo: "",         // data: URI, or the Google avatar
    /* Where else people can reach you. Handles are stored bare, without
       the @ or the full URL, and turned into links when drawn. */
    links: { discord: "", instagram: "", facebook: "", telegram: "", phone: "" },
    /* Phone is the one contact detail matched-only by default, because
       it is the one that is hard to take back. */
    phonePublic: false,
    phoneVerified: false,
    /* Structured availability: days 0-6 (Sun first) and blocks. The free
       text note stays as `avail` so nothing already typed is lost. */
    days: [],
    blocks: [],
    freeNow: false,
    lastActive: 0,
    joined: 0          // first time this account published a card
  }
};

var state = load();

function load() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORE_KEY);
      if (raw) localStorage.setItem(STORE_KEY, raw);
    }
    if (!raw) return clone(defaultState);
    var saved = JSON.parse(raw);
    var s = clone(defaultState);
    Object.keys(saved).forEach(function (k) {
      if (k === "me") {
        s.me = Object.assign({}, s.me, saved.me || {});
        s.me.profiles = (saved.me && saved.me.profiles) || {};
      }
      else if (k in s) { s[k] = saved[k]; }
    });
    return s;
  } catch (e) {
    return clone(defaultState);
  }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ==================================================================
   3. SMALL HELPERS
   ================================================================== */

function byId(id) { return document.getElementById(id); }
function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function personById(id) {
  for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].id === id) return PEOPLE[i];
  return null;
}
function categoryBySlug(slug) {
  for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
  return CATEGORIES[0];
}
function initials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2)
    .map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
}
/* Deterministic colour so a person always looks the same. */
function hueFor(seed) {
  var n = 0;
  for (var i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return HUES[n % HUES.length];
}
/* Draw a sprite icon. `name` is a Lucide id without the `i-` prefix; the
   optional class carries a size modifier (lg/xl). Icons are decorative
   here \u2014 every one of them sits next to a label or an aria-label. */
/* ==================================================================
   3c. AVATARS, VERIFICATION, MODERATION, ALERTS
   ================================================================== */

/* A real photo when there is one, initials when there is not. The photo
   is either the Google avatar or a small square the member uploaded,
   which is stored as a data: URI on the profile card. */
function avatarFor(p, size, extraStyle) {
  var src = p && p.photo;
  if (!src) return avatarHTML(p ? p.name : "?", p ? p.id : "?", size, extraStyle);
  /* Square, like every other avatar in the arcade skin — the corner
     cut comes from the .avatar rule in the stylesheet. */
  return '<img class="avatar photo" src="' + esc(src) + '" alt="" loading="lazy" ' +
    'style="width:' + size + 'px;height:' + size + 'px;object-fit:cover;' +
    (extraStyle || '') + '">';
}

/* Verification here means one specific, checkable thing: this member
   proved they control a phone number, through Firebase. It is not an
   identity check and the wording never pretends otherwise. */
function verifiedHTML(p, compact) {
  if (!p) return "";
  if (p.phoneVerified) {
    return '<span class="vbadge" title="Phone number verified">' + ic("shield-check") +
      (compact ? "" : "Verified") + '</span>';
  }
  return compact ? "" : '<span class="vbadge no" title="No phone number verified">' +
    ic("shield-alert") + 'Unverified</span>';
}

/* ---- report and block -------------------------------------------- */

var REPORT_REASONS = [
  "Harassment or abuse",
  "Fake or impersonating someone",
  "Spam or scam",
  "Sexual or explicit content",
  "Someone underage",
  "Something else"
];

function reportDialog(id) {
  var p = personById(id);
  if (!p) return;
  var already = (state.reported || []).indexOf(id) !== -1;
  openModal(
    '<div class="pehead"><h2 id="modalTitle">Report ' + esc(p.name) + '</h2>' +
      '<button type="button" class="icobtn del" data-act="close-modal" aria-label="Close">' + ic("x") + '</button></div>' +
    '<div class="pebody">' +
      (already ? '<p class="profhint">You have reported this member before. Sending another report is fine.</p>' : '') +
      '<p class="profhint">Reports go to the moderation queue with your account attached, ' +
        'so please only report things that actually happened.</p>' +
      '<div class="field"><label for="rep-why">What happened?</label>' +
        '<select class="sel" id="rep-why">' +
          REPORT_REASONS.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join("") +
        '</select></div>' +
      '<div class="field"><label for="rep-note">Anything else (optional)</label>' +
        '<textarea id="rep-note" maxlength="400" placeholder="What you saw, and roughly when."></textarea></div>' +
      '<label class="ctl"><input type="checkbox" id="rep-block" checked> ' +
        'Block them as well</label>' +
    '</div>' +
    '<div class="pefoot">' +
      '<button class="btn" data-act="close-modal">Cancel</button>' +
      '<button class="btn primary" id="rep-send">Send report</button>' +
    '</div>', "profedit");

  byId("rep-send").addEventListener("click", function () {
    var reason = byId("rep-why").value;
    var note = byId("rep-note").value.trim();
    var alsoBlock = byId("rep-block").checked;
    sendReport(id, reason, note);
    if (alsoBlock) blockUser(id, true);
    closeModal();
    toast(alsoBlock ? "Reported and blocked" : "Report sent");
  });
}

function sendReport(id, reason, note) {
  if (state.reported.indexOf(id) === -1) state.reported.push(id);
  save();
  if (!cloud.on || !cloud.user) return;
  cloud.db.collection("reports").add({
    reporter: cloud.user.uid,
    reported: id,
    reason: reason || "",
    note: (note || "").slice(0, 400),
    t: Date.now()
  }).catch(function () { /* the local record stands either way */ });
}

function blockUser(id, quiet) {
  if (state.blocked.indexOf(id) === -1) state.blocked.push(id);
  /* Blocking is not a match. Remove every trace of the connection. */
  state.matches = state.matches.filter(function (m) { return m !== id; });
  state.liked = state.liked.filter(function (m) { return m !== id; });
  save();
  publishProfile();
  PEOPLE = PEOPLE.filter(function (x) { return x.id !== id; });
  closeModal();
  if (current.view === "chat" && current.chatWith === id) go("discover");
  else render();
  if (!quiet) toast("Blocked — you will not see each other again");
}

function unblockUser(id) {
  state.blocked = state.blocked.filter(function (b) { return b !== id; });
  save();
  publishProfile();
  render();
  toast("Unblocked");
}

/* ---- alerts -------------------------------------------------------
   The "New pair alerts" switch used to set a flag nothing read. It now
   asks the browser for permission and raises a notification while the
   tab is in the background. Notifications with the tab fully closed
   would need Firebase Cloud Messaging and a server to send them, which
   this build deliberately does not have. */
var lastSeenMsgAt = {};

function alertsAllowed() {
  return !!(window.Notification && Notification.permission === "granted" && state.me.notify);
}

function askAlertPermission() {
  if (!window.Notification) { toast("This browser has no notifications"); return; }
  if (Notification.permission === "granted") { toast("Alerts are on"); return; }
  if (Notification.permission === "denied") {
    toast("Notifications are blocked for this site in your browser settings");
    return;
  }
  Notification.requestPermission().then(function (r) {
    toast(r === "granted" ? "Alerts are on" : "Alerts stay off");
  });
}

function raiseAlert(title, body, onClick) {
  if (!alertsAllowed() || !document.hidden) return;
  try {
    var n = new Notification(title, { body: body, tag: "ggpartner", renotify: false });
    n.onclick = function () { window.focus(); n.close(); if (onClick) onClick(); };
  } catch (e) { /* some browsers refuse outside a user gesture */ }
}

function notifyNewMessages(otherUid, msgs) {
  var last = msgs[msgs.length - 1];
  if (!last || last.from !== "them") return;
  if (lastSeenMsgAt[otherUid] && last.t <= lastSeenMsgAt[otherUid]) return;
  lastSeenMsgAt[otherUid] = last.t;
  var p = personById(otherUid);
  var name = p ? p.name : "Someone";
  var text = last.kind === "voice" ? "Voice message" : last.text;
  raiseAlert(name, text, function () { go("chat", otherUid); });
}

/* ==================================================================
   3b. PRESENCE, CONTACT LINKS, MATCH SCORE
   ================================================================== */

/* How long since someone's client last checked in. The heartbeat runs
   every 90s while a tab is visible, so "active now" means "within the
   last five minutes" rather than "this exact second".

   These two numbers are the whole presence system, and they are also
   its running cost: one Firestore write per member per beat. At 90s a
   member with the tab open all day costs about 320 writes, so the free
   tier's 20,000 a day covers roughly 60 people online at once. Raise
   BEAT_MS if that ceiling ever gets close; keep PRESENCE_FRESH at
   about three times it so a single missed beat does not make someone
   look like they left. */
var BEAT_MS = 90000;
var PRESENCE_FRESH = 5 * 60 * 1000;

function isActiveNow(p) {
  return !!(p && p.lastActive && Date.now() - p.lastActive < PRESENCE_FRESH);
}

function agoLabel(ms) {
  var d = Math.max(0, Date.now() - ms);
  var m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
  var h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  var days = Math.floor(h / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return days + " days ago";
  var w = Math.floor(days / 7);
  if (w < 5) return w + (w === 1 ? " week ago" : " weeks ago");
  return "a long time ago";
}

/* The line under a name. Returns "" when we have never heard from them,
   because "last active never" reads worse than nothing at all. */
function presenceLabel(p) {
  if (isActiveNow(p)) return "Active now";
  if (p && p.lastActive) return "Last active " + agoLabel(p.lastActive);
  return "";
}

function presenceHTML(p) {
  var label = presenceLabel(p);
  if (!label) return "";
  var now = isActiveNow(p);
  return '<span class="presence' + (now ? " on" : "") + '">' +
    '<i aria-hidden="true"></i>' + esc(label) + '</span>';
}

/* ---- contact links ---------------------------------------------- */

/* Everything is stored as a bare handle. These build the outward link
   at draw time, so a saved profile never contains a URL that rots. */
var LINK_KINDS = [
  { id: "discord",   label: "Discord",   icon: "b-discord",
    ph: "yourname", url: null, hint: "Username, not an invite link" },
  { id: "instagram", label: "Instagram", icon: "b-instagram",
    ph: "yourname", url: "https://instagram.com/" },
  { id: "facebook",  label: "Facebook",  icon: "b-facebook",
    ph: "yourname", url: "https://facebook.com/" },
  { id: "telegram",  label: "Telegram",  icon: "b-telegram",
    ph: "yourname", url: "https://t.me/" },
  { id: "phone",     label: "Phone",     icon: "phone",
    ph: "+63 912 345 6789", url: "tel:", priv: true }
];

function linkKind(id) {
  for (var i = 0; i < LINK_KINDS.length; i++) if (LINK_KINDS[i].id === id) return LINK_KINDS[i];
  return null;
}

/* Strip whatever someone pasted back down to a handle: leading @, a full
   profile URL, trailing slashes. Phone keeps its digits and +. */
function cleanHandle(id, raw) {
  var v = String(raw || "").trim();
  if (!v) return "";
  if (id === "phone") return v.replace(/[^\d+ ()-]/g, "").slice(0, 24);
  v = v.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  v = v.replace(/^(instagram\.com|facebook\.com|fb\.com|t\.me|telegram\.me|discord\.com\/users)\//i, "");
  v = v.replace(/^@/, "").replace(/[/?#].*$/, "");
  return v.slice(0, 40);
}

function linkURL(id, handle) {
  var k = linkKind(id);
  if (!k || !handle) return "";
  if (id === "phone") return "tel:" + handle.replace(/[^\d+]/g, "");
  if (!k.url) return "";
  return k.url + encodeURIComponent(handle);
}

/* Which of someone's links you are allowed to see. A phone number is
   matched-only unless its owner ticked the box that makes it public. */
function visibleLinks(p) {
  var links = (p && p.links) || {};
  var matched = state.matches.indexOf(p.id) !== -1;
  return LINK_KINDS.filter(function (k) {
    if (!links[k.id]) return false;
    if (k.priv && !p.phonePublic && !matched) return false;
    return true;
  }).map(function (k) {
    return { kind: k, handle: links[k.id], url: linkURL(k.id, links[k.id]) };
  });
}

function linksHTML(p) {
  var list = visibleLinks(p);
  var hiddenPhone = p && p.links && p.links.phone && !p.phonePublic &&
                    state.matches.indexOf(p.id) === -1;
  if (!list.length && !hiddenPhone) return "";
  var out = list.map(function (l) {
    var inner = ic(l.kind.icon, l.kind.icon.indexOf("b-") === 0 ? "brand" : "") +
      '<span>' + esc(l.handle) + '</span>';
    return l.url
      ? '<a class="clink" href="' + esc(l.url) + '" target="_blank" rel="noopener nofollow">' + inner + '</a>'
      : '<span class="clink">' + inner + '</span>';
  }).join("");
  if (hiddenPhone) {
    out += '<span class="clink off">' + ic("phone") + '<span>Phone — match first</span></span>';
  }
  return '<div class="clinks">' + out + '</div>';
}

/* ---- availability ------------------------------------------------ */

var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var TIME_BLOCKS = [
  { id: "morning",   label: "Morning",   from: 6,  to: 12 },
  { id: "afternoon", label: "Afternoon", from: 12, to: 17 },
  { id: "evening",   label: "Evening",   from: 17, to: 22 },
  { id: "late",      label: "Late",      from: 22, to: 30 }
];

function blockNow() {
  var h = new Date().getHours();
  for (var i = 0; i < TIME_BLOCKS.length; i++) {
    var b = TIME_BLOCKS[i];
    if (b.to > 24) { if (h >= b.from || h < b.to - 24) return b.id; }
    else if (h >= b.from && h < b.to) return b.id;
  }
  return "late";
}

/* Do the two of you have any free time in common? Used by the score and
   by the "free when I am" filter. */
function availOverlap(p) {
  var mine = state.me, theirs = p || {};
  var myDays = mine.days || [], theirDays = theirs.days || [];
  var myBlocks = mine.blocks || [], theirBlocks = theirs.blocks || [];
  if (!myDays.length || !theirDays.length || !myBlocks.length || !theirBlocks.length) return null;
  var days = myDays.filter(function (d) { return theirDays.indexOf(d) !== -1; });
  var blocks = myBlocks.filter(function (b) { return theirBlocks.indexOf(b) !== -1; });
  if (!days.length || !blocks.length) return { days: [], blocks: [], any: false };
  return { days: days, blocks: blocks, any: true };
}

function availLabel(p) {
  var days = (p.days || []), blocks = (p.blocks || []);
  if (!days.length && !blocks.length) return p.avail || "";
  var d = days.length === 7 ? "Any day"
        : days.length ? days.slice().sort().map(function (i) { return DAY_NAMES[i]; }).join(" ")
        : "";
  var b = blocks.map(function (id) {
    for (var i = 0; i < TIME_BLOCKS.length; i++) if (TIME_BLOCKS[i].id === id) return TIME_BLOCKS[i].label;
    return id;
  }).join(", ");
  return [d, b].filter(Boolean).join(" · ");
}

/* ---- match score -------------------------------------------------
   Five things, weighted, each one explainable in a sentence. The card
   shows the number; the profile sheet shows the reasons. */
function matchScore(p) {
  var why = [], pts = 0, max = 0;

  var myCats = Object.keys(state.me.profiles || {});
  var theirCats = p.cats || [];
  var shared = myCats.filter(function (c) { return theirCats.indexOf(c) !== -1; });
  max += 30;
  if (shared.length) {
    pts += Math.min(30, 18 + shared.length * 6);
    why.push({ good: true, text: shared.length === 1
      ? "You are both in " + esc(categoryBySlug(shared[0]).label)
      : "You share " + shared.length + " categories" });
  } else {
    why.push({ good: false, text: "No category in common yet" });
  }

  /* Same game beats same category: it is the difference between "we both
     play games" and "we both play the same one". */
  max += 22;
  var myGames = gameIdsOf(state.me), theirGames = gameIdsOf(p);
  var bothGames = myGames.filter(function (g) { return theirGames.indexOf(g) !== -1; });
  if (bothGames.length) {
    pts += 22;
    why.push({ good: true, text: "You both play " + esc(gameName(bothGames[0])) });
  } else if (myGames.length && theirGames.length) {
    why.push({ good: false, text: "Different games" });
  }

  max += 18;
  var ov = availOverlap(p);
  if (ov && ov.any) {
    pts += 18;
    why.push({ good: true, text: "Free at the same times" });
  } else if (ov) {
    why.push({ good: false, text: "Your free times do not overlap" });
  }

  max += 18;
  /* Someone in ghost mode has no point at all, and haversine would hand
     back NaN — which is not the same as "far away". */
  var km = (typeof p.lat === "number" && typeof p.lng === "number") ? distanceKm(p) : null;
  if (km != null && !isNaN(km)) {
    if (km <= 2)       { pts += 18; why.push({ good: true, text: "Under 2 km away" }); }
    else if (km <= 10) { pts += 13; why.push({ good: true, text: Math.round(km) + " km away" }); }
    else if (km <= 40) { pts += 7;  why.push({ good: true, text: Math.round(km) + " km away" }); }
    else               { why.push({ good: false, text: "Over 40 km away" }); }
  }

  max += 12;
  if (isActiveNow(p)) { pts += 12; why.push({ good: true, text: "Active right now" }); }
  else if (p.lastActive && Date.now() - p.lastActive < 86400000) { pts += 6; }

  var pct = max ? Math.round((pts / max) * 100) : 0;
  return { pct: Math.max(4, Math.min(99, pct)), why: why };
}

function gameIdsOf(who) {
  var out = [];
  var g = ((who.profiles || {}).gaming || {}).fields || {};
  var rows = g.games || [];
  if (Array.isArray(rows)) rows.forEach(function (r) { if (r && r.game) out.push(r.game); });
  return out;
}
function gameName(id) {
  for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i].name;
  return id;
}

function scoreBadgeHTML(p) {
  var s = matchScore(p);
  var tone = s.pct >= 70 ? "hi" : (s.pct >= 40 ? "mid" : "lo");
  return '<span class="mscore ' + tone + '" title="How well you two fit">' +
    '<b class="num">' + s.pct + '%</b> match</span>';
}

function ic(name, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' +
    '<use href="#i-' + name + '"></use></svg>';
}

function avatarHTML(name, seed, size, extraStyle) {
  var c = hueFor(seed || name);
  return '<div class="avatar" aria-hidden="true" style="width:' + size + 'px;height:' + size +
    'px;font-size:' + Math.round(size * 0.36) + 'px;background:linear-gradient(145deg,' + c +
    ',' + shade(c, -26) + ');' + (extraStyle || '') + '">' + esc(initials(name)) + '</div>';
}
function shade(hex, amt) {
  var n = parseInt(hex.slice(1), 16);
  var r = Math.min(255, Math.max(0, (n >> 16) + amt));
  var g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  var b = Math.min(255, Math.max(0, (n & 255) + amt));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function timeNow() {
  var d = new Date();
  return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
}

var toastTimer;
/* An in-app banner for things that happen while you are looking at the
   app, where an OS notification would never fire. Tapping it takes you
   to whatever it is about. */
var notifTimer = null;

function notify(title, body, onClick) {
  var el = byId("notif");
  if (!el) return;
  el.innerHTML =
    '<span class="nt">' + esc(title) + '</span>' +
    '<span class="nb">' + esc(body) + '</span>';
  el.hidden = false;
  el.onclick = function () {
    el.hidden = true;
    if (onClick) onClick();
  };
  /* Restart the clock, so a second arrival does not inherit the first
     one's remaining time. */
  clearTimeout(notifTimer);
  requestAnimationFrame(function () { el.classList.add("show"); });
  notifTimer = setTimeout(function () {
    el.classList.remove("show");
    setTimeout(function () { el.hidden = true; }, 220);
  }, 6000);
}

function toast(msg) {
  var el = byId("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
}

/* ==================================================================
   4. NAVIGATION
   ================================================================== */

var NAV = [
  { view: "discover", label: "Discover", ico: "compass", title: "Discover", sub: "Browse everyone looking for a partner" },
  { view: "map",      label: "Map",      ico: "map-pin", title: "Map",      sub: "Where everyone is, and how far away" },
  { view: "matches",  label: "Matches",  ico: "arrow-left-right", title: "Matches",  sub: "People who paired up with you" },
  { view: "chats",    label: "Chats",    ico: "message-circle", title: "Chats",    sub: "Keep the conversation going" },
  { view: "profile",  label: "Profile",  ico: "user-round", title: "Profile",  sub: "How other people see you" }
];

var current = { view: "discover", tab: "people", chatWith: null, query: "", sort: "nearby",
                radius: "any", searching: false, filters: {} };

function chatPartners() {
  var ids = state.matches.slice();
  Object.keys(state.threads || {}).forEach(function (id) {
    if (ids.indexOf(id) === -1 && (state.threads[id] || []).length) ids.push(id);
  });
  return ids;
}

function unreadCount() {
  var n = 0;
  chatPartners().forEach(function (id) {
    var msgs = state.threads[id] || [];
    var read = state.read[id] || 0;
    for (var i = read; i < msgs.length; i++) if (msgs[i].from === "them") n++;
  });
  return n;
}

function renderNav() {
  var unread = unreadCount();
  var html = NAV.map(function (n) {
    var badge = "";
    if (n.view === "matches" && state.matches.length) badge = '<span class="count">' + state.matches.length + '</span>';
    if (n.view === "chats" && unread) badge = '<span class="count">' + unread + '</span>';
    return '<button class="navlink" data-nav="' + n.view + '"' +
      (current.view === n.view ? ' aria-current="page"' : '') + '>' +
      '<span class="ico" aria-hidden="true">' + ic(n.ico) + '</span>' + esc(n.label) + badge + '</button>';
  }).join("");
  byId("sidelinks").innerHTML = html;
  byId("tabbar").innerHTML = html;
}

function go(view, arg) {
  current.view = view;
  if (view === "chat") {
    current.chatWith = arg;
    if (typeof watchThread === "function") watchThread(arg);
  } else if (unsub.thread) {
    unsub.thread(); unsub.thread = null;
  }
  var meta = null;
  for (var i = 0; i < NAV.length; i++) if (NAV[i].view === view) meta = NAV[i];
  if (meta) {
    byId("viewTitle").textContent = meta.title;
    byId("viewSub").textContent = meta.sub;
  } else if (view === "chat") {
    var who = personById(current.chatWith);
    byId("viewTitle").textContent = who ? who.name.split(" ")[0] : "Chat";
    byId("viewSub").textContent = who ? who.headline : "";
  }
  render();
}

document.addEventListener("click", function (e) {
  var nav = e.target.closest("[data-nav]");
  if (nav) { go(nav.getAttribute("data-nav")); return; }

  var act = e.target.closest('[data-act="signout"], [data-act="signin"]');
  if (act) {
    if (act.getAttribute("data-act") === "signout") signOut();
    else signInWithGoogle();
  }
});

/* ==================================================================
   5. THEME
   ================================================================== */

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  /* The toggle shows where it takes you, not where you are: a sun while
     the app is dark, a moon while it is light. */
  var next = state.theme === "dark" ? "sun" : "moon-star";
  var top = byId("themeTop"), side = byId("themeSide");
  if (top) top.innerHTML = ic(next);
  if (side) side.innerHTML = '<span class="ico" aria-hidden="true">' + ic(next) + '</span> Theme';
}
function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(); save();
  /* Keep the Profile switch in sync when the theme is flipped elsewhere. */
  var sw = document.querySelector('[data-toggle="theme"]');
  if (sw) sw.setAttribute("aria-checked", state.theme === "dark");
  if (maps.map) {
    addTiles();
    paintMarkers(false);
  }
  toast(state.theme === "dark" ? "Dark theme on" : "Light theme on");
}
/* The call overlay sits outside the app shell, so it gets its own
   handler rather than going through the view dispatcher. */
byId("callui").addEventListener("click", function (e) {
  var b = e.target.closest("[data-call]");
  if (!b) return;
  var a = b.getAttribute("data-call");
  if (a === "answer") answerCall();
  else if (a === "decline") declineCall();
  else if (a === "mute") toggleMute();
  else if (a === "hangup") endCall("Call ended");
});

byId("themeTop").addEventListener("click", toggleTheme);
byId("themeSide").addEventListener("click", toggleTheme);

/* ==================================================================
   6. RENDER ROUTER
   ================================================================== */

/* Data changed underneath us (a Firestore push, a new fix from the GPS).
   Update what is on screen without rebuilding views that hold live
   state — the map keeps its position, the message box keeps your text. */
/* True while the caret is in a field. A background snapshot that
   rebuilds the view mid-sentence throws the half-typed value away,
   which is what made the profile inputs look like they cleared
   themselves every few seconds. */
function typingNow() {
  var a = document.activeElement;
  if (!a) return false;
  var tag = a.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || a.isContentEditable;
}

function softRefresh() {
  renderNav();
  if (typingNow()) return;
  /* Your own page does not change because somebody else's card did. */
  if (current.view === "profile") return;
  if (current.view === "map") {
    if (maps.map) paintMarkers(false); else render();
    return;
  }
  if (current.view === "chat") { repaintThread(); return; }
  if (current.view === "discover") {
    if (current.tab === "events") {
      if (byId("events")) { paintEvents(); return; }
      render(); return;
    }
    paintList(); return;
  }
  render();
}

/* Redraw only the bubbles, so the composer (and what you have typed,
   and the caret position) survives. */
function repaintThread() {
  var p = personById(current.chatWith);
  var thread = byId("thread");
  if (!p || !thread) return;
  var atBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 60;
  thread.innerHTML = bubblesHTML(p);
  delete thread.dataset.voiceArmed;
  armVoicePlayback();
  if (atBottom) thread.scrollTop = thread.scrollHeight;
  state.read[p.id] = (state.threads[p.id] || []).length;
  localSave();
  renderNav();
}

function render() {
  renderNav();
  var app = byId("app");
  if (current.view === "discover") app.innerHTML = viewDiscover();
  else if (current.view === "matches") app.innerHTML = viewMatches();
  else if (current.view === "chats") app.innerHTML = viewChats();
  else if (current.view === "chat") app.innerHTML = viewChat();
  else if (current.view === "map") app.innerHTML = viewMap();
  else if (current.view === "profile") app.innerHTML = viewProfile();

  if (current.view === "discover") armDiscover();
  if (current.view === "map") armMap();
  if (current.view === "chat") afterChat();
  if (current.view === "profile") armProfile();
}

/* ==================================================================
   6b. LOCATION
   ================================================================== */

var RADII = [
  { key: "any",  label: "Anywhere" },
  { key: 25,     label: "Within 25 km" },
  { key: 100,    label: "Within 100 km" },
  { key: 500,    label: "Within 500 km" },
  { key: 2000,   label: "Within 2 000 km" },
  { key: 5000,   label: "Within 5 000 km" }
];

/* Great-circle distance in km. */
function haversine(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var rad = Math.PI / 180;
  var dLat = (lat2 - lat1) * rad;
  var dLon = (lon2 - lon1) * rad;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function distanceKm(p) {
  return haversine(state.me.lat, state.me.lng, p.lat, p.lng);
}

function distanceLabel(p) {
  var d = distanceKm(p);
  if (d < 10) return d.toFixed(1) + " km";
  if (d < 1000) return Math.round(d) + " km";
  return Math.round(d).toLocaleString() + " km";
}

function coordText() {
  return state.me.lat.toFixed(4) + ", " + state.me.lng.toFixed(4);
}

/* Ask the browser where we are. Needs a secure context — over file://
   most browsers refuse, so the error message says what to do. */
function useMyLocation() {
  if (!navigator.geolocation) { toast("This browser has no geolocation"); return; }
  toast("Asking for your location…");
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      state.me.lat = pos.coords.latitude;
      state.me.lng = pos.coords.longitude;
      state.me.locLabel = "My current location";
      save();
      render();
      toast("Location updated — distances recalculated");
    },
    function (err) {
      var msg = err.code === 1 ? "Location permission denied"
              : err.code === 2 ? "Location unavailable"
              : "Location request timed out";
      if (location.protocol === "file:") msg += " — serve the page over http://localhost";
      toast(msg);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}

/* ==================================================================
   LOCATION PERMISSION

   Browsers only give you one good chance to ask: if someone dismisses
   the native prompt it is remembered, and asking again is ignored. So
   we explain why first, in our own card, and only call the browser
   when they choose to. That also satisfies Chrome's rule that the
   prompt should follow a user gesture.
   ================================================================== */

/* "granted" | "denied" | "prompt" | "unknown" */
function locationPermission() {
  if (!navigator.permissions || !navigator.permissions.query) {
    return Promise.resolve("unknown");
  }
  return navigator.permissions.query({ name: "geolocation" })
    .then(function (p) { return p.state; })
    .catch(function () { return "unknown"; });
}

function askLocationOnce() {
  if (!navigator.geolocation) return;
  if (state.askedLocation) return;

  locationPermission().then(function (perm) {
    /* Already answered — nothing to ask. If it was granted, take a fix
       so the map opens somewhere useful. */
    if (perm === "granted") { state.askedLocation = true; save(); useMyLocation(); return; }
    if (perm === "denied") { state.askedLocation = true; save(); return; }
    showLocationCard();
  });
}

function showLocationCard() {
  var scrim = byId("scrim");
  if (!scrim) return;

  scrim.innerHTML =
    '<div class="modal locask">' +
      '<div class="pinart" aria-hidden="true">' + ic('map-pin', 'xl') + '</div>' +
      '<h3>Show people near you?</h3>' +
      '<p>GG Partner uses your location for two things: sorting partners by how far away ' +
      'they are, and placing your pin on the map. Nothing else.</p>' +
      '<ul class="locfacts">' +
        '<li>Your exact position is never shown to anyone \u2014 only the distance.</li>' +
        '<li>Ghost mode hides your pin completely, any time.</li>' +
        '<li>You can say no and still use every part of the app.</li>' +
      '</ul>' +
      '<button class="btn primary block" data-act="loc-allow">' + ic('crosshair') + ' Use my location</button>' +
      '<button class="btn ghost block" data-act="loc-skip">Not now</button>' +
    '</div>';
  scrim.classList.add("open");

  state.askedLocation = true;
  save();
}

/* ---- Live location ------------------------------------------------
   watchPosition keeps firing as the device moves. We store each fix,
   repaint whatever is on screen, and stop automatically when the
   chosen duration runs out. ------------------------------------- */

var liveWatch = null;
var liveTimer = null;

function startLive(minutes) {
  if (!navigator.geolocation) { toast("This browser has no geolocation"); return; }
  if (!state.me.sharing) { toast("Turn sharing on first"); return; }

  state.me.live = true;
  state.me.liveUntil = minutes ? Date.now() + minutes * 60000 : 0;
  save();

  liveWatch = navigator.geolocation.watchPosition(
    function (pos) {
      state.me.lat = pos.coords.latitude;
      state.me.lng = pos.coords.longitude;
      state.me.locLabel = "Live location";
      state.me.lastFix = Date.now();
      save();
      repaintLocation();
    },
    function (err) {
      var msg = err.code === 1 ? "Location permission denied"
              : err.code === 2 ? "Location unavailable"
              : "Location request timed out";
      if (location.protocol === "file:") msg += " — serve the page over http://localhost";
      stopLive(true);
      render();
      toast(msg);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  );

  if (liveTimer) clearInterval(liveTimer);
  liveTimer = setInterval(tickLive, 1000);
  render();
  toast(minutes ? "Live for " + minutes + " minutes" : "Live until you switch it off");
}

function stopLive(quiet) {
  if (liveWatch !== null) { navigator.geolocation.clearWatch(liveWatch); liveWatch = null; }
  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  state.me.live = false;
  state.me.liveUntil = 0;
  save();
  if (!quiet) { render(); toast("Live location off"); }
}

/* Runs once a second while live: refreshes the countdown and expires it. */
function tickLive() {
  if (!state.me.live) { if (liveTimer) { clearInterval(liveTimer); liveTimer = null; } return; }
  if (state.me.liveUntil && Date.now() >= state.me.liveUntil) {
    stopLive(true);
    render();
    toast("Live location expired");
    return;
  }
  var b = byId("livebadge");
  if (b) b.innerHTML = '<i></i>LIVE' + (state.me.liveUntil ? ' · ' + liveCountdown() : '');
  refreshLocBar();
}

function liveCountdown() {
  var ms = Math.max(0, state.me.liveUntil - Date.now());
  var t = Math.round(ms / 1000);
  var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  return h ? h + ":" + pad(m) + ":" + pad(sec) : m + ":" + pad(sec);
}

/* Ghost mode: you keep seeing everyone, your own pin goes hidden. */
function setSharing(on) {
  state.me.sharing = on;
  if (!on && state.me.live) stopLive(true);
  save();
  render();
  toast(on ? "Location sharing on" : "Ghost mode — your pin is hidden");
}

function fixAgo() {
  if (!state.me.lastFix) return "";
  var sec = Math.round((Date.now() - state.me.lastFix) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return sec + "s ago";
  var m = Math.round(sec / 60);
  return m < 60 ? m + " min ago" : Math.round(m / 60) + " h ago";
}

/* Repaint only what depends on our own position. */
function repaintLocation() {
  refreshLocBar();
  softRefresh();
}

function radiusSelectHTML() {
  var opts = RADII.map(function (r) {
    return '<option value="' + r.key + '"' +
      (String(current.radius) === String(r.key) ? ' selected' : '') + '>' + esc(r.label) + '</option>';
  }).join("");
  return '<select class="sort" id="radius" aria-label="Distance">' + opts + '</select>';
}

function locBarHTML() {
  var me = state.me;
  var durs = [15, 60, 480, 0];
  var durLabel = { 15: "15 minutes", 60: "1 hour", 480: "8 hours", 0: "Until I stop it" };
  var opts = durs.map(function (d) {
    return '<option value="' + d + '">' + durLabel[d] + '</option>';
  }).join("");

  var status = me.sharing
    ? esc(coordText()) + (me.live && me.lastFix ? " · updated " + esc(fixAgo()) : " · drag your own pin to move it")
    : "Hidden from the map while ghost mode is on";

  return '<div class="locbar">' +
    '<span aria-hidden="true">' + ic(me.sharing ? 'map-pin' : 'ghost', 'lg') + '</span>' +
    '<div class="grow"><b>' + esc(me.sharing ? me.locLabel : "Ghost mode") + '</b>' +
      '<small>' + status + '</small></div>' +
    (me.live ? '<span class="livebadge" id="livebadge"><i></i>LIVE' +
      (me.liveUntil ? ' · ' + liveCountdown() : '') + '</span>' : '') +
    '<button class="btn sm" data-act="use-location">' + ic('crosshair') + ' Use my location</button>' +

    '<div class="locctl">' +
      '<div class="ctl"><button class="switch" role="switch" data-toggle="sharing" ' +
        'aria-checked="' + !!me.sharing + '" aria-label="Share my location"></button>' +
        '<span>Share my location</span></div>' +

      '<div class="ctl"><button class="switch" role="switch" data-toggle="live" ' +
        'aria-checked="' + !!me.live + '" aria-label="Live location"' +
        (me.sharing ? '' : ' disabled style="opacity:.45"') + '></button>' +
        '<span>Live</span>' +
        (me.live ? '' : '<select class="dur" id="livedur" aria-label="Share live for">' + opts + '</select>') +
      '</div>' +
    '</div>' +

    (me.sharing ? '' : '<div class="ghostnote"><span aria-hidden="true">' + ic('ghost') + '</span>' +
      '<span>You can still see everyone. Your own pin is hidden until you switch sharing back on.</span></div>') +
  '</div>';
}

/* ==================================================================
   7. DISCOVER (browsable list)
   ================================================================== */

var SORTS = [
  { key: "match",  label: "Best match" },
  { key: "nearby", label: "Nearest first" },
  { key: "online", label: "Active first" },
  { key: "name",   label: "Name A\u2013Z" }
];

/* Everyone still undecided, after the category filter, the search box
   and the chosen sort. */
/* The map is not the Discover deck. Matched friends belong on it even
   though they are "seen", and they are the only people whose exact
   position you are allowed to see. */
function mapPeople() {
  var byId = {};
  PEOPLE.forEach(function (p) {
    if (state.matches.indexOf(p.id) !== -1) byId[p.id] = p;
  });
  /* Anyone still in the deck shows too, at their coarse point. */
  visiblePeople().forEach(function (p) { if (!byId[p.id]) byId[p.id] = p; });
  return Object.keys(byId).map(function (k) { return byId[k]; });
}

function visiblePeople() {
  var q = (current.query || "").trim().toLowerCase();

  var out = PEOPLE.filter(function (p) {
    /* Everyone signed in stays in the list — people you have already
       paired with, invited, or passed on included. Discover is the
       directory, not a deck that empties as you work through it.
       Blocking is the only thing that takes someone out of it, and
       that is handled where the directory is built. */
    if (state.filter !== "all") {
      var cats = p.cats && p.cats.length ? p.cats : [p.cat];
      if (cats.indexOf(state.filter) === -1) return false;
    }
    if (current.radius !== "any" && distanceKm(p) > Number(current.radius)) return false;
    if (!matchesSmartFilters(p)) return false;
    if (q && searchHaystack(p).indexOf(q) === -1) return false;
    return true;
  });

  var sort = current.sort;
  out.sort(function (a, b) {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "match") {
      var m = matchScore(b).pct - matchScore(a).pct;
      if (m) return m;
    }
    if (sort === "online") {
      var d = (isActiveNow(b) ? 1 : 0) - (isActiveNow(a) ? 1 : 0);
      if (d) return d;
      var l = (b.lastActive || 0) - (a.lastActive || 0);
      if (l) return l;
    }
    return distanceKm(a) - distanceKm(b);
  });
  return out;
}

/* A member can keep one profile per category. Pick the one that fits
   the category being browsed, else fall back to their first. */
function profileFor(p, slug) {
  var ps = p.profiles || {};
  if (slug && slug !== "all" && ps[slug]) return ps[slug];
  var keys = Object.keys(ps);
  return keys.length ? ps[keys[0]] : null;
}

/* The person, flattened for display in the current category. */
function shownAs(p) {
  var prof = profileFor(p, state.filter);
  if (!prof) return p;
  return {
    id: p.id, name: p.name, age: p.age, city: p.city,
    gender: p.gender, height: p.height, career: p.career,
    lat: p.lat, lng: p.lng, online: p.online, likes: p.likes,
    profiles: p.profiles, cats: p.cats,
    /* Carried through untouched: these belong to the person, not to the
       category profile being shown, and the card needs every one of
       them to draw presence, the badge and the match score. */
    lastActive: p.lastActive, phoneVerified: p.phoneVerified,
    joined: p.joined, pairs: p.pairs, events: p.events,
    photo: p.photo, links: p.links, phonePublic: p.phonePublic,
    days: p.days, blocks: p.blocks, freeNow: p.freeNow,
    cat: prof.cat || p.cat,
    headline: prof.headline || p.headline,
    bio: prof.bio || p.bio,
    tags: (prof.tags && prof.tags.length) ? prof.tags : p.tags,
    avail: prof.avail || p.avail,
    place: prof.place || null,
    fieldChips: fieldChips(categoryBySlug(prof.cat || p.cat), prof.fields)
  };
}

/* Age, gender, height, career \u2014 whatever they filled in, on one pill. */
function detailPillHTML(p, skipAge) {
  var bits = [];
  if (p.age && !skipAge) bits.push(String(p.age));
  if (p.gender) bits.push(p.gender);
  if (p.height) bits.push(p.height);
  if (p.career) bits.push(p.career);
  if (!bits.length) return "";
  return '<div class="pinfo">' + bits.map(function (b) {
    return '<span>' + esc(b) + '</span>';
  }).join("") + '</div>';
}

/* Every category they are listed in, the one being browsed first. */
function catBadgesHTML(raw, shown) {
  var slugs = (raw.cats && raw.cats.length) ? raw.cats.slice() : (shown.cat ? [shown.cat] : []);
  if (state.filter !== "all" && slugs.indexOf(state.filter) > 0) {
    slugs = [state.filter].concat(slugs.filter(function (sl) { return sl !== state.filter; }));
  }
  return slugs.slice(0, 3).map(function (sl) {
    var c = categoryBySlug(sl);
    return '<span class="catbadge">' + ic(c.icon) + ' ' + esc(c.label) + '</span>';
  }).join("");
}

/* The game a card should lead with: the one being filtered for, else
   the highest rank they hold. */
function bestGameRow(raw) {
  var rows = gameRowsOf(raw).filter(function (r) { return r.game; });
  if (!rows.length) return null;
  var want = (current.filters || {}).game;
  if (want) {
    var m = rows.filter(function (r) { return r.game === want; })[0];
    if (m) return m;
  }
  return rows.slice().sort(function (a, b) {
    return rankIndex(b.game, b.rank) - rankIndex(a.game, a.rank);
  })[0];
}

/* Rank, role and server on one line; the numbers people compare on the
   next, in the tabular face so they line up down the column. */
function gameStripHTML(raw, shown) {
  /* Only where it belongs: browsing Game, or browsing everything and
     this is the profile being shown. A study partner's card should not
     lead with their Valorant rank. */
  if (state.filter !== "gaming" && !(state.filter === "all" && shown.cat === "gaming")) return "";
  var row = bestGameRow(raw);
  if (!row) return "";
  var g = gameByName(row.game);

  var line = ['<b>' + esc(g ? (g.short || g.name) : row.game) + '</b>'];
  if (row.rank) {
    line.push('<span class="rank">' + esc(row.rank) +
      (row.stars ? ' <span class="num">' + esc(row.stars) + ic('star') + '</span>' : '') + '</span>');
  }
  if (row.role) line.push(esc(row.role));
  if (row.region) line.push(esc(row.region));

  var stats = "";
  if (row.winrate) stats += '<span class="gstat"><b class="num">' + esc(row.winrate) +
    '%</b> win rate</span>';
  if (row.matches) stats += '<span class="gstat"><b class="num">' + esc(row.matches) +
    '</b> matches</span>';
  if (row.heroes) stats += '<span class="gstat">' +
    esc((g && g.heroLabel) || "Mains") + ': <b>' + esc(row.heroes) + '</b></span>';

  return '<div class="gstrip">' + line.join('<i aria-hidden="true">\u00b7</i>') + '</div>' +
    (stats ? '<div class="gstats">' + stats + '</div>' : "");
}

/* Category chips if the profile has them, else the free-text tags.
   An empty row is left out rather than opening a gap in the card. */
function tagRowHTML(p) {
  var tags = (p.fieldChips && p.fieldChips.length) ? p.fieldChips : (p.tags || []);
  if (!tags.length) return "";
  return '<div class="tags">' + tags.slice(0, 4).map(function (t) {
    return '<span class="tag">' + esc(t) + '</span>'; }).join("") + '</div>';
}

function personRowHTML(raw) {
  var p = shownAs(raw);
  var mine = !!raw.isMe;
  var matched = state.matches.indexOf(p.id) !== -1;
  var strip = gameStripHTML(raw, p);

  /* There is nobody to message and nobody to match with when the card is
     your own, so that column becomes the way to edit it instead. */
  /* When you are looking at one category, Edit opens that category's
     profile — the job the "you are listed in X" strip used to do. */
  var editHere = mine && state.filter !== "all" && (state.me.profiles || {})[state.filter];
  var chat = mine
    ? (editHere
        ? '<button class="actbtn" data-profedit="' + esc(state.filter) + '" ' +
            'aria-label="Edit your ' + esc(categoryBySlug(state.filter).label) + ' profile">' +
            '<span class="ico" aria-hidden="true">' + ic('pencil') + '</span>Edit</button>'
        : '<button class="actbtn" data-nav="profile" aria-label="Edit your profile">' +
            '<span class="ico" aria-hidden="true">' + ic('pencil') + '</span>Edit</button>')
    : '<button class="actbtn" data-openchat="' + esc(p.id) + '" ' +
        'title="Message ' + esc(p.name) + ' directly" ' +
        'aria-label="Direct chat with ' + esc(p.name) + '">' +
        '<span class="ico" aria-hidden="true">' + ic('mail') + '</span>Direct chat</button>';

  var pair = mine
    ? ''
    : matched
    ? '<button class="actbtn matched" data-openchat="' + esc(p.id) + '" ' +
        'aria-label="You are matched with ' + esc(p.name) + '">' +
        '<span class="ico" aria-hidden="true">' + ic('check') + '</span>Matched</button>'
    : '<button class="actbtn match" data-decide="pair" data-id="' + esc(p.id) + '" ' +
        'aria-label="Ask ' + esc(p.name) + ' to match">' +
        '<span class="ico" aria-hidden="true">' + ic('arrow-left-right') + '</span>Match</button>';

  return '' +
  '<article class="person' + (mine ? ' isme' : '') + '">' +
    '<div class="pres">' + avatarFor(p, 112) +
      (isActiveNow(p) ? '<span class="live" title="Active now"></span>' : '') +
    '</div>' +
    '<div class="who">' +
      '<div class="line1">' +
        '<button class="namebtn" data-act="detail" data-id="' + esc(p.id) + '">' + esc(p.name) + '</button>' +
        verifiedHTML(p, true) +
        (mine ? '<span class="mebadge">' + ic('user-round') + ' This is you</span>'
              : scoreBadgeHTML(p)) +
        catBadgesHTML(raw, p) +
      '</div>' +
      detailPillHTML(p) +
      '<div class="meta">' +
        /* "0.0 km away" from yourself reads as a bug, so your own card
           just says where you are. */
        '<span>' + ic('map-pin') + ' ' + esc(p.city) +
          (mine ? '' : ' \u00b7 ' + distanceLabel(p) + ' away') + '</span>' +
        (presenceLabel(p) ? presenceHTML(p) : "") +
        (availLabel(p) ? '<span>' + ic('clock') + ' ' + esc(availLabel(p)) + '</span>' : "") +
        (p.place && p.place.name
          ? '<span class="placetag">' + ic('map-pin') + ' ' + esc(p.place.name) + '</span>'
          : "") +
      '</div>' +
      (p.headline ? '<p class="headline">' + esc(p.headline) + '</p>' : "") +
      (p.bio ? '<p class="bionote">' + esc(p.bio) + '</p>' : "") +
      (strip || tagRowHTML(p)) +
    '</div>' +
    '<div class="acts">' + chat + pair + '</div>' +
  '</article>';
}

/* You only appear in a category once you have a profile there. Say so,
   right where people look, with the button to fix it. */
function joinBannerHTML() {
  if (state.filter === "all") {
    var n = Object.keys(state.me.profiles || {}).length;
    if (n) return "";
    return '<div class="joinbar">' +
      '<div><b>You are not in any category yet</b>' +
      '<small>Add a profile to a category and people browsing it will see you.</small></div>' +
      '<button class="btn primary sm" data-act="goprofile">Add a profile</button></div>';
  }

  var c = categoryBySlug(state.filter);
  if (!c) return "";
  var has = (state.me.profiles || {})[state.filter];

  /* Nothing to announce once you are in this category: your own card is
     pinned at the top of the list, and it says the same thing the way
     everyone else will actually see it. */
  if (has) return "";

  return '<div class="joinbar">' +
    '<div><b>You are not in ' + esc(c.label) + ' yet</b>' +
    '<small>Add your ' + esc(c.label.toLowerCase()) + ' profile to show up here.</small></div>' +
    '<button class="btn primary sm" data-profadd="' + esc(c.slug) + '">' +
      ic(c.icon) + ' Add profile</button></div>';
}

/* Your own card, shaped exactly like everyone else's so it can go
   through the same renderer. This is the only honest way to see what
   other people see: the real card, in the real list, not a preview. */
function meAsPerson() {
  var me = state.me;
  return {
    id: myId(),
    isMe: true,
    name: me.name || "You",
    age: me.age || "",
    city: me.city || "",
    lat: me.sharing ? me.lat : null,
    lng: me.sharing ? me.lng : null,
    cat: Object.keys(me.profiles || {})[0] || "all",
    cats: Object.keys(me.profiles || {}),
    profiles: me.profiles || {},
    online: !!me.online,
    headline: me.headline || "",
    bio: me.bio || "",
    tags: me.tags || [],
    avail: me.avail || "",
    days: me.days || [],
    blocks: me.blocks || [],
    freeNow: !!me.freeNow,
    photo: me.photo || "",
    links: me.links || {},
    phonePublic: !!me.phonePublic,
    phoneVerified: !!me.phoneVerified,
    /* Always "now": you are, by definition, here. */
    lastActive: Date.now(),
    joined: me.joined || 0,
    pairs: (state.matches || []).length,
    events: (state.myEvents || []).length,
    likes: state.liked || []
  };
}

/* You appear in Everything, and in each category you have filled in —
   the same rule that decides whether anyone else shows up there. */
function showMeHere() {
  if (state.filter === "all") return true;
  return Object.keys(state.me.profiles || {}).indexOf(state.filter) !== -1;
}

function listInnerHTML(list) {
  /* Pinned above everyone else, and not part of `list`, so it is never
     counted as somebody you could meet. */
  var mine = showMeHere() ? personRowHTML(meAsPerson()) : "";
  if (list.length) return mine + list.map(personRowHTML).join("");
  if (mine) return mine + emptyListHTML();
  return emptyListHTML();
}

function emptyListHTML() {

  /* Nobody has joined yet — say so plainly rather than pretending the
     deck ran out. This is the honest state for a brand-new app. */
  if (!PEOPLE.length) {
    if (!cloud.on) {
      return '<div class="empty">' +
        '<div class="big">' + ic('users') + '</div><h3>No members yet</h3>' +
        '<p>Firebase is switched off, so this browser has no way to see anyone else. ' +
        'Add your Firebase config to turn on sign-in and the member directory.</p></div>';
    }
    if (!cloud.user) {
      return '<div class="empty">' +
        '<div class="big">' + ic('key-round') + '</div><h3>Sign in to see members</h3>' +
        '<p>Everyone on GG Partner is a real person signed in with Google. ' +
        'Sign in and your profile joins the directory too.</p>' +
        '<button class="btn primary" data-act="signin">Sign in with Google</button></div>';
    }
    if (cloud.error) {
      return '<div class="empty">' +
        '<div class="big">' + ic('triangle-alert') + '</div><h3>Directory unavailable</h3>' +
        '<p>' + esc(cloud.error) + '</p></div>';
    }
    if (!directoryLoaded) {
      return '<div class="empty"><div class="big">' + ic('hourglass') + '</div><h3>Loading members\u2026</h3></div>';
    }
    return '<div class="empty">' +
      '<div class="big">' + ic('sprout') + '</div><h3>You are the first one here</h3>' +
      '<p>Nobody else has signed in yet. Your profile is already listed, so as soon as ' +
      'someone joins with Google they will show up here \u2014 and you will show up for them.</p></div>';
  }

  if ((current.query || "").trim()) {
    return '<div class="empty">' +
      '<div class="big">' + ic('search') + '</div><h3>Nothing matches \u201c' + esc(current.query) + '\u201d</h3>' +
      '<p>Try a different word, or clear the search to see everyone again.</p>' +
      '<button class="btn primary" data-act="clear-search">Clear search</button></div>';
  }
  if (activeFilters().length) {
    return '<div class="empty">' +
      '<div class="big">' + ic('sliders-horizontal') + '</div><h3>Nobody matches those filters yet</h3>' +
      '<p>' + esc(activeFilters().map(filterLabel).join(", ")) +
      ' narrowed it to nothing. Loosen one, or drop the rank a tier.</p>' +
      '<button class="btn primary" data-act="clearfilters">Clear filters</button></div>';
  }
  if (current.radius !== "any") {
    return '<div class="empty">' +
      '<div class="big">' + ic('map-pin') + '</div><h3>Nobody within ' + esc(current.radius) + ' km</h3>' +
      '<p>Widen the distance, or set your location to somewhere closer to the action.</p>' +
      '<button class="btn primary" data-act="widen">Show anywhere</button></div>';
  }
  return '<div class="empty">' +
    '<div class="big">' + ic('handshake') + '</div><h3>That is everyone for now</h3>' +
    '<p>You have been through every profile in ' +
    (state.filter === "all" ? "GG Partner" : esc(categoryBySlug(state.filter).label)) +
    '. Try another category, or bring the passed profiles back.</p>' +
    '<button class="btn primary" data-act="reset-deck">Start over</button></div>';
}

function countLabel(list) {
  var n = list.length;
  var cat = state.filter === "all" ? "" : " in " + categoryBySlug(state.filter).label.toLowerCase();
  /* Your own card is in the list but is not somebody you can meet, so
     the count says "others" whenever it is on screen — otherwise "0
     people available" sits directly above a visible card. */
  if (showMeHere()) {
    return n === 0 ? "Nobody else" + (cat || " here") + " yet"
                   : n + (n === 1 ? " other" : " others") + " available" + cat;
  }
  return n + (n === 1 ? " person" : " people") + " available" + cat;
}

/* ==================================================================
   7b. SMART SEARCH

   Searching by name only finds someone you already know. What people
   actually want is "Mythical Immortal roamer on SEA with a 60% win
   rate", so the filters are built from the same GAMES data the profile
   is filled in with: pick Mobile Legends and the rank list becomes the
   Mobile Legends ladder, the roles become its lanes, and the mains box
   suggests its heroes.
   ================================================================== */

/* The filters that only mean anything inside a game. */
var GAME_FILTER_KEYS = ["game", "rank", "stars", "role", "region", "hero", "winrate", "matches"];

function gameRowsOf(raw) {
  var pr = (raw.profiles || {}).gaming;
  var rows = pr && pr.fields && pr.fields.games;
  return Array.isArray(rows) ? rows : [];
}

function activeFilters() {
  var f = current.filters || {};
  return Object.keys(f).filter(function (k) { return f[k] !== "" && f[k] != null; });
}

function clearFilters() { current.filters = {}; }

/* A person passes when ONE of their games satisfies every game filter \u2014
   a Mythic Immortal roamer and a Gold-lane smurf on two accounts should
   both be findable, but not by mixing halves of each. */
function matchesSmartFilters(raw) {
  var f = current.filters || {};

  var usesGame = GAME_FILTER_KEYS.some(function (k) { return f[k]; });
  if (usesGame) {
    var rows = gameRowsOf(raw);
    if (!rows.length) return false;
    var hit = rows.some(function (row) {
      if (f.game && row.game !== f.game) return false;
      if (f.rank) {
        var want = rankIndex(f.game || row.game, f.rank);
        var have = rankIndex(row.game, row.rank);
        if (want === -1 || have === -1 || have < want) return false;
      }
      if (f.stars && Number(row.stars || 0) < Number(f.stars)) return false;
      if (f.role && row.role !== f.role) return false;
      if (f.region && row.region !== f.region) return false;
      if (f.hero && String(row.heroes || "").toLowerCase()
            .indexOf(String(f.hero).toLowerCase()) === -1) return false;
      if (f.winrate && Number(row.winrate || 0) < Number(f.winrate)) return false;
      if (f.matches && Number(row.matches || 0) < Number(f.matches)) return false;
      return true;
    });
    if (!hit) return false;
  }

  /* Every other category filters on its own answers: level, goal,
     format, style \u2014 whatever that category asks for. */
  var vals = (((raw.profiles || {})[state.filter] || {}).fields) || {};
  var fieldFail = Object.keys(f).some(function (k) {
    if (k.indexOf("f:") !== 0 || !f[k]) return false;
    var v = vals[k.slice(2)];
    if (Array.isArray(v)) return v.indexOf(f[k]) === -1;
    return v !== f[k];
  });
  if (fieldFail) return false;

  if (f.online && !isActiveNow(raw)) return false;
  if (f.verified && !raw.phoneVerified) return false;
  if (f.freenow && !raw.freeNow) return false;
  if (f.samefree) {
    var ov = availOverlap(raw);
    if (!ov || !ov.any) return false;
  }
  return true;
}

/* Everything about a person that a keyword should be able to reach \u2014
   including their rank, role, server and mains. */
function searchHaystack(p) {
  var bits = [p.name, p.city, p.headline, p.bio, (p.tags || []).join(" "),
              categoryBySlug(p.cat).label];
  (p.cats || []).forEach(function (sl) {
    var c = categoryBySlug(sl);
    if (c) bits.push(c.label);
  });
  gameRowsOf(p).forEach(function (row) {
    bits.push(row.game, row.rank, row.role, row.region, row.heroes, row.ign);
    var g = gameByName(row.game);
    if (g) bits.push(g.short);
  });
  return bits.join(" ").toLowerCase();
}

function filterLabel(key) {
  if (key === "hero") {
    var g = gameByName((current.filters || {}).game);
    return (g && g.heroLabel) || "Mains";
  }
  if (key === "winrate") return "Win rate";
  if (key === "matches") return "Matches";
  if (key === "stars") {
    var g2 = gameByName((current.filters || {}).game);
    return (g2 && g2.starLabel) || "Stars";
  }
  if (key === "region") return "Server";
  if (key === "online") return "Online";
  if (key.indexOf("f:") === 0) {
    var cat = categoryBySlug(state.filter);
    var fd = (cat.fields || []).filter(function (x) { return x.id === key.slice(2); })[0];
    return fd ? fd.label : key.slice(2);
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function filterValueLabel(key) {
  var v = (current.filters || {})[key];
  if (key === "winrate") return v + "%+";
  if (key === "matches" || key === "stars") return v + "+";
  if (key === "rank") return v + " or above";
  if (key === "online") return "now";
  return v;
}

/* The applied filters, shown even when the panel is shut, each one
   removable on its own. */
function filterChipsHTML() {
  var keys = activeFilters();
  if (!keys.length) return "";
  return '' +
    keys.map(function (k) {
      return '<button class="fchip" data-unfilter="' + esc(k) + '" ' +
        'title="Remove this filter">' + esc(filterLabel(k)) + ' <b>' +
        esc(filterValueLabel(k)) + '</b> ' + ic('x') + '</button>';
    }).join("") +
    '<button class="fchip clear" data-act="clearfilters">Clear all</button>';
}

/* Repaint the applied-filter chips and the badge on the search button
   without rebuilding the panel \u2014 typing a hero name keeps its caret. */
function paintChips() {
  var host = byId("fchips");
  if (host) host.innerHTML = filterChipsHTML();
  var btn = document.querySelector('[data-act="togglesearch"]');
  if (!btn) return;
  var n = activeFilters().length;
  var badge = btn.querySelector(".fcount");
  if (n && !badge) {
    btn.insertAdjacentHTML("beforeend", '<span class="fcount num">' + n + '</span>');
  } else if (n && badge) {
    badge.textContent = n;
  } else if (badge) {
    badge.remove();
  }
}

function fselHTML(key, label, options, suffix) {
  var v = (current.filters || {})[key] || "";
  return '<label class="fctl"><span>' + esc(label) + '</span>' +
    '<select class="sel" data-smart="' + esc(key) + '">' +
    '<option value="">Any</option>' +
    options.map(function (o) {
      return '<option value="' + esc(o) + '"' + (v === String(o) ? ' selected' : '') + '>' +
        esc(o) + esc(suffix || "") + '</option>';
    }).join("") + '</select></label>';
}

function ftextHTML(key, label, options, ph) {
  var v = (current.filters || {})[key] || "";
  var lid = "dl-filter-" + esc(key);
  return '<label class="fctl"><span>' + esc(label) + '</span>' +
    '<input class="inp" data-smart="' + esc(key) + '" value="' + esc(v) + '" ' +
    (options && options.length ? 'list="' + lid + '" ' : '') +
    'placeholder="' + esc(ph || "Any") + '">' +
    datalistHTML(lid, options || []) + '</label>';
}

/* The controls themselves, rebuilt for whichever category is selected. */
function smartFilterHTML() {
  var slug = state.filter;
  var out = "";

  if (slug === "gaming") {
    var g = gameByName((current.filters || {}).game);
    out += fselHTML("game", "Game", GAMES.filter(function (x) { return x.id !== "other"; })
      .map(function (x) { return x.name; }));

    if (g) {
      if (g.ranks.length) out += fselHTML("rank", "Rank at least", g.ranks);
      if (g.stars) out += fselHTML("stars", (g.starLabel || "Stars") + " at least",
        ["25", "50", "100", "150", "200"]);
      if (g.roles.length) out += fselHTML("role", "Role", g.roles);
      out += fselHTML("region", "Server", REGIONS);
      out += ftextHTML("hero", g.heroLabel || "Mains", g.heroes,
        g.heroes.length ? g.heroes[0] : "Any");
      out += fselHTML("winrate", "Win rate at least", ["50", "55", "60", "65", "70"], "%");
      out += fselHTML("matches", "Matches at least", ["100", "300", "500", "1000", "3000"]);
    } else {
      out += '<p class="fhint">Pick a game and the rank, role, server and hero ' +
        'filters below become that game\u2019s own.</p>';
    }
  } else if (slug !== "all") {
    var cat = categoryBySlug(slug);
    (cat.fields || []).forEach(function (fd) {
      if (fd.type !== "select" && fd.type !== "multi") return;
      out += fselHTML("f:" + fd.id, fd.label, fd.options || []);
    });
    if (!out) out += '<p class="fhint">This category has no set answers to filter on \u2014 ' +
      'the keyword box searches everything people wrote.</p>';
  } else {
    out += '<p class="fhint">Pick a category on the right \u2014 Game, Gym, Study \u2014 ' +
      'and the filters here become that category\u2019s own.</p>';
  }

  return '<div class="fgrid">' + out + '</div>';
}

/* ------------------------------------------------------------------
   The Discover screen: a mode bar on top, the list in the middle, the
   category rail on the right. People and Events share all three \u2014 the
   swap button is what moves between them.
   ------------------------------------------------------------------ */

function modeBarHTML() {
  var events = current.tab === "events";
  var n = events ? visibleEvents().length : visiblePeople().length;
  var n2 = events ? 0 : activeFilters().length;
  return '<div class="dmode">' +
    '<div class="modemain">' +
      '<div class="modename">' + (events ? "Events" : "People") +
        ' <span class="hint" id="modecount">\u00b7 ' + n + '</span></div>' +
      '<div class="modesub">' + (events
        ? "Lobbies you can join. Swap back for people."
        : "Everyone looking for a partner. Swap for events.") + '</div>' +
    '</div>' +
    '<div class="spacer"></div>' +
    '<button class="roundbtn" data-act="swapmode" ' +
      'title="Switch to ' + (events ? "people" : "events") + '" ' +
      'aria-label="Switch to ' + (events ? "people" : "events") + '">' + ic('refresh-cw') + '</button>' +
    '<button class="roundbtn" data-act="togglesearch" aria-pressed="' + !!current.searching + '" ' +
      'title="Search and filters" aria-label="Search and filters">' + ic('search') +
      (n2 ? '<span class="fcount num">' + n2 + '</span>' : '') + '</button>' +
  '</div>' +
  (current.tab === "events" ? "" : '<div class="fchips" id="fchips">' + filterChipsHTML() + '</div>');
}

/* The search row only exists while the search button is on. */
function searchPanelHTML() {
  if (!current.searching) return "";
  var events = current.tab === "events";
  var sorts = SORTS.map(function (o) {
    return '<option value="' + o.key + '"' +
      (current.sort === o.key ? ' selected' : '') + '>' + esc(o.label) + '</option>';
  }).join("");

  return '<div class="dsearch">' +
    '<div class="drow1">' +
      '<label class="search"><span class="mag" aria-hidden="true">' + ic('search') + '</span>' +
        '<input id="q" type="search" placeholder="' +
        (events ? "Search events, hosts, times\u2026"
                : "Rank, role, hero, city, name\u2026") + '" ' +
        'aria-label="Search" value="' + esc(current.query || "") + '"></label>' +
      (events ? "" :
        '<select class="sort" id="sort" aria-label="Sort by">' + sorts + '</select>' +
        radiusSelectHTML() +
        '<button class="chip" data-smarttoggle="online" aria-pressed="' +
          !!(current.filters || {}).online + '">' + ic('circle-dot') + ' Active now</button>' +
        '<button class="chip" data-smarttoggle="verified" aria-pressed="' +
          !!(current.filters || {}).verified + '">' + ic('shield-check') + ' Verified only</button>' +
        '<button class="chip" data-smarttoggle="freenow" aria-pressed="' +
          !!(current.filters || {}).freenow + '">' + ic('clock') + ' Free now</button>' +
        '<button class="chip" data-smarttoggle="samefree" aria-pressed="' +
          !!(current.filters || {}).samefree + '">' + ic('calendar-days') + ' Free when I am</button>') +
    '</div>' +
    (events ? "" : smartFilterHTML()) +
  '</div>';
}

/* The right-hand rail: add a profile, then filter by category. */
function railHTML() {
  var cats = CATEGORIES.map(function (c) {
    return '<button class="railbtn" data-filter="' + c.slug + '" aria-pressed="' +
      (state.filter === c.slug) + '">' + ic(c.icon) + esc(c.label) + '</button>';
  }).join("");

  return '<aside class="drail" aria-label="Categories">' +
    '<button class="addprof" data-act="addprofile">' +
      '<span class="plus" aria-hidden="true">' + ic('plus') + '</span>Add Profile</button>' +
    '<div class="railcats">' + cats + '</div>' +
  '</aside>';
}

function discoverShell(inner) {
  return '<div class="view discover">' +
    modeBarHTML() +
    searchPanelHTML() +
    '<div class="dbody">' +
      '<div class="dscroll" id="dscroll">' + inner + '</div>' +
      railHTML() +
    '</div>' +
  '</div>';
}

function viewEvents() {
  var list = visibleEvents();
  var body;
  if (!list.length) {
    body = '<div class="empty">' +
      '<div class="big">' + ic('calendar-days') + '</div><h3>No events yet</h3>' +
      '<p>Host one and people can join your lobby \u2014 a ranked five-stack, ' +
      'a gym session, a study block. It stays in recruiting until the slots fill.</p>' +
      '<button class="btn primary" data-act="hostevent">Host an event</button></div>';
  } else {
    body = list.map(eventCardHTML).join("");
  }

  return discoverShell(
    '<div class="resultbar"><span>' + list.length +
      (list.length === 1 ? ' event' : ' events') + '</span>' +
      '<button class="btn primary sm" data-act="hostevent">+ Host event</button></div>' +
    '<div class="people" id="events">' + body + '</div>');
}

function viewDiscover() {
  if (current.tab === "events") return viewEvents();
  var list = visiblePeople();

  var undo = state.passed.length
    ? '<div class="undone"><span class="grow">You passed on ' + state.passed.length +
      (state.passed.length === 1 ? ' person' : ' people') + '.</span>' +
      '<button class="btn sm" data-act="undo-passes">Bring them back</button></div>'
    : '';

  return discoverShell(
    joinBannerHTML() +
    '<div class="resultbar"><span id="count">' + esc(countLabel(list)) + '</span>' +
      '<span class="hint">Tap a name for the full profile</span></div>' +
    '<div class="people" id="people">' + listInnerHTML(list) + '</div>' +
    undo);
}

/* Repaint just the list, so typing in the search box keeps focus. */
function paintList() {
  var host = byId("people");
  if (!host) return;
  var list = visiblePeople();
  host.innerHTML = listInnerHTML(list);
  var c = byId("count");
  if (c) c.textContent = countLabel(list);
  var m = byId("modecount");
  if (m) m.textContent = "\u00b7 " + list.length;
}

/* Events, repainted in place, so the search box keeps focus there too. */
function paintEvents() {
  var host = byId("events");
  if (!host) return;
  var list = visibleEvents();
  host.innerHTML = list.length
    ? list.map(eventCardHTML).join("")
    : '<div class="empty"><div class="big">' + ic('search') + '</div><h3>No events match</h3>' +
      '<p>Try a different word, or clear the search.</p>' +
      '<button class="btn primary" data-act="clear-search">Clear search</button></div>';
  var m = byId("modecount");
  if (m) m.textContent = "\u00b7 " + list.length;
}

function armDiscover() {
  var repaint = current.tab === "events" ? paintEvents : paintList;
  var q = byId("q");
  if (q) {
    q.addEventListener("input", function () { current.query = q.value; repaint(); });
    q.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { q.value = ""; current.query = ""; repaint(); }
    });
    if (current.searching && !q.value) q.focus();
  }
  var sort = byId("sort");
  if (sort) sort.addEventListener("change", function () {
    current.sort = sort.value; paintList();
  });

  [].forEach.call(document.querySelectorAll("[data-smart]"), function (el) {
    var key = el.getAttribute("data-smart");
    el.addEventListener(el.tagName === "SELECT" ? "change" : "input", function () {
      var v = (el.value || "").trim();
      if (v === "") delete current.filters[key]; else current.filters[key] = v;
      /* Changing the game changes which filters exist at all. */
      if (key === "game") {
        GAME_FILTER_KEYS.forEach(function (k) { if (k !== "game") delete current.filters[k]; });
        render();
        return;
      }
      paintList();
      paintChips();
    });
  });
  var rad = byId("radius");
  if (rad) rad.addEventListener("change", function () {
    current.radius = rad.value === "any" ? "any" : Number(rad.value);
    paintList();
  });
}

/* Deterministic "do they pair back", so a person always behaves the same. */
/* A pair happens when the invite goes both ways. `p.likes` comes
   straight off the other person's profile document. */
function likesBack(p) {
  return Array.isArray(p.likes) && cloud.user && p.likes.indexOf(cloud.user.uid) !== -1;
}

function decide(id, action) {
  var p = personById(id);
  if (!p) return;
  if (state.seen.indexOf(id) === -1) state.seen.push(id);

  var matched = false;
  if (action === "pass") {
    if (state.passed.indexOf(id) === -1) state.passed.push(id);
  } else {
    if (state.liked.indexOf(id) === -1) state.liked.push(id);
    if (action === "star" || likesBack(p)) {
      matched = true;
      if (state.matches.indexOf(id) === -1) state.matches.push(id);
      if (!state.threads[id]) state.threads[id] = [];
      state.read[id] = 0;
    }
  }
  save();
  /* The invite lives in `likes` on your public card, and the other side
     only pairs when it can see it there. Saving to this browser alone
     left the invite stranded, so publish straight away. */
  publishProfile();
  closeModal();
  /* On the map, repaint the pins instead of rebuilding the whole map. */
  if (current.view === "map" && maps.map) { paintMarkers(false); renderNav(); }
  else render();

  if (matched) {
    matchModal(p, action === "star");
    /* This is the alert the "New pair alerts" switch was always naming. */
    raiseAlert("You paired up with " + p.name, "Say hello.", function () { go("chat", p.id); });
  }
  else if (action === "pass") toast("Passed on " + p.name.split(" ")[0]);
  else toast("Invite sent \u2014 no pair yet");
}

/* ------------------------------------------------------------------
   INCOMING INVITES

   A pair needs an invite each way, and the two almost never land in the
   same second. Whoever moves second sees the pair straight away, because
   the first person's `likes` was already sitting on their card when
   `decide` ran. Whoever moved first would never hear about it: they had
   already acted, and nothing re-read the directory on their behalf.

   So every time the directory changes we look at who is pointing back at
   us. Anyone we had already invited becomes a pair on the spot. Anyone we
   have not answered yet is put in front of us as a request.
   ------------------------------------------------------------------ */

/* The uid whose request is on screen, so it is asked once and not on
   every snapshot. */
var invitePrompted = null;

function incomingInvites() {
  if (!cloud.user) return [];
  return PEOPLE.filter(function (p) {
    if (!likesBack(p)) return false;
    if (state.matches.indexOf(p.id) !== -1) return false;
    if ((state.blocked || []).indexOf(p.id) !== -1) return false;
    if ((state.declined || []).indexOf(p.id) !== -1) return false;
    return true;
  });
}

/* Promote someone to a pair. `quiet` is for the pass that runs on a cold
   start, where a stack of "you paired up" windows would be nonsense. */
function becomeMatch(p, quiet) {
  if (!p || state.matches.indexOf(p.id) !== -1) return;
  state.matches.push(p.id);
  if (state.liked.indexOf(p.id) === -1) state.liked.push(p.id);
  if (state.seen.indexOf(p.id) === -1) state.seen.push(p.id);
  if (!state.threads[p.id]) state.threads[p.id] = [];
  if (state.read[p.id] == null) state.read[p.id] = 0;
  save();
  publishProfile();
  watchMatchThreads();
  if (quiet) return;
  matchModal(p, false);
  raiseAlert("You paired up with " + p.name, "Say hello.", function () { go("chat", p.id); });
}

/* Something else already has the screen: do not stamp on it. */
function screenBusy() {
  var sc = byId("scrim");
  return (sc && sc.classList.contains("open")) || (call && call.state !== "idle");
}

function reconcileInvites(quiet) {
  if (!cloud.user) return;
  var pending = incomingInvites();
  var promoted = false;
  var ask = null;

  pending.forEach(function (p) {
    if (state.liked.indexOf(p.id) !== -1) { becomeMatch(p, quiet); promoted = true; }
    else if (!ask) ask = p;
  });

  if (promoted) { renderNav(); return; }
  if (!ask) { invitePrompted = null; return; }
  if (quiet || screenBusy() || ask.id === invitePrompted) return;

  invitePrompted = ask.id;
  inviteRequestModal(ask);
  raiseAlert(ask.name + " wants to pair up", "Open GG Partner to answer.",
    function () { go("discover"); });
}

function inviteRequestModal(p) {
  openModal(
    '<div class="pairfaces">' +
      avatarHTML(state.me.name, "me", 78) +
      avatarFor(p, 78) +
    '</div>' +
    '<h2 id="modalTitle">' + esc(p.name.split(" ")[0]) + ' invited you</h2>' +
    '<p>' + esc(p.name) + ' is in for ' +
      esc(categoryBySlug(p.cat).label.toLowerCase()) +
      '. Accept and you two pair up straight away.</p>' +
    '<div style="display:flex;justify-content:center;margin:12px 0 4px">' +
      scoreBadgeHTML(p) + '</div>' +
    '<div class="actions">' +
      '<button class="btn primary block" data-act="invite-accept" data-id="' +
        esc(p.id) + '">Accept</button>' +
      '<button class="btn ghost block" data-act="invite-decline" data-id="' +
        esc(p.id) + '">Not now</button>' +
    '</div>');
}

/* Full profile in a dialog, opened from the person's name. */
/* One category profile, laid out as a labelled list rather than a blob
   of chips, so a rank or a game ID is actually readable. */
function profileBlockHTML(p, slug) {
  var c = categoryBySlug(slug);
  var pr = (p.profiles || {})[slug];
  if (!c || !pr) return "";

  var rows = "";
  (c.fields || []).forEach(function (f) {
    var v = (pr.fields || {})[f.id];
    if (!v || (Array.isArray(v) && !v.length)) return;

    if (f.type === "list" && Array.isArray(v)) {
      rows += v.map(function (row) {
        var head = row[f.item[0].id] || "Entry";
        var bits = f.item.slice(1).map(function (sub) {
          return row[sub.id] ? '<span><i>' + esc(sub.label) + '</i>' + esc(row[sub.id]) + '</span>' : "";
        }).join("");
        return '<div class="dgame"><b>' + esc(head) + '</b><div class="dgrid">' + bits + '</div></div>';
      }).join("");
      return;
    }

    rows += '<div class="drow"><i>' + esc(f.label) + '</i>' +
      esc(Array.isArray(v) ? v.join(", ") : v) + '</div>';
  });

  return '<section class="dblock">' +
    '<div class="dblockhead">' + ic(c.icon) + ' <b>' + esc(c.label) + '</b></div>' +
    (pr.headline ? '<p class="dhl">' + esc(pr.headline) + '</p>' : '') +
    (pr.bio ? '<p class="dbio">' + esc(pr.bio) + '</p>' : '') +
    rows +
    (pr.avail ? '<div class="drow"><i>Free</i>' + esc(pr.avail) + '</div>' : '') +
    (pr.place && pr.place.name
      ? '<div class="drow"><i>Place</i>' + ic('map-pin') + ' ' + esc(pr.place.name) +
        (pr.place.address ? ' <small>' + esc(pr.place.address) + '</small>' : '') + '</div>'
      : '') +
    (pr.tags && pr.tags.length
      ? '<div class="tags">' + pr.tags.map(function (t) {
          return '<span class="tag">' + esc(t) + '</span>'; }).join("") + '</div>'
      : '') +
  '</section>';
}

/* Why the score is what it is. Shown on the profile sheet, because a
   bare percentage that will not explain itself is just decoration. */
function matchWhyHTML(p) {
  var s = matchScore(p);
  if (!s.why.length) return "";
  return '<section class="dblock">' +
    '<div class="dblockhead">' + ic("sparkles") + ' <b>' + s.pct + '% match</b></div>' +
    '<div class="whylist">' + s.why.map(function (w) {
      return '<div class="why ' + (w.good ? "yes" : "no") + '">' +
        ic(w.good ? "check" : "x") + '<span>' + w.text + '</span></div>';
    }).join("") + '</div>' +
  '</section>';
}

/* A track record, not a rating. Nothing here is an opinion — it is how
   long the account has existed, how many pairs it has actually made and
   whether a phone number was ever checked. */
function recordBlockHTML(p) {
  var bits = [];
  if (p.joined) {
    bits.push({ n: new Date(p.joined).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
                l: "Member since" });
  }
  bits.push({ n: p.pairs || 0, l: (p.pairs === 1 ? "pair" : "pairs") });
  bits.push({ n: p.events || 0, l: (p.events === 1 ? "event" : "events") });
  bits.push({ n: p.phoneVerified ? "Yes" : "No", l: "Phone checked" });
  return '<section class="dblock">' +
    '<div class="dblockhead">' + ic("badge-check") + ' <b>Track record</b></div>' +
    '<div class="stats">' + bits.map(function (b) {
      return '<div class="stat"><b>' + esc(String(b.n)) + '</b><span>' + esc(b.l) + '</span></div>';
    }).join("") + '</div>' +
  '</section>';
}

function contactBlockHTML(p) {
  var links = linksHTML(p);
  if (!links) return "";
  return '<section class="dblock">' +
    '<div class="dblockhead">' + ic("link") + ' <b>Elsewhere</b></div>' + links +
  '</section>';
}

function detailModal(id) {
  var p = personById(id);
  if (!p) return;

  var matched = state.matches.indexOf(p.id) !== -1;
  var colour = hueFor(p.id);
  var slugs = (p.cats && p.cats.length) ? p.cats : Object.keys(p.profiles || {});
  if (!slugs.length && p.cat) slugs = [p.cat];

  var blocks = slugs.map(function (sl) { return profileBlockHTML(p, sl); }).join("");
  if (!blocks) {
    blocks = '<section class="dblock">' +
      (p.headline ? '<p class="dhl">' + esc(p.headline) + '</p>' : '') +
      (p.bio ? '<p class="dbio">' + esc(p.bio) + '</p>' : '') +
      '<p class="hint">No category profiles filled in yet.</p></section>';
  }

  var actions = matched
    ? '<button class="btn primary block" data-openchat="' + esc(p.id) + '">Message ' +
        esc(p.name.split(" ")[0]) + '</button>' +
      (typeof p.lat === "number"
        ? '<button class="btn block" data-showonmap="' + esc(p.id) + '">Show on map</button>' : '') +
      '<button class="btn ghost block" data-act="close-modal">Close</button>'
    : '<button class="btn primary block" data-decide="pair" data-id="' + esc(p.id) + '">Pair up</button>' +
      '<button class="btn block" data-decide="star" data-id="' + esc(p.id) + '">' + ic('star') + ' Priority invite</button>' +
      '<button class="btn ghost block" data-decide="pass" data-id="' + esc(p.id) + '">Pass</button>';

  byId("scrim").innerHTML =
    '<div class="modal profedit detail">' +
      '<div class="pehead">' +
        '<h2 id="modalTitle">' + esc(p.name) + (p.age ? ', ' + esc(p.age) : '') + '</h2>' +
        '<button type="button" class="icobtn del" data-act="close-modal" aria-label="Close">' + ic('x') + '</button>' +
      '</div>' +

      '<div class="pebody">' +
        '<div class="dtop" style="background:linear-gradient(150deg,' + colour + '22,' + colour + '55)">' +
          avatarFor(p, 64) +
          '<div>' +
            '<div class="dbadges">' +
              verifiedHTML(p) +
              (isActiveNow(p) ? '<span class="catbadge" style="color:var(--like)">' + ic('circle-dot') + ' Active now</span>' : '') +
              (matched ? '<span class="catbadge" style="color:var(--accent-ink)">' + ic('arrow-left-right') + ' Matched</span>' : '') +
            '</div>' +
            '<div class="dloc">' + ic('map-pin') + ' ' + esc(p.city || "Location not set") +
              ' \u00b7 ' + distanceLabel(p) + ' away' +
              (presenceLabel(p) && !isActiveNow(p) ? ' \u00b7 ' + esc(presenceLabel(p)) : '') + '</div>' +
            detailPillHTML(p, true) +
          '</div>' +
        '</div>' +
        matchWhyHTML(p) +
        recordBlockHTML(p) +
        contactBlockHTML(p) +
        blocks +
        '<section class="dblock">' +
          '<div class="dblockhead">' + ic('shield-alert') + ' <b>Safety</b></div>' +
          '<p class="hint" style="margin-bottom:9px">If something is wrong here, tell us — ' +
            'and put a wall up while we look.</p>' +
          '<div class="dangerzone">' +
            '<button class="btn sm danger" data-act="report" data-id="' + esc(p.id) + '">' +
              ic('flag') + ' Report</button>' +
            '<button class="btn sm danger" data-act="blockuser" data-id="' + esc(p.id) + '">' +
              ic('ban') + ' Block</button>' +
          '</div>' +
        '</section>' +
      '</div>' +

      '<div class="pefoot col">' + actions + '</div>' +
    '</div>';

  byId("scrim").classList.add("open");
}

/* ==================================================================
   8. MATCH MODAL
   ================================================================== */

function matchModal(p, wasStar) {
  var scrim = byId("scrim");
  scrim.innerHTML =
    '<div class="modal">' +
      '<div class="pairfaces">' +
        avatarHTML(state.me.name, "me", 78) +
        avatarHTML(p.name, p.id, 78) +
      '</div>' +
      '<h2 id="modalTitle">You paired up!</h2>' +
      '<p>' + esc(p.name.split(" ")[0]) + ' is in for ' +
      esc(categoryBySlug(p.cat).label.toLowerCase()) + '.' +
      (wasStar ? ' Your priority invite went straight through.' : '') + '</p>' +
      '<div class="actions">' +
        '<button class="btn primary block" data-act="open-chat" data-id="' + p.id + '">Send a message</button>' +
        '<button class="btn ghost block" data-act="close-modal">Keep browsing</button>' +
      '</div>' +
    '</div>';
  scrim.classList.add("open");
}
/* The dialogs written after this one all share the same frame, so they
   go through here instead of each one assembling its own scrim. */
function openModal(inner, cls) {
  var scrim = byId("scrim");
  scrim.innerHTML = '<div class="modal ' + (cls || "") + '">' + inner + '</div>';
  scrim.classList.add("open");
}

function closeModal() {
  var s = byId("scrim");
  s.classList.remove("open");
  s.innerHTML = "";
}

/* ==================================================================
   8b. MAP (Google Maps JavaScript API)
   ================================================================== */

var maps = { status: "idle", error: "", map: null, tiles: null, labels: null, markers: [], mine: null };

/* Leaflet is loaded from a CDN in the <head>. If the network blocked
   it, window.L will be missing and we show a message instead. */
function loadMaps(cb) {
  maps.status = window.L ? "ready" : "error";
  if (maps.status === "error") {
    maps.error = "The map library could not be downloaded. Check the internet " +
      "connection, then reload the page.";
  }
  cb();
}

/* Snapchat-style floating segmented control, sitting on the map. */
function mapStyleHTML() {
  var styles = [
    { id: "map", label: "Map", icon: "map" },
    { id: "satellite", label: "Satellite", icon: "satellite-dish" }
  ];
  return '<div class="mapstyle" role="group" aria-label="Map style">' +
    styles.map(function (v) {
      return '<button type="button" data-mapstyle="' + v.id + '" aria-pressed="' +
        (state.mapStyle === v.id) + '">' + ic(v.icon) + esc(v.label) + '</button>';
    }).join("") +
  '</div>';
}

function viewMap() {
  var chips = CATEGORIES.map(function (c) {
    return '<button class="chip" data-filter="' + c.slug + '" aria-pressed="' +
      (state.filter === c.slug) + '">' + ic(c.icon) + esc(c.label) + '</button>';
  }).join("");

  return '<div class="view"><div class="mapwrap">' +
    locBarHTML() +
    '<div class="maptools">' + radiusSelectHTML() +
      '<span class="hint" id="mapcount"></span></div>' +
    '<div class="chiprow">' + chips + '</div>' +
    '<div id="mapslot"><div id="map"></div>' + mapStyleHTML() + '</div>' +
  '</div></div>';
}

function armMap() {
  var rad = byId("radius");
  if (rad) rad.addEventListener("change", function () {
    current.radius = rad.value === "any" ? "any" : Number(rad.value);
    if (maps.map) paintMarkers(true); else render();
  });

  loadMaps(function () {
    var slot = byId("mapslot");
    if (!slot) return;
    if (maps.status === "error") {
      slot.innerHTML = '<div class="card setup"><h3>Map could not load</h3>' +
        '<p style="color:var(--muted);font-size:13.5px">' + esc(maps.error) + '</p>' +
        '<div class="note">Distances and the rest of the app keep working without the map.</div></div>';
      return;
    }
    initMap();
  });
}

function initMap() {
  var host = byId("map");
  if (!host) return;

  /* If this exact container already holds a live map, leave it alone.
     Tearing it down on every repaint is what made the map flicker and
     snap back to your own pin mid-drag. */
  if (maps.map && maps.map.getContainer() === host) {
    maps.map.invalidateSize();
    paintMarkers(false);
    return;
  }

  /* A different container (the view was re-rendered): retire the old
     map first, since Leaflet refuses to reuse one. */
  if (maps.map) { maps.map.remove(); maps.map = null; }
  host.innerHTML = "";

  maps.map = L.map(host, {
    center: [state.me.lat, state.me.lng],
    zoom: 3,
    zoomControl: true
  });

  addTiles();
  paintMarkers(false);

  /* The tab is drawn before it is visible, so Leaflet first measures the
     container as zero-sized — and fitting bounds against a zero-sized
     box gives a nonsense zoom. Measure first, then frame. */
  setTimeout(function () {
    if (!maps.map) return;
    maps.map.invalidateSize();
    paintMarkers(true);
  }, 80);
}

/* Swap the tile layer rather than restyling: light and dark are two
   different tile sets. */
function addTiles() {
  if (!maps.map) return;
  if (maps.tiles) { maps.map.removeLayer(maps.tiles); maps.tiles = null; }
  if (maps.labels) { maps.map.removeLayer(maps.labels); maps.labels = null; }

  var sat = state.mapStyle === "satellite";
  var t = sat ? TILES.satellite : (state.theme === "dark" ? TILES.dark : TILES.light);

  maps.tiles = L.tileLayer(t.url, {
    attribution: t.attribution,
    maxZoom: t.maxZoom || 19,
    /* Neither Esri nor OSM standard serve @2x tiles; asking 404s. */
    detectRetina: !sat && t.retina !== false
  }).addTo(maps.map);

  /* Place names over the imagery, so you can still tell where you are. */
  if (sat && t.labels) {
    maps.labels = L.tileLayer(t.labels, {
      maxZoom: t.maxZoom || 19,
      pane: "overlayPane"
    }).addTo(maps.map);
  }

  /* Pins need a light outline on dark imagery. */
  var host = byId("map");
  if (host) host.classList.toggle("sat", sat);
}

function setMapStyle(style) {
  if (state.mapStyle === style) return;
  state.mapStyle = style;
  save();
  addTiles();
  paintMarkers(false);
  var wrap = document.querySelector(".mapstyle");
  if (wrap) {
    [].forEach.call(wrap.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-mapstyle") === style);
    });
  }
  toast(style === "satellite" ? "Satellite view" : "Map view");
}

/* Build a map pin as an inline SVG: a round avatar with the person\u2019s
   initials, a presence dot, and their first name on a pill underneath.
   Returned as a data URI, so there are still no external image files. */
function pinSVG(opts) {
  var dark = state.theme === "dark";
  var pill = dark ? "#131a2a" : "#ffffff";
  var pillLine = dark ? "#2b3446" : "#e0e4ef";
  var pillText = dark ? "#e9edf7" : "#0f1420";
  var ring = opts.me ? "#f5b642" : (dark ? "#0e131f" : "#ffffff");
  var r = 20;

  var svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="78" viewBox="0 0 64 78">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + opts.color + '"/>' +
      '<stop offset="1" stop-color="' + shade(opts.color, -26) + '"/>' +
    '</linearGradient>' +
    '<filter id="s" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.28"/>' +
    '</filter></defs>' +

    '<g filter="url(#s)">' +
      '<circle cx="32" cy="24" r="' + r + '" fill="url(#g)" stroke="' + ring +
        '" stroke-width="' + (opts.me ? 4 : 3) + '"/>' +
      '<text x="32" y="30" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" ' +
        'font-size="15" font-weight="700" fill="#ffffff">' + xml(opts.initials) + '</text>' +
      (opts.online ? '<circle cx="46" cy="37" r="6" fill="#1f7a52" stroke="' + ring + '" stroke-width="2.5"/>' : '') +
    '</g>' +

    '<g filter="url(#s)">' +
      '<rect x="2" y="50" width="60" height="19" rx="9.5" fill="' + pill +
        '" stroke="' + pillLine + '" stroke-width="1"/>' +
      '<text x="32" y="63" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" ' +
        'font-size="10.5" font-weight="700" fill="' + pillText + '">' + xml(opts.label) + '</text>' +
    '</g>' +
  '</svg>';

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

/* A place pin: a small labelled card, the way a maps app draws a POI,
   so the map reads as somewhere real rather than an anonymous dot. */
function placeLabel(name) {
  var t = String(name || "Place");
  return t.length > 18 ? t.slice(0, 17) + "\u2026" : t;
}
function placePinWidth(name) {
  return Math.max(64, 22 + placeLabel(name).length * 6.6);
}
function placePinSVG(emoji, label) {
  var dark = state.theme === "dark" || state.mapStyle === "satellite";
  var bg = dark ? "#232120" : "#ffffff";
  var line = dark ? "#4a423c" : "#d9d3ca";
  var fg = dark ? "#f2efeb" : "#191614";
  var text = placeLabel(label);
  var w = placePinWidth(label);

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="40" viewBox="0 0 ' + w + ' 40">' +
      '<defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-opacity="0.32"/></filter></defs>' +
      '<g filter="url(#s)">' +
        '<rect x="1" y="1" width="' + (w - 2) + '" height="24" rx="12" fill="' + bg +
          '" stroke="' + line + '"/>' +
        '<text x="11" y="18" font-size="12" font-family="Helvetica,Arial,sans-serif">' + xml(emoji) + '</text>' +
        '<text x="26" y="17.5" font-size="11" font-weight="700" fill="' + fg +
          '" font-family="Helvetica,Arial,sans-serif">' + xml(text) + '</text>' +
        '<path d="M' + (w / 2 - 5) + ' 25 L' + (w / 2) + ' 32 L' + (w / 2 + 5) + ' 25 Z" fill="' + bg + '"/>' +
      '</g>' +
    '</svg>');
}

/* SVG lives in an XML document, so the escaping rules differ from HTML. */
function xml(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/* A name that fits on the pill. */
function pinName(name) {
  var first = String(name).split(/\s+/)[0];
  return first.length > 10 ? first.slice(0, 9) + "\u2026" : first;
}

function iwHTML(p) {
  return '<div class="iw">' +
    '<div class="iwtop">' + avatarHTML(p.name, p.id, 40) +
      '<div><b>' + esc(p.name) + ', ' + p.age + '</b>' +
      '<div class="h">' + (p.online ? ic('circle-dot') + ' Online now' : 'Active today') + '</div></div>' +
    '</div>' +
    '<div class="h">' + esc(p.headline) + '</div>' +
    '<div class="d">' + esc(p.city) + ' · ' + distanceLabel(p) + ' away</div>' +
    /* Be explicit about which kind of position this pin is. */
    '<div class="h">' + (p.exact ? 'Exact position — shared with you'
                                 : 'Approximate area only') + '</div>' +
    '<div class="btns">' +
      '<button data-act="detail" data-id="' + p.id + '">Profile</button>' +
      '<button class="p" data-decide="pair" data-id="' + p.id + '">Pair up</button>' +
    '</div>' +
  '</div>';
}

/* Redraw every pin. `fit` re-frames the map, which we skip after a
   drag so the view does not jump out from under the user. */
function paintMarkers(fit) {
  if (!maps.map) return;

  /* Clear whatever is on the map from the previous draw. */
  maps.markers.forEach(function (m) { maps.map.removeLayer(m); });
  maps.markers = [];
  if (maps.mine) { maps.map.removeLayer(maps.mine); maps.mine = null; }

  var list = mapPeople();
  var points = [];

  /* Turn one of our SVG pins into a Leaflet icon. The anchor puts the
     point of the pin on the exact coordinate. */
  function icon(opts) {
    return L.icon({
      iconUrl: pinSVG(opts),
      iconSize: [64, 78],
      iconAnchor: [32, 44],
      popupAnchor: [0, -40]
    });
  }

  list.forEach(function (p) {
    /* A matched friend who is sharing gets their exact pin; everyone
       else is only ever drawn at the rounded point on their card. */
    var friend = state.matches.indexOf(p.id) !== -1;
    var exact = friend && friendLoc[p.id];
    if (exact) p = Object.assign({}, p, { lat: exact.lat, lng: exact.lng, exact: true });
    if (typeof p.lat !== "number") return;

    var m = L.marker([p.lat, p.lng], {
      icon: icon({
        initials: initials(p.name),
        label: pinName(p.name) + (p.exact ? "" : " ~"),
        color: hueFor(p.id),
        online: p.online
      }),
      title: p.name + " \u2014 " + p.headline,
      zIndexOffset: p.online ? 1000 : 0,
      riseOnHover: true
    }).addTo(maps.map);

    m.bindPopup(iwHTML(p), { closeButton: true, minWidth: 220 });
    maps.markers.push(m);
    points.push([p.lat, p.lng]);
  });

  /* Your own pin. Draggable, unless live tracking is driving it. */
  maps.mine = L.marker([state.me.lat, state.me.lng], {
    icon: icon({
      initials: state.me.sharing ? initials(state.me.name) : "\u2022\u2022",
      label: state.me.sharing ? "You" : "Hidden",
      color: state.me.sharing ? "#c98a1c" : "#626e88",
      online: state.me.sharing && !!state.me.online,
      me: true
    }),
    opacity: state.me.sharing ? 1 : 0.55,
    /* While you are sharing, the pin is wherever the device says you
       are. Dragging it would be a way to fake your location to the
       people who trust it, so it is only movable in ghost mode. */
    draggable: !state.me.sharing,
    zIndexOffset: 2000,
    title: state.me.sharing ? "You \u2014 your real location, from this device"
                            : "Ghost mode \u2014 nobody can see this pin"
  }).addTo(maps.map);

  maps.mine.on("dragend", function (e) {
    if (state.me.sharing) return;
    var pos = e.target.getLatLng();
    state.me.lat = pos.lat;
    state.me.lng = pos.lng;
    state.me.locLabel = "Pin dropped on the map";
    save();
    paintMarkers(false);
    refreshLocBar();
    toast("Location moved \u2014 distances recalculated");
  });

  /* Places people have pinned to a category profile. */
  var seenPlaces = {};
  function addPlace(pl, slug) {
    if (!pl || typeof pl.lat !== "number") return;
    var key = pl.lat.toFixed(4) + "," + pl.lng.toFixed(4) + "|" + slug;
    if (seenPlaces[key]) return;
    seenPlaces[key] = true;
    var cat = categoryBySlug(slug);
    var m = L.marker([pl.lat, pl.lng], {
      icon: L.icon({
        iconUrl: placePinSVG((cat && cat.emoji) || "\ud83d\udccd", pl.name),
        iconSize: [placePinWidth(pl.name), 40],
        iconAnchor: [placePinWidth(pl.name) / 2, 32],
        popupAnchor: [0, -30]
      }),
      zIndexOffset: -500,
      title: pl.name
    }).addTo(maps.map);
    m.bindPopup('<div class="iw"><b>' + esc(pl.name) + '</b>' +
      (pl.address ? '<div class="h">' + esc(pl.address) + '</div>' : '') +
      '<div class="d">' + ((cat && cat.emoji + " " + cat.label) || "") + '</div></div>');
    maps.markers.push(m);
    points.push([pl.lat, pl.lng]);
  }

  list.forEach(function (per) {
    var ps = per.profiles || {};
    Object.keys(ps).forEach(function (slug) {
      if (state.filter === "all" || state.filter === slug) addPlace(ps[slug].place, slug);
    });
  });
  var myps = state.me.profiles || {};
  Object.keys(myps).forEach(function (slug) {
    if (state.filter === "all" || state.filter === slug) addPlace(myps[slug].place, slug);
  });

  points.push([state.me.lat, state.me.lng]);

  if (fit) {
    /* maxZoom keeps two pins in the same street from slamming the view
       all the way in; 13 is roughly "city district". */
    if (points.length > 1) {
      maps.map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 13 });
    } else {
      maps.map.setView([state.me.lat, state.me.lng], 12);
    }
  }

  var c = byId("mapcount");
  if (c) c.textContent = list.length + (list.length === 1 ? " person" : " people") + " on the map";
}

function refreshLocBar() {
  var bar = document.querySelector(".locbar");
  if (!bar) return;
  var me = state.me;
  bar.querySelector("b").textContent = me.sharing ? me.locLabel : "Ghost mode";
  bar.querySelector("small").textContent = me.sharing
    ? coordText() + (me.live && me.lastFix ? " · updated " + fixAgo() : " · drag your own pin to move it")
    : "Hidden from the map while ghost mode is on";
}

/* ==================================================================
   9. MATCHES
   ================================================================== */

function viewMatches() {
  if (!state.matches.length) {
    return '<div class="view"><div class="empty">' +
      '<div class="big">' + ic('heart') + '</div><h3>No matches yet</h3>' +
      '<p>Pair up with someone in Discover and they will show up here.</p>' +
      '<button class="btn primary" data-nav="discover">Go to Discover</button></div></div>';
  }
  var cards = state.matches.map(function (id) {
    var p = personById(id);
    if (!p) return "";
    var cat = categoryBySlug(p.cat);
    return '<button class="card mcard" data-act="open-chat" data-id="' + p.id + '">' +
      '<div class="top">' + avatarHTML(p.name, p.id, 46) +
        '<div><h4>' + esc(p.name) + '</h4>' +
        '<div class="sub">' + ic(cat.icon) + ' ' + esc(cat.label) + ' · ' + esc(p.city) + '</div></div>' +
      '</div>' +
      '<p class="sub" style="color:var(--muted);font-size:12.5px">' + esc(p.headline) + '</p>' +
      '<div class="tags">' + p.tags.slice(0, 3).map(function (t) {
        return '<span class="tag">' + esc(t) + '</span>'; }).join("") + '</div>' +
    '</button>';
  }).join("");
  return '<div class="view"><div class="grid">' + cards + '</div></div>';
}

/* ==================================================================
   10. CHATS
   ================================================================== */

function viewChats() {
  var partners = chatPartners();
  if (!partners.length) {
    return '<div class="view"><div class="empty">' +
      '<div class="big">' + ic('message-square-text') + '</div><h3>Nothing to read</h3>' +
      '<p>Message anyone straight from Discover, or pair up first — either way ' +
      'the conversation lands here.</p>' +
      '<button class="btn primary" data-nav="discover">Find someone</button></div></div>';
  }
  var rows = partners.map(function (id) {
    var p = personById(id);
    if (!p) return "";
    var msgs = state.threads[id] || [];
    var last = msgs[msgs.length - 1];
    var read = state.read[id] || 0;
    var unread = 0;
    for (var i = read; i < msgs.length; i++) if (msgs[i].from === "them") unread++;
    return '<button class="row" data-act="open-chat" data-id="' + id + '">' +
      avatarHTML(p.name, p.id, 44) +
      '<div class="grow"><h4>' + esc(p.name) + (unread ? '<span class="dot"></span>' : '') + '</h4>' +
      '<div class="last">' + (last ? (last.from === "me" ? "You: " : "") + esc(last.text) : "Say hello") + '</div></div>' +
      '<span class="when">' + (last ? esc(last.t) : "") + '</span>' +
    '</button>';
  }).join("");
  return '<div class="view"><div class="list">' + rows + '</div></div>';
}

/* One tick sent, two ticks delivered to their device, two gold ticks
   opened. Only ever drawn on your own messages. */
function ticksHTML(m) {
  if (m.from !== "me") return "";
  var cls = m.seen ? "tick seen" : (m.delivered ? "tick got" : "tick");
  var icon = (m.delivered || m.seen) ? "check-check" : "check";
  var label = m.seen ? "Seen" : (m.delivered ? "Delivered" : "Sent");
  return '<span class="' + cls + '" title="' + label + '" aria-label="' + label + '">' + ic(icon) + '</span>';
}

function clockOf(t) {
  var d = new Date(t);
  return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" +
         (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
}

function durLabel(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  return Math.floor(sec / 60) + ":" + (sec % 60 < 10 ? "0" : "") + (sec % 60);
}

/* A voice note. The audio itself rides inside the message document as a
   data: URI, so there is no file store to set up and nothing to clean
   up when a chat is deleted. */
function voiceBubbleHTML(m, i) {
  return '<div class="voice" data-voice="' + i + '">' +
      '<button type="button" class="vplay" data-vplay="' + i + '" aria-label="Play voice message">' +
        ic("play") + '</button>' +
      '<span class="vwave" aria-hidden="true">' +
        Array.apply(null, Array(22)).map(function (_, k) {
          /* A fixed pseudo-random shape: same message, same bars, every
             render, without storing a waveform. */
          var h = 22 + ((Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) / 2 * 60;
          return '<i style="height:' + Math.round(h) + '%"></i>';
        }).join("") +
      '</span>' +
      '<span class="vtime num" data-vtime="' + i + '">' + durLabel(m.dur) + '</span>' +
      '<audio preload="none" data-vaudio="' + i + '" src="' + esc(m.audio) + '"></audio>' +
    '</div>';
}

function bubblesHTML(p) {
  var msgs = state.threads[p.id] || [];
  var lastDay = "";
  return msgs.map(function (m, i) {
    var out = "";
    var day = new Date(m.t).toDateString();
    if (day !== lastDay) {
      lastDay = day;
      var today = new Date().toDateString();
      var label = day === today ? "Today" : new Date(m.t).toLocaleDateString(undefined,
        { weekday: "short", day: "numeric", month: "short" });
      out += '<div class="daysep"><span>' + esc(label) + '</span></div>';
    }
    var body = m.kind === "voice" ? voiceBubbleHTML(m, i)
             : m.kind === "call"  ? '<span class="callnote">' + ic("phone") + esc(m.text) + '</span>'
             : esc(m.text);
    return out + '<div class="bubble ' + (m.from === "me" ? "me" : "them") +
      (m.kind === "voice" ? " isvoice" : "") + (m.kind === "call" ? " iscall" : "") + '">' +
      body + '<span class="t">' + esc(clockOf(m.t)) + ticksHTML(m) + '</span></div>';
  }).join("");
}

function viewChat() {
  var p = personById(current.chatWith);
  if (!p) return viewChats();
  var canCall = !!(cloud.on && cloud.user && window.RTCPeerConnection && navigator.mediaDevices);

  return '<div class="chat">' +
    '<div class="head">' +
      '<button class="icobtn" data-nav="chats" aria-label="Back">' + ic('arrow-left') + '</button>' +
      avatarFor(p, 40) +
      '<div class="grow"><h3>' + esc(p.name) + verifiedHTML(p, true) + '</h3>' +
      '<div class="sub" id="chatpresence">' + (presenceLabel(p) || esc(p.city)) + '</div></div>' +
      (canCall
        ? '<button class="icobtn callbtn" data-act="callstart" data-id="' + esc(p.id) + '" ' +
          'title="Voice call" aria-label="Voice call ' + esc(p.name) + '">' + ic('phone') + '</button>'
        : '') +
      '<button class="icobtn" data-act="detail" data-id="' + esc(p.id) + '" ' +
        'title="View profile" aria-label="View profile">' + ic('user-round') + '</button>' +
    '</div>' +
    '<div class="thread" id="thread">' + bubblesHTML(p) + '</div>' +
    '<div class="reccard" id="reccard" hidden>' +
      '<span class="recdot"></span><span class="rectime num" id="rectime">0:00</span>' +
      '<span class="recnote">Recording — tap the mic again to send</span>' +
      '<button type="button" class="btn sm danger" id="reccancel">Cancel</button>' +
    '</div>' +
    '<form class="composer" id="composer" autocomplete="off">' +
      '<input id="msg" placeholder="Message ' + esc(p.name.split(" ")[0]) + '…" aria-label="Message">' +
      (canRecord()
        ? '<button type="button" class="send mic" id="micbtn" aria-label="Hold to record a voice message" ' +
          'title="Hold to record">' + ic('mic') + '</button>'
        : '') +
      '<button class="send" type="submit" aria-label="Send">' + ic('send-horizontal') + '</button>' +
    '</form>' +
  '</div>';
}

function afterChat() {
  var p = personById(current.chatWith);
  if (!p) return;
  /* localSave, not save(): a read receipt must not trigger a cloud
     write, because that write comes straight back as a snapshot and
     re-renders the chat mid-keystroke. */
  state.read[p.id] = (state.threads[p.id] || []).length;
  localSave();
  renderNav();
  markThreadSeen(p.id);

  var thread = byId("thread");
  if (thread) thread.scrollTop = thread.scrollHeight;
  armVoicePlayback();
  startPresenceTicker();

  var form = byId("composer");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = byId("msg");
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendMessage(p.id, { kind: "text", text: text });
  });

  if (byId("micbtn")) armRecorder(p.id);

  var input = byId("msg");

  /* When the keyboard opens the viewport shrinks; scroll the box back
     into view so you can see what you are typing. */
  input.addEventListener("focus", function () {
    setTimeout(function () {
      var t = byId("thread");
      if (t) t.scrollTop = t.scrollHeight;
      input.scrollIntoView({ block: "nearest" });
    }, 250);
  });

  input.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });
  input.focus();
}

/* One way in for every kind of message. Draws it straight away so the
   thread feels instant, then lets the Firestore snapshot replace it
   with the authoritative copy (which is what carries the receipts). */
function sendMessage(id, msg) {
  pushMsg(id, "me", msg);
  if (cloud.on && cloud.user) sendToCloud(id, msg);
}

function pushMsg(id, from, msg) {
  if (typeof msg === "string") msg = { kind: "text", text: msg };
  if (!state.threads[id]) state.threads[id] = [];
  state.threads[id].push({
    from: from, kind: msg.kind || "text", text: msg.text || "",
    audio: msg.audio || "", dur: msg.dur || 0,
    t: Date.now(), delivered: false, seen: false
  });
  save();
  if (current.view === "chat" && current.chatWith === id) {
    state.read[id] = state.threads[id].length;
    save();
    repaintThread();
  }
  renderNav();
}

/* The "last active" line has to age while you are looking at it. */
var presenceTimer = null;
function startPresenceTicker() {
  if (presenceTimer) clearInterval(presenceTimer);
  presenceTimer = setInterval(function () {
    var el = byId("chatpresence");
    if (!el) { clearInterval(presenceTimer); presenceTimer = null; return; }
    var p = personById(current.chatWith);
    if (p) el.textContent = presenceLabel(p) || p.city;
  }, 30000);
}

/* ==================================================================
   11c. VOICE CALLS
   WebRTC, with Firestore used only to pass the offer, the answer and
   the ICE candidates between the two browsers. Once connected the
   audio goes peer to peer and never touches a server of ours.

   The one honest caveat: there is a STUN server but no TURN server.
   STUN is free and gets two peers talking through most home routers.
   A minority of networks — strict corporate NATs, some mobile carrier
   CGNAT — need TURN, which has to be paid for. On those, the call
   will ring, fail to connect, and say so rather than hanging.
   ================================================================== */

var RTC_CONF = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }]
};

var call = {
  id: null, pc: null, local: null, remote: null,
  role: null,            // "caller" | "callee"
  withId: null, withName: "",
  state: "idle",         // idle | ringing | connecting | live | ended
  started: 0, timer: null, muted: false,
  unsubDoc: null, unsubCand: null, ringTo: null
};

function callsCol() { return cloud.db.collection("calls"); }

function canCall() {
  return !!(cloud.on && cloud.user && window.RTCPeerConnection &&
            navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/* ---- placing a call ---------------------------------------------- */

function startCall(otherUid) {
  if (!canCall()) { toast("This browser cannot make calls"); return; }
  if (call.state !== "idle") { toast("You are already on a call"); return; }
  var p = personById(otherUid);
  if (!p) return;

  call.role = "caller";
  call.withId = otherUid;
  call.withName = p.name;
  setCallState("connecting");

  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    call.local = stream;
    var pc = newPeer();
    stream.getTracks().forEach(function (t) { pc.addTrack(t, stream); });

    var doc = callsCol().doc();
    call.id = doc.id;
    var callerCands = doc.collection("callerCandidates");
    pc.onicecandidate = function (e) { if (e.candidate) callerCands.add(e.candidate.toJSON()); };

    return pc.createOffer()
      .then(function (offer) { return pc.setLocalDescription(offer).then(function () { return offer; }); })
      .then(function (offer) {
        return doc.set({
          from: cloud.user.uid,
          fromName: state.me.name || "Member",
          to: otherUid,
          state: "ringing",
          t: Date.now(),
          offer: { type: offer.type, sdp: offer.sdp }
        });
      })
      .then(function () {
        setCallState("ringing");
        watchCallDoc(doc, "callee");
        /* Nobody should listen to a ringtone forever. */
        call.ringTo = setTimeout(function () {
          if (call.state === "ringing") endCall("No answer");
        }, 45000);
      });
  }).catch(function (err) {
    endCall(err && err.name === "NotAllowedError"
      ? "Microphone permission was declined"
      : "Could not start the call");
  });
}

/* ---- answering --------------------------------------------------- */

function answerCall() {
  if (!call.id || call.role !== "callee") return;
  setCallState("connecting");

  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    call.local = stream;
    var pc = newPeer();
    stream.getTracks().forEach(function (t) { pc.addTrack(t, stream); });

    var doc = callsCol().doc(call.id);
    var calleeCands = doc.collection("calleeCandidates");
    pc.onicecandidate = function (e) { if (e.candidate) calleeCands.add(e.candidate.toJSON()); };

    return doc.get().then(function (snap) {
      var d = snap.data() || {};
      if (!d.offer) throw new Error("no offer");
      return pc.setRemoteDescription(new RTCSessionDescription(d.offer));
    }).then(function () {
      return pc.createAnswer();
    }).then(function (answer) {
      return pc.setLocalDescription(answer).then(function () { return answer; });
    }).then(function (answer) {
      return doc.update({
        state: "live",
        answer: { type: answer.type, sdp: answer.sdp }
      });
    }).then(function () {
      watchCallDoc(doc, "caller");
    });
  }).catch(function (err) {
    endCall(err && err.name === "NotAllowedError"
      ? "Microphone permission was declined"
      : "Could not answer");
  });
}

function newPeer() {
  var pc = new RTCPeerConnection(RTC_CONF);
  call.pc = pc;
  pc.ontrack = function (e) {
    call.remote = e.streams[0];
    var el = byId("callaudio");
    if (el) { el.srcObject = call.remote; el.play().catch(function () {}); }
  };
  pc.onconnectionstatechange = function () {
    if (pc.connectionState === "connected") setCallState("live");
    if (pc.connectionState === "failed") {
      /* Almost always a NAT that STUN alone cannot punch through. */
      endCall("Could not connect — this network needs a TURN server");
    }
    if (pc.connectionState === "disconnected" && call.state === "live") endCall("Call ended");
  };
  return pc;
}

/* Watch the other side's half of the handshake: their answer (if we are
   the caller) and their ICE candidates, plus the hang-up flag. */
function watchCallDoc(doc, otherRole) {
  if (call.unsubDoc) call.unsubDoc();
  call.unsubDoc = doc.onSnapshot(function (snap) {
    var d = snap.data();
    if (!d) { endCall("Call ended"); return; }
    if (d.state === "ended") { endCall(d.reason || "Call ended"); return; }
    if (d.state === "declined") { endCall("Declined"); return; }
    if (call.role === "caller" && d.answer && call.pc && !call.pc.currentRemoteDescription) {
      call.pc.setRemoteDescription(new RTCSessionDescription(d.answer))
        .then(function () { setCallState("live"); })
        .catch(function () { endCall("Could not connect"); });
    }
  });

  if (call.unsubCand) call.unsubCand();
  var col = doc.collection(otherRole === "callee" ? "calleeCandidates" : "callerCandidates");
  call.unsubCand = col.onSnapshot(function (snap) {
    snap.docChanges().forEach(function (ch) {
      if (ch.type !== "added" || !call.pc) return;
      call.pc.addIceCandidate(new RTCIceCandidate(ch.doc.data())).catch(function () {});
    });
  });
}

/* ---- incoming ----------------------------------------------------- */

function watchIncomingCalls() {
  if (!cloud.on || !cloud.user) return;
  if (unsub.calls) unsub.calls();
  unsub.calls = callsCol()
    .where("to", "==", cloud.user.uid)
    .where("state", "==", "ringing")
    .onSnapshot(function (snap) {
      snap.docChanges().forEach(function (ch) {
        if (ch.type !== "added") return;
        var d = ch.doc.data() || {};
        /* A stale ringing document from a browser that was closed
           mid-call should not ring an hour later. */
        if (Date.now() - (d.t || 0) > 60000) return;
        if (call.state !== "idle") { ch.doc.ref.update({ state: "declined" }); return; }
        if (state.blocked && state.blocked.indexOf(d.from) !== -1) {
          ch.doc.ref.update({ state: "declined" });
          return;
        }
        call.id = ch.doc.id;
        call.role = "callee";
        call.withId = d.from;
        call.withName = d.fromName || "Someone";
        setCallState("ringing");
        notify(call.withName, "Incoming voice call", null);
        raiseAlert(call.withName, "Incoming voice call", null);
      });
    }, function (err) {
      /* Silence here is indistinguishable from "nobody is calling you",
         which makes a rules problem impossible to spot. */
      if (window.console) console.warn("Incoming calls unavailable:", err && err.message);
    });
}

function declineCall() {
  if (call.id) callsCol().doc(call.id).update({ state: "declined" }).catch(function () {});
  endCall("Declined");
}

function endCall(reason) {
  var wasLive = call.state === "live";
  var secs = wasLive ? Math.round((Date.now() - call.started) / 1000) : 0;
  var withId = call.withId;

  if (call.id && call.state !== "idle" && call.state !== "ended") {
    callsCol().doc(call.id).update({ state: "ended", reason: reason || "" }).catch(function () {});
  }
  if (call.unsubDoc) { call.unsubDoc(); call.unsubDoc = null; }
  if (call.unsubCand) { call.unsubCand(); call.unsubCand = null; }
  if (call.ringTo) { clearTimeout(call.ringTo); call.ringTo = null; }
  if (call.timer) { clearInterval(call.timer); call.timer = null; }
  if (call.local) call.local.getTracks().forEach(function (t) { t.stop(); });
  if (call.pc) { try { call.pc.close(); } catch (e) {} }

  call.pc = null; call.local = null; call.remote = null;
  call.id = null; call.role = null; call.muted = false;
  call.state = "idle";
  paintCall();

  /* A call leaves a line in the thread, the way a phone leaves an entry
     in the log. */
  if (withId && wasLive) {
    sendMessage(withId, { kind: "call", text: "Voice call · " + durLabel(secs) });
  } else if (withId && reason && reason !== "Declined") {
    toast(reason);
  } else if (reason === "Declined") {
    toast("Call declined");
  }
}

function toggleMute() {
  if (!call.local) return;
  call.muted = !call.muted;
  call.local.getAudioTracks().forEach(function (t) { t.enabled = !call.muted; });
  paintCall();
}

function setCallState(next) {
  call.state = next;
  if (next === "live" && !call.timer) {
    call.started = Date.now();
    call.timer = setInterval(function () {
      var el = byId("calltimer");
      if (el) el.textContent = durLabel((Date.now() - call.started) / 1000);
    }, 500);
  }
  paintCall();
}

/* ---- the call overlay --------------------------------------------- */

function paintCall() {
  var host = byId("callui");
  if (!host) return;
  if (call.state === "idle") { host.hidden = true; host.innerHTML = ""; return; }

  var incoming = call.role === "callee" && call.state === "ringing";
  var label = incoming ? "Incoming call"
            : call.state === "ringing"   ? "Ringing…"
            : call.state === "connecting" ? "Connecting…"
            : "Connected";

  host.hidden = false;
  host.innerHTML =
    '<div class="callbox">' +
      '<div class="callface">' + avatarHTML(call.withName, call.withId || call.withName, 96) + '</div>' +
      '<h2>' + esc(call.withName) + '</h2>' +
      '<p class="callstate">' + esc(label) +
        (call.state === "live" ? ' · <span class="num" id="calltimer">0:00</span>' : '') + '</p>' +
      '<div class="callacts">' +
        (incoming
          ? '<button class="callkey no" data-call="decline" aria-label="Decline">' + ic("phone-off") + '</button>' +
            '<button class="callkey yes" data-call="answer" aria-label="Answer">' + ic("phone-call") + '</button>'
          : '<button class="callkey mute' + (call.muted ? " on" : "") + '" data-call="mute" ' +
              'aria-label="' + (call.muted ? "Unmute" : "Mute") + '">' +
              ic(call.muted ? "mic-off" : "mic") + '</button>' +
            '<button class="callkey no" data-call="hangup" aria-label="Hang up">' + ic("phone-off") + '</button>') +
      '</div>' +
      '<p class="callfine">Audio goes straight between the two of you. ' +
        'On a few strict networks it will not connect — you will be told if that happens.</p>' +
    '</div>' +
    '<audio id="callaudio" autoplay></audio>';
}

/* ==================================================================
   11b. VOICE NOTES
   Recorded with MediaRecorder, encoded as a data: URI and carried
   inside the message document itself. That keeps the whole app on
   Firestore's free tier with no file storage to configure — at the
   cost of a hard length limit, which is why recording stops itself
   at sixty seconds.
   ================================================================== */

var VOICE_MAX_SEC = 60;
var VOICE_MAX_BYTES = 900000;          // Firestore documents cap at 1 MiB
var rec = { mr: null, chunks: [], started: 0, timer: null, to: null, cancelled: false };

function canRecord() {
  return !!(window.MediaRecorder && navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia);
}

/* Chrome and Firefox take Opus in a WebM container; Safari does not, and
   takes MP4 instead. Anything else falls back to the browser default. */
function recorderMime() {
  var want = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (var i = 0; i < want.length; i++) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(want[i])) return want[i];
  }
  return "";
}

function armRecorder(partnerId) {
  var btn = byId("micbtn");
  if (!btn) return;
  btn.addEventListener("click", function () {
    if (rec.mr && rec.mr.state === "recording") stopRecording(false);
    else startRecording(partnerId);
  });
  var cancel = byId("reccancel");
  if (cancel) cancel.addEventListener("click", function () { stopRecording(true); });
}

function startRecording(partnerId) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    var mime = recorderMime();
    try {
      rec.mr = new MediaRecorder(stream, mime
        ? { mimeType: mime, audioBitsPerSecond: 24000 }
        : { audioBitsPerSecond: 24000 });
    } catch (e) {
      rec.mr = new MediaRecorder(stream);
    }
    rec.chunks = [];
    rec.cancelled = false;
    rec.started = Date.now();

    rec.mr.ondataavailable = function (e) { if (e.data && e.data.size) rec.chunks.push(e.data); };
    rec.mr.onstop = function () {
      stream.getTracks().forEach(function (t) { t.stop(); });
      clearInterval(rec.timer); clearTimeout(rec.to);
      setRecUI(false);
      if (rec.cancelled) { rec.chunks = []; return; }

      var sec = Math.round((Date.now() - rec.started) / 1000);
      if (sec < 1) { toast("Too short — hold on a moment longer"); return; }
      var blob = new Blob(rec.chunks, { type: rec.chunks[0] ? rec.chunks[0].type : "audio/webm" });
      var reader = new FileReader();
      reader.onload = function () {
        var uri = String(reader.result || "");
        if (uri.length > VOICE_MAX_BYTES) {
          toast("That note is too long to send — try under a minute");
          return;
        }
        sendMessage(partnerId, { kind: "voice", text: "Voice message", audio: uri, dur: sec });
      };
      reader.readAsDataURL(blob);
    };

    rec.mr.start();
    setRecUI(true);
    rec.timer = setInterval(function () {
      var el = byId("rectime");
      if (el) el.textContent = durLabel((Date.now() - rec.started) / 1000);
    }, 200);
    /* Stops itself, so nobody sends a document Firestore will reject. */
    rec.to = setTimeout(function () { stopRecording(false); }, VOICE_MAX_SEC * 1000);
  }).catch(function (err) {
    toast(err && err.name === "NotAllowedError"
      ? "Microphone permission was declined"
      : "No microphone available");
  });
}

function stopRecording(cancelled) {
  rec.cancelled = !!cancelled;
  if (rec.mr && rec.mr.state === "recording") rec.mr.stop();
  else setRecUI(false);
}

function setRecUI(on) {
  var card = byId("reccard"), btn = byId("micbtn");
  if (card) card.hidden = !on;
  if (btn) {
    btn.innerHTML = ic(on ? "square" : "mic");
    btn.classList.toggle("recording", on);
    btn.setAttribute("aria-label", on ? "Stop and send" : "Record a voice message");
  }
  if (!on) { var t = byId("rectime"); if (t) t.textContent = "0:00"; }
}

/* One <audio> per bubble. Playing one stops whatever else was playing,
   because two voice notes at once is nobody's idea of a good time. */
function armVoicePlayback() {
  var thread = byId("thread");
  if (!thread || thread.dataset.voiceArmed) return;
  thread.dataset.voiceArmed = "1";
  thread.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-vplay]");
    if (!btn) return;
    var i = btn.getAttribute("data-vplay");
    var audio = thread.querySelector('[data-vaudio="' + i + '"]');
    if (!audio) return;

    Array.prototype.forEach.call(thread.querySelectorAll("audio"), function (a) {
      if (a !== audio) { a.pause(); a.currentTime = 0; }
    });
    Array.prototype.forEach.call(thread.querySelectorAll("[data-vplay]"), function (b) {
      if (b !== btn) { b.innerHTML = ic("play"); b.classList.remove("playing"); }
    });

    if (audio.paused) {
      audio.play().then(function () {
        btn.innerHTML = ic("pause");
        btn.classList.add("playing");
      }, function () { toast("That voice note could not be played"); });
    } else {
      audio.pause();
      btn.innerHTML = ic("play");
      btn.classList.remove("playing");
    }

    if (!audio.dataset.wired) {
      audio.dataset.wired = "1";
      var label = thread.querySelector('[data-vtime="' + i + '"]');
      var wrap = thread.querySelector('[data-voice="' + i + '"]');
      audio.addEventListener("timeupdate", function () {
        if (label && audio.duration && isFinite(audio.duration)) {
          label.textContent = durLabel(audio.currentTime);
          if (wrap) wrap.style.setProperty("--vpos", (audio.currentTime / audio.duration * 100) + "%");
        }
      });
      audio.addEventListener("ended", function () {
        btn.innerHTML = ic("play");
        btn.classList.remove("playing");
        if (wrap) wrap.style.setProperty("--vpos", "0%");
        if (label) label.textContent = durLabel(audio.duration || 0);
      });
    }
  });
}

/* Replies now arrive from the other person through Firestore, so there
   is nothing to simulate. Kept as a no-op for older call sites. */
function replyLater() {}

/* ==================================================================
   11. PROFILE
   ================================================================== */

/* Account card: who is signed in, whether Firestore is syncing, and a
   way out. Renders nothing at all when Firebase is switched off. */
function accountCardHTML() {
  if (!cloud.on) {
    return '<section class="card panel">' +
      '<h3>Account</h3>' +
      '<p style="color:var(--muted);font-size:13.5px">Firebase is switched off, so everything is ' +
      'saved only in this browser. Clearing site data would erase it.</p>' +
    '</section>';
  }

  if (!cloud.user) {
    return '<section class="card panel">' +
      '<h3>Account</h3>' +
      '<p style="color:var(--muted);font-size:13.5px;margin-bottom:12px">You are browsing without ' +
      'signing in. Sign in with Google to keep your profile, matches and chats across devices.</p>' +
      '<button class="btn block" data-act="signin">Sign in with Google</button>' +
    '</section>';
  }

  var u = cloud.user;
  return '<section class="card panel">' +
    '<h3>Account</h3>' +
    '<div class="acctrow" style="margin-bottom:14px">' +
      (u.photoURL
        ? '<img src="' + esc(u.photoURL) + '" alt="" width="40" height="40" ' +
          'style="flex:none;border:2px solid var(--border)" ' +
          'referrerpolicy="no-referrer">'
        : avatarHTML(u.displayName || "You", "me", 40)) +
      '<span class="who"><b>' + esc(u.displayName || "Signed in") + '</b>' +
        '<span>' + esc(u.email || "") + '</span></span>' +
      '<span class="syncdot' + (cloud.error ? ' off' : '') + '"><i></i>' +
        '<span id="syncstate">' + (cloud.error ? "Not syncing" : "Synced") + '</span></span>' +
    '</div>' +
    (cloud.error
      ? '<p style="margin:-4px 0 12px;padding:10px 12px;' +
        'background:var(--star-soft);color:var(--star);font-size:12.5px">' +
        esc(cloud.error) + '</p>'
      : '') +
    '<button class="btn block" data-act="signout">Sign out</button>' +
  '</section>';
}

function viewProfile() {
  var me = state.me;
  /* One profile per category: add, edit, delete. */
  var mine = me.profiles || {};
  var used = Object.keys(mine);
  var free = CATEGORIES.filter(function (c) {
    return c.slug !== "all" && used.indexOf(c.slug) === -1;
  });

  var interests =
    (used.length
      ? '<div class="proflist">' + used.map(function (slug) {
          var c = categoryBySlug(slug);
          var pr = mine[slug] || {};
          if (!c) return "";
          return '<div class="profrow">' +
            '<span class="profemoji" aria-hidden="true">' + ic(c.icon) + '</span>' +
            '<div class="profmain">' +
              '<b>' + esc(c.label) + '</b>' +
              '<small>' + esc(pr.headline || "No headline yet") + '</small>' +
            '</div>' +
            '<button class="btn sm" data-profedit="' + esc(slug) + '">Edit</button>' +
            '<button class="icobtn del" data-profdel="' + esc(slug) + '" ' +
              'title="Delete this profile" aria-label="Delete your ' + esc(c.label) + ' profile">' + ic('trash-2') + '</button>' +
          '</div>';
        }).join("") + '</div>'
      : '<p class="profempty">No category profiles yet. Add one and you will show up ' +
        'when people browse that category.</p>') +

    (free.length
      ? '<div class="profadd"><span class="hint">Add a profile</span><div class="chiprow">' +
          free.map(function (c) {
            return '<button class="chip" data-profadd="' + esc(c.slug) + '">' +
              ic(c.icon) + ' ' + esc(c.label) + '</button>';
          }).join("") +
        '</div></div>'
      : '<p class="profempty">You have a profile in every category.</p>');

  return '<div class="view"><div class="profgrid">' +
    '<section class="card panel me">' +
      '<div class="photopick">' +
        avatarFor({ name: me.name, id: "me", photo: me.photo }, 88) +
        '<div class="grow" style="text-align:left">' +
          '<button class="btn sm" id="photobtn">' + ic("camera") + ' ' +
            (me.photo ? "Change photo" : "Add a photo") + '</button>' +
          (me.photo ? '<button class="btn sm ghost" data-act="photo-clear">Remove</button>' : '') +
          '<input type="file" id="photofile" accept="image/*">' +
        '</div>' +
      '</div>' +
      '<div><h3 style="text-transform:none;letter-spacing:-.3px;font-size:18px;color:var(--text)">' +
        esc(me.name) + ', ' + esc(me.age) + '</h3>' +
        '<p style="color:var(--faint);font-size:12.5px;margin-top:3px">' + ic('map-pin') + ' ' + esc(me.city) + '</p></div>' +
      '<div class="dbadges" style="justify-content:center">' +
        (me.phoneVerified
          ? '<span class="vbadge">' + ic("shield-check") + 'Verified</span>'
          : '<button class="vbadge no" data-act="verifyphone" style="cursor:pointer">' +
            ic("shield-alert") + 'Unverified — get verified</button>') +
      '</div>' +
      '<div class="stats">' +
        '<div class="stat"><b>' + state.liked.length + '</b><span>Invites</span></div>' +
        '<div class="stat"><b>' + state.matches.length + '</b><span>Pairs</span></div>' +
        '<div class="stat"><b>' + state.seen.length + '</b><span>Viewed</span></div>' +
      '</div>' +
      '<button class="btn block" data-act="reset-all">Reset all data</button>' +
    '</section>' +

    accountCardHTML() +

    '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<section class="card panel">' +
        '<h3>Your details</h3>' +
        '<div class="field"><label for="f-name">Display name</label>' +
          '<input id="f-name" data-me="name" value="' + esc(me.name) + '"></div>' +
        '<div style="display:grid;grid-template-columns:110px minmax(0,1fr);gap:12px">' +
          '<div class="field"><label for="f-age">Age</label>' +
            '<input id="f-age" data-me="age" type="number" min="16" max="99" value="' + esc(me.age) + '"></div>' +
          '<div class="field"><label for="f-city">City</label>' +
            '<input id="f-city" data-me="city" value="' + esc(me.city) + '"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px">' +
          '<div class="field"><label for="f-gender">Gender</label>' +
            '<input id="f-gender" data-me="gender" maxlength="24" placeholder="Optional" value="' +
              esc(me.gender || "") + '"></div>' +
          '<div class="field"><label for="f-height">Height</label>' +
            '<input id="f-height" data-me="height" maxlength="12" placeholder="170 cm" value="' +
              esc(me.height || "") + '"></div>' +
          '<div class="field"><label for="f-career">Career</label>' +
            '<input id="f-career" data-me="career" maxlength="40" placeholder="Nurse, student\u2026" value="' +
              esc(me.career || "") + '"></div>' +
        '</div>' +
        '<div class="field"><label for="f-head">Headline</label>' +
          '<input id="f-head" data-me="headline" maxlength="60" value="' + esc(me.headline) + '"></div>' +
        '<div class="field"><label for="f-bio">About you</label>' +
          '<textarea id="f-bio" data-me="bio" maxlength="400">' + esc(me.bio) + '</textarea></div>' +
      '</section>' +

      '<section class="card panel">' +
        '<h3>Location</h3>' +
        '<div class="locbar" style="border:none;padding:0">' +
          '<span aria-hidden="true">' + ic('map-pin', 'lg') + '</span>' +
          '<div class="grow"><b>' + esc(me.locLabel) + '</b>' +
            '<small>' + esc(coordText()) + '</small></div>' +
          '<button class="btn sm" data-act="use-location">' + ic('crosshair') + ' Use my location</button>' +
        '</div>' +
        '<div class="locctl" style="margin-top:0">' +
          '<div class="ctl"><button class="switch" role="switch" data-toggle="sharing" ' +
            'aria-checked="' + !!me.sharing + '" aria-label="Share my location"></button>' +
            '<span>Share my location</span></div>' +
          '<div class="ctl"><button class="switch" role="switch" data-toggle="live" ' +
            'aria-checked="' + !!me.live + '" aria-label="Live location"' +
            (me.sharing ? '' : ' disabled style="opacity:.45"') + '></button>' +
            '<span>Live' + (me.live && me.liveUntil ? ' · ' + esc(liveCountdown()) : '') + '</span></div>' +
        '</div>' +
        '<p style="color:var(--faint);font-size:12px">Every distance in GG Partner is measured from here. ' +
        'Ghost mode hides your pin; live mode follows you until you stop it. Nothing leaves this browser ' +
        '— there is no server behind this app yet, so “sharing” is local state.</p>' +
      '</section>' +

      '<section class="card panel">' +
        '<h3>Where else to find you</h3>' +
        '<p style="color:var(--faint);font-size:12px;margin-bottom:2px">Handles only — no need for the ' +
          'full link. Leave anything blank to keep it off your card.</p>' +
        LINK_KINDS.map(function (k) {
          return '<div class="field"><label for="lk-' + k.id + '">' +
            ic(k.icon, k.icon.indexOf("b-") === 0 ? "brand" : "") + ' ' + esc(k.label) + '</label>' +
            '<input id="lk-' + k.id + '" data-link="' + k.id + '" maxlength="40" placeholder="' +
              esc(k.ph) + '" value="' + esc((me.links || {})[k.id] || "") + '">' +
            (k.hint ? '<small style="color:var(--faint);font-size:11.5px">' + esc(k.hint) + '</small>' : '') +
          '</div>';
        }).join("") +
        '<div class="switchrow"><div class="grow"><b>Show my phone to everyone</b>' +
          '<small>Off means only people you have matched with can see it</small></div>' +
          '<button class="switch" role="switch" data-toggle="phonePublic" aria-checked="' +
            !!me.phonePublic + '" aria-label="Show my phone to everyone"></button></div>' +
      '</section>' +

      '<section class="card panel">' +
        '<h3>When you are free</h3>' +
        '<div class="field"><label>Days</label>' +
          '<div class="daypick" id="daypick">' +
            DAY_NAMES.map(function (d, i) {
              return '<button type="button" data-day="' + i + '" aria-pressed="' +
                ((me.days || []).indexOf(i) !== -1) + '">' + d + '</button>';
            }).join("") +
          '</div></div>' +
        '<div class="field"><label>Times</label>' +
          '<div class="chiprow wrapchips" id="blockpick">' +
            TIME_BLOCKS.map(function (b) {
              return '<button type="button" class="chip" data-block="' + b.id + '" aria-pressed="' +
                ((me.blocks || []).indexOf(b.id) !== -1) + '">' + esc(b.label) + '</button>';
            }).join("") +
          '</div></div>' +
        '<div class="switchrow"><div class="grow"><b>Free right now</b>' +
          '<small>Puts you at the top for anyone filtering on it</small></div>' +
          '<button class="switch" role="switch" data-toggle="freeNow" aria-checked="' +
            !!me.freeNow + '" aria-label="Free right now"></button></div>' +
      '</section>' +

      blockedPanelHTML() +

      '<section class="card panel">' +
        '<h3>What you are looking for</h3>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px">' + interests + '</div>' +
      '</section>' +

      '<section class="card panel">' +
        '<h3>Preferences</h3>' +
        '<div class="switchrow"><div class="grow"><b>Show me as online</b>' +
          '<small>Others see a green dot on your card</small></div>' +
          '<button class="switch" role="switch" data-toggle="online" aria-checked="' + !!me.online + '" aria-label="Show me as online"></button></div>' +
        '<div class="switchrow"><div class="grow"><b>Nearby first</b>' +
          '<small>Sort the list by distance instead of who is online</small></div>' +
          '<button class="switch" role="switch" data-toggle="nearby" aria-checked="' + !!me.nearby + '" aria-label="Nearby first"></button></div>' +
        '<div class="switchrow"><div class="grow"><b>New pair alerts</b>' +
          '<small>Get a notification the moment someone pairs back</small></div>' +
          '<button class="switch" role="switch" data-toggle="notify" aria-checked="' + !!me.notify + '" aria-label="New pair alerts"></button></div>' +
        '<div class="switchrow"><div class="grow"><b>Dark theme</b>' +
          '<small>Easier on the eyes at 2am</small></div>' +
          '<button class="switch" role="switch" data-toggle="theme" aria-checked="' + (state.theme === "dark") + '" aria-label="Dark theme"></button></div>' +
      '</section>' +
    '</div>' +
  '</div></div>';
}

function armProfile() {
  Array.prototype.forEach.call(document.querySelectorAll("[data-me]"), function (el) {
    el.addEventListener("input", function () {
      var key = el.getAttribute("data-me");
      state.me[key] = el.type === "number" ? (parseInt(el.value, 10) || 0) : el.value;
      save();
    });
  });

  /* Contact handles. Cleaned on the way out of the box, so what is
     stored is always a handle and never a pasted URL. */
  Array.prototype.forEach.call(document.querySelectorAll("[data-link]"), function (el) {
    el.addEventListener("change", function () {
      var id = el.getAttribute("data-link");
      if (!state.me.links) state.me.links = {};
      var v = cleanHandle(id, el.value);
      el.value = v;
      state.me.links[id] = v;
      save(); publishProfile();
    });
  });

  var days = byId("daypick");
  if (days) days.addEventListener("click", function (e) {
    var b = e.target.closest("[data-day]");
    if (!b) return;
    var d = Number(b.getAttribute("data-day"));
    if (!state.me.days) state.me.days = [];
    var i = state.me.days.indexOf(d);
    if (i === -1) state.me.days.push(d); else state.me.days.splice(i, 1);
    b.setAttribute("aria-pressed", i === -1);
    save(); publishProfile();
  });

  var blocks = byId("blockpick");
  if (blocks) blocks.addEventListener("click", function (e) {
    var b = e.target.closest("[data-block]");
    if (!b) return;
    var id = b.getAttribute("data-block");
    if (!state.me.blocks) state.me.blocks = [];
    var i = state.me.blocks.indexOf(id);
    if (i === -1) state.me.blocks.push(id); else state.me.blocks.splice(i, 1);
    b.setAttribute("aria-pressed", i === -1);
    save(); publishProfile();
  });

  var photoBtn = byId("photobtn"), photoFile = byId("photofile");
  if (photoBtn && photoFile) {
    photoBtn.addEventListener("click", function () { photoFile.click(); });
    photoFile.addEventListener("change", function () {
      if (photoFile.files && photoFile.files[0]) shrinkPhoto(photoFile.files[0]);
    });
  }
}

/* Photos are squashed to a 256px square JPEG before they are stored, so
   the whole card stays comfortably inside a Firestore document and no
   file storage has to be set up. */
function shrinkPhoto(file) {
  if (!/^image\//.test(file.type)) { toast("That is not an image"); return; }
  var reader = new FileReader();
  reader.onload = function () {
    var img = new Image();
    img.onload = function () {
      var side = Math.min(img.width, img.height);
      var c = document.createElement("canvas");
      c.width = c.height = 256;
      var ctx = c.getContext("2d");
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
      var out = c.toDataURL("image/jpeg", 0.72);
      if (out.length > 120000) out = c.toDataURL("image/jpeg", 0.55);
      state.me.photo = out;
      save(); publishProfile(); render();
      toast("Photo updated");
    };
    img.onerror = function () { toast("That image could not be read"); };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

/* The list of people you have blocked, with a way back. */
function blockedPanelHTML() {
  var list = state.blocked || [];
  if (!list.length) return "";
  return '<section class="card panel">' +
    '<h3>Blocked</h3>' +
    '<div class="blocklist">' + list.map(function (id) {
      var p = personById(id);
      return '<div class="blockrow">' + ic("ban") +
        '<span class="grow">' + esc(p ? p.name : "Member") + '</span>' +
        '<button class="btn sm" data-act="unblock" data-id="' + esc(id) + '">Unblock</button></div>';
    }).join("") + '</div>' +
    '<p style="color:var(--faint);font-size:12px">Blocked members cannot see you and you ' +
      'cannot see them. Unblocking puts you both back in each other\'s list.</p>' +
  '</section>';
}

/* ==================================================================
   10b. EVENTS — host a session, fill the slots, then play

   An event has two phases:
     recruiting  waiting for people to join
     live        slots are full, the session is on
   Both are timed, so you can see how long a lobby has been waiting or
   how long a session has been running.
   ================================================================== */

var EVENTS = [];          // everything visible to me
var eventTimer = null;

function uid4() {
  return "e" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}

function myId() {
  return (cloud.user && cloud.user.uid) || "local-me";
}

function myName() {
  return state.me.name || "You";
}

/* Everyone in the lobby, host included. */
function eventMembers(ev) { return ev.members || []; }
function isMember(ev) {
  return eventMembers(ev).some(function (m) { return m.uid === myId(); });
}
function isHost(ev) { return ev.host && ev.host.uid === myId(); }
function slotsLeft(ev) { return Math.max(0, ev.slots - eventMembers(ev).length); }

/* Friends-only events are visible to the host's matches. */
function canSeeEvent(ev) {
  if (ev.visibility === "public") return true;
  if (isHost(ev) || isMember(ev)) return true;
  /* An invitation gets you in whatever the setting says — otherwise
     inviting somebody who is not a match would do nothing. */
  if ((ev.invited || []).indexOf(myId()) !== -1) return true;
  return state.matches.indexOf(ev.host.uid) !== -1;
}

function visibleEvents() {
  var q = (current.query || "").trim().toLowerCase();
  var out = EVENTS.filter(canSeeEvent).filter(function (ev) {
    if (ev.phase === "done") return isHost(ev) || isMember(ev);
    if (state.filter !== "all" && ev.cat !== state.filter) return false;
    if (q && current.tab === "events") {
      var hay = (ev.title + " " + ev.when + " " + ((ev.host && ev.host.name) || "") + " " +
                 (categoryBySlug(ev.cat) || {}).label + " " +
                 ((ev.place && ev.place.name) || "")).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
  /* Lobbies still recruiting come first, newest at the top. */
  out.sort(function (a, b) {
    var pa = a.phase === "recruiting" ? 0 : a.phase === "live" ? 1 : 2;
    var pb = b.phase === "recruiting" ? 0 : b.phase === "live" ? 1 : 2;
    return pa - pb || b.createdAt - a.createdAt;
  });
  return out;
}

/* "12m" / "1h 04m" — used for both waiting and playing. */
function since(ts) {
  if (!ts) return "0m";
  var sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  if (h) return h + "h " + (m < 10 ? "0" : "") + m + "m";
  if (m) return m + "m";
  return sec + "s";
}

function phaseChipHTML(ev) {
  if (ev.phase === "live") {
    return '<span class="evphase live"><i></i>Playing \u00b7 <b data-since="' +
      (ev.startedAt || 0) + '">' + since(ev.startedAt) + '</b></span>';
  }
  if (ev.phase === "done") {
    return '<span class="evphase done">Finished</span>';
  }
  return '<span class="evphase wait"><i></i>Recruiting \u00b7 waiting <b data-since="' +
    (ev.createdAt || 0) + '">' + since(ev.createdAt) + '</b></span>';
}

/* Fly the map to an arbitrary point and drop a temporary marker there.
   Used by the event timeline, where the destination is a place rather
   than a person. */
var stopMarker = null;

function showPointOnMap(lat, lng, label) {
  if (typeof lat !== "number" || isNaN(lat)) return;
  closeModal();
  go("map");
  setTimeout(function () {
    if (!maps.map) return;
    maps.map.setView([lat, lng], 16);
    if (stopMarker) { try { maps.map.removeLayer(stopMarker); } catch (e) {} }
    stopMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "stoppin",
        html: '<span>' + esc(label || "Stop") + '</span>',
        iconSize: null
      }),
      zIndexOffset: 3000
    }).addTo(maps.map);
  }, 260);
}

/* ==================================================================
   10d. INVITES
   Two ways to fill a lobby. Ask specific people — anyone you have
   matched with, or anyone in the directory if you open it up — or let
   it sit in Discover for anyone to find. An invitation is a real
   message in a real chat, not a notification nobody can answer.
   ================================================================== */

function inviteDialog(eventId) {
  var ev = EVENTS.filter(function (e) { return e.id === eventId; })[0];
  if (!ev) return;
  current.inviteScope = "friends";

  openModal(
    '<div class="pehead"><h2 id="modalTitle">' + ic("user-plus") + ' Invite to ' + esc(ev.title) + '</h2>' +
      '<button type="button" class="icobtn del" data-act="close-modal" aria-label="Close">' + ic("x") + '</button></div>' +
    '<div class="pebody">' +
      '<div class="chiprow wrapchips" id="inv-scope">' +
        '<button type="button" class="chip" data-invscope="friends" aria-pressed="true">' +
          ic("handshake") + ' Your matches</button>' +
        '<button type="button" class="chip" data-invscope="all" aria-pressed="false">' +
          ic("users") + ' Anyone nearby</button>' +
      '</div>' +
      '<div id="inv-list" class="invlist"></div>' +
    '</div>' +
    '<div class="pefoot">' +
      '<button class="btn" data-act="close-modal">Done</button>' +
    '</div>', "profedit");

  paintInviteList(ev);

  byId("inv-scope").addEventListener("click", function (e) {
    var b = e.target.closest("[data-invscope]");
    if (!b) return;
    current.inviteScope = b.getAttribute("data-invscope");
    Array.prototype.forEach.call(byId("inv-scope").children, function (c) {
      c.setAttribute("aria-pressed", c === b);
    });
    paintInviteList(ev);
  });

  byId("inv-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-invite]");
    if (!b) return;
    sendInvite(ev.id, b.getAttribute("data-invite"));
  });
}

function invitePool(ev) {
  var pool = current.inviteScope === "all"
    ? PEOPLE.slice()
    : PEOPLE.filter(function (p) { return state.matches.indexOf(p.id) !== -1; });
  /* Nobody already in the lobby, and nobody blocked. */
  return pool.filter(function (p) {
    if (eventMembers(ev).some(function (m) { return m.uid === p.id; })) return false;
    if ((state.blocked || []).indexOf(p.id) !== -1) return false;
    return true;
  }).sort(function (a, b) { return matchScore(b).pct - matchScore(a).pct; });
}

function paintInviteList(ev) {
  var host = byId("inv-list");
  if (!host) return;
  var pool = invitePool(ev);

  if (!pool.length) {
    host.innerHTML = '<div class="empty" style="padding:26px 16px">' +
      '<div class="big">' + ic("users") + '</div>' +
      '<h3>' + (current.inviteScope === "all" ? "Nobody else here yet" : "No matches yet") + '</h3>' +
      '<p>' + (current.inviteScope === "all"
        ? "As soon as somebody else signs in you can invite them."
        : "Pair up with someone first, or switch to Anyone nearby.") + '</p></div>';
    return;
  }

  host.innerHTML = pool.map(function (p) {
    var already = (ev.invited || []).indexOf(p.id) !== -1;
    return '<div class="invrow">' +
      avatarFor(p, 40) +
      '<div class="grow">' +
        '<b>' + esc(p.name) + '</b>' +
        '<small>' + esc([p.city, presenceLabel(p)].filter(Boolean).join(" · ")) + '</small>' +
      '</div>' +
      scoreBadgeHTML(p) +
      (already
        ? '<span class="btn sm" style="opacity:.6;pointer-events:none">' + ic("check") + ' Asked</span>'
        : '<button class="btn primary sm" data-invite="' + esc(p.id) + '">Invite</button>') +
    '</div>';
  }).join("");
}

/* The invitation itself: a line in the chat, worded so it still makes
   sense weeks later when the lobby is long gone. */
function sendInvite(eventId, uid) {
  var ev = EVENTS.filter(function (e) { return e.id === eventId; })[0];
  if (!ev) return;
  if (!ev.invited) ev.invited = [];
  if (ev.invited.indexOf(uid) === -1) ev.invited.push(uid);
  saveEvent(ev);

  var where = (ev.stops || []).filter(function (st) { return st.place && st.place.name; })[0];
  var line = myName() + " invited you to " + ev.title +
    " (" + (categoryBySlug(ev.cat) || {}).label + ")" +
    (ev.when ? " · " + ev.when : "") +
    (where ? " · " + where.place.name : "") +
    ". Open Discover, switch to events and join.";
  sendMessage(uid, { kind: "text", text: line });

  paintInviteList(ev);
  var p = personById(uid);
  toast("Invited " + (p ? p.name.split(" ")[0] : "them"));
}

/* ==================================================================
   10c. EVENT ITINERARY
   A lobby can be more than one place: coffee at 8, the gym at 10, the
   cafe after. Each stop is a time and a place, kept in order, and the
   card draws them as a timeline you can tap through to the map.
   ================================================================== */

/* Stops being edited in the host dialog. Kept out of the event until
   Create is pressed, so an abandoned dialog leaves nothing behind. */
var draftStops = [];

function stopRowHTML(st, i) {
  return '<div class="stoprow" data-stop="' + i + '">' +
    '<span class="stopnum">' + (i + 1) + '</span>' +
    '<div class="stopmain">' +
      '<input class="inp stoptime" data-stoptime="' + i + '" maxlength="12" ' +
        'placeholder="8:00am" value="' + esc(st.time || "") + '">' +
      (st.place && st.place.name
        ? '<div class="stopplace"><b>' + esc(st.place.name) + '</b>' +
            (st.place.address ? '<small>' + esc(st.place.address) + '</small>' : '') + '</div>'
        : '<div class="placebox">' +
            '<input class="inp" data-stopsearch="' + i + '" autocomplete="off" ' +
              'placeholder="Search for a place">' +
            '<div class="placelist" data-stoplist="' + i + '" hidden></div>' +
          '</div>') +
    '</div>' +
    '<button type="button" class="icobtn del" data-stopdel="' + i + '" ' +
      'aria-label="Remove stop ' + (i + 1) + '">' + ic("x") + '</button>' +
  '</div>';
}

function paintStops() {
  var host = byId("ev-stops");
  if (!host) return;
  host.innerHTML = draftStops.length
    ? draftStops.map(stopRowHTML).join("")
    : '<p class="fxempty">No stops yet. One is enough — add more if the plan moves.</p>';
}

/* All the stop controls in one delegated handler, so redrawing the list
   never leaves a dead listener behind. */
function armStops() {
  var host = byId("ev-stops");
  if (!host || host.dataset.armed) return;
  host.dataset.armed = "1";

  host.addEventListener("click", function (e) {
    var del = e.target.closest("[data-stopdel]");
    if (del) {
      draftStops.splice(Number(del.getAttribute("data-stopdel")), 1);
      paintStops();
      return;
    }
    var pick = e.target.closest("[data-stoppick]");
    if (pick) {
      var box = pick.closest("[data-stoplist]");
      var i = Number(box.getAttribute("data-stoplist"));
      var chosen = (box.__results || [])[Number(pick.getAttribute("data-stoppick"))];
      if (chosen) { draftStops[i].place = chosen; paintStops(); }
      return;
    }
  });

  host.addEventListener("input", function (e) {
    var t = e.target.getAttribute("data-stoptime");
    if (t !== null) { draftStops[Number(t)].time = e.target.value; return; }

    var sIdx = e.target.getAttribute("data-stopsearch");
    if (sIdx === null) return;
    var i = Number(sIdx);
    var box = host.querySelector('[data-stoplist="' + i + '"]');
    var v = e.target.value;
    if (v.trim().length < 3) { if (box) box.hidden = true; return; }
    if (box) { box.hidden = false; box.innerHTML = '<div class="placemsg">Searching…</div>'; }
    searchPlaces(v, function (list) {
      var b = host.querySelector('[data-stoplist="' + i + '"]');
      if (!b) return;
      if (!list || !list.length) {
        b.hidden = false;
        b.innerHTML = '<div class="placemsg">' +
          (list ? "No places found. Try the name on its own, or add the city."
                : "Could not reach the place search.") + '</div>';
        return;
      }
      b.hidden = false;
      b.innerHTML = list.map(function (pl, k) {
        return '<button type="button" class="placeitem" data-stoppick="' + k + '">' +
          '<span class="pi-ico" aria-hidden="true">' + ic("map-pin") + '</span>' +
          '<span class="pi-txt"><b>' + esc(pl.name) + '</b>' +
            '<small>' + esc([pl.kind, pl.address].filter(Boolean).join(" · ")) + '</small></span>' +
          '<span class="pi-km">' + esc(kmBetween(state.me.lat, state.me.lng, pl.lat, pl.lng)) + '</span>' +
        '</button>';
      }).join("");
      b.__results = list;
    });
  });
}

/* The timeline on the card. Each stop opens the map at that point. */
function stopsHTML(ev) {
  var stops = (ev.stops || []).filter(function (st) { return st && (st.time || (st.place && st.place.name)); });
  if (!stops.length) return "";
  return '<ol class="evstops">' + stops.map(function (st, i) {
    var pl = st.place || {};
    var canMap = typeof pl.lat === "number";
    return '<li>' +
      '<span class="stopnum">' + (i + 1) + '</span>' +
      '<span class="stoptimechip num">' + esc(st.time || "—") + '</span>' +
      (pl.name
        ? (canMap
            ? '<button type="button" class="stoplink" data-stopmap="' + esc(pl.lat) + ',' + esc(pl.lng) +
                '" title="Show on the map">' + ic("map-pin") + esc(pl.name) + '</button>'
            : '<span class="stoplink">' + ic("map-pin") + esc(pl.name) + '</span>')
        : '<span class="stoplink off">Place not set</span>') +
    '</li>';
  }).join("") + '</ol>';
}

function eventCardHTML(ev) {
  var c = categoryBySlug(ev.cat) || categoryBySlug("all");
  var filled = eventMembers(ev).length;
  var pct = Math.min(100, Math.round((filled / ev.slots) * 100));
  var mine = isMember(ev);

  var actions;
  if (ev.phase === "done") {
    actions = '';
  } else if (isHost(ev)) {
    actions = (ev.phase === "live"
      ? '<button class="btn sm" data-evend="' + esc(ev.id) + '">End session</button>'
      : '<button class="btn sm" data-evstart="' + esc(ev.id) + '">Start early</button>') +
      (slotsLeft(ev) > 0
        ? '<button class="btn primary sm" data-evinvite="' + esc(ev.id) + '">' +
            ic('user-plus') + ' Invite</button>'
        : '') +
      '<button class="btn sm danger" data-evcancel="' + esc(ev.id) + '">Cancel</button>';
  } else if (mine) {
    actions = (slotsLeft(ev) > 0
      ? '<button class="btn sm" data-evinvite="' + esc(ev.id) + '">' +
          ic('user-plus') + ' Invite</button>'
      : '') +
      '<button class="btn sm" data-evleave="' + esc(ev.id) + '">Leave</button>';
  } else if (slotsLeft(ev) > 0 && ev.phase === "recruiting") {
    actions = '<button class="btn primary sm" data-evjoin="' + esc(ev.id) + '">Join</button>';
  } else {
    actions = '<span class="hint">Lobby full</span>';
  }

  return '<article class="card evcard' + (ev.phase === "done" ? " isdone" : "") + '">' +
    '<div class="evtop">' +
      '<span class="evemoji" aria-hidden="true">' + ic(c.icon) + '</span>' +
      '<div class="evmain">' +
        '<b>' + esc(ev.title || c.label) + '</b>' +
        '<small>' + esc(c.label) + ' \u00b7 hosted by ' + esc(ev.host.name) +
          (ev.visibility === "friends" ? ' \u00b7 friends only' : '') + '</small>' +
      '</div>' +
      phaseChipHTML(ev) +
    '</div>' +

    '<div class="evmeta">' +
      '<span>' + ic('clock') + ' ' + esc(ev.when || "Anytime") + '</span>' +
      /* With a timeline below, repeating the first stop up here is noise. */
      (!(ev.stops || []).length && ev.place && ev.place.name
        ? '<span class="placetag">' + ic('map-pin') + ' ' + esc(ev.place.name) + '</span>' : '') +
      (ev.duration ? '<span>' + ic('hourglass') + ' ' + esc(ev.duration) + '</span>' : '') +
    '</div>' +

    stopsHTML(ev) +

    '<div class="evslots">' +
      '<div class="evbar"><i style="width:' + pct + '%"></i></div>' +
      '<span>' + filled + '/' + ev.slots + ' in' +
        (ev.phase === "recruiting" ? ' \u00b7 ' + slotsLeft(ev) + ' needed' : '') + '</span>' +
    '</div>' +

    '<div class="evwho">' + eventMembers(ev).map(function (m) {
      /* The directory has their photo and presence; a member entry only
         has a uid and a name, so look them up and fall back gracefully
         for anyone who has since left or is not loaded yet. */
      var who = personById(m.uid) || { id: m.uid, name: m.name, photo: "" };
      return '<button type="button" class="evpill" data-act="detail" data-id="' + esc(m.uid) + '" ' +
        'aria-label="View ' + esc(m.name) + '\u2019s profile">' +
        avatarFor(who, 22) +
        '<span>' + esc(m.name) + '</span>' +
        (m.uid === ev.host.uid ? ic('star') : '') +
      '</button>';
    }).join("") + '</div>' +

    (actions ? '<div class="evacts">' + actions + '</div>' : '') +
  '</article>';
}

/* ---- host dialog -------------------------------------------------- */

function hostEventDialog() {
  var cats = CATEGORIES.filter(function (c) { return c.slug !== "all"; });
  var pre = state.filter !== "all" ? state.filter : "gaming";
  var scrim = byId("scrim");

  scrim.innerHTML =
    '<div class="modal profedit">' +
      '<div class="pehead">' +
        '<h2 id="modalTitle">Host an event</h2>' +
        '<button type="button" class="icobtn del" data-act="close-modal" aria-label="Close">' + ic('x') + '</button>' +
      '</div>' +
      '<div class="pebody">' +
        '<p class="profhint">People join your lobby. When every slot is taken it ' +
        'flips from recruiting to live by itself.</p>' +

        '<div class="field"><label for="ev-cat">Category</label>' +
          '<select class="sel" id="ev-cat">' + cats.map(function (c) {
            return '<option value="' + esc(c.slug) + '"' + (c.slug === pre ? ' selected' : '') + '>' +
              c.emoji + ' ' + esc(c.label) + '</option>';
          }).join("") + '</select></div>' +

        '<div class="field"><label for="ev-title">What are you doing</label>' +
          '<input class="inp" id="ev-title" maxlength="60" placeholder="Mobile Legends \u2014 ranked 5-stack"></div>' +

        '<div class="field"><label for="ev-when">When</label>' +
          '<input class="inp" id="ev-when" maxlength="40" placeholder="Tonight 10pm"></div>' +

        '<div class="field"><label for="ev-dur">How long</label>' +
          '<select class="sel" id="ev-dur">' +
            ["30 minutes","1 hour","2 hours","3 hours","All evening","Open ended"]
              .map(function (d) { return '<option>' + d + '</option>'; }).join("") +
          '</select></div>' +

        '<div class="field"><label for="ev-slots">People needed in total (including you)</label>' +
          '<select class="sel" id="ev-slots">' +
            [2,3,4,5,6,8,10].map(function (n) {
              return '<option value="' + n + '"' + (n === 5 ? ' selected' : '') + '>' + n + '</option>';
            }).join("") +
          '</select></div>' +

        '<div class="field"><label>Who can join</label>' +
          '<div class="chiprow wrapchips" id="ev-vis">' +
            '<button type="button" class="chip" data-evvis="public" aria-pressed="true">Anyone</button>' +
            '<button type="button" class="chip" data-evvis="friends" aria-pressed="false">Friends only</button>' +
          '</div>' +
          '<small style="color:var(--faint);font-size:11.5px">Friends only means your matches ' +
            'and anyone you invite. You can invite people either way.</small></div>' +

        '<div class="field"><label>Where and when</label>' +
          '<small style="color:var(--faint);font-size:11.5px;margin-bottom:6px;display:block">' +
            'Add a stop for each place the plan moves to — the cafe at 8, the gym at 10.</small>' +
          '<div id="ev-stops"></div>' +
          '<button type="button" class="btn sm" id="ev-addstop">' + ic('plus') + ' Add a stop</button>' +
        '</div>' +
      '</div>' +
      '<div class="pefoot">' +
        '<button class="btn ghost" data-act="close-modal">Cancel</button>' +
        '<button class="btn primary" data-evcreate="1">Create event</button>' +
      '</div>' +
    '</div>';

  scrim.classList.add("open");

  /* One empty stop to start: most lobbies have exactly one place, and an
     empty row is a clearer invitation than a button alone. */
  draftStops = [{ time: "", place: null }];
  paintStops();
  armStops();
  byId("ev-addstop").addEventListener("click", function () {
    if (draftStops.length >= 8) { toast("Eight stops is plenty"); return; }
    draftStops.push({ time: "", place: null });
    paintStops();
  });
}

function createEventFromDialog() {
  var cat = byId("ev-cat").value;
  var vis = document.querySelector('[data-evvis][aria-pressed="true"]');
  var ev = {
    id: uid4(),
    host: { uid: myId(), name: myName() },
    cat: cat,
    title: (byId("ev-title").value || "").trim() ||
           ((categoryBySlug(cat) || {}).label + " session"),
    when: (byId("ev-when").value || "").trim() || "Anytime",
    duration: byId("ev-dur").value,
    slots: Number(byId("ev-slots").value) || 4,
    visibility: vis ? vis.getAttribute("data-evvis") : "public",
    members: [{ uid: myId(), name: myName() }],
    phase: "recruiting",
    createdAt: Date.now(),
    startedAt: 0,
    endedAt: 0,
    /* Drop rows nobody filled in, so an untouched starter row does not
       become an empty stop on the card. */
    stops: draftStops.filter(function (st) {
      return (st.time || "").trim() || (st.place && st.place.name);
    }),
    invited: [],
    place: null
  };
  /* The first stop with a place doubles as the event's headline
     location, which is what the map and the card meta already read. */
  var firstPlaced = ev.stops.filter(function (st) { return st.place && st.place.name; })[0];
  ev.place = (firstPlaced && firstPlaced.place) ||
             (state.me.profiles[cat] && state.me.profiles[cat].place) || null;

  closeModal();
  draftStops = [];
  saveEvent(ev);
  current.tab = "events";
  render();
  toast("Lobby open \u2014 " + slotsLeft(ev) + " more needed");
  /* Straight into inviting: a lobby with nobody in it is the whole
     problem this is meant to solve. */
  inviteDialog(ev.id);
}

/* ---- storage: Firestore when signed in, this browser otherwise ---- */

function saveEvent(ev) {
  var i = EVENTS.findIndex(function (e) { return e.id === ev.id; });
  if (i === -1) EVENTS.push(ev); else EVENTS[i] = ev;

  /* Local copy so a refresh does not lose your own lobbies. */
  state.myEvents = EVENTS.filter(function (e) { return isHost(e) || isMember(e); });
  localSave();

  if (cloud.on && cloud.user) {
    cloud.db.collection("events").doc(ev.id).set(ev, { merge: true })
      .then(function () { cloud.error = ""; }, noteCloudError);
  }
  softRefresh();
}

function removeEvent(id) {
  EVENTS = EVENTS.filter(function (e) { return e.id !== id; });
  state.myEvents = (state.myEvents || []).filter(function (e) { return e.id !== id; });
  localSave();
  if (cloud.on && cloud.user) {
    cloud.db.collection("events").doc(id).delete().catch(noteCloudError);
  }
  softRefresh();
}

function watchEvents() {
  if (!cloud.on || !cloud.user) { EVENTS = (state.myEvents || []).slice(); return; }
  if (unsub.events) unsub.events();

  unsub.events = cloud.db.collection("events").limit(200).onSnapshot(function (snap) {
    var out = [];
    snap.forEach(function (d) { out.push(d.data()); });
    EVENTS = out;
    autoAdvance();
    softRefresh();
  }, noteCloudError);
}

/* A lobby flips to "live" by itself the moment the last slot fills. */
function autoAdvance() {
  EVENTS.forEach(function (ev) {
    if (ev.phase === "recruiting" && eventMembers(ev).length >= ev.slots && isHost(ev)) {
      ev.phase = "live";
      ev.startedAt = Date.now();
      saveEvent(ev);
    }
  });
}

/* ---- actions ------------------------------------------------------ */

function eventById(id) {
  return EVENTS.filter(function (e) { return e.id === id; })[0];
}

function joinEvent(id) {
  var ev = eventById(id);
  if (!ev || isMember(ev) || slotsLeft(ev) === 0 || ev.phase !== "recruiting") return;
  ev.members = eventMembers(ev).concat([{ uid: myId(), name: myName() }]);
  if (ev.members.length >= ev.slots) { ev.phase = "live"; ev.startedAt = Date.now(); }
  saveEvent(ev);
  toast(ev.phase === "live" ? "Lobby full \u2014 session started" : "Joined \u2014 waiting for the rest");
}

function leaveEvent(id) {
  var ev = eventById(id);
  if (!ev || isHost(ev)) return;
  ev.members = eventMembers(ev).filter(function (m) { return m.uid !== myId(); });
  if (ev.phase === "live" && ev.members.length < ev.slots) {
    ev.phase = "recruiting";           // someone dropped out, recruiting again
    ev.startedAt = 0;
  }
  saveEvent(ev);
  toast("Left the lobby");
}

function startEventNow(id) {
  var ev = eventById(id);
  if (!ev || !isHost(ev) || ev.phase !== "recruiting") return;
  ev.phase = "live";
  ev.startedAt = Date.now();
  saveEvent(ev);
  toast("Started with " + eventMembers(ev).length + " of " + ev.slots);
}

function endEvent(id) {
  var ev = eventById(id);
  if (!ev || !isHost(ev)) return;
  ev.phase = "done";
  ev.endedAt = Date.now();
  saveEvent(ev);
  toast("Session ended after " + since(ev.startedAt));
}

/* Tick the visible durations without redrawing anything else. */
function tickEvents() {
  var els = document.querySelectorAll("[data-since]");
  if (!els.length) return;
  [].forEach.call(els, function (el) {
    el.textContent = since(Number(el.getAttribute("data-since")));
  });
}

/* ==================================================================
   11a. PLACES — searching OpenStreetMap by name

   Nominatim is OpenStreetMap's free geocoder: no key, no billing. It
   asks for light use, so every query is debounced and cached, and we
   never fire more than one at a time.
   ================================================================== */

var placeCache = {};
var placeTimer = null;
var placeSeq = 0;

/* Bias results to what you can actually get to: a box roughly 60 km
   around you. `bounded=0` still allows good matches further out. */
function viewboxAroundMe(km) {
  var d = (km || 60) / 111;                       // rough degrees
  var lat = state.me.lat, lng = state.me.lng;
  return [lng - d, lat + d, lng + d, lat - d].join(",");
}

function searchPlaces(query, cb) {
  var q = (query || "").trim();
  if (q.length < 3) { cb([]); return; }

  var key = q.toLowerCase();
  if (placeCache[key]) { cb(placeCache[key]); return; }

  var seq = ++placeSeq;
  var url = "https://nominatim.openstreetmap.org/search" +
    "?format=jsonv2&limit=8&addressdetails=1&namedetails=1" +
    "&viewbox=" + encodeURIComponent(viewboxAroundMe(60)) +
    "&q=" + encodeURIComponent(q);

  fetch(url, { headers: { "Accept": "application/json" } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var out = (rows || []).map(toPlace).filter(Boolean);
      placeCache[key] = out;
      if (seq === placeSeq) cb(out);          // ignore stale responses
    })
    .catch(function () { if (seq === placeSeq) cb(null); });
}

/* Nominatim returns a long display_name; split off a short title and a
   readable address so the list looks like a maps app rather than a
   dump of comma-separated fields. */
function toPlace(row) {
  if (!row || !row.lat || !row.lon) return null;
  var parts = String(row.display_name || "").split(",").map(function (x) { return x.trim(); });
  var name = (row.namedetails && row.namedetails.name) || parts[0] || "Unnamed place";
  var addr = parts.slice(1, 4).join(", ");
  return {
    name: name,
    address: addr,
    kind: (row.type || row.category || "").replace(/_/g, " "),
    lat: Number(row.lat),
    lng: Number(row.lon)
  };
}

function debouncedPlaceSearch(query, cb) {
  clearTimeout(placeTimer);
  placeTimer = setTimeout(function () { searchPlaces(query, cb); }, 550);
}

/* ==================================================================
   11b. CATEGORY PROFILES — one per category, add / edit / delete
   ================================================================== */

/* ------------------------------------------------------------------
   Dynamic fields. Each category declares what it asks for, and the
   form is built from that — so adding a question to Gaming is one
   line of data, not new markup.
   ------------------------------------------------------------------ */

var editingList = {};       // fieldId -> array of rows, while the editor is open
var currentEditSlug = null; // which category the open editor belongs to

/* Read the repeatable rows straight from the DOM, so anything typed
   survives an add or a delete. */
function readListRows(f) {
  var host = byId("fx-" + f.id);
  if (!host) return (editingList[f.id] || []).slice();
  return [].map.call(host.querySelectorAll(".fxrow"), function (rowEl) {
    var row = {};
    [].forEach.call(rowEl.querySelectorAll("[data-fxsub]"), function (el) {
      var v = (el.value || "").trim();
      if (v) row[el.getAttribute("data-fxsub")] = v;
    });
    return row;
  });
}

function fieldInputHTML(f, val) {
  var id = "fx-" + f.id;

  if (f.type === "select") {
    return '<select class="sel" id="' + id + '" data-fx="' + esc(f.id) + '">' +
      '<option value="">\u2014</option>' +
      f.options.map(function (o) {
        return '<option' + (val === o ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join("") + '</select>';
  }

  if (f.type === "multi") {
    var on = Array.isArray(val) ? val : [];
    return '<div class="chiprow wrapchips" data-fxmulti="' + esc(f.id) + '">' +
      f.options.map(function (o) {
        return '<button type="button" class="chip" data-fxopt="' + esc(o) + '" aria-pressed="' +
          (on.indexOf(o) !== -1) + '">' + esc(o) + '</button>';
      }).join("") + '</div>';
  }

  if (f.type === "list") {
    return '<div class="fxlist" id="' + id + '"></div>' +
      '<button type="button" class="btn sm" data-fxadd="' + esc(f.id) + '">' + ic('plus') + ' ' +
        esc(f.addLabel || "Add") + '</button>';
  }

  return '<input class="inp" id="' + id + '" data-fx="' + esc(f.id) + '" maxlength="60" ' +
    'placeholder="' + esc(f.ph || "") + '" value="' + esc(val == null ? "" : val) + '">';
}

function fieldsHTML(cat, values) {
  if (!cat.fields || !cat.fields.length) return "";
  return cat.fields.map(function (f) {
    return '<div class="field"><label' +
      (f.type === "multi" || f.type === "list" ? '' : ' for="fx-' + esc(f.id) + '"') + '>' +
      esc(f.label) + '</label>' + fieldInputHTML(f, values[f.id]) + '</div>';
  }).join("");
}

/* Options for a sub-field that depends on the game chosen in its row:
   Mobile Legends offers Mythical Immortal and Roamer, Valorant offers
   Radiant and Duelist. `regions` is shared by every game. */
function subOptions(sub, row) {
  if (!sub.from) return sub.options || [];
  if (sub.from === "regions") return REGIONS;
  var g = gameByName(row.game);
  return (g && g[sub.from]) || [];
}

function datalistHTML(id, options) {
  if (!options.length) return "";
  return '<datalist id="' + id + '">' + options.map(function (o) {
    return '<option value="' + esc(o) + '"></option>';
  }).join("") + '</datalist>';
}

/* One repeatable block, e.g. a single game. */
function listRowHTML(f, row, idx) {
  var g = gameByName(row.game);

  var subs = f.item.map(function (sub) {
    /* `when` fields only exist on ladders that have them \u2014 no star box
       for Valorant, which counts RR instead. */
    if (sub.when && !(g && g[sub.when])) return "";

    var v = row[sub.id] == null ? "" : row[sub.id];
    var wide = sub.type === "tags" ? ' fxwide' : '';
    var label = '<span>' + esc(sub.type === "tags" && g && g.heroLabel ? g.heroLabel : sub.label) + '</span>';

    if (sub.type === "game") {
      return '<label class="fxsub fxwide"><span>' + esc(sub.label) + '</span>' +
        '<select class="sel" data-fxsub="game" data-fxgame="' + esc(f.id) + '" ' +
        'data-fxi="' + idx + '">' +
        '<option value="">Pick a game\u2026</option>' +
        GAMES.map(function (gg) {
          return '<option' + (v === gg.name ? ' selected' : '') + '>' + esc(gg.name) + '</option>';
        }).join("") + '</select></label>';
    }

    if (sub.type === "number") {
      return '<label class="fxsub"><span>' + esc(sub.label) + '</span>' +
        '<input class="inp num" type="number" min="0" data-fxsub="' + esc(sub.id) + '" ' +
        'placeholder="' + esc(sub.ph || "") + '" value="' + esc(v) + '"></label>';
    }

    if (sub.type === "tags") {
      var opts = subOptions(sub, row);
      var lid = "dl-" + esc(f.id) + "-" + esc(sub.id) + "-" + idx;
      return '<label class="fxsub' + wide + '">' + label +
        '<input class="inp" data-fxsub="' + esc(sub.id) + '" maxlength="80" ' +
        (opts.length ? 'list="' + lid + '" ' : '') +
        'placeholder="' + esc(sub.ph || "") + '" value="' + esc(v) + '">' +
        datalistHTML(lid, opts) + '</label>';
    }

    if (sub.type === "select") {
      var options = subOptions(sub, row);
      /* No ladder to offer (no game picked yet, or a game we do not
         carry) \u2014 a plain box beats an empty dropdown. */
      if (!options.length) {
        return '<label class="fxsub"><span>' + esc(sub.label) + '</span>' +
          '<input class="inp" data-fxsub="' + esc(sub.id) + '" maxlength="40" ' +
          'placeholder="' + esc(g ? "\u2014" : "Pick a game first") + '" value="' + esc(v) + '"></label>';
      }
      /* A value typed before this ladder existed stays selectable, so
         editing an old profile never silently drops someone's rank. */
      var all = options.indexOf(v) === -1 && v ? [v].concat(options) : options;
      return '<label class="fxsub"><span>' + esc(sub.label) + '</span>' +
        '<select class="sel" data-fxsub="' + esc(sub.id) + '">' +
        '<option value="">\u2014</option>' +
        all.map(function (o) {
          return '<option' + (v === o ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join("") + '</select></label>';
    }

    return '<label class="fxsub"><span>' + esc(sub.label) + '</span>' +
      '<input class="inp" data-fxsub="' + esc(sub.id) + '" maxlength="40" placeholder="' +
      esc(sub.ph || "") + '" value="' + esc(v) + '"></label>';
  }).join("");

  return '<div class="fxrow" data-fxidx="' + idx + '">' +
    '<div class="fxrowhead"><b>' + esc(row.game || f.addLabel || "Entry") + '</b>' +
      (row.rank ? '<span class="rankpill">' + esc(row.rank) +
        (row.stars ? ' <span class="num">' + esc(row.stars) + ic('star') + '</span>' : '') + '</span>' : '') +
      '<button type="button" class="icobtn del" data-fxdel="' + esc(f.id) + '" data-fxi="' + idx + '" ' +
      'aria-label="Remove">' + ic('x') + '</button></div>' +
    subs +
  '</div>';
}

/* Swapping the game in a row invalidates the rank, role and mains that
   came from the old one, so they are cleared and the row is redrawn
   against the new ladder. */
document.addEventListener("change", function (e) {
  var sel = e.target && e.target.closest && e.target.closest("[data-fxgame]");
  if (!sel) return;
  var fid = sel.getAttribute("data-fxgame");
  var cat = categoryBySlug(currentEditSlug);
  var f = cat && (cat.fields || []).filter(function (x) { return x.id === fid; })[0];
  if (!f) return;

  var rows = readListRows(f);
  var i = Number(sel.getAttribute("data-fxi"));
  if (rows[i]) {
    rows[i].game = sel.value;
    rows[i].rank = "";
    rows[i].role = "";
    rows[i].stars = "";
    rows[i].heroes = "";
  }
  editingList[fid] = rows;
  renderList(f);
});

function renderList(f) {
  var host = byId("fx-" + f.id);
  if (!host) return;
  var rows = editingList[f.id] || [];
  host.innerHTML = rows.length
    ? rows.map(function (r, i) { return listRowHTML(f, r, i); }).join("")
    : '<p class="fxempty">Nothing added yet.</p>';
}

/* Read every field back out of the DOM when saving. */
function collectFields(cat) {
  var out = {};
  if (!cat.fields) return out;

  cat.fields.forEach(function (f) {
    if (f.type === "multi") {
      var box = document.querySelector('[data-fxmulti="' + f.id + '"]');
      if (!box) return;
      var on = [].filter.call(box.querySelectorAll("[data-fxopt]"), function (b) {
        return b.getAttribute("aria-pressed") === "true";
      }).map(function (b) { return b.getAttribute("data-fxopt"); });
      if (on.length) out[f.id] = on;
      return;
    }

    if (f.type === "list") {
      var host = byId("fx-" + f.id);
      if (!host) return;
      var rows = [].map.call(host.querySelectorAll(".fxrow"), function (rowEl) {
        var row = {};
        [].forEach.call(rowEl.querySelectorAll("[data-fxsub]"), function (el) {
          var v = (el.value || "").trim();
          if (v) row[el.getAttribute("data-fxsub")] = v;
        });
        return row;
      }).filter(function (r) { return Object.keys(r).length; });
      if (rows.length) out[f.id] = rows;
      return;
    }

    var el = byId("fx-" + f.id);
    if (el && (el.value || "").trim()) out[f.id] = el.value.trim();
  });

  return out;
}

/* Flatten a profile's answers into short chips for the cards. */
function fieldChips(cat, values) {
  var out = [];
  if (!cat || !cat.fields || !values) return out;
  cat.fields.forEach(function (f) {
    var v = values[f.id];
    if (!v) return;
    if (f.type === "list" && Array.isArray(v)) {
      v.forEach(function (row) {
        var first = row[f.item[0].id];
        if (first) out.push(first + (row.rank ? " \u00b7 " + row.rank : ""));
      });
    } else if (Array.isArray(v)) {
      out.push.apply(out, v);
    } else {
      out.push(v);
    }
  });
  return out;
}

/* The rail's "+ Add Profile" button: pick a category, then fill it in
   with the same editor the Profile screen uses. */
function addProfileDialog() {
  var mine = state.me.profiles || {};
  var free = CATEGORIES.filter(function (c) {
    return c.slug !== "all" && !mine[c.slug];
  });

  if (!free.length) {
    toast("You already have a profile in every category");
    go("profile");
    return;
  }

  byId("scrim").innerHTML =
    '<div class="modal profedit">' +
      '<div class="pehead">' +
        '<h2 id="modalTitle">Add a profile</h2>' +
        '<button type="button" class="icobtn del" data-act="close-modal" aria-label="Close">' + ic('x') + '</button>' +
      '</div>' +
      '<div class="pebody">' +
        '<p class="profhint">Pick the category you want to be found in. ' +
        'You get one profile per category, and only the categories you fill in ' +
        'put you in front of other people.</p>' +
        '<div class="profadd"><div class="chiprow">' +
          free.map(function (c) {
            return '<button class="chip" data-profadd="' + esc(c.slug) + '">' +
              ic(c.icon) + ' ' + esc(c.label) + '</button>';
          }).join("") +
        '</div></div>' +
      '</div>' +
    '</div>';
  byId("scrim").classList.add("open");
}

function editProfile(slug) {
  var c = categoryBySlug(slug);
  if (!c) return;
  var pr = (state.me.profiles || {})[slug] || { headline: "", bio: "", tags: [], avail: "" };
  var scrim = byId("scrim");

  scrim.innerHTML =
    '<div class="modal profedit">' +
      '<div class="pehead">' +
        '<h2 id="modalTitle">' + ic(c.icon) + ' ' + esc(c.label) + '</h2>' +
        '<button type="button" class="icobtn del" data-act="close-modal" ' +
          'aria-label="Close">' + ic('x') + '</button>' +
      '</div>' +
      '<div class="pebody">' +
      '<p class="profhint">One profile per category. This is what people see ' +
      'when they browse ' + esc(c.label) + '.</p>' +

      '<div class="field"><label for="pf-head">Headline</label>' +
        '<input id="pf-head" maxlength="60" placeholder="' + esc(c.blurb || "What are you after?") + '" ' +
        'value="' + esc(pr.headline) + '"></div>' +

      '<div class="field"><label for="pf-bio">About</label>' +
        '<textarea id="pf-bio" maxlength="400" ' +
        'placeholder="Skill level, what you want out of it, how often.">' + esc(pr.bio) + '</textarea></div>' +

      fieldsHTML(c, pr.fields || {}) +

      '<div class="field"><label for="pf-place">Place</label>' +
        '<div class="placebox">' +
          '<div id="pf-placechosen">' + placeChosenHTML(pr.place) + '</div>' +
          '<input id="pf-place" autocomplete="off" placeholder="' +
            esc(c.placeHint || "Search for a place") + '">' +
          '<button type="button" class="btn sm" data-placenear="' + esc(slug) + '">Near me</button>' +
          '<div id="pf-placelist" class="placelist" hidden></div>' +
        '</div>' +
        '<span class="hint">Optional. Partners can see the name, and you show up ' +
        'on the map at this spot.</span></div>' +

      '<div class="field"><label for="pf-avail">When you are free</label>' +
        '<input id="pf-avail" maxlength="60" placeholder="Weeknights 19\u201323 \u00b7 Sat mornings" ' +
        'value="' + esc(pr.avail) + '"></div>' +

      '<div class="field"><label for="pf-tags">Tags <span class="hint">comma separated</span></label>' +
        '<input id="pf-tags" maxlength="120" placeholder="Anything else worth searching for" ' +
        'value="' + esc((pr.tags || []).join(", ")) + '"></div>' +

      '</div>' +
      '<div class="pefoot">' +
        '<button class="btn ghost" data-act="close-modal">Cancel</button>' +
        '<button class="btn primary" data-profsave="' + esc(slug) + '">Save profile</button>' +
      '</div>' +
    '</div>';

  scrim.classList.add("open");
  currentEditSlug = slug;
  editingPlace = pr.place || null;
  editingList = {};
  (c.fields || []).forEach(function (f) {
    if (f.type !== "list") return;
    var saved = (pr.fields || {})[f.id];
    editingList[f.id] = Array.isArray(saved) ? saved.slice() : [];
    renderList(f);
  });
  armPlacePicker(slug);
  var h = byId("pf-head");
  if (h) h.focus();
}

/* The chosen place, or nothing. Kept as its own function so the editor
   can redraw just this strip after a pick. */
function placeChosenHTML(place) {
  if (!place || !place.name) return "";
  return '<div class="placechosen">' +
    '<span aria-hidden="true">' + ic('map-pin') + '</span>' +
    '<div><b>' + esc(place.name) + '</b>' +
      (place.address ? '<small>' + esc(place.address) + '</small>' : '') + '</div>' +
    '<button type="button" class="icobtn del" data-placeclear="1" ' +
      'aria-label="Remove this place">' + ic('x') + '</button>' +
  '</div>';
}

/* Holds the place while the editor is open. */
var editingPlace = null;

function renderPlaceResults(list) {
  var box = byId("pf-placelist");
  if (!box) return;

  if (list === null) {
    box.hidden = false;
    box.innerHTML = '<div class="placemsg">Could not reach the place search. ' +
      'Check your connection and try again.</div>';
    return;
  }
  if (!list.length) {
    box.hidden = false;
    box.innerHTML = '<div class="placemsg">No places found. Try the name on its own, ' +
      'or add the city.</div>';
    return;
  }

  box.hidden = false;
  box.innerHTML = list.map(function (pl, i) {
    return '<button type="button" class="placeitem" data-placepick="' + i + '">' +
      '<span class="pi-ico" aria-hidden="true">' + ic('map-pin') + '</span>' +
      '<span class="pi-txt"><b>' + esc(pl.name) + '</b>' +
        '<small>' + esc([pl.kind, pl.address].filter(Boolean).join(" \u00b7 ")) + '</small></span>' +
      '<span class="pi-km">' + esc(kmBetween(state.me.lat, state.me.lng, pl.lat, pl.lng)) + '</span>' +
    '</button>';
  }).join("");
  box.__results = list;
}

function kmBetween(lat1, lng1, lat2, lng2) {
  var R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return km < 1 ? Math.round(km * 1000) + " m" : km.toFixed(km < 10 ? 1 : 0) + " km";
}

function armPlacePicker(slug) {
  var input = byId("pf-place");
  if (!input) return;
  input.addEventListener("input", function () {
    var v = input.value;
    if (v.trim().length < 3) { var b = byId("pf-placelist"); if (b) b.hidden = true; return; }
    var box = byId("pf-placelist");
    if (box) { box.hidden = false; box.innerHTML = '<div class="placemsg">Searching\u2026</div>'; }
    debouncedPlaceSearch(v, renderPlaceResults);
  });
}

function saveProfileFor(slug) {
  var c = categoryBySlug(slug);
  if (!c) return;
  if (!state.me.profiles) state.me.profiles = {};

  var tags = (byId("pf-tags").value || "").split(",")
    .map(function (t) { return t.trim(); })
    .filter(Boolean)
    .slice(0, 8);

  state.me.profiles[slug] = {
    cat: slug,
    fields: collectFields(c),
    place: editingPlace || null,
    headline: (byId("pf-head").value || "").trim(),
    bio: (byId("pf-bio").value || "").trim(),
    avail: (byId("pf-avail").value || "").trim(),
    tags: tags
  };

  save();                 // local + Firestore (debounced) + public card
  closeModal();
  render();               // repaint straight away, no reload
  toast(c.label + " profile saved");
}

function deleteProfile(slug) {
  var c = categoryBySlug(slug);
  if (!c || !state.me.profiles || !state.me.profiles[slug]) return;
  delete state.me.profiles[slug];
  save();
  render();
  toast(c.label + " profile deleted");
}

/* ==================================================================
   12. GLOBAL EVENTS
   ================================================================== */

document.addEventListener("click", function (e) {
  var t = e.target;

  var filter = t.closest("[data-filter]");
  if (filter) {
    /* A category's filters mean nothing in the next category. */
    if (state.filter !== filter.getAttribute("data-filter")) clearFilters();
    state.filter = filter.getAttribute("data-filter");
    save(); render(); return;
  }

  var unf = t.closest("[data-unfilter]");
  if (unf) {
    var uk = unf.getAttribute("data-unfilter");
    delete current.filters[uk];
    /* Dropping the game drops everything that only made sense inside it. */
    if (uk === "game") GAME_FILTER_KEYS.forEach(function (k) { delete current.filters[k]; });
    render(); return;
  }

  var smt = t.closest("[data-smarttoggle]");
  if (smt) {
    var sk = smt.getAttribute("data-smarttoggle");
    if (current.filters[sk]) delete current.filters[sk]; else current.filters[sk] = true;
    render(); return;
  }

  var oc = t.closest("[data-openchat]");
  if (oc) { closeModal(); go("chat", oc.getAttribute("data-openchat")); return; }

  var som = t.closest("[data-showonmap]");
  if (som) {
    var who = personById(som.getAttribute("data-showonmap"));
    closeModal();
    go("map");
    /* Wait for the map to exist, then fly to them. */
    setTimeout(function () {
      if (!maps.map || !who) return;
      var ex = friendLoc[who.id];
      var lat = ex ? ex.lat : who.lat, lng = ex ? ex.lng : who.lng;
      if (typeof lat !== "number") return;
      maps.map.setView([lat, lng], 14);
      var m = maps.markers.filter(function (mk) {
        var ll = mk.getLatLng();
        return Math.abs(ll.lat - lat) < 1e-6 && Math.abs(ll.lng - lng) < 1e-6;
      })[0];
      if (m && m.openPopup) m.openPopup();
    }, 400);
    return;
  }


  var evVis = t.closest("[data-evvis]");
  if (evVis) {
    [].forEach.call(document.querySelectorAll("[data-evvis]"), function (b) {
      b.setAttribute("aria-pressed", b === evVis);
    });
    return;
  }
  if (t.closest("[data-evcreate]")) { createEventFromDialog(); return; }

  var evJoin = t.closest("[data-evjoin]");
  if (evJoin) { joinEvent(evJoin.getAttribute("data-evjoin")); return; }

  var evLeave = t.closest("[data-evleave]");
  if (evLeave) { leaveEvent(evLeave.getAttribute("data-evleave")); return; }

  var evStart = t.closest("[data-evstart]");
  if (evStart) { startEventNow(evStart.getAttribute("data-evstart")); return; }

  var evEnd = t.closest("[data-evend]");
  if (evEnd) { endEvent(evEnd.getAttribute("data-evend")); return; }

  var evInvite = t.closest("[data-evinvite]");
  if (evInvite) { inviteDialog(evInvite.getAttribute("data-evinvite")); return; }

  /* A stop on the timeline flies the map to that point. */
  var stopMap = t.closest("[data-stopmap]");
  if (stopMap) {
    var parts = stopMap.getAttribute("data-stopmap").split(",");
    showPointOnMap(Number(parts[0]), Number(parts[1]),
      stopMap.textContent.trim());
    return;
  }

  var evCancel = t.closest("[data-evcancel]");
  if (evCancel) { removeEvent(evCancel.getAttribute("data-evcancel")); toast("Event cancelled"); return; }

  var fxOpt = t.closest("[data-fxopt]");
  if (fxOpt) {
    var on = fxOpt.getAttribute("aria-pressed") === "true";
    fxOpt.setAttribute("aria-pressed", !on);
    return;
  }

  var fxAdd = t.closest("[data-fxadd]");
  if (fxAdd) {
    var fid = fxAdd.getAttribute("data-fxadd");
    var catA = categoryBySlug(currentEditSlug);
    var fA = catA && (catA.fields || []).filter(function (x) { return x.id === fid; })[0];
    if (fA) {
      /* keep what is already typed before redrawing */
      editingList[fid] = readListRows(fA);
      editingList[fid].push({});
      renderList(fA);
    }
    return;
  }

  var fxDel = t.closest("[data-fxdel]");
  if (fxDel) {
    var fid2 = fxDel.getAttribute("data-fxdel");
    var catD = categoryBySlug(currentEditSlug);
    var fD = catD && (catD.fields || []).filter(function (x) { return x.id === fid2; })[0];
    if (fD) {
      editingList[fid2] = readListRows(fD);
      editingList[fid2].splice(Number(fxDel.getAttribute("data-fxi")), 1);
      renderList(fD);
    }
    return;
  }

  var pick = t.closest("[data-placepick]");
  if (pick) {
    var box = byId("pf-placelist");
    var list = box && box.__results;
    var chosen = list && list[Number(pick.getAttribute("data-placepick"))];
    if (chosen) {
      editingPlace = chosen;
      byId("pf-placechosen").innerHTML = placeChosenHTML(chosen);
      byId("pf-place").value = "";
      box.hidden = true;
    }
    return;
  }

  if (t.closest("[data-placeclear]")) {
    editingPlace = null;
    byId("pf-placechosen").innerHTML = "";
    return;
  }

  var near = t.closest("[data-placenear]");
  if (near) {
    var cat = categoryBySlug(near.getAttribute("data-placenear"));
    var terms = (cat && cat.placeTerms) || ["cafe"];
    var box2 = byId("pf-placelist");
    if (box2) { box2.hidden = false; box2.innerHTML = '<div class="placemsg">Looking around you\u2026</div>'; }
    searchPlaces(terms[0], renderPlaceResults);
    return;
  }

  var pAdd = t.closest("[data-profadd]");
  if (pAdd) { editProfile(pAdd.getAttribute("data-profadd")); return; }

  var pEdit = t.closest("[data-profedit]");
  if (pEdit) { editProfile(pEdit.getAttribute("data-profedit")); return; }

  var pDel = t.closest("[data-profdel]");
  if (pDel) { deleteProfile(pDel.getAttribute("data-profdel")); return; }

  var pSave = t.closest("[data-profsave]");
  if (pSave) { saveProfileFor(pSave.getAttribute("data-profsave")); return; }

  var ms = t.closest("[data-mapstyle]");
  if (ms) { setMapStyle(ms.getAttribute("data-mapstyle")); return; }

  var dec = t.closest("[data-decide]");
  if (dec) { decide(dec.getAttribute("data-id"), dec.getAttribute("data-decide")); return; }

  var interest = t.closest("[data-interest]");
  if (interest) {
    var label = interest.getAttribute("data-interest");
    var i = state.me.tags.indexOf(label);
    if (i === -1) state.me.tags.push(label); else state.me.tags.splice(i, 1);
    save();
    interest.setAttribute("aria-pressed", i === -1);
    return;
  }

  var toggle = t.closest("[data-toggle]");
  if (toggle) {
    var key = toggle.getAttribute("data-toggle");
    if (key === "sharing") { setSharing(!state.me.sharing); return; }
    if (key === "live") {
      if (state.me.live) { stopLive(); }
      else {
        var sel = byId("livedur");
        startLive(sel ? Number(sel.value) : 15);
      }
      return;
    }
    if (key === "theme") {
      toggleTheme();
      toggle.setAttribute("aria-checked", state.theme === "dark");
    } else {
      state.me[key] = !state.me[key];
      if (key === "nearby") current.sort = state.me.nearby ? "nearby" : "online";
      /* Switching alerts on has to actually ask the browser, or the
         switch is a promise nothing keeps. */
      if (key === "notify" && state.me.notify) askAlertPermission();
      if (key === "phonePublic" || key === "freeNow") publishProfile();
      save();
      toggle.setAttribute("aria-checked", !!state.me[key]);
    }
    return;
  }

  var act = t.closest("[data-act]");
  if (act) {
    var a = act.getAttribute("data-act");
    if (a === "open-chat") { closeModal(); go("chat", act.getAttribute("data-id")); }
    else if (a === "invite-accept") {
      closeModal();
      invitePrompted = null;
      becomeMatch(personById(act.getAttribute("data-id")));
    }
    else if (a === "invite-decline") {
      var declinedId = act.getAttribute("data-id");
      if (!state.declined) state.declined = [];
      if (state.declined.indexOf(declinedId) === -1) state.declined.push(declinedId);
      if (state.seen.indexOf(declinedId) === -1) state.seen.push(declinedId);
      closeModal();
      invitePrompted = null;
      save();
      render();
    }
    else if (a === "callstart") { closeModal(); startCall(act.getAttribute("data-id")); }
    else if (a === "report") { closeModal(); reportDialog(act.getAttribute("data-id")); }
    else if (a === "blockuser") { blockUser(act.getAttribute("data-id")); }
    else if (a === "unblock") { unblockUser(act.getAttribute("data-id")); }
    else if (a === "verifyphone") { verifyPhoneDialog(); }
    else if (a === "photo-clear") {
      state.me.photo = ""; save(); publishProfile(); render(); toast("Photo removed");
    }
    else if (a === "swapmode") {
      current.tab = current.tab === "events" ? "people" : "events";
      current.query = "";
      render();
      toast(current.tab === "events" ? "Event mode" : "People mode");
    }
    else if (a === "togglesearch") {
      current.searching = !current.searching;
      if (!current.searching) current.query = "";
      render();
    }
    else if (a === "addprofile") { addProfileDialog(); }
    else if (a === "clearfilters") { clearFilters(); render(); }
    else if (a === "detail") {
      var who = act.getAttribute("data-id");
      /* Your own card is in the list too, and it has no directory entry
         to open — tapping your own name goes to the editor instead. */
      if (who === myId()) { closeModal(); go("profile"); }
      else detailModal(who);
    }
    else if (a === "clear-search") { current.query = ""; current.searching = false; render(); }
    else if (a === "use-location") { useMyLocation(); }
    else if (a === "widen") { current.radius = "any"; render(); }
    else if (a === "undo-passes") {
      state.seen = state.seen.filter(function (id) { return state.passed.indexOf(id) === -1; });
      state.passed = [];
      save(); render();
      toast("Passed profiles are back");
    }
    else if (a === "close-modal") { closeModal(); }
    else if (a === "loc-allow") { closeModal(); useMyLocation(); }
    else if (a === "loc-skip") { closeModal(); toast("No problem \u2014 you can turn it on from the Map tab"); }
    else if (a === "loc-ask") { showLocationCard(); }
    else if (a === "goprofile") { go("profile"); }
    else if (a === "hostevent") { hostEventDialog(); }
    else if (a === "reset-deck") {
      state.seen = state.matches.slice();
      state.passed = [];
      save(); render();
      toast("Deck reset");
    }
    else if (a === "reset-all") {
      var theme = state.theme;
      state = clone(defaultState);
      state.theme = theme;
      save(); go("discover");
      toast("Everything reset");
    }
    return;
  }

  if (t.id === "scrim") closeModal();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { closeModal(); return; }
  /* "/" jumps straight to the search box while browsing. */
  if (e.key === "/" && current.view === "discover" && !e.target.matches("input,textarea,select")) {
    e.preventDefault();
    var q = byId("q");
    if (q) { q.focus(); q.select(); return; }
    current.searching = true;
    render();
  }
});

/* ==================================================================
   12b. FIREBASE — sign in with Google, and sync to Firestore

   Everything here is optional. If FIREBASE_CONFIG.apiKey is empty, or
   the SDK fails to load, `cloud.on` stays false and the app behaves
   exactly as it did before: local only.
   ================================================================== */

var cloud = {
  on: false,        // Firebase available and configured
  user: null,       // the signed-in Google user
  db: null,         // Firestore
  auth: null,
  saving: false,
  pending: null,    // debounce timer for writes
  error: ""
};

/* localStorage key that remembers "this person chose to stay local". */
var LOCAL_ONLY_KEY = "ggpartner.localOnly";

function firebaseReady() {
  return !!(window.firebase && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey);
}

function initFirebase() {
  if (!firebaseReady()) return false;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    cloud.auth = firebase.auth();
    cloud.db = firebase.firestore();
    cloud.on = true;
    return true;
  } catch (e) {
    cloud.error = "Firebase could not start: " + e.message;
    return false;
  }
}

/* ---- the sign-in screen ------------------------------------------ */

function googleMark() {
  return '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"/>' +
    '<path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>' +
    '<path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>' +
    '<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C37 41.2 44 36 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>';
}

/* Leaving the front door behind. The flag is what stops the landing
   page appearing again on the next visit. */
function enterApp() {
  try { localStorage.setItem("ggpartner.seenApp", "1"); } catch (e) {}
  document.documentElement.classList.add("app-mode");
}

/* The landing page is the signed-out home. Both of its calls to action
   come through here. */
function armLanding() {
  var land = byId("landing");
  if (!land || land.dataset.armed) return;
  land.dataset.armed = "1";
  land.addEventListener("click", function (e) {
    var b = e.target.closest("[data-land]");
    if (!b) return;
    if (b.getAttribute("data-land") === "signin") { showGate(""); return; }
    try { localStorage.setItem(LOCAL_ONLY_KEY, "1"); } catch (e2) {}
    enterApp(); hideGate(); boot();
  });
}

function showGate(message) {
  var g = byId("gate");
  g.hidden = false;
  g.innerHTML =
    '<div class="box">' +
      '<h1>GG Partner</h1>' +
      '<p>Find the person who is free when you are. Sign in so your profile, matches and chats follow you to any device.</p>' +
      '<button class="gbtn" id="gsignin">' + googleMark() + ' Continue with Google</button>' +
      '<button class="ghost" id="glocal">Continue without signing in</button>' +
      '<button class="ghost" id="gback">Back to the home page</button>' +
      (message ? '<div class="err">' + esc(message) + '</div>' : '') +
      '<p class="fine">Without signing in, everything is saved only in this browser. ' +
      'GG Partner will never ask for a password, a code, or payment details.</p>' +
    '</div>';

  byId("gsignin").addEventListener("click", signInWithGoogle);
  byId("glocal").addEventListener("click", function () {
    try { localStorage.setItem(LOCAL_ONLY_KEY, "1"); } catch (e) {}
    enterApp();
    hideGate();
    boot();
  });
  byId("gback").addEventListener("click", function () {
    hideGate();
    document.documentElement.classList.remove("app-mode");
  });
}

function hideGate() {
  var g = byId("gate");
  g.hidden = true;
  g.innerHTML = "";
}

function signInWithGoogle() {
  var btn = byId("gsignin");
  if (btn) { btn.disabled = true; btn.textContent = "Opening Google…"; }

  var provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  cloud.auth.signInWithPopup(provider).catch(function (err) {
    /* Popups are blocked in some browsers (and in most in-app ones).
       Fall back to a full-page redirect, which always works. */
    if (err && (err.code === "auth/popup-blocked" ||
                err.code === "auth/operation-not-supported-in-this-environment" ||
                err.code === "auth/cancelled-popup-request")) {
      cloud.auth.signInWithRedirect(provider);
      return;
    }
    if (err && err.code === "auth/popup-closed-by-user") { showGate(""); return; }
    showGate(explainAuthError(err));
  });
}

function explainAuthError(err) {
  var code = err && err.code ? err.code : "";
  if (code === "auth/unauthorized-domain") {
    return "This address is not on the Firebase authorised domains list. " +
           "Add " + location.hostname + " in Firebase console -> Authentication -> Settings.";
  }
  if (code === "auth/operation-not-supported-in-this-environment") {
    return "Google sign-in needs the page to be served over http:// or https://. " +
           "Opening the file directly (file://) will not work.";
  }
  if (code === "auth/configuration-not-found") {
    return "Google sign-in is not enabled for this Firebase project yet.";
  }
  return "Sign-in failed" + (code ? " (" + code + ")" : "") + ". Please try again.";
}

function signOut() {
  if (!cloud.on || !cloud.user) return;
  cloud.auth.signOut().then(function () { location.reload(); });
}

/* ---- Firestore: one document per signed-in user ------------------- */

function userDoc() {
  return cloud.db.collection("users").doc(cloud.user.uid);
}

/* Only the parts worth keeping. Theme stays local to the device. */
function syncableState() {
  return {
    me: state.me,
    seen: state.seen,
    passed: state.passed,
    liked: state.liked,
    matches: state.matches,
    threads: state.threads,
    read: state.read,
    filter: state.filter,
    updatedAt: Date.now()
  };
}

function noteCloudError(e) {
  var msg = (e && e.message) || String(e);
  if (/has not been used|SERVICE_DISABLED|NOT_FOUND/i.test(msg)) {
    cloud.error = "Firestore is not switched on for this project yet. " +
      "Firebase console -> Build -> Firestore Database -> Create database.";
  } else if (/permission|PERMISSION_DENIED/i.test(msg)) {
    cloud.error = "Firestore rejected the write. Check the security rules allow " +
      "a signed-in user to read and write their own users/{uid} document.";
  } else {
    cloud.error = "Sync is unavailable: " + msg;
  }
  return cloud.error;
}

function pullFromCloud() {
  return userDoc().get().then(function (snap) {
    if (!snap.exists) return pushToCloud();       // first sign-in
    cloud.error = "";
    var data = snap.data() || {};
    Object.keys(data).forEach(function (k) {
      if (k === "me") state.me = Object.assign({}, state.me, data.me || {});
      else if (k in state) state[k] = data[k];
    });
    save();
  }).catch(noteCloudError);
}

function pushToCloud() {
  if (!cloud.on || !cloud.user) return Promise.resolve();
  cloud.saving = true;
  paintSync();
  return userDoc().set(syncableState(), { merge: true })
    .then(function () { cloud.error = ""; }, noteCloudError)
    .then(function () { cloud.saving = false; paintSync(); });
}

/* Writes are debounced so dragging a slider does not fire 40 requests. */
function scheduleCloudSave() {
  if (!cloud.on || !cloud.user) return;
  clearTimeout(cloud.pending);
  cloud.pending = setTimeout(function () {
    pushToCloud();
    publishProfile();          // the card other people see
    publishPreciseLocation();  // the exact pin, friends only
  }, 800);
}

function paintSync() {
  var el = byId("syncstate");
  if (!el) return;
  var wrap = el.parentNode;
  if (cloud.error) {
    el.textContent = "Not syncing";
    if (wrap && wrap.classList) wrap.classList.add("off");
  } else {
    el.textContent = cloud.saving ? "Saving…" : "Synced";
    if (wrap && wrap.classList) wrap.classList.remove("off");
  }
}

/* `save()` already runs after every change, so wrapping it is the one
   hook needed to mirror everything to Firestore. */
var localSave = save;
save = function () {
  localSave();
  scheduleCloudSave();
};

/* ---- start-up ----------------------------------------------------- */

function startAuth() {
  armLanding();
  /* No Firebase configured -> straight into the app, local only. */
  if (!initFirebase()) { enterApp(); hideGate(); boot(); return; }

  var chosenLocal = false;
  try { chosenLocal = localStorage.getItem(LOCAL_ONLY_KEY) === "1"; } catch (e) {}

  cloud.auth.onAuthStateChanged(function (user) {
    if (user) {
      cloud.user = user;
      try { localStorage.removeItem(LOCAL_ONLY_KEY); } catch (e) {}

      /* Use the Google name and photo the first time only, so later
         edits in the Profile tab are not overwritten on every login. */
      if (!state.me.signedInOnce) {
        if (user.displayName) state.me.name = user.displayName;
        state.me.photo = user.photoURL || "";
        state.me.email = user.email || "";
        state.me.signedInOnce = true;
      }

      enterApp();
      hideGate();
      pullFromCloud()
        .then(publishProfile, publishProfile)
        .then(function () {
          watchDirectory(); watchEvents(); watchFriendLocations();
          publishPreciseLocation();
        })
        .then(boot, boot);
      return;
    }

    cloud.user = null;
    /* Signed out: the landing page is the home page. The sign-in dialog
       only opens when the visitor asks for it. */
    if (chosenLocal) { enterApp(); hideGate(); boot(); }
    else {
      document.documentElement.classList.remove("app-mode");
      hideGate();
    }
  });
}

/* ==================================================================
   12c. THE REAL DIRECTORY

   Everyone you can see is a real person who signed in with Google.
   Their public card lives in Firestore at profiles/{uid}; messages
   live under threads/{pair}/messages. Nothing is invented locally.
   ================================================================== */

var unsub = { dir: null, thread: null, events: null, precise: null, calls: null };

/* The half of your profile that other people are allowed to see. */
function publicCard() {
  var me = state.me;
  return {
    uid: cloud.user.uid,
    name: me.name || "Member",
    age: Number(me.age) || null,
    gender: me.gender || "",
    height: me.height || "",
    career: me.career || "",
    city: me.city || "",
    /* Public card carries a deliberately coarse point (~1 km) so
       distances can be sorted without handing out your address. */
    lat: me.sharing ? Math.round(me.lat * 100) / 100 : null,
    lng: me.sharing ? Math.round(me.lng * 100) / 100 : null,
    coarse: true,
    sharing: !!me.sharing,
    online: !!me.online,
    headline: me.headline || "",
    bio: me.bio || "",
    tags: me.tags || [],
    profiles: me.profiles || {},
    cats: Object.keys(me.profiles || {}),
    cat: Object.keys(me.profiles || {})[0] || "all",
    avail: me.avail || "",
    days: me.days || [],
    blocks: me.blocks || [],
    freeNow: !!me.freeNow,
    photo: me.photo || "",
    links: me.links || {},
    phonePublic: !!me.phonePublic,
    phoneVerified: !!me.phoneVerified,
    /* Published so the other side can hide you too — blocking has to
       work both ways or it is not blocking. */
    blocked: state.blocked || [],
    /* A thin, honest track record: how long they have been here and how
       much they have actually done. Nothing here can be inflated without
       doing the thing it counts. */
    joined: me.joined || Date.now(),
    pairs: (state.matches || []).length,
    events: (state.myEvents || []).length,
    likes: state.liked || [],
    lastActive: Date.now(),
    updatedAt: Date.now()
  };
}

/* ---- presence heartbeat -------------------------------------------
   A small write every 45 seconds while the tab is visible. That is what
   turns "online: true" (which someone could leave set forever) into a
   timestamp that decays on its own. */
var beatTimer = null;

function beat() {
  if (!cloud.on || !cloud.user) return;
  if (document.hidden) return;
  var now = Date.now();
  state.me.lastActive = now;
  cloud.db.collection("profiles").doc(cloud.user.uid)
    .set({ lastActive: now, online: !!state.me.online }, { merge: true })
    .catch(function () { /* a missed beat just means "active a minute ago" */ });
}

function startHeartbeat() {
  if (beatTimer) clearInterval(beatTimer);
  beat();
  beatTimer = setInterval(beat, BEAT_MS);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) beat();
  });
}

/* Your exact position, readable only by the people you have matched
   with. Kept in its own document so the security rules can gate it —
   the public card only ever carries the rounded point. */
function publishPreciseLocation() {
  if (!cloud.on || !cloud.user) return Promise.resolve();
  var ref = cloud.db.collection("precise").doc(cloud.user.uid);

  if (!state.me.sharing) return ref.delete().catch(function () {});

  return ref.set({
    uid: cloud.user.uid,
    lat: state.me.lat,
    lng: state.me.lng,
    at: state.me.lastFix || Date.now(),
    live: !!state.me.live,
    /* Only these uids may read it. */
    allowed: state.matches.slice()
  }, { merge: true }).catch(noteCloudError);
}

/* Pull the precise pins of the friends who have shared with me. */
function watchFriendLocations() {
  if (!cloud.on || !cloud.user) return;
  if (unsub.precise) unsub.precise();

  unsub.precise = cloud.db.collection("precise")
    .where("allowed", "array-contains", cloud.user.uid)
    .onSnapshot(function (snap) {
      friendLoc = {};
      snap.forEach(function (d) {
        var v = d.data();
        if (typeof v.lat === "number") friendLoc[d.id] = v;
      });
      if (current.view === "map" && maps.map) paintMarkers(false);
    }, function (err) {
      /* Denial is expected until you have matches, so this stays quiet
         for the member and loud enough for whoever is debugging. */
      if (window.console) console.warn("Friend locations unavailable:", err && err.message);
    });
}

var friendLoc = {};

function publishProfile() {
  if (!cloud.on || !cloud.user) return Promise.resolve();
  if (!state.me.joined) { state.me.joined = Date.now(); localSave(); }
  return cloud.db.collection("profiles").doc(cloud.user.uid)
    .set(publicCard(), { merge: true })
    .then(function () { cloud.error = ""; }, noteCloudError);
}

/* Listen to the whole directory. Firestore pushes changes, so somebody
   signing in on another device shows up without a refresh. */
var directorySeen = false;

function watchDirectory() {
  if (!cloud.on || !cloud.user) { directoryLoaded = true; return; }
  if (unsub.dir) unsub.dir();

  unsub.dir = cloud.db.collection("profiles").limit(200).onSnapshot(function (snap) {
    var out = [];
    snap.forEach(function (doc) {
      var d = doc.data() || {};
      if (doc.id === cloud.user.uid) return;              // not yourself
      if (state.blocked && state.blocked.indexOf(doc.id) !== -1) return;
      /* ...and anyone who has blocked you. */
      if (Array.isArray(d.blocked) && d.blocked.indexOf(cloud.user.uid) !== -1) return;
      out.push({
        id: doc.id,
        name: d.name || "Member",
        age: d.age || "",
        city: d.city || "",
        /* Someone in ghost mode still appears in Discover, just not on
           the map — the map filters on a missing lat/lng. */
        lat: typeof d.lat === "number" ? d.lat : null,
        lng: typeof d.lng === "number" ? d.lng : null,
        cat: d.cat || "all",
        profiles: d.profiles || {},
        cats: Array.isArray(d.cats) ? d.cats : (d.cat ? [d.cat] : []),
        online: !!d.online,
        headline: d.headline || "",
        bio: d.bio || "",
        tags: Array.isArray(d.tags) ? d.tags : [],
        avail: d.avail || "",
        days: Array.isArray(d.days) ? d.days : [],
        blocks: Array.isArray(d.blocks) ? d.blocks : [],
        freeNow: !!d.freeNow,
        photo: d.photo || "",
        links: d.links || {},
        phonePublic: !!d.phonePublic,
        phoneVerified: !!d.phoneVerified,
        lastActive: d.lastActive || 0,
        joined: d.joined || 0,
        pairs: d.pairs || 0,
        events: d.events || 0,
        likes: Array.isArray(d.likes) ? d.likes : []
      });
    });
    PEOPLE = out;
    directoryLoaded = true;
    cloud.error = "";
    /* The first snapshot after a reload is history, not news, so it
       promotes pairs without throwing a window up for each one. */
    reconcileInvites(!directorySeen);
    directorySeen = true;
    softRefresh();
  }, function (e) {
    noteCloudError(e);
    directoryLoaded = true;
    render();
  });
}

/* ---- messages ---------------------------------------------------- */

/* Both people must derive the same id, so the two uids are sorted. */
function threadId(otherUid) {
  return [cloud.user.uid, otherUid].sort().join("__");
}

function watchThread(otherUid) {
  if (!cloud.on || !cloud.user) return;
  if (unsub.thread) { unsub.thread(); unsub.thread = null; }

  unsub.thread = cloud.db.collection("threads").doc(threadId(otherUid))
    .collection("messages").orderBy("t").limit(500)
    .onSnapshot(function (snap) {
      var msgs = [], toMark = [];
      snap.forEach(function (doc) {
        var d = doc.data() || {};
        var mine = d.from === cloud.user.uid;
        msgs.push({
          id: doc.id,
          from: mine ? "me" : "them",
          kind: d.kind || "text",
          text: d.text || "",
          audio: d.audio || "",
          dur: d.dur || 0,
          t: d.t || Date.now(),
          delivered: !!d.delivered,
          seen: !!d.seen
        });
        /* Their message just reached this device: that is "delivered".
           If the thread is open in front of us, it is also "seen". */
        if (!mine && (!d.delivered || !d.seen)) toMark.push({ id: doc.id, d: d });
      });
      state.threads[otherUid] = msgs;
      localSave();

      var open = current.view === "chat" && current.chatWith === otherUid && !document.hidden;
      markReceipts(otherUid, toMark, open);

      if (current.view === "chat" && current.chatWith === otherUid) repaintThread();
      else notifyNewMessages(otherUid, msgs);
      renderNav();
    }, noteCloudError);
}

/* Receipts are written by the receiver, on the sender's message. One
   batch per snapshot, so a burst of ten messages is one write. */
function markReceipts(otherUid, rows, seen) {
  if (!rows.length || !cloud.on || !cloud.user) return;
  var col = cloud.db.collection("threads").doc(threadId(otherUid)).collection("messages");
  var batch = cloud.db.batch(), n = 0;
  rows.forEach(function (r) {
    var patch = {};
    if (!r.d.delivered) patch.delivered = true;
    if (seen && !r.d.seen) patch.seen = true;
    if (!Object.keys(patch).length) return;
    batch.update(col.doc(r.id), patch);
    n++;
  });
  if (n) batch.commit().catch(function () { /* rules or offline; retried next snapshot */ });
}

/* Called when the chat is opened, so anything that arrived while you
   were elsewhere flips from delivered to seen. */
function markThreadSeen(otherUid) {
  if (!cloud.on || !cloud.user) return;
  var msgs = state.threads[otherUid] || [];
  var rows = msgs.filter(function (m) { return m.from === "them" && !m.seen && m.id; })
                 .map(function (m) { return { id: m.id, d: { delivered: m.delivered, seen: m.seen } }; });
  markReceipts(otherUid, rows, true);
}

function sendToCloud(otherUid, msg) {
  if (!cloud.on || !cloud.user) return Promise.resolve();
  var doc = {
    from: cloud.user.uid,
    to: otherUid,
    kind: msg.kind || "text",
    text: msg.text || "",
    t: Date.now(),
    delivered: false,
    seen: false
  };
  if (msg.kind === "voice") { doc.audio = msg.audio; doc.dur = msg.dur || 0; }
  return cloud.db.collection("threads").doc(threadId(otherUid))
    .collection("messages").add(doc)
    .then(function () { cloud.error = ""; }, noteCloudError);
}

/* Every open chat has its own listener, but a message that arrives for a
   thread you are not looking at used to land in silence. One small
   listener per pair — the newest message only — is enough to tell you. */
var msgUnsubs = {};

function watchMatchThreads() {
  if (!cloud.on || !cloud.user) return;
  var want = (state.matches || []).slice(0, 40);

  Object.keys(msgUnsubs).forEach(function (id) {
    if (want.indexOf(id) === -1) { msgUnsubs[id](); delete msgUnsubs[id]; }
  });

  want.forEach(function (id) {
    if (msgUnsubs[id]) return;
    msgUnsubs[id] = cloud.db.collection("threads").doc(threadId(id))
      .collection("messages").orderBy("t", "desc").limit(1)
      .onSnapshot(function (snap) {
        snap.docChanges().forEach(function (ch) {
          if (ch.type !== "added") return;
          var d = ch.doc.data() || {};
          if (d.from === cloud.user.uid) return;
          /* Older than this session: it is backlog, not an arrival. */
          if (!d.t || d.t < threadWatchFrom) return;
          if (lastSeenMsgAt[id] && d.t <= lastSeenMsgAt[id]) return;
          lastSeenMsgAt[id] = d.t;
          /* You are already reading it. */
          if (current.view === "chat" && current.chatWith === id && !document.hidden) return;

          var p = personById(id);
          var name = p ? p.name : "Someone";
          var body = d.kind === "voice" ? "Sent a voice note" : (d.text || "New message");
          notify(name, body, function () { go("chat", id); });
          raiseAlert(name, body, function () { go("chat", id); });
        });
      }, function (err) {
        if (window.console) console.warn("Thread " + id + " unavailable:", err && err.message);
      });
  });
}

var threadWatchFrom = Date.now();

/* ==================================================================
   12d. PHONE VERIFICATION
   The verified badge means one checkable thing: this member received a
   code on a phone number they control. Firebase does the sending and
   the checking; the number itself is linked to the account and only
   shown to other members if they choose to show it.

   This needs Phone to be switched on in the Firebase console under
   Authentication -> Sign-in method. Until it is, the flow fails with a
   message that says exactly that rather than a raw error code.
   ================================================================== */

var verifier = null;

function verifyPhoneDialog() {
  if (!cloud.on || !cloud.user) { toast("Sign in first"); return; }
  openModal(
    '<div class="pehead"><h2 id="modalTitle">' + ic("shield-check") + ' Get verified</h2>' +
      '<button type="button" class="icobtn del" data-act="close-modal" aria-label="Close">' + ic("x") + '</button></div>' +
    '<div class="pebody">' +
      '<p class="profhint">We send a code to your phone. Getting it back proves the ' +
        'number is yours, and your card gets a verified badge. Your number is never ' +
        'shown to anyone unless you turn that on yourself.</p>' +
      '<div class="field"><label for="vp-num">Phone number, with country code</label>' +
        '<input class="inp" id="vp-num" type="tel" placeholder="+63 912 345 6789" ' +
          'value="' + esc((state.me.links || {}).phone || "") + '"></div>' +
      '<div id="vp-recaptcha"></div>' +
      '<div class="field" id="vp-codewrap" hidden><label for="vp-code">The six-digit code</label>' +
        '<input class="inp num" id="vp-code" inputmode="numeric" maxlength="6" placeholder="123456"></div>' +
      '<p class="fhint" id="vp-msg" hidden></p>' +
    '</div>' +
    '<div class="pefoot">' +
      '<button class="btn" data-act="close-modal">Cancel</button>' +
      '<button class="btn primary" id="vp-go">Send code</button>' +
    '</div>', "profedit");

  var step = "send";
  var confirmation = null;

  function say(msg) {
    var el = byId("vp-msg");
    el.hidden = false;
    el.textContent = msg;
  }

  byId("vp-go").addEventListener("click", function () {
    var go = byId("vp-go");
    if (step === "send") {
      var num = byId("vp-num").value.trim();
      if (!/^\+?[\d\s()-]{7,20}$/.test(num)) { say("That does not look like a phone number."); return; }
      go.disabled = true; go.textContent = "Sending…";
      try {
        if (!verifier) {
          verifier = new firebase.auth.RecaptchaVerifier("vp-recaptcha", { size: "invisible" });
        }
      } catch (e) {
        go.disabled = false; go.textContent = "Send code";
        say("Could not start the check: " + e.message);
        return;
      }
      cloud.user.linkWithPhoneNumber(num.replace(/[^\d+]/g, ""), verifier)
        .then(function (res) {
          confirmation = res;
          step = "code";
          byId("vp-codewrap").hidden = false;
          byId("vp-code").focus();
          go.disabled = false; go.textContent = "Verify";
          say("Code sent. It usually arrives within a minute.");
        })
        .catch(function (err) {
          go.disabled = false; go.textContent = "Send code";
          say(explainPhoneError(err));
          if (verifier) { try { verifier.clear(); } catch (e2) {} verifier = null; }
        });
      return;
    }

    var code = byId("vp-code").value.trim();
    if (code.length < 6) { say("The code is six digits."); return; }
    go.disabled = true; go.textContent = "Checking…";
    confirmation.confirm(code).then(function () {
      state.me.phoneVerified = true;
      if (!state.me.links) state.me.links = {};
      state.me.links.phone = byId("vp-num").value.trim();
      save();
      publishProfile();
      closeModal();
      render();
      toast("Verified — your card now carries the badge");
    }).catch(function (err) {
      go.disabled = false; go.textContent = "Verify";
      say(err && err.code === "auth/invalid-verification-code"
        ? "That code did not match. Try again."
        : explainPhoneError(err));
    });
  });
}

function explainPhoneError(err) {
  var code = err && err.code ? err.code : "";
  if (code === "auth/operation-not-allowed" || code === "auth/configuration-not-found") {
    return "Phone sign-in is not switched on for this Firebase project yet " +
           "(Authentication -> Sign-in method -> Phone).";
  }
  if (code === "auth/credential-already-in-use" || code === "auth/account-exists-with-different-credential") {
    return "That number is already verified on another account.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  if (code === "auth/invalid-phone-number") return "That number was not accepted. Include the country code.";
  if (code === "auth/unauthorized-domain") {
    return "This address is not on the Firebase authorised domains list.";
  }
  return "Verification failed" + (code ? " (" + code + ")" : "") + ".";
}

/* ==================================================================
   14. STAYING CURRENT
   Two related jobs. One: notice when a new build has been deployed and
   offer to take it, so an open tab never sits on stale code waiting for
   somebody to hard-refresh. Two: pull down at the top of the list to
   re-sync by hand, the way every app on a phone behaves.
   ================================================================== */

/* The version stamp is written by build.sh and is a hash of the app
   file, so it moves only when the app actually changes. The build the
   tab starts on is whatever it reads first; anything different later is
   a new deploy. */
var VERSION_URL = "version.json";
var myBuild = null;
var newBuild = null;
var versionTimer = null;

function readBuild() {
  return fetch(VERSION_URL, { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { return (j && j.build) || null; })
    .catch(function () { return null; });
}

function startVersionWatch() {
  readBuild().then(function (b) {
    myBuild = b;
    if (versionTimer) clearInterval(versionTimer);
    /* Every ten minutes, plus whenever the tab comes back to the front —
       which is when somebody is most likely about to use it. */
    versionTimer = setInterval(checkVersion, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) checkVersion();
    });
  });
}

function checkVersion() {
  if (!myBuild) return Promise.resolve(false);
  return readBuild().then(function (b) {
    if (!b || b === myBuild) return false;
    newBuild = b;
    showUpdateBar();
    return true;
  });
}

/* An offer, not an ambush: reloading under someone mid-message would
   lose what they were typing. */
function showUpdateBar() {
  if (byId("updatebar")) return;
  var bar = document.createElement("div");
  bar.className = "updatebar";
  bar.id = "updatebar";
  bar.innerHTML =
    ic("rotate-ccw") +
    '<span>A newer version of GG Partner is ready.</span>' +
    '<button class="btn primary sm" id="updatego">Reload</button>' +
    '<button class="icobtn" id="updateno" aria-label="Later">' + ic("x") + '</button>';
  document.body.appendChild(bar);
  requestAnimationFrame(function () { bar.classList.add("in"); });
  byId("updatego").addEventListener("click", applyUpdate);
  byId("updateno").addEventListener("click", function () {
    bar.classList.remove("in");
    setTimeout(function () { bar.remove(); }, 250);
  });
}

function applyUpdate() {
  /* A plain reload is enough: index.html is served must-revalidate, so
     the browser re-fetches it rather than reading its own cache. The
     query string is belt and braces for proxies in between. */
  var u = location.pathname + "?v=" + (newBuild || Date.now());
  location.replace(u);
}

/* ---- pull to refresh ---------------------------------------------
   Touch only, and only from the very top of the page. A gesture that
   starts inside something already scrolled (the chat thread, the
   Discover list on a wide screen) is left alone, because there the
   drag means "scroll up", not "refresh". */
var PULL_TRIGGER = 74;
var PULL_MAX = 130;
var pull = { on: false, y0: 0, dy: 0, busy: false };

function scrollerAbove(el) {
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.scrollTop > 0) return true;
    el = el.parentElement;
  }
  return false;
}

function pageAtTop() {
  return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
}

function armPullToRefresh() {
  var host = byId("ptr");
  if (!host || host.dataset.armed) return;
  host.dataset.armed = "1";

  document.addEventListener("touchstart", function (e) {
    if (pull.busy || e.touches.length !== 1) return;
    if (!document.documentElement.classList.contains("app-mode")) return;
    if (!pageAtTop() || scrollerAbove(e.target)) return;
    pull.on = true;
    pull.y0 = e.touches[0].clientY;
    pull.dy = 0;
  }, { passive: true });

  document.addEventListener("touchmove", function (e) {
    if (!pull.on) return;
    var dy = e.touches[0].clientY - pull.y0;
    if (dy <= 0) { setPull(0); pull.on = false; return; }
    /* Resistance, so the sheet slows as it stretches rather than
       tracking the finger one to one all the way down. */
    pull.dy = Math.min(PULL_MAX, dy * 0.55);
    setPull(pull.dy);
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", function () {
    if (!pull.on) return;
    pull.on = false;
    if (pull.dy >= PULL_TRIGGER) runRefresh();
    else setPull(0);
  }, { passive: true });
}

function setPull(dy) {
  var host = byId("ptr");
  if (!host) return;
  host.style.transform = "translate(-50%," + Math.round(dy) + "px)";
  host.style.opacity = dy > 6 ? "1" : "0";
  var ring = host.firstElementChild;
  if (ring) {
    ring.style.transform = "rotate(" + Math.round((dy / PULL_TRIGGER) * 300) + "deg)";
    ring.classList.toggle("ready", dy >= PULL_TRIGGER);
  }
}

/* What "refresh" actually means here. Firestore is already live, so
   this is not how you get new messages — it re-reads your own state,
   republishes your card, redraws, and checks for a new build. If there
   is one, taking it IS the refresh. */
function runRefresh() {
  if (pull.busy) return;
  pull.busy = true;
  var host = byId("ptr");
  if (host) host.classList.add("spin");
  setPull(PULL_TRIGGER);

  checkVersion().then(function (isNew) {
    if (isNew) { applyUpdate(); return null; }
    if (cloud.on && cloud.user) {
      return pullFromCloud().then(publishProfile, publishProfile).then(function () {
        watchDirectory();
        beat();
      });
    }
    return null;
  }).catch(function () {}).then(function () {
    /* A refresh that blinks past in 40ms reads as "nothing happened",
       so it is held just long enough to be seen. */
    setTimeout(function () {
      if (host) host.classList.remove("spin");
      setPull(0);
      pull.busy = false;
      render();
      toast("Up to date");
    }, 550);
  });
}

/* ==================================================================
   13. BOOT
   ================================================================== */

/* The app starts here, but only once we know who (if anyone) is
   signed in — otherwise the sign-in screen would flash over a
   half-drawn app. */
function boot() {
  applyTheme();
  current.sort = state.me.nearby ? "nearby" : "online";

  /* A live session saved last time either resumes or has already run out. */
  if (state.me.live) {
    var stillValid = state.me.sharing && (!state.me.liveUntil || state.me.liveUntil > Date.now());
    state.me.live = false;
    if (stillValid) startLive(state.me.liveUntil ? Math.round((state.me.liveUntil - Date.now()) / 60000) : 0);
    else { state.me.liveUntil = 0; save(); }
  }

  EVENTS = (state.myEvents || []).slice();
  watchEvents();
  startHeartbeat();
  watchIncomingCalls();
  watchMatchThreads();
  startVersionWatch();
  armPullToRefresh();
  if (eventTimer) clearInterval(eventTimer);
  eventTimer = setInterval(tickEvents, 1000);

  go("discover");

  /* Ask after the first screen is painted, so the card lands on top of
     a real app rather than a blank page. */
  setTimeout(askLocationOnce, 900);
}

startAuth();

})();
