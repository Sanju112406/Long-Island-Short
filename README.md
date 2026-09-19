<div align="center">

### *Navigate the world, not your screen.*

</div>

> No matter how many tools or how much technology we build to navigate the
> disruption and chaos of a commute, the best tool we've always had is our
> own brain. Eyes Up is designed to sharpen it, not replace it.

# Eyes Up — Your Personal AI Commuter Companion

Eyes Up is a voice-first web app that helps Singapore commuters plan
customised journeys, navigate through spoken landmark guidance, and adapt
during planned and unexpected disruptions. Addressing Problem Statement 2, it
turns transport information into personalised, actionable support from
departure to arrival. It's designed to build commuters' awareness and
confidence — helping them recognise their surroundings, understand their
options, and make their own decisions — without making them dependent on
constant instructions. This aligns with SMRT's vision of *"Moving People.
Enhancing Lifestyles"* by making everyday journeys more manageable and
engaging.

## Why this exists

Navigation apps are effective at telling commuters where to go, but they
often require users to continuously look at their phones and follow a map —
especially challenging for anyone less confident with directions in an
unfamiliar area. This creates a cycle of dependence: low confidence in
directions leads to greater reliance on maps, which pulls attention onto the
phone instead of the surroundings, which means less familiarity with
landmarks and routes, which drives continued reliance on maps.

The problem compounds when something unexpected happens. A commuter may know
their normal journey perfectly well, but a train disruption, missed bus
stop, or wrong turn can suddenly turn a familiar commute into an unfamiliar
one — and the map-dependence cycle offers little help in that moment.

## How it helps

- **Plan around your needs.** Compare public-transport routes, specify an
  arrival time, add stopovers, or find a meeting point with a friend before
  continuing together. These preferences give the companion context for
  helping users assess alternatives if their original journey is affected.
- **Navigate through conversation.** Receive spoken directions grounded in
  recognisable landmarks, and ask questions like *"Am I going the right
  way?"* or *"Will I be late?"* Guidance adapts to route familiarity —
  detailed reassurance on unfamiliar journeys, fewer interruptions on
  regular commutes — and users can ask for extra guidance when a reroute
  introduces an unfamiliar transfer or walking segment.
- **Recover when plans change.** Journey monitoring, transport alerts, and
  off-route detection identify changes affecting the trip. The companion
  explains the disruption's impact, presents an alternative alongside the
  current route, and updates arrival estimates so the commuter can decide
  whether to switch or continue. After a missed stop, recovery guidance
  helps them reconnect with their journey.
- **Share progress privately.** A shareable transit pass keeps trusted
  contacts informed of ETA, journey progress, and arrival status — without
  exposing precise GPS coordinates. Updated estimates automatically
  communicate delays when a disruption or reroute changes the journey.
- **Keep your eyes up.** Spoken guidance and a battery-conscious pocket mode
  reduce the need for screen checks. Optional "Eyes Up Moments" surface
  short landmark stories along the way, with collectible stamps in a "My
  Singapore" passport.

## Design philosophy

Eyes Up's central idea is that commuters shouldn't have to keep interpreting
a map to feel confident about their journey. Narration connects directions
to the surroundings, while conversation lets users resolve uncertainty in
their own words — the same route doesn't mean the same guidance. A
first-time visitor may need reassurance at every interchange; a regular
commuter may only want to hear about changes. Eyes Up makes that support
adjustable and familiarity-aware, reflecting SMRT's value of Respect.

