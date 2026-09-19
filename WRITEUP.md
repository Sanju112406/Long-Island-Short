# Eyes Up - Your Personal AI Commuter Companion

Navigate the world, not your screen.

Eyes Up is a voice-first web app that helps Singapore commuters plan customised journeys, navigate through spoken landmark guidance, and adapt during planned and unexpected disruptions. Addressing Problem Statement 2, it turns transport information into personalised, actionable support from departure to arrival. It is designed to build commuters’ awareness and confidence: helping them recognise their surroundings, understand their options and make their own decisions without becoming dependent on constant instructions.

This aligns with SMRT’s vision of “Moving People. Enhancing Lifestyles” by making everyday journeys more manageable and engaging.

## Our Solution

Plan around your needs. Compare public-transport routes, specify an arrival time, add stopovers, or find a meeting point with a friend before continuing together. These preferences give the companion context for helping users assess alternatives when their original journey is affected.

Navigate through conversation. Receive spoken directions based on recognisable landmarks and ask questions such as “Am I going the right way?” or “Will I be late?” Guidance adapts to route familiarity, offering detailed reassurance for unfamiliar journeys and fewer interruptions on regular commutes. When rerouting introduces an unfamiliar transfer or walking segment, users can ask for additional guidance.

Recover when plans change. Journey monitoring, transport alerts and off-route detection help identify changes affecting the trip. The companion explains the disruption’s impact, presents an alternative alongside the current route, and updates arrival estimates so users can decide whether to switch or continue. After a missed stop, recovery guidance helps them reconnect with their journey. Clear explanations and actionable next steps reflect SMRT’s emphasis on Safety & Service, particularly when commuters face uncertainty.

Share progress privately. A shareable transit pass keeps trusted contacts informed of estimated arrival time, journey progress and arrival status without displaying precise GPS coordinates. Updated estimates help communicate delays when a disruption or reroute changes the journey.

Keep your eyes up. Spoken guidance and a battery-conscious pocket mode reduce the need for screen checks. Optional “Eyes Up Moments” introduce short landmark stories, with collectible stamps in a “My Singapore” passport.

## What Makes Eyes Up Unique

Eyes Up’s central idea is that commuters should not have to keep interpreting a map to feel confident about their journey. Narration connects directions to the surroundings, while interaction lets users resolve uncertainty in their own words. The result is a travel companion that explains, responds and helps users make decisions throughout the trip.

Crucially, the same route does not mean the same guidance. A first-time visitor may need reassurance at every interchange; a regular commuter may only want to hear about changes. Eyes Up makes that support adjustable and familiarity-aware, combining easy route customisation with control over how the journey is narrated. This attention to different commuter needs reflects SMRT’s value of Respect.

This experience is supported by an agentic backend: Gemini can call dedicated journey tools to turn conversational requests into informed travel support.

Everyday routes also become opportunities for discovery. “Eyes Up Moments” offer bite-sized stories about nearby landmarks, local history and neighbourhood details that commuters might otherwise pass without noticing. Users can listen to a story and collect a stamp in their “My Singapore” passport, gradually building a personal record of discoveries. This gives even a familiar commute something new to offer—and gives users a memorable reason to keep their eyes up.

## Tech Stack Up and Agentic Architecture

Built using Google AI Studio and deployed on Google Cloud Run, Eyes Up connects a React, TypeScript and Vite frontend to a Node.js and Express backend.

The Gemini API, integrated through Google’s @google/genai SDK, provides conversational reasoning and tool/function calling. A custom agentic backend supplies routing, journey impact analysis, landmark context, off-route detection and journey monitoring as tools. Backend services calculate routes and establish transport facts; Gemini uses those results to explain options and guide the commuter.

The backend integrates OneMap for Singapore geocoding and dynamic public-transport routing, LTA DataMall for arrivals, service alerts and available crowding or facility information, and data.gov.sg for weather nowcasts. Leaflet with OpenStreetMap provides map visualisation. Browser Geolocation, Web Speech Recognition and Speech Synthesis support location awareness, voice input and spoken guidance.

React state and custom Journey/JourneyStep models manage progress, disruptions, ETA, rerouting and familiarity modes. A diagnostic console distinguishes live integrations from fallback behaviour. Credentials remain server-side, using local environment configuration during development and Cloud Run environment variables or secrets in production.

Google Cloud Build, connected to GitHub, automatically rebuilds and redeploys the application to Cloud Run when changes are pushed to main, supporting rapid iteration and a repeatable deployment workflow.
