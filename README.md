<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Eyes-Up — Singapore AI Commuter Companion

Eyes-Up plans and narrates real Singapore commutes with landmark-based voice
guidance, live disruption/weather awareness, and accessibility-first routing.
All external data below is fetched live from the source APIs server-side; the
app only falls back to fixed sample data when a live call genuinely fails,
and every response is tagged with where it actually came from (see
[Data sources & attribution](#data-sources--attribution)).

## Run Locally

**Prerequisites:** Node.js

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

### How to use the endpoints

```bash
# Companion chat (live Gemini + tool calling over real transit data)
curl -X POST localhost:3000/api/companion/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"Is there rain near Bugis?","persona":"default","familiarityMode":"full"}'

# Live journey planning (OneMap routing; falls back to a curated route only if OneMap is unreachable)
curl -X POST localhost:3000/api/journey/plan \
  -H "Content-Type: application/json" \
  -d '{"origin":"NUS University Town","destination":"ION Orchard"}'

# LTA live train alerts / bus arrivals
curl localhost:3000/api/lta/alerts
curl localhost:3000/api/lta/bus-arrivals/16189

# OneMap geocoding
curl "localhost:3000/api/onemap/search?q=ION+Orchard"

# Weather & environment (all data.gov.sg, no key needed)
curl "localhost:3000/api/weather/nowcast?area=Central"   # 2-hour nowcast
curl localhost:3000/api/weather/24hr                      # 24-hour general forecast
curl localhost:3000/api/weather/4day                      # 4-day outlook
curl localhost:3000/api/weather/rainfall                  # per-station rainfall (mm)
curl localhost:3000/api/environment/air-temperature       # per-station °C
curl localhost:3000/api/environment/humidity              # per-station %
curl localhost:3000/api/environment/wind                  # per-station speed + direction
curl localhost:3000/api/environment/pm25                  # PM2.5 by region (west/south/north/east/central)
```

The rainfall/temperature/humidity/wind/PM2.5 endpoints are wired for future
walking- and cycling-leg advisories (e.g. suggesting sheltered routes or a
mask on high-PM2.5 days) — they're live and ready to consume, but not yet
surfaced in the UI.

### Documented but not wired in

- **Public holidays / school terms / HDB & population / historical
  ridership** — available on the [data.gov.sg catalogue](https://data.gov.sg/datasets),
  but each needs its own dataset ID looked up before it can be called; left
  for whoever picks this up next.
- **SG MRT Updates Telegram channel** (`t.me/s/sgmrt`) — a historical archive
  of service notices, not a live API. Useful for building/evaluating a
  disruption-summarizer, not for real-time state (use LTA `TrainServiceAlerts`
  for that).
