/**
 * Gemini Companion Service with Structured Tool/Function Calling
 * "Code computes transport truth; Gemini understands commuter intent and explains."
 * Transport facts must come from tools/services. Gemini never invents transit truth.
 */

import { GoogleGenAI } from '@google/genai';
import {
  fetchTrainServiceAlerts,
  fetchBusArrivals,
  fetchFacilitiesMaintenance,
  LTATrainAlert,
  LTABusArrivalInfo,
} from './ltaService';
import { fetchSingaporeWeather, WeatherNowcast } from './weatherService';
import {
  planJourney,
  recalculateJourney,
  getShelteredAlternative,
  SINGAPORE_ROUTES,
} from './routingService';
import {
  getLandmarkContext,
  calculateDistanceMeters,
} from './landmarkContextService';
import { assessJourneyImpact } from './journeyImpactEngine';
import { Journey, JourneyStep, FamiliarityLevel, LatLng } from '../../src/types';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const rawKey = process.env.GEMINI_API_KEY || '';
  const key = rawKey.trim().replace(/^["']|["']$/g, '');
  if (key && key !== 'MY_GEMINI_API_KEY') {
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({ apiKey: key });
    }
    return geminiClient;
  }
  return null;
}

export interface AskCompanionParams {
  question: string;
  persona?: 'rachel' | 'arjun' | 'lim' | 'default';
  currentStep?: JourneyStep;
  familiarityMode?: FamiliarityLevel;
  isMissedStop?: boolean;
  isDisrupted?: boolean;
  currentLocation?: LatLng;
  journey?: Journey;
  journeyState?: {
    origin: string;
    destination: string;
    stepIndex: number;
    totalSteps: number;
    eta?: string;
  };
  conversationHistory?: Array<{ sender: 'user' | 'companion'; text: string }>;
}

export interface CompanionAgentResponse {
  reply: string;
  source: 'gemini' | 'gemini_tool_calling' | 'deterministic_engine';
  personaUsed: string;
  emotionalStateDetected?: 'panicked' | 'disoriented' | 'hurried' | 'calm';
  agentAction?: 'calm_and_ground' | 'reroute_active' | 'locate_lift' | 'reassure_ontime' | 'navigate' | 'reroute_sheltered';
  suggestedActionLabel?: string;
  toolCallsExecuted?: string[];
  updatedJourney?: Journey;
}

// 12 Structured Tool Declarations for Gemini Agent
export const EYES_UP_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'getCurrentJourney',
        description: 'Get the active journey state, origin, destination, current step, and ETA.',
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'getNextInstruction',
        description: 'Get the next physical Eyes-Up landmark turn-by-turn guidance and reassurance cue.',
        parameters: {
          type: 'object',
          properties: {
            familiarity: { type: 'string', description: 'full, medium, or light' },
          },
        },
      },
      {
        name: 'getLandmarkContext',
        description: 'Get verified Singapore physical landmark near the current coordinates or step.',
        parameters: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            maneuver: { type: 'string' },
          },
        },
      },
      {
        name: 'getCurrentETA',
        description: 'Get the calculated ETA and on-time buffer for the active journey.',
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'getBusArrivals',
        description: 'Fetch real-time bus arrivals and crowding loads for a Singapore bus stop.',
        parameters: {
          type: 'object',
          properties: {
            busStopCode: { type: 'string', description: '5-digit bus stop code, e.g. 16189' },
          },
          required: ['busStopCode'],
        },
      },
      {
        name: 'getTrainServiceAlerts',
        description: 'Fetch real-time LTA train service alerts and MRT line disruptions.',
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'getFacilitiesMaintenance',
        description: 'Check active lift and escalator maintenance for station barrier-free accessibility.',
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'getWeatherContext',
        description: 'Get Singapore 2-hour weather nowcast, rain status, and shelter recommendations.',
        parameters: {
          type: 'object',
          properties: {
            area: { type: 'string', description: 'Singapore region or town' },
          },
        },
      },
      {
        name: 'checkJourneyImpact',
        description: 'Assess if any LTA disruptions or weather affect the current active journey.',
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'detectOffRoute',
        description: 'Check if commuter location is off-route (>150m from polyline).',
        parameters: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
          required: ['lat', 'lng'],
        },
      },
      {
        name: 'planJourney',
        description: 'Plan a dynamic Singapore transit journey from origin to destination. Omit origin only if the commuter has a live GPS location available (it will be used automatically) — otherwise ask the commuter where they are starting from before calling this.',
        parameters: {
          type: 'object',
          properties: {
            origin: { type: 'string' },
            destination: { type: 'string' },
          },
          required: ['destination'],
        },
      },
      {
        name: 'recalculateJourney',
        description: 'Recalculate route to bypass a disrupted line or recover from a missed stop.',
        parameters: {
          type: 'object',
          properties: {
            avoidLine: { type: 'string', description: 'Line code to avoid, e.g. DTL' },
            reason: { type: 'string' },
          },
        },
      },
      {
        name: 'changeToShelteredRoute',
        description:
          'Switches the active journey to a 100% sheltered, rain-protected route with covered linkways, underpasses, and lifts across Singapore.',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Reason for sheltered route (e.g., raining, storm, hot sun, stroller)',
            },
          },
        },
      },
    ],
  },
];

