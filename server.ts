import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  fetchTrainServiceAlerts,
  getStationCrowding,
  fetchBusArrivals,
  fetchFacilitiesMaintenance,
  fetchTrafficIncidents,
} from "./server/services/ltaService";
import { fetchSingaporeWeather } from "./server/services/weatherService";
import {
  fetch24HourForecast,
  fetch4DayOutlook,
  fetchRainfall,
  fetchAirTemperature,
  fetchHumidity,
  fetchWindSpeed,
  fetchWindDirection,
  fetchPM25,
} from "./server/services/environmentService";
import {
  getRouteById,
  SINGAPORE_ROUTES,
  planJourney,
  planMultiRouteJourney,
  recalculateJourney,
  getShelteredAlternative,
} from "./server/services/routingService";
import { assessJourneyImpact } from "./server/services/journeyImpactEngine";
import {
  findNearestLandmark,
  calculateDistanceMeters,
} from "./server/services/landmarkContextService";
import {
  getOneMapStatus,
  searchOneMapLocation,
  getOneMapPublicTransportRoute,
  getOneMapEmail,
} from "./server/services/oneMapService";
import { askEyesUpCompanion } from "./server/services/geminiService";
import {
  runFullDiagnostic,
  testGeminiConnectivity,
  testOneMapConnectivity,
  testLtaConnectivity,
  testWeatherConnectivity,
} from "./server/services/diagnosticService";

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, '');
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      geminiConfigured: !!geminiKey && geminiKey !== "MY_GEMINI_API_KEY",
      geminiKeyLength: geminiKey.length,
      ltaConfigured: !!process.env.LTA_ACCOUNT_KEY,
      oneMapConfigured: !!process.env.ONEMAP_PASSWORD,
    });
  });

  // Dedicated Diagnostic API Endpoints
  app.get("/api/diagnostics/report", async (_req, res) => {
    try {
      const report = await runFullDiagnostic();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate diagnostic report", details: err?.message });
    }
  });

  app.post("/api/diagnostics/test-gemini", async (_req, res) => {
    try {
      const result = await testGeminiConnectivity();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Gemini diagnostic probe failed", details: err?.message });
    }
  });

  app.post("/api/diagnostics/test-onemap", async (_req, res) => {
    try {
      const result = await testOneMapConnectivity();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "OneMap diagnostic probe failed", details: err?.message });
    }
  });

  app.post("/api/diagnostics/test-lta", async (_req, res) => {
    try {
      const result = await testLtaConnectivity();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "LTA diagnostic probe failed", details: err?.message });
    }
  });

  app.post("/api/diagnostics/test-weather", async (_req, res) => {
    try {
      const result = await testWeatherConnectivity();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Weather diagnostic probe failed", details: err?.message });
    }
  });

  // LTA DataMall Train Service Alerts (Structured Disruption Feed)
  app.get("/api/lta/alerts", async (_req, res) => {
    try {
      const alerts = await fetchTrainServiceAlerts();
      res.json(alerts);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch LTA alerts", details: err?.message });
    }
  });

  // LTA DataMall v3/BusArrival (Live ETA + Passenger Load SEA/SDA/LSD + Wheelchair WAB)
  app.get("/api/lta/bus-arrivals/:busStopCode", async (req, res) => {
    try {
      const info = await fetchBusArrivals(req.params.busStopCode);
      res.json(info);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch bus arrivals", details: err?.message });
    }
  });

  // LTA DataMall v2/FacilitiesMaintenance (Live MRT Lift Maintenance - Mdm Lim Accessibility)
  app.get("/api/lta/facilities-maintenance", async (_req, res) => {
    try {
      const facilities = await fetchFacilitiesMaintenance();
      res.json({ facilities, count: facilities.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch facility maintenance", details: err?.message });
    }
  });

  // LTA DataMall TrafficIncidents (Accidents, Roadworks, Diversions)
  app.get("/api/lta/traffic-incidents", async (_req, res) => {
    try {
      const incidents = await fetchTrafficIncidents();
      res.json({ incidents, count: incidents.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch traffic incidents", details: err?.message });
    }
  });

  // LTA Platform Crowd Density (PCDRealTime)
  app.get("/api/lta/crowd/:stationCode", (req, res) => {
    try {
      const data = getStationCrowding(req.params.stationCode);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch station crowding", details: err?.message });
    }
  });

  // data.gov.sg 2-hour Real-Time Weather Nowcast
  app.get("/api/weather/nowcast", async (req, res) => {
    try {
      const area = typeof req.query.area === "string" ? req.query.area : "Central";
      const weather = await fetchSingaporeWeather(area);
      res.json(weather);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch weather nowcast", details: err?.message });
    }
  });

  // data.gov.sg 24-Hour Forecast (general outlook + regional periods)
  app.get("/api/weather/24hr", async (_req, res) => {
    try {
      res.json(await fetch24HourForecast());
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch 24-hour forecast", details: err?.message });
    }
  });

  // data.gov.sg 4-Day Outlook (trip-planning horizon)
  app.get("/api/weather/4day", async (_req, res) => {
    try {
      res.json(await fetch4DayOutlook());
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch 4-day outlook", details: err?.message });
    }
  });

  // data.gov.sg Live Rainfall (per-station mm)
  app.get("/api/weather/rainfall", async (_req, res) => {
    try {
      res.json(await fetchRainfall());
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch rainfall", details: err?.message });
    }
  });

  // data.gov.sg live Air Temperature, Humidity, Wind, and PM2.5 (NEA sensor network)
  app.get("/api/environment/air-temperature", async (_req, res) => {
    try {
      res.json(await fetchAirTemperature());
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch air temperature", details: err?.message });
    }
  });

  app.get("/api/environment/humidity", async (_req, res) => {
    try {
      res.json(await fetchHumidity());
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch humidity", details: err?.message });
    }
  });

  app.get("/api/environment/wind", async (_req, res) => {
    try {
      const [speed, direction] = await Promise.all([fetchWindSpeed(), fetchWindDirection()]);
      res.json({ speed, direction });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch wind data", details: err?.message });
    }
  });

  app.get("/api/environment/pm25", async (_req, res) => {
    try {
      res.json(await fetchPM25());
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch PM2.5", details: err?.message });
    }
  });

  // Deterministic Route Provider
  app.get("/api/routes", (_req, res) => {
    try {
      res.json(Object.values(SINGAPORE_ROUTES));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to list routes", details: err?.message });
    }
  });

  app.get("/api/routes/:id", (req, res) => {
    try {
      const route = getRouteById(req.params.id);
      res.json(route);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch route", details: err?.message });
    }
  });

  // Dynamic Journey Planner (OneMap Transit + Deterministic Multimodal Fallback with 3 Route Options)
  app.post("/api/journey/plan", async (req, res) => {
    try {
      const {
        origin,
        destination,
        viaStops,
        secondaryOrigin,
        preferences,
        currentLocation,
        desiredArrivalTime,
      } = req.body;
      if (!origin || !destination) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }
      const multiResult = await planMultiRouteJourney({
        origin,
        destination,
        viaStops,
        secondaryOrigin,
        preferences,
        currentLocation,
        desiredArrivalTime,
      });
      // Response includes top-level journey fields + routes array for multi-choice UI
      res.json({
        ...multiResult.journey,
        routes: multiResult.routes,
        journey: multiResult.journey,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to plan journey", details: err?.message });
    }
  });

  // Dynamic Rerouting Engine (Bypass Disrupted Lines / Recover from Missed Stops)
  app.post("/api/journey/recalculate", async (req, res) => {
    try {
      const { currentLocation, destination, avoidLines, avoidStops, preferredModes, reason } = req.body;
      if (!currentLocation || !destination) {
        return res.status(400).json({ error: "currentLocation and destination are required" });
      }
      const journey = await recalculateJourney({
        currentLocation,
        destination,
        avoidLines,
        avoidStops,
        preferredModes,
        reason,
      });
      res.json(journey);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to recalculate journey", details: err?.message });
    }
  });

  // Journey Impact Engine (Evaluates if incidents intersect the commuter's route)
  app.post("/api/journey/impact", async (req, res) => {
    try {
      const { journey, currentStepIndex = 0, currentLocation, userPersona } = req.body;
      const [trainAlerts, lifts, weather] = await Promise.all([
        fetchTrainServiceAlerts(),
        fetchFacilitiesMaintenance(),
        fetchSingaporeWeather(),
      ]);
      const assessment = assessJourneyImpact({
        journey,
        currentStepIndex,
        currentLocation,
        trainAlerts,
        facilityMaintenance: lifts,
        weather,
        userPersona,
      });
      res.json(assessment);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to assess journey impact", details: err?.message });
    }
  });

  // Off-Route Perception / Deviation Detection
  app.post("/api/journey/off-route", (req, res) => {
    try {
      const { currentLocation, journey } = req.body;
      if (!currentLocation || !journey?.geometry?.length) {
        return res.json({ offRoute: false, distanceFromRouteMeters: 0, confidence: 1 });
      }
      let minDist = Infinity;
      for (const pt of journey.geometry) {
        const d = calculateDistanceMeters(currentLocation, { lat: pt[0], lng: pt[1] });
        if (d < minDist) minDist = d;
      }
      const isOff = minDist > 150;
      res.json({
        offRoute: isOff,
        distanceFromRouteMeters: minDist,
        confidence: 0.95,
        reason: isOff ? `Commuter is ${minDist}m away from the planned transit corridor.` : 'On route',
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to detect off-route", details: err?.message });
    }
  });

  // Nearby Verified Singapore Physical Landmarks
  app.get("/api/landmarks/near", (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string) || 1.3040;
      const lng = parseFloat(req.query.lng as string) || 103.8318;
      const result = findNearestLandmark({ lat, lng });
      res.json(result || { landmark: null, distanceMeters: null });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to find nearby landmark", details: err?.message });
    }
  });

  // OneMap Singapore Status (GovTech/SLA) - Safe telemetry without secrets
  app.get("/api/onemap/status", (_req, res) => {
    try {
      const status = getOneMapStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get OneMap status", details: err?.message });
    }
  });

  // OneMap Singapore Location / Landmark Search (Elasticsearch)
  app.get("/api/onemap/search", async (req, res) => {
    try {
      const query = typeof req.query.q === "string" ? req.query.q : "";
      const results = await searchOneMapLocation(query);
      res.json({ query, results, count: results.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to search OneMap", details: err?.message });
    }
  });

  // OneMap Public Transport Routing Proxy
  app.get("/api/onemap/route", async (req, res) => {
    try {
      const startLat = parseFloat(req.query.startLat as string) || 1.3048;
      const startLng = parseFloat(req.query.startLng as string) || 103.7725;
      const endLat = parseFloat(req.query.endLat as string) || 1.304;
      const endLng = parseFloat(req.query.endLng as string) || 103.8318;
      const mode = (req.query.mode as any) || "TRANSIT";

      const routeResult = await getOneMapPublicTransportRoute(startLat, startLng, endLat, endLng, mode);
      res.json(routeResult);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to query OneMap route", details: err?.message });
    }
  });

  // Ephemeral Token for Gemini Live Voice (Architecture Box 5)
  app.post("/api/gemini/live-token", (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
    res.json({
      status: "ready",
      hasServerKey: hasKey,
      ephemeralToken: hasKey ? `live_token_${Buffer.from(Date.now().toString()).toString("base64")}` : "demo_token_sg_eyesup",
      expiresIn: 3600,
      instructions: "Direct WebSocket connection to Gemini Live with server-side tool calling and local TTS fallback.",
    });
  });

  // AI Companion Chat endpoint powered by Gemini 1.5 Flash + Singapore transit context
  app.post("/api/companion/chat", async (req, res) => {
    try {
      const {
        question,
        persona,
        currentStep,
        familiarityMode,
        isDisrupted,
        isMissedStop,
        journeyState,
        currentLocation,
      } = req.body;

      const result = await askEyesUpCompanion({
        question: question || "",
        persona,
        currentStep,
        familiarityMode,
        isDisrupted,
        isMissedStop,
        journeyState,
        currentLocation,
      });

      return res.json({
        reply: result.reply,
        source: result.source,
        personaUsed: result.personaUsed,
        emotionalStateDetected: result.emotionalStateDetected,
        agentAction: result.agentAction,
        suggestedActionLabel: result.suggestedActionLabel,
        updatedJourney: result.updatedJourney,
      });
    } catch (err: any) {
      console.warn("Companion chat failed, falling back to local companion:", err?.message);
      const { question, currentStep, familiarityMode, isMissedStop, isDisrupted, journeyState, currentLocation } = req.body;
      const qLower = (question || "").toLowerCase();

      let updatedJourney: any = undefined;
      if (
        qLower.includes("rain") ||
        qLower.includes("shelter") ||
        qLower.includes("weather") ||
        qLower.includes("umbrella") ||
        qLower.includes("wet") ||
        qLower.includes("covered")
      ) {
        try {
          updatedJourney = await getShelteredAlternative(
            currentLocation,
            journeyState?.origin || "Toa Payoh Central",
            journeyState?.destination || "Bugis Junction"
          );
        } catch (e) {
          console.warn("Could not generate sheltered fallback route:", e);
        }
      }

      return res.json({
        reply: getRuleBasedResponse(question, currentStep, familiarityMode, isMissedStop, isDisrupted),
        source: "fallback",
        agentAction: updatedJourney ? "reroute_sheltered" : undefined,
        updatedJourney,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(__dirname, "index.html"))
      ? __dirname
      : path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Eyes Up server running on http://0.0.0.0:${PORT}`);
  });
}

function getRuleBasedResponse(
  question: string = "",
  currentStep: any = {},
  familiarityMode: string = "full",
  isMissedStop: boolean = false,
  isDisrupted: boolean = false
): string {
  const q = question.toLowerCase();

  if (isMissedStop) {
    return "You've gone one stop past where we planned to get off. That's totally okay — I've adjusted your journey. Stay at this stop and take Bus 65. Your new ETA is 6:17 PM.";
  }

  if (isDisrupted) {
    return "There's an unexpected signal delay ahead at Bugis. Your current route would arrive at 9:07 AM, but I found an alternative route arriving at 8:49 AM. Tap to switch whenever you're ready.";
  }

  if (
    q.includes("rain") ||
    q.includes("shelter") ||
    q.includes("weather") ||
    q.includes("umbrella") ||
    q.includes("wet") ||
    q.includes("dry") ||
    q.includes("covered")
  ) {
    return "I've switched your active route to 100% sheltered linkways and underground concourses to keep you completely dry. Follow the covered canopy straight ahead.";
  }

  if (q.includes("right way") || q.includes("correct way") || q.includes("wrong way")) {
    if (familiarityMode === "light") {
      return "Spot on. Keep heading straight ahead towards the station.";
    }
    return `Yes, you're on the right path! Look out for ${currentStep.landmark || "the covered walkway"} just ahead on your left.`;
  }

  if (q.includes("turn here") || q.includes("turn")) {
    return `Turn right just after you pass ${currentStep.landmark || "the FairPrice supermarket"}, right by the sheltered zebra crossing.`;
  }

  if (q.includes("don't see") || q.includes("dont see") || q.includes("can't find") || q.includes("where")) {
    return `No worries! Look slightly up and to your left — you'll spot the yellow sign board right beside the Toast Box cafe.`;
  }

  if (q.includes("missed") || q.includes("lost")) {
    return "Don't stress. You're still on track. Keep walking forward along the sheltered linkway and you'll see the MRT gantry in about 30 paces.";
  }

  if (q.includes("what do i do next") || q.includes("next step") || q.includes("what next")) {
    return currentStep.instruction || "Keep walking straight along the sheltered path until you see the bus interchange entrance.";
  }

  if (q.includes("late") || q.includes("time") || q.includes("eta")) {
    return "You're pacing comfortably on schedule. We're expected to reach by your desired arrival time with 4 minutes of cushion.";
  }

  return `You're doing great. ${currentStep.guidance?.[familiarityMode] || currentStep.instruction || "Continue heading towards your next stop."}`;
}

startServer();
