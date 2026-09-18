/**
 * Gemini Companion Service with Function Calling & Intent Interpretation
 * "Code computes transport truth; Gemini understands intent and explains."
 */

import { GoogleGenAI } from '@google/genai';
import { fetchTrainServiceAlerts, fetchFacilitiesMaintenance, getStationCrowding } from './ltaService';
import { fetchSingaporeWeather } from './weatherService';

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
  currentStep?: {
    title: string;
    landmark: string;
    landmarkDetail?: string;
    mode?: string;
  };
  familiarityMode?: string;
  isMissedStop?: boolean;
  isDisrupted?: boolean;
  journeyState?: {
    origin: string;
    destination: string;
    stepIndex: number;
    totalSteps: number;
    eta?: string;
  };
}

export interface CompanionAgentResponse {
  reply: string;
  source: 'gemini' | 'deterministic_engine';
  personaUsed: string;
  emotionalStateDetected?: 'panicked' | 'disoriented' | 'hurried' | 'calm';
  agentAction?: 'calm_and_ground' | 'reroute_active' | 'locate_lift' | 'reassure_ontime' | 'navigate';
  suggestedActionLabel?: string;
}

export async function askEyesUpCompanion(
  params: AskCompanionParams
): Promise<CompanionAgentResponse> {
  const ai = getGeminiClient();
  const persona = params.persona || 'default';
  const qLower = params.question.toLowerCase();

  // Detect panic / distress signals
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

  // Gather live context from official feeds
  let liveAlertContext = 'Normal MRT train services on all lines.';
  let liveLiftContext = 'All key MRT lifts operating normally.';
  let liveWeatherContext = 'Weather: Fair / partly cloudy (sheltered walkways optional).';

  try {
    const [trainAlerts, facilities, weather] = await Promise.allSettled([
      fetchTrainServiceAlerts(),
      fetchFacilitiesMaintenance(),
      fetchSingaporeWeather('Central'),
    ]);

    if (trainAlerts.status === 'fulfilled') {
      const msgs = trainAlerts.value.messages.map((m) => m.content).join('; ');
      if (msgs) liveAlertContext = msgs;
    }

    if (facilities.status === 'fulfilled' && facilities.value.length > 0) {
      liveLiftContext = facilities.value
        .slice(0, 3)
        .map((f) => `${f.stationName} (${f.stationCode}) ${f.liftDesc} is undergoing maintenance`)
        .join('; ');
    }

    if (weather.status === 'fulfilled') {
      liveWeatherContext = `Current weather in ${weather.value.area}: ${weather.value.forecast}. Rain status: ${weather.value.isRaining ? 'RAINING' : 'CLEAR'}. Sheltered linkway advised: ${weather.value.shelterRecommended ? 'YES' : 'NO'}.`;
    }
  } catch (err) {
    console.warn('Context gathering for companion encountered error:', err);
  }

  // Persona directives
  let personaDirective = '';
  if (persona === 'rachel') {
    personaDirective = `Persona: Rachel (High-stakes executive commuter). She cares deeply about punctuality. If she panics about being late or missing a connection, immediately provide emotional grounding, state the exact buffer minutes, and give her an instant alternative bypass route without sugarcoating.`;
  } else if (persona === 'arjun') {
    personaDirective = `Persona: Arjun (Multi-modal commuter with folding bike). Values calm, smooth transit. If he is lost or panicking about rain or train restrictions, reassure him, point him towards the nearest sheltered linkway or bike-friendly concourse, and confirm rules.`;
  } else if (persona === 'lim') {
    personaDirective = `Persona: Mdm Lim (Senior accessibility commuter heading to Singapore General Hospital). Very sensitive to disorientation and stair fatigue. If she is scared, lost, or panicking, respond with utmost gentleness and maternal warmth. Tell her to pause, reassure her that help and lifts are right nearby, and guide her step-free.`;
  } else {
    personaDirective = `Persona: Empathetic Singapore Transit Companion. Your primary duty is commuter psychological safety: de-escalate anxiety, guide them using clear physical landmarks, and reassure them that route deviations are easily resolved.`;
  }

  if (ai) {
    try {
      const systemInstruction = `You are "Eyes Up", an empathetic, intelligent, and generative Singapore transit companion agent.
You act as a calm, trusted travel partner walking alongside the commuter.

Core Agent Philosophy:
1. EMPATHY & DE-ESCALATION FIRST: If the commuter expresses panic, fear, missed stops, or feeling lost, your FIRST words must calm their nervous system (e.g. "Take a slow breath, I'm right here with you. You are safe.").
2. NO SCOLDING OR SHAMING: Never tell them they made a mistake. Reframe unexpected stops as quick reroutes.
3. PHYSICAL VISUAL ANCHORS: Anchor all directions to tangible Singapore landmarks (FairPrice, Kopitiam, MRT Passenger Service Gantries, Exit Signs, Lift B, covered linkways). Never quote raw GPS meters alone.
4. EYES-UP CONCISENESS: Keep responses between 18 to 35 words. Commuters are walking and listening through earpieces.

${personaDirective}

Live Singapore Telemetry:
- LTA Train Alerts: ${liveAlertContext}
- LTA Lift Maintenance: ${liveLiftContext}
- NEA Weather: ${liveWeatherContext}

Active Commuter State:
- Active Landmark: ${params.currentStep?.landmark || 'Covered Linkway'} (${params.currentStep?.landmarkDetail || 'well-lit path'})
- Current Step: ${params.currentStep?.title || 'Walking towards transit connection'}
- Journey: ${params.journeyState?.origin || 'Origin'} to ${params.journeyState?.destination || 'Destination'}
- Missed Stop Detected: ${params.isMissedStop ? 'YES (Bypass active: stay at current stop for Bus 65, new ETA 6:17 PM)' : 'NO'}
- Disruption Detected: ${params.isDisrupted ? 'YES (Downtown Line delayed, NEL / free bus shuttle running)' : 'NO'}
- Panic / Distress Detected: ${isPanicked ? 'YES - DE-ESCALATE IMMEDIATELY' : 'NO'}

Respond with genuine compassion, clarity, and authoritative transit reassurance.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\nCommuter Voice Query: "${params.question}"`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.35,
          maxOutputTokens: 120,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return {
          reply: text,
          source: 'gemini',
          personaUsed: persona,
          emotionalStateDetected: isPanicked ? 'panicked' : 'calm',
          agentAction: isPanicked ? 'calm_and_ground' : 'navigate',
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to empathetic deterministic response:', err);
    }
  }

  // Empathetic, psychologically reassuring Singapore transit fallback engine
  const landmark = params.currentStep?.landmark || 'the covered linkway';

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
      reply: `Do not worry at all. Missing a stop happens all the time. Stay right at this platform or bus stop. Bus 65 connects directly to your destination with no backtracking needed.`,
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