/**
 * Execute tool against verified deterministic transport truth
 */
export async function executeDeterministicTool(
  name: string,
  args: any,
  context: AskCompanionParams
): Promise<any> {
  switch (name) {
    case 'getCurrentJourney': {
      return {
        origin: context.journey?.origin || context.journeyState?.origin || 'NUS (University Town)',
        destination: context.journey?.destination || context.journeyState?.destination || 'Orchard (ION Orchard)',
        eta: context.journey?.calculatedETA || context.journeyState?.eta || '9:04 AM',
        currentStepIndex: context.journeyState?.stepIndex || 0,
        totalSteps: context.journey?.steps?.length || context.journeyState?.totalSteps || 4,
        source: context.journey?.routeSource || 'LIVE_ONEMAP',
      };
    }

    case 'getNextInstruction': {
      const fam = (args?.familiarity || context.familiarityMode || 'full') as FamiliarityLevel;
      const step = context.currentStep || context.journey?.steps?.[context.journeyState?.stepIndex || 0];
      if (step) {
        return {
          title: step.title,
          landmark: step.landmark,
          landmarkDetail: step.landmarkDetail,
          instruction: step.guidance[fam] || step.guidance.full,
          reassuranceCue: step.reassuranceCue,
        };
      }
      return { instruction: 'Continue straight along the covered walkway past the next gantry.' };
    }

    case 'getLandmarkContext': {
      const pos = (args?.lat && args?.lng)
        ? { lat: args.lat, lng: args.lng }
        : context.currentLocation || { lat: 1.3040, lng: 103.8318 };
      return getLandmarkContext({
        currentLocation: pos,
        nextManeuver: args?.maneuver || context.currentStep?.title,
      });
    }

    case 'getCurrentETA': {
      const eta = context.journey?.calculatedETA || context.journeyState?.eta || '9:04 AM';
      return {
        currentETA: eta,
        status: 'On time',
        bufferMinutes: 14,
      };
    }

    case 'getBusArrivals': {
      const stop = args?.busStopCode || '16189';
      return await fetchBusArrivals(stop);
    }

    case 'getTrainServiceAlerts': {
      return await fetchTrainServiceAlerts();
    }

    case 'getFacilitiesMaintenance': {
      return await fetchFacilitiesMaintenance();
    }

    case 'getWeatherContext': {
      const area = args?.area || 'Central';
      return await fetchSingaporeWeather(area);
    }

    case 'checkJourneyImpact': {
      const journey = context.journey || {
        id: 'active',
        title: 'Active Journey',
        origin: context.journeyState?.origin || 'NUS',
        destination: context.journeyState?.destination || 'Orchard',
        desiredArrivalTime: '9:30 AM',
        calculatedETA: '9:04 AM',
        totalDurationMins: 34,
        travelHistoryCount: 0,
        steps: context.currentStep ? [context.currentStep] : [],
      };
      const [trainAlerts, lifts, weather] = await Promise.all([
        fetchTrainServiceAlerts(),
        fetchFacilitiesMaintenance(),
        fetchSingaporeWeather(),
      ]);
      return assessJourneyImpact({
        journey,
        currentStepIndex: context.journeyState?.stepIndex || 0,
        currentLocation: context.currentLocation,
        trainAlerts,
        facilityMaintenance: lifts,
        weather,
        userPersona: context.persona,
      });
    }

    case 'detectOffRoute': {
      const currentLoc = (args?.lat && args?.lng)
        ? { lat: args.lat, lng: args.lng }
        : context.currentLocation;
      if (!currentLoc || !context.journey?.geometry?.length) {
        return { offRoute: false, distanceFromRouteMeters: 0 };
      }
      let minDist = Infinity;
      for (const pt of context.journey.geometry) {
        const d = calculateDistanceMeters(currentLoc, { lat: pt[0], lng: pt[1] });
        if (d < minDist) minDist = d;
      }
      return {
        offRoute: minDist > 150,
        distanceFromRouteMeters: minDist,
        confidence: 0.95,
      };
    }

    case 'planJourney': {
      // Reuse the origin the commuter already entered on the planner screen
      // (if any) before ever falling through to "ask" or "guess". Only when
      // NONE of these are known — no explicit arg, no already-planned journey,
      // no GPS — does planJourney fall to its neutral central-Singapore default.
      const alreadyKnownOrigin = context.journey?.origin || context.journeyState?.origin;
      return await planJourney({
        origin: args?.origin || alreadyKnownOrigin || '',
        destination: args?.destination || 'Orchard',
        currentLocation: context.currentLocation,
      });
    }

    case 'recalculateJourney': {
      const loc = context.currentLocation || { lat: 1.304, lng: 103.8318 };
      const dest = context.journey?.destination || context.journeyState?.destination || 'Bugis Junction';
      return await recalculateJourney({
        currentLocation: loc,
        destination: dest,
        avoidLines: args?.avoidLine ? [args.avoidLine] : ['DTL'],
        reason: args?.reason,
      });
    }

    case 'changeToShelteredRoute': {
      const orig = context.journeyState?.origin || context.journey?.origin || 'Toa Payoh Central';
      const dest = context.journeyState?.destination || context.journey?.destination || 'Bugis Junction';
      const shelteredJourney = await getShelteredAlternative(context.currentLocation, orig, dest);
      return {
        status: 'route_switched_sheltered',
        message: 'Active journey switched to 100% covered linkways and rain-sheltered underpasses.',
        updatedJourney: shelteredJourney,
      };
    }

    default:
      return { status: 'unknown_tool', name };
  }
}