This is powered by an agentic backend (see
[Agentic architecture](#agentic-architecture) below): Gemini calls dedicated
journey tools rather than just reciting turn-by-turn steps. Everyday routes
also become opportunities for discovery — "Eyes Up Moments" offer
bite-sized stories about nearby landmarks and neighbourhood history, giving
even a familiar commute something new to notice.

## Agentic architecture

Eyes Up doesn't treat Gemini as a chatbot bolted onto a map — it runs as an
**agent with a job to do**: keep this specific commuter safely and
confidently moving toward their destination, deciding for itself, turn by
turn, what it needs to know and what it needs to do before it's allowed to
speak. The governing rule is: **code computes transport truth, the agent
decides and explains.** The model is never allowed to invent a station,
ETA, disruption, or GPS coordinate — it has to go and get every fact itself.

**A toolbelt, not a script.** The agent isn't handed a decision tree of
"if the user says X, do Y." It's given twelve capabilities — read the
active journey and ETA, fetch the next landmark instruction, check live bus
arrivals or train alerts, check lift/escalator maintenance, read the
weather, assess whether a live disruption actually intersects this route,
detect off-route drift, plan a journey from scratch, recalculate one
mid-trip, or switch the commuter onto a fully sheltered route — and it
autonomously chooses which ones to reach for based on what the commuter
actually asked and what it doesn't yet know. Nobody tells it "call
`checkJourneyImpact` now"; it decides that on its own, the same way a human
companion would glance at their phone before answering. Each capability is
backed by one of the deterministic services in the
[capabilities in detail](#capabilities-in-detail), so the agent's actions always
bottom out in real LTA, OneMap, or data.gov.sg data — it observes the
world through tools, it never talks to those APIs directly.

**Perceive, decide, act, observe, respond.** Every turn runs a real agent
loop. The model perceives the commuter's message plus live context (current
step, GPS fix or lack of one, familiarity mode, whether they've just missed
a stop or hit a disruption); decides whether it already knows enough to
answer or needs to act first; if it needs to act, it issues a function call
instead of a reply; the server executes that action against live data and
hands the observation back; and only then does the agent synthesise what
the commuter actually hears. Nothing is ever spoken before the agent has
gone and checked — the loop guarantees the "explain" step always happens
after the "know" step, not before it.

**Judgment, not just retrieval.** The agent is also expected to act on what
it finds, not just report it. When `checkJourneyImpact` comes back positive,
it's the agent's call whether that's worth interrupting the commuter for;
when a weather question comes in, it can decide on its own to invoke
`changeToShelteredRoute` and hand back an already-updated journey rather
than just describing the weather. A system prompt sets the boundaries this
judgment has to operate inside — lead with de-escalation if the commuter
sounds panicked or just missed a stop, never scold them, anchor every
instruction to the exact landmark a tool returned rather than a placeholder,
keep replies short enough to be spoken through an earpiece while walking,
vary its own phrasing turn to turn, and never guess a starting point — if
there's no live GPS fix and the commuter hasn't said where they are, the
agent has to ask before it's allowed to plan. A lightweight persona layer
(a time-pressured executive vs. a senior commuter prioritising step-free
access) shapes tone without touching the facts underneath, and the agent
runs its own lightweight read of the commuter's emotional state on every
turn to decide how to open its response.

**Resilience is layered into the agent, not bolted on after it.** For
latency-sensitive voice turns it reasons with a fast "flash" model
(thinking disabled for speed) and autonomously retries on a heavier "pro"
model if that call fails. If Gemini itself is unreachable or misconfigured,
the same request is handed to a fully deterministic, rule-based companion
that pattern-matches the question and responds immediately — so a missing
API key or a network hiccup degrades the agent's fluency, not its ability
to keep the commuter moving.

## Tech stack

Deployed on Google Cloud Run, Eyes Up connects a React, TypeScript, and
Vite frontend to a Node.js/Express backend. The Gemini API, via Google's `@google/genai` SDK, provides the
conversational reasoning and tool/function calling described above.

The backend integrates **OneMap** for Singapore geocoding and dynamic
public-transport routing, **LTA DataMall** for arrivals, service alerts, and
crowding/facility data, and **data.gov.sg** for weather nowcasts. Leaflet
with OpenStreetMap provides map visualisation, and Browser Geolocation, Web
Speech Recognition, and Speech Synthesis support location awareness, voice
input, and spoken guidance.

React state and custom Journey/JourneyStep models track progress,
disruptions, ETA, rerouting, and familiarity mode. A diagnostic console
distinguishes live integrations from fallback behaviour, and credentials
stay server-side — local `.env` in development, Cloud Run environment
variables/secrets in production (see [Deployment](#deployment)).

All external data described below is fetched live from the source APIs
server-side; the app only falls back to fixed sample data when a live call
genuinely fails, and every response is tagged with where it actually came
from (see [Data sources & attribution](#data-sources--attribution)).

## Run Locally

**Prerequisites:**

- **Node.js 22.x** (see `engines` in [package.json](package.json)) and npm.
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/)
  — powers the AI companion chat; the app falls back to a rule-based
  companion without one, so this is optional for local testing.
- An **LTA DataMall account key** — free signup at
  [datamall.lta.gov.sg](https://datamall.lta.gov.sg/) — for live train
  alerts, bus arrivals, and facility/traffic data.
- A **OneMap Singapore account** (email + password) — free signup at
  [onemap.gov.sg](https://www.onemap.gov.sg/) — for geocoding and live
  transit routing.

The LTA and OneMap accounts are only needed to see *live* data; the app
still runs and is fully usable without any keys, using fixed fallback data
tagged accordingly (see [Data sources & attribution](#data-sources--attribution)).

1. Install dependencies:
   `npm install`
2. Create a `.env` file in the project root (never commit this file) with:
   ```
   GEMINI_API_KEY=your_google_ai_studio_key
   LTA_ACCOUNT_KEY=your_lta_datamall_account_key
   ONEMAP_EMAIL=your_onemap_account_email
   ONEMAP_PASSWORD=your_onemap_account_password
   PORT=3000
   ```
   All four credentials stay server-side and are never sent to the browser.
3. Run the app:
   `npm run dev`
4. Check that everything is actually live:
   `curl http://localhost:3000/api/diagnostics/report`
   or open the in-app Diagnostics console (Settings → Diagnostics).

## Deployment

Eyes Up deploys straight from source to **Google Cloud Run** through
**Google Cloud Build** — there's no Dockerfile in this repo. Cloud Build is
connected directly to the GitHub repository, so every push to `main`
triggers a fresh build and redeploy automatically: Cloud Build's Node.js
buildpack detects the project from `package.json`, installs dependencies,
runs the build, and packages the result into a container image behind the
scenes, all without a hand-written Dockerfile to maintain. There's no
manual build/deploy step, and a bad deploy can be rolled back by pointing
Cloud Run at a previous revision. The four API credentials are supplied as
Cloud Run environment variables/secrets rather than baked into the build,
so the same pipeline is safe to redeploy across environments.

The same handful of `package.json` scripts drive both the local and
deployed paths:

- **`dev`** runs `tsx server.ts` directly against the TypeScript source, with
  Vite's dev middleware serving the frontend and hot-reloading on change.
  This is what `npm run dev` uses locally, and it's the only script Cloud
  Build never touches.
- **`build`** does two things in sequence: `vite build` compiles the React
  frontend into static assets in `dist/`, then `esbuild` bundles
  `server.ts` (and everything it imports — the LTA/OneMap/weather/Gemini
  services, routing engine, journey-impact engine, etc.) into a single
  CommonJS file, `dist/server.cjs`, with external packages left unbundled
  so they're installed as regular dependencies instead.
- **`gcp-build`** is the hook Cloud Build's buildpack looks for
  automatically — here it's just an alias for `build`, so the deployed
  build reuses the exact same frontend + server bundling logic as a manual
  `npm run build`, instead of a separate deploy-only script that could
  drift out of sync.
- **`start`** runs `node dist/server.cjs` — the compiled bundle produced by
  `build`. This is what the buildpack runs to serve traffic on Cloud Run,
  reading the `PORT` Cloud Run injects at runtime; it's the same server
  code as `dev`, just pre-compiled instead of run through `tsx`.

None of this is required to work on the app day to day, though. Running
`npm run dev` locally (see [Run Locally](#run-locally) above) starts the
exact same Express server directly, with Vite's dev middleware serving the
frontend — no Cloud Build or Cloud Run access needed. Local and deployed
environments read the same `.env`-style configuration, so anything verified
locally behaves the same way once it reaches Cloud Run.

## Data sources & attribution

Every live payload carries a `source` field (`LIVE_*` vs `FALLBACK_*`) so the
UI never silently shows sample data as if it were real.

| Provider | What it powers | Needs a key? |
|---|---|---|
| **Google Gemini** (`@google/genai`, `gemini-3.6-flash`) | Companion chat + structured tool-calling (bus arrivals, alerts, rerouting) | Yes — `GEMINI_API_KEY` |
| **LTA DataMall** | Train service alerts, live bus arrivals, lift/escalator maintenance, traffic incidents | Yes — `LTA_ACCOUNT_KEY` |
| **OneMap Singapore** (SLA/GovTech) | Geocoding/search, public-transport routing | Yes — `ONEMAP_EMAIL` + `ONEMAP_PASSWORD` |
| **data.gov.sg** | 2-hr nowcast, 24-hr forecast, 4-day outlook, rainfall, air temperature, humidity, wind, PM2.5 | No — keyless |
| **OpenStreetMap** | Map tiles (`© OpenStreetMap contributors`, shown in-app) | No — keyless |

### Capabilities in detail

**Conversational AI companion.** The commuter's question travels to Gemini
alongside their live journey context — which step they're on, their chosen
persona, their familiarity mode, and whether they've just hit a disruption
or missed a stop. Gemini reasons over that context and can call the app's
own journey tools to ground its answer in what's actually happening on the
trip, rather than guessing. If Gemini is briefly unreachable, a local
rule-based responder recognises common intents — asking about rain or
shelter, confirming direction, checking the next step, asking for an ETA —
and answers immediately, so a flaky connection never leaves the commuter
without guidance. Voice conversations are handled through a short-lived,
low-privilege session token so the microphone connection never needs a
long-lived credential on the client.

**Journey planning with real alternatives.** Planning a trip tries live
transit routing first and only drops to a curated, hand-checked route if
that live call genuinely fails — the commuter is always shown which kind of
result they got. Plans can include a stopover or a second starting point (to
meet a friend partway), and the planner returns several route options
rather than a single "best" path, so the AI companion has real alternatives
to offer if something changes later.

**Mid-journey recalculation.** When a line is disrupted or the commuter
needs to dodge a specific station or stop, the app re-plans from the
commuter's current position rather than restarting the whole trip — it can
avoid named lines or stops entirely and explain why the new route looks the
way it does.

**Journey impact assessment.** This is what lets the companion stay quiet
when a disruption doesn't matter. It continuously cross-checks live train
alerts, lift/escalator outages, and weather against the commuter's actual
route and current position, and only surfaces a warning — with an
alternative and an updated arrival estimate — when the disruption genuinely
intersects their path.

**Off-route detection.** The app compares the commuter's live position
against the geometry of their planned route and flags a deviation once
they're meaningfully off the corridor, which is what triggers the "looks
like you've missed a turn" recovery conversation rather than a hard error.

**Privacy-preserving ETA sharing.** A shared transit pass reports estimated
arrival time, percentage progress, and arrival status to trusted contacts —
never precise GPS coordinates — and updates automatically whenever the
underlying journey is recalculated, so a delay or reroute is communicated
without the commuter sending another message.

**Live transit awareness (LTA DataMall).** Train service alerts, live bus
arrival ETAs (including passenger load and wheelchair-accessible bus
flags), lift/escalator maintenance status, road incidents, and platform
crowd density all come from LTA's live feeds, and feed directly into the
impact assessment and accessibility-aware routing described above.

**Location search & routing (OneMap Singapore).** Free-text place search
and turn-by-turn public-transport routing are backed by OneMap/SLA's
government geocoding and routing engine, which is also what journey
planning calls first before falling back to a curated route.

**Weather & environmental awareness (data.gov.sg).** Rain nowcasts,
24-hour and 4-day forecasts, and per-station rainfall, temperature,
humidity, wind, and PM2.5 readings are all live and keyless. They already
feed the "should I take a sheltered route" conversation today; per-station
rainfall, temperature, humidity, wind, and PM2.5 are fetched live and ready
to use, but aren't yet surfaced as their own advisories (e.g. a proactive
mask suggestion on a high-PM2.5 day) in the UI.

**Landmark grounding.** Voice guidance is tied to the nearest verified,
real-world landmark rather than generic distances, which is what makes an
instruction like "keep FairPrice on your right" possible instead of "turn
in 100 metres."

**Diagnostics.** A built-in diagnostics console (and matching backend
checks) probes Gemini, LTA, OneMap, and weather connectivity independently,
so it's always clear whether the commuter is seeing live data or a
fallback, and which specific integration is degraded if not.

### Documented but not wired in

- **Public holidays / school terms / HDB & population / historical
  ridership** — available on the [data.gov.sg catalogue](https://data.gov.sg/datasets),
  but each requires its own dataset ID to be looked up before it can be
  called. Not yet integrated; a candidate for a future iteration.
- **SG MRT Updates Telegram channel** (`t.me/s/sgmrt`) — a historical archive
  of service notices, not a live API. Useful for building/evaluating a
  disruption-summarizer, not for real-time state (use LTA `TrainServiceAlerts`
  for that).