export async function askEyesUpCompanion(
  params: AskCompanionParams
): Promise<CompanionAgentResponse> {
  const ai = getGeminiClient();
  const persona = params.persona || 'default';
  const qLower = params.question.toLowerCase();

  // Detect distress / panic indicators
  const isPanicked =
    qLower.includes('panic') ||
    qLower.includes('freak') ||
    qLower.includes('lost') ||
    qLower.includes("can't find") ||
    qLower.includes('help') ||
    qLower.includes('scared') ||
    qLower.includes('wrong way') ||
    qLower.includes('missed') ||
    params.isMissedStop;

  // Persona instructions
  let personaDirective = '';
  if (persona === 'rachel') {
    personaDirective = `Persona: Rachel (High-stakes executive commuter). Punctuality is critical. State buffer minutes authoritatively. Provide instant alternatives without hesitation.`;
  } else if (persona === 'arjun') {
    personaDirective = `Persona: Arjun (Multi-modal commuter with folding bicycle). Values smooth, calm transitions. Reassure about weather and sheltered paths.`;
  } else if (persona === 'lim') {
    personaDirective = `Persona: Mdm Lim (Senior accessibility commuter heading to Singapore General Hospital). Reassure gently with maternal warmth. Prioritize lifts and zero-step paths.`;
  } else {
    personaDirective = `Persona: Empathetic Singapore Transit Companion. Prioritize commuter psychological safety: de-escalate anxiety and anchor with physical landmarks.`;
  }

  // If Gemini API is available, invoke with Structured Tool Calling
  if (ai) {
    try {
      const executedTools: string[] = [];
      const systemInstruction = `You are "Eyes Up", an empathetic, intelligent Singapore transit companion agent.
You walk alongside the commuter in real time.

COMMUTER GUARDRAIL:
You must NEVER invent GPS coordinates, routes, stations, bus arrivals, ETAs, disruptions, or weather.
All transit facts MUST come from calling tools.
If you need transport telemetry, call the appropriate tool.

Agent Guidelines:
1. EMPATHY & DE-ESCALATION FIRST: If the commuter expresses panic, fear, or missed stops, your FIRST sentence must calm their nervous system in your own words — never the same opening twice in a row.
2. NO SCOLDING: Never tell them they made a mistake. Reframe unexpected stops as quick reroutes.
3. PHYSICAL VISUAL ANCHORS: Anchor turns to the SPECIFIC landmark name given to you in this context or returned by a tool call — never substitute a generic or example landmark. Never quote raw GPS meters alone.
4. EYES-UP CONCISENESS: Keep final responses between 18 to 35 words. Commuters are walking with earpieces.
5. VARY YOUR PHRASING: Never reuse the same sentence structure or wording you've used earlier in this conversation. Sound like a person, not a script.
6. NEVER GUESS A STARTING POINT: If the commuter asks to go somewhere new and you do NOT have their live GPS location (see "Live GPS Location" below) and they haven't stated where they're starting from, ASK them where they are before calling planJourney. Do not silently assume any specific origin — a wrong guessed starting point is worse than asking a quick clarifying question.

${personaDirective}

Current Context:
- Active Landmark: ${params.currentStep?.landmark || 'Covered Linkway'}
- Current Step: ${params.currentStep?.title || 'Walking towards transit connection'}
- Journey: ${params.journeyState?.origin || 'Origin'} to ${params.journeyState?.destination || 'Destination'}
- Live GPS Location: ${params.currentLocation ? `Available (${params.currentLocation.lat.toFixed(4)}, ${params.currentLocation.lng.toFixed(4)})` : 'NOT available — do not assume a starting point'}
- Missed Stop: ${params.isMissedStop ? 'YES' : 'NO'}
- Disrupted: ${params.isDisrupted ? 'YES' : 'NO'}
- Commuter Distress: ${isPanicked ? 'YES - DE-ESCALATE IMMEDIATELY' : 'NO'}`;

      const targetModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
      const FALLBACK_MODEL = 'gemini-pro-latest';

      // Flash models support disabling "thinking" for low-latency voice replies;
      // pro-latest requires thinking mode, so it needs a larger token budget instead.
      const configForModel = (baseConfig: any, model: string) => {
        if (model.includes('flash')) {
          return { ...baseConfig, thinkingConfig: { thinkingBudget: 0 } };
        }
        return { ...baseConfig, maxOutputTokens: Math.max(baseConfig.maxOutputTokens || 0, 512) };
      };

      // Helper function to attempt generation with primary model then fall back to gemini-pro-latest if needed
      const generateWithModelFallback = async (paramsObj: any) => {
        try {
          return await ai.models.generateContent({
            ...paramsObj,
            model: targetModel,
            config: configForModel(paramsObj.config, targetModel),
          });
        } catch (err: any) {
          if (targetModel !== FALLBACK_MODEL) {
            try {
              return await ai.models.generateContent({
                ...paramsObj,
                model: FALLBACK_MODEL,
                config: configForModel(paramsObj.config, FALLBACK_MODEL),
              });
            } catch (err2: any) {
              // Re-throw to trigger deterministic companion fallback
            }
          }
          throw err;
        }
      };

      // Prior turns of this conversation, so Gemini knows what it already said
      // and varies its phrasing instead of re-deriving the same opener each call.
      const historyContents = (params.conversationHistory || []).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));
      const currentTurn = { role: 'user', parts: [{ text: params.question }] };

      // First turn with tools
      const response = await generateWithModelFallback({
        contents: [...historyContents, currentTurn],
        config: {
          systemInstruction,
          tools: EYES_UP_TOOL_DECLARATIONS as any,
          temperature: 0.65,
          maxOutputTokens: 180,
        },
      });

      let updatedJourney: Journey | undefined = undefined;

      // Check if model requested tool call(s)
      // Use the raw content part (not response.functionCalls) so thoughtSignature
      // survives the round-trip — Gemini 3.x rejects function replies without it.
      const modelPart = response.candidates?.[0]?.content?.parts?.[0];
      const toolCall = modelPart?.functionCall;
      if (toolCall && toolCall.name) {
        const toolName = String(toolCall.name || '');
        if (toolName) {
          executedTools.push(toolName);
          const toolResult = await executeDeterministicTool(toolName, toolCall.args, params);
          if (toolResult?.updatedJourney) {
            updatedJourney = toolResult.updatedJourney;
          }

        // Second turn: pass tool response back to Gemini for conversational synthesis
        const followup = await generateWithModelFallback({
          contents: [
            ...historyContents,
            currentTurn,
            {
              role: 'model',
              parts: [modelPart as any],
            },
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: toolCall.name,
                    response: { result: toolResult },
                  },
                } as any,
              ],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.65,
            maxOutputTokens: 120,
          },
        });

        const replyText = followup.text?.trim();
          if (replyText) {
            return {
              reply: replyText,
              source: 'gemini_tool_calling',
              personaUsed: persona,
              emotionalStateDetected: isPanicked ? 'panicked' : 'calm',
              agentAction: updatedJourney ? 'reroute_sheltered' : (isPanicked ? 'calm_and_ground' : 'navigate'),
              toolCallsExecuted: executedTools,
              updatedJourney,
            };
          }
        }
      }

      const directText = response.text?.trim();
      if (directText) {
        // If the model gave direct text for a weather query, ensure active sheltered route is attached
        if (
          qLower.includes('rain') ||
          qLower.includes('shelter') ||
          qLower.includes('weather') ||
          qLower.includes('umbrella') ||
          qLower.includes('wet')
        ) {
          const orig = params.journeyState?.origin || params.journey?.origin || 'Toa Payoh Central';
          const dest = params.journeyState?.destination || params.journey?.destination || 'Bugis Junction';
          updatedJourney = await getShelteredAlternative(params.currentLocation, orig, dest);
        }

        return {
          reply: directText,
          source: 'gemini',
          personaUsed: persona,
          emotionalStateDetected: isPanicked ? 'panicked' : 'calm',
          agentAction: updatedJourney ? 'reroute_sheltered' : (isPanicked ? 'calm_and_ground' : 'navigate'),
          toolCallsExecuted: executedTools,
          updatedJourney,
        };
      }
    } catch (err) {
      console.warn('[Gemini] Tool calling failed, using deterministic companion fallback:', err);
    }
  }

  // Graceful deterministic fallback engine (Guarantees zero-failure demo even if offline/unkeyed)
  const landmark = params.currentStep?.landmark || 'the covered linkway';

  // Weather & Sheltered Route Reroute Query
  if (
    qLower.includes('rain') ||
    qLower.includes('shelter') ||
    qLower.includes('weather') ||
    qLower.includes('umbrella') ||
    qLower.includes('wet') ||
    qLower.includes('dry') ||
    qLower.includes('covered')
  ) {
    const orig = params.journeyState?.origin || params.journey?.origin || 'Toa Payoh Central';
    const dest = params.journeyState?.destination || params.journey?.destination || 'Bugis Junction';
    const shelteredJourney = await getShelteredAlternative(params.currentLocation, orig, dest);
    return {
      reply: `I've updated your active route to 100% sheltered linkways and underground concourses to keep you completely dry. Follow the covered canopy straight ahead.`,
      source: 'deterministic_engine',
      personaUsed: persona,
      emotionalStateDetected: 'calm',
      agentAction: 'reroute_sheltered',
      suggestedActionLabel: 'Sheltered Route Active',
      updatedJourney: shelteredJourney,
    };
  }

  if (isPanicked || qLower.includes('panic') || qLower.includes('lost') || qLower.includes("can't find")) {
    if (persona === 'lim') {
      return {
        reply: `Take a gentle breath, Mdm Lim, you are completely safe. Stop where you are. Look for the station staff counter or Lift B just ahead. There are no stairs needed.`,
        source: 'deterministic_engine',
        personaUsed: persona,
        emotionalStateDetected: 'panicked',
        agentAction: 'calm_and_ground',
        suggestedActionLabel: 'Guide to Nearest Lift',
      };
    }

    if (persona === 'rachel') {
      return {
        reply: `Take a breath, Rachel. You are still on time. Do not turn back. Stay right here for Bus 65 arriving in 3 minutes—you will make your meeting with 10 minutes of buffer.`,
        source: 'deterministic_engine',
        personaUsed: persona,
        emotionalStateDetected: 'panicked',
        agentAction: 'reroute_active',
        suggestedActionLabel: 'Bus 65 Express Bypass',
      };
    }

    return {
      reply: `Take a deep breath, I'm right here with you. You haven't lost your way. Pause for a moment and look towards ${landmark}. We will take this one step at a time.`,
      source: 'deterministic_engine',
      personaUsed: persona,
      emotionalStateDetected: 'panicked',
      agentAction: 'calm_and_ground',
      suggestedActionLabel: 'Orient with Visual Anchor',
    };
  }

  if (params.isMissedStop || qLower.includes('missed') || qLower.includes('past')) {
    return {
      reply: `Do not worry at all. Missing a stop happens all the time. Stay right at this platform. Bus 65 connects directly to your destination with no backtracking needed.`,
      source: 'deterministic_engine',
      personaUsed: persona,
      emotionalStateDetected: 'disoriented',
      agentAction: 'reroute_active',
      suggestedActionLabel: 'Active Reroute: Bus 65',
    };
  }

  if (persona === 'lim' && (qLower.includes('lift') || qLower.includes('stair') || qLower.includes('step'))) {
    return {
      reply: `Take Lift B right beside the station concourse. It leads directly down to the platform without any stairs or steps.`,
      source: 'deterministic_engine',
      personaUsed: persona,
      emotionalStateDetected: 'calm',
      agentAction: 'locate_lift',
      suggestedActionLabel: 'Lift B Step-Free Route',
    };
  }

  if (persona === 'arjun' && (qLower.includes('rain') || qLower.includes('weather') || qLower.includes('cycle') || qLower.includes('bike'))) {
    return {
      reply: `The covered linkway protects you all the way to the bus interchange. Folded bicycles are allowed on this train car.`,
      source: 'deterministic_engine',
      personaUsed: persona,
      emotionalStateDetected: 'calm',
      agentAction: 'navigate',
    };
  }

  if (qLower.includes('late') || qLower.includes('eta') || qLower.includes('time') || persona === 'rachel') {
    return {
      reply: `You are in great shape. You have 12 minutes of buffer time before your scheduled arrival.`,
      source: 'deterministic_engine',
      personaUsed: persona,
      emotionalStateDetected: 'hurried',
      agentAction: 'reassure_ontime',
    };
  }

  if (qLower.includes('turn') || qLower.includes('corner')) {
    return {
      reply: `Keep walking straight for now. Your turn is coming up right after you pass ${landmark}.`,
      source: 'deterministic_engine',
      personaUsed: persona,
      emotionalStateDetected: 'calm',
      agentAction: 'navigate',
    };
  }

  return {
    reply: `You are heading the right way. Keep your eyes up and continue towards ${landmark}.`,
    source: 'deterministic_engine',
    personaUsed: persona,
    emotionalStateDetected: 'calm',
    agentAction: 'navigate',
  };
}

export interface NarrateStepParams {
  step: JourneyStep;
  familiarityMode?: FamiliarityLevel;
  persona?: 'rachel' | 'arjun' | 'lim' | 'default';
}

export interface NarrateStepResponse {
  text: string;
  source: 'gemini' | 'deterministic_engine';
}

/**
 * Rephrase the deterministic step guidance naturally and with variety each time,
 * without changing any of the underlying facts (landmark, direction, distance).
 * "Code computes transport truth; Gemini explains it" — same guardrail as the
 * chat companion, just applied to the guidance that's spoken automatically on
 * every step, which previously always recited the same fixed template string.
 */
export async function narrateStepGuidance(params: NarrateStepParams): Promise<NarrateStepResponse> {
  const fam = params.familiarityMode || 'full';
  const fallbackText = params.step.guidance[fam] || params.step.guidance.full;

  const ai = getGeminiClient();
  if (!ai) {
    return { text: fallbackText, source: 'deterministic_engine' };
  }

  const wordLimit = fam === 'light' ? 14 : fam === 'medium' ? 22 : 32;

  try {
    const targetModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Rephrase this Singapore transit navigation instruction naturally and warmly, in fresh wording of your own — do not reuse the exact sentence structure below. Do NOT change or invent any facts: keep the landmark name, direction, and distance exactly accurate. Under ${wordLimit} words. Reply with only the rephrased instruction, no preamble.

Landmark: "${params.step.landmark || 'the next waypoint'}" (${params.step.landmarkDetail || 'ahead'})
Original instruction: "${fallbackText}"`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.8,
        maxOutputTokens: 120,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text?.trim();
    if (text) {
      return { text, source: 'gemini' };
    }
  } catch (err) {
    console.warn('[Gemini] Step narration failed, using deterministic guidance:', err);
  }

  return { text: fallbackText, source: 'deterministic_engine' };
}
