/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Journey,
  JourneyStep,
  FamiliarityLevel,
  CompanionMessage,
  DisruptionAlert,
  MissedStopState,
  SharedETAState,
  UserLocation,
  GPSPermissionState,
  LatLng,
} from './types';
import {
  DEFAULT_JOURNEY,
  MISSED_STOP_RECOVERY_STEPS,
  DISRUPTION_ALTERNATIVE_STEPS,
  PRESET_JOURNEYS,
} from './data/singaporeRoutes';
import { speechService } from './services/speechService';
import { geolocationService } from './services/geolocationService';
import { journeyMonitor } from './services/journeyMonitor';
import { JourneyHeader } from './components/JourneyHeader';
import { CompanionVoiceOrb } from './components/CompanionVoiceOrb';
import { ActiveStepCard } from './components/ActiveStepCard';
import { SimplifiedJourneyMap } from './components/SimplifiedJourneyMap';
import { FamiliaritySelector } from './components/FamiliaritySelector';
import { DisruptionBanner } from './components/DisruptionBanner';
import { MissedStopBanner } from './components/MissedStopBanner';
import { SimulationBar } from './components/SimulationBar';
import { AccessibleSideTrigger } from './components/AccessibleSideTrigger';
import { VoiceChatDrawer } from './components/VoiceChatDrawer';
import { ETAShareModal } from './components/ETAShareModal';
import { JourneyPlannerModal } from './components/JourneyPlannerModal';
import { PowerSaverOverlay } from './components/PowerSaverOverlay';
import { OpenStreetMapViewer } from './components/OpenStreetMapViewer';
import { HomeJourneyPlannerView } from './components/HomeJourneyPlannerView';
import { VoiceCompanionView } from './components/VoiceCompanionView';
import { ETAShareView } from './components/ETAShareView';
import { SettingsScreen } from './components/SettingsScreen';
import { ArrivalScreen } from './components/ArrivalScreen';
import { DiagnosticConsole } from './components/DiagnosticConsole';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { MessageSquare, Sparkles, CheckCircle2, Navigation } from 'lucide-react';

// A short, URL-safe id for a real shareable ETA link (persisted in localStorage
// per session so refreshing doesn't invalidate a link already sent to a friend).
function generateShareId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export default function App() {
  // Navigation tab state matching architecture diagram Section 4.
  // Starts on the planner, not Travel — Travel shows `journey` state, which is
  // seeded with a placeholder until a real journey is planned, so opening there
  // first would present that placeholder as if a trip were already active.
  const [activeTab, setActiveTab] = useState<NavTab>('plan');
  const [isArrivalComplete, setIsArrivalComplete] = useState<boolean>(false);

  // Current active journey
  const [journey, setJourney] = useState<Journey>(DEFAULT_JOURNEY);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Route Familiarity mode
  const [familiarity, setFamiliarity] = useState<FamiliarityLevel>('full');
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Voice & Audio states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Power saver mode (OLED true black)
  const [isPowerSaving, setIsPowerSaving] = useState<boolean>(false);

  // Active commuter persona (Rachel / Arjun / Mdm Lim / Default)
  const [persona, setPersona] = useState<'rachel' | 'arjun' | 'lim' | 'default'>('default');

  // Real Geolocation & Off-Route states
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [gpsState, setGpsState] = useState<GPSPermissionState>('UNKNOWN');
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);

  // Modals & drawers
  const [isVoiceDrawerOpen, setIsVoiceDrawerOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  // Missed stop state
  const [missedStopState, setMissedStopState] = useState<MissedStopState>({
    isMissed: false,
    missedStopName: 'Middle Road / Bugis Junction (Stop 01112)',
    nextStopName: 'North Bridge Road (Stop 01059)',
    recoveryBus: '65',
    originalETA: '6:10 PM',
    newETA: '6:17 PM',
    recoverySteps: MISSED_STOP_RECOVERY_STEPS,
    aiExplanation:
      "You've gone one stop past where we planned to get off. That's okay — I've adjusted the journey. Stay at this stop and take Bus 65. Your new ETA is 6:17 PM.",
  });

  // Disruption state
  const [disruption, setDisruption] = useState<DisruptionAlert>({
    id: 'dtl-delay-1',
    active: false,
    title: 'Downtown Line Signal Delay near Bugis',
    affectedLine: 'Downtown Line',
    description: 'Track fault near Bugis station causing 18-minute transit bottleneck.',
    currentRouteETA: '9:07 AM',
    alternativeRouteETA: '8:49 AM',
    alternativeLine: 'North East Line (NEL)',
    alternativeSteps: DISRUPTION_ALTERNATIVE_STEPS,
  });

  // ETA sharing state
  const [sharedState, setSharedState] = useState<SharedETAState>(() => ({
    shareId: generateShareId(),
    recipientName: 'Mom',
    destination: DEFAULT_JOURNEY.destination,
    currentETA: DEFAULT_JOURNEY.calculatedETA,
    progressPercentage: 0,
    statusText: 'On schedule',
    lastUpdated: 'Just now',
    isArrived: false,
  }));

  // Conversational history
  const [messages, setMessages] = useState<CompanionMessage[]>([
    {
      id: 'init-1',
      sender: 'companion',
      text: "Hello! I'm Eyes Up, your Singapore commute companion. Put your phone away and look up — I'll guide you using tangible landmarks. Tap the mic or squeeze the side control whenever you need reassurance.",
      timestamp: 'Now',
      source: 'system',
    },
  ]);

  const activeStep = journey.steps[currentStepIndex] || journey.steps[0];
  const recognitionRef = useRef<any>(null);

  // Keep shared state synchronized with journey changes
  useEffect(() => {
    const total = journey.steps.length;
    const pct = total > 1 ? Math.min(100, Math.round((currentStepIndex / (total - 1)) * 100)) : 0;
    const isArrived = currentStepIndex >= total - 1;

    let statusText: SharedETAState['statusText'] = 'On schedule';
    let currentETA = journey.calculatedETA;

    if (isArrived) {
      statusText = 'Arrived safely';
    } else if (missedStopState.isMissed) {
      statusText = 'Slight delay (+7 min)';
      currentETA = missedStopState.newETA;
    } else if (disruption.active) {
      statusText = 'Alternative route taken';
      currentETA = disruption.alternativeRouteETA;
    }

    setSharedState((prev) => ({
      ...prev,
      destination: journey.destination,
      currentETA,
      progressPercentage: pct,
      statusText,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isArrived,
    }));

    // Refine the generic "On schedule" into a genuine comparison against the
    // commuter's actual desired arrival time, once it's not already a more
    // specific state (arrived / missed stop / disruption reroute).
    if (!isArrived && !missedStopState.isMissed && !disruption.active && journey.desiredArrivalTime) {
      const params = new URLSearchParams({
        desiredArrivalTime: journey.desiredArrivalTime,
        calculatedETA: currentETA,
      });
      fetch(`/api/journey/arrival-status?${params}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.statusText) {
            setSharedState((prev) => ({ ...prev, statusText: data.statusText }));
          }
        })
        .catch(() => {});
    }
  }, [currentStepIndex, journey, missedStopState.isMissed, disruption.active]);

  // Restore saved session on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('eyesup_session_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.journey) setJourney(parsed.journey);
        if (typeof parsed.currentStepIndex === 'number') setCurrentStepIndex(parsed.currentStepIndex);
        if (parsed.familiarity) setFamiliarity(parsed.familiarity);
        if (parsed.persona) setPersona(parsed.persona);
        if (typeof parsed.isPowerSaving === 'boolean') setIsPowerSaving(parsed.isPowerSaving);
        if (typeof parsed.shareId === 'string') {
          setSharedState((prev) => ({ ...prev, shareId: parsed.shareId }));
        }
      }
    } catch (e) {
      console.warn('Could not restore local session:', e);
    }
  }, []);

  // Persist session changes
  useEffect(() => {
    try {
      localStorage.setItem(
        'eyesup_session_state',
        JSON.stringify({
          journey,
          currentStepIndex,
          familiarity,
          persona,
          isPowerSaving,
          shareId: sharedState.shareId,
        })
      );
    } catch (e) {
      // Storage quota or private browsing
    }
  }, [journey, currentStepIndex, familiarity, persona, isPowerSaving, sharedState.shareId]);

  // Push the sender's live progress to the server so anyone with the share
  // link (no login) can poll for real, current status — not just a preview
  // rendered locally in the sender's own tab.
  useEffect(() => {
    fetch('/api/share/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId: sharedState.shareId,
        recipientName: sharedState.recipientName,
        destination: sharedState.destination,
        currentETA: sharedState.currentETA,
        progressPercentage: sharedState.progressPercentage,
        statusText: sharedState.statusText,
        isArrived: sharedState.isArrived,
      }),
    }).catch(() => {
      // Best-effort — the sender's own view still works from local state either way.
    });
  }, [
    sharedState.shareId,
    sharedState.recipientName,
    sharedState.destination,
    sharedState.currentETA,
    sharedState.progressPercentage,
    sharedState.statusText,
    sharedState.isArrived,
  ]);

  // Geolocation tracking & state management
  useEffect(() => {
    geolocationService.startTracking();
    const unsubLoc = geolocationService.onLocationChange((loc) => {
      setUserLocation(loc);
    });
    const unsubState = geolocationService.onStateChange((state) => {
      setGpsState(state);
    });

    return () => {
      unsubLoc();
      unsubState();
      geolocationService.stopTracking();
    };
  }, []);

  // Proactive Agentic Monitoring Loop
  useEffect(() => {
    if (activeTab === 'travel' && !isArrivalComplete) {
      journeyMonitor.start({
        journey,
        currentStepIndex,
        getCurrentLocation: () => userLocation,
        familiarityMode: familiarity,
        userPersona: persona,
        isPowerSaving,
        onProactiveGuidance: (speechText) => {
          speakText(speechText);
          const alertMsg: CompanionMessage = {
            id: `proactive-${Date.now()}`,
            sender: 'companion',
            text: speechText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'system',
          };
          setMessages((prev) => [...prev, alertMsg]);
        },
        onImpactDetected: (assessment) => {
          if (assessment.recommendedAction === 'REROUTE') {
            setDisruption((prev) => ({
              ...prev,
              active: true,
              description: assessment.reason,
            }));
          }
        },
        onOffRouteDetected: () => {
          setIsOffRoute(true);
          handleRecalculateOffRoute();
        },
      });
    } else {
      journeyMonitor.stop();
    }

    return () => {
      journeyMonitor.stop();
    };
  }, [journey, currentStepIndex, activeTab, isArrivalComplete, familiarity, persona, isPowerSaving, userLocation]);

  // Handle Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        const reco = new SpeechRecognitionClass();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = 'en-SG';

        reco.onstart = () => {
          setIsListening(true);
        };

        reco.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            handleSendMessage(transcript);
          }
          setIsListening(false);
        };

        reco.onerror = (e: any) => {
          console.warn('Speech recognition event:', e?.error);
          setIsListening(false);
        };

        reco.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = reco;
      }
    }
  }, [journey, currentStepIndex, familiarity, missedStopState.isMissed, disruption.active]);

  const toggleListen = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (recognitionRef.current) {
      try {
        speechService.stop();
        setIsSpeaking(false);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start error, opening drawer fallback:', err);
        setIsVoiceDrawerOpen(true);
      }
    } else {
      // Fallback: Open voice chat drawer for quick tap questions
      setIsVoiceDrawerOpen(true);
    }
  };

  const speakText = (text: string) => {
    speechService.playSubtleChime();
    speechService.speak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Ask Gemini to rephrase the deterministic step guidance naturally each time,
  // instead of always reciting the same fixed template string. Same facts
  // (landmark, direction, distance), varied wording. Falls back to the raw
  // template instantly if Gemini is slow or unreachable.
  const fetchNarratedGuidance = async (step: JourneyStep, fam: FamiliarityLevel): Promise<string> => {
    const fallback = step.guidance[fam] || step.guidance.full;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/companion/narrate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, familiarityMode: fam, persona }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.text) return data.text;
      }
    } catch (e) {
      // Network error or timeout — use the deterministic fallback below.
    }
    return fallback;
  };

  // Speak active step guidance
  const speakCurrentStep = async () => {
    const text = await fetchNarratedGuidance(activeStep, familiarity);
    speakText(text);
  };

  // Process a message to the AI Companion (server Gemini + fallback)
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: CompanionMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          persona, // Persona parameter: 'rachel' | 'arjun' | 'lim' | 'default'
          currentStep: activeStep,
          familiarityMode: familiarity,
          isMissedStop: missedStopState.isMissed,
          isDisrupted: disruption.active,
          journeyState: {
            origin: journey.origin,
            destination: journey.destination,
            stepIndex: currentStepIndex,
            totalSteps: journey.steps.length,
          },
          // Recent turns so Gemini knows what it already said and doesn't
          // repeat the same opener/phrasing across a real conversation.
          conversationHistory: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
          // Real GPS location, so a voice request like "I need to go to Pasir Ris"
          // plans from where the commuter actually is instead of a guessed origin.
          currentLocation: userLocation,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "You're right on track. Keep following the sheltered linkway.";

      const compMsg: CompanionMessage = {
        id: `comp-${Date.now()}`,
        sender: 'companion',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
      };

      setMessages((prev) => [...prev, compMsg]);
      speakText(reply);
    } catch (err) {
      console.warn('Chat request failed, using local rule fallback:', err);
      const fallbackReply = `You're heading the right way. ${activeStep.landmark} is your current anchor.`;
      const compMsg: CompanionMessage = {
        id: `comp-${Date.now()}`,
        sender: 'companion',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
      };
      setMessages((prev) => [...prev, compMsg]);
      speakText(fallbackReply);
    } finally {
      setIsThinking(false);
    }
  };

  // Step navigation
  const handleNextStep = async () => {
    if (currentStepIndex < journey.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      speechService.playSubtleChime();
      const nextStep = journey.steps[nextIdx];
      const text = await fetchNarratedGuidance(nextStep, familiarity);
      speakText(text);
    } else {
      // Arrived (Screen 7 in architecture diagram)
      setIsArrivalComplete(true);
      const arriveText = `Congratulations! You have arrived safely at ${journey.destination}.`;
      speakText(arriveText);
    }
  };

  const handleSelectPersona = (p: 'rachel' | 'arjun' | 'lim' | 'default') => {
    setPersona(p);
    if (p === 'rachel') {
      const match = PRESET_JOURNEYS.find((j) => j.id === 'rachel-tampines-raffles');
      if (match) {
        setJourney(match);
        setCurrentStepIndex(0);
        setFamiliarity('light');
        setHistoryCount(match.travelHistoryCount);
      }
      speakText("Switched to Rachel mode. Direct, 1-line guidance with on-time buffer tracking.");
    } else if (p === 'arjun') {
      const match = PRESET_JOURNEYS.find((j) => j.id === 'arjun-punggol-onenorth');
      if (match) {
        setJourney(match);
        setCurrentStepIndex(0);
        setFamiliarity('medium');
        setHistoryCount(match.travelHistoryCount);
      }
      speakText("Switched to Arjun mode. Multi-modal cycling and sheltered path alerts active.");
    } else if (p === 'lim') {
      const match = PRESET_JOURNEYS.find((j) => j.id === 'lim-bedok-sgh');
      if (match) {
        setJourney(match);
        setCurrentStepIndex(0);
        setFamiliarity('full');
        setHistoryCount(match.travelHistoryCount);
      }
      speakText("Switched to Mdm Lim mode. Step-free routes and live lift monitoring enabled.");
    } else {
      speakText("Switched to Standard commuter mode.");
    }
  };

  const handleStartPlannedJourney = async (
    routeKey: string,
    origin: string,
    destination: string,
    arrivalTime: string
  ) => {
    // Only use a curated preset (persona demo scenarios) when the caller explicitly
    // selected one by id AND hasn't edited its origin/destination away from the
    // canonical values — otherwise every journey, including the default plan form,
    // must go through live OneMap routing rather than fixed local data.
    const match = routeKey
      ? PRESET_JOURNEYS.find((r) => r.id === routeKey && r.origin === origin && r.destination === destination)
      : null;

    if (match) {
      setJourney(match);
      setHistoryCount(match.travelHistoryCount);
      if (match.travelHistoryCount === 0) setFamiliarity('full');
      else if (match.travelHistoryCount < 8) setFamiliarity('medium');
      else setFamiliarity('light');
    } else {
      // Dynamic Singapore Route Planning
      try {
        const res = await fetch('/api/journey/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Never guess a specific place when it's blank — prefer real GPS
            // (sent below) and otherwise let the server fall through to its
            // own neutral central-Singapore default rather than a fake origin.
            origin: origin || '',
            destination: destination || '',
            desiredArrivalTime: arrivalTime || '9:30 AM',
            currentLocation: userLocation,
          }),
        });

        if (res.ok) {
          const dynamicJourney: Journey = await res.json();
          setJourney(dynamicJourney);
          setFamiliarity('full');
        } else {
          throw new Error('Dynamic routing failed');
        }
      } catch (err) {
        console.warn('Fallback to standard journey:', err);
        setJourney({
          ...DEFAULT_JOURNEY,
          id: `custom-${Date.now()}`,
          title: `${origin} to ${destination}`,
          origin,
          destination,
          desiredArrivalTime: arrivalTime || '9:30 AM',
        });
        setFamiliarity('full');
      }
    }

    // Automatically align persona with chosen scenario
    if (routeKey.includes('rachel') || destination.toLowerCase().includes('raffles') || destination.toLowerCase().includes('republic')) {
      setPersona('rachel');
    } else if (routeKey.includes('arjun') || destination.toLowerCase().includes('one-north') || destination.toLowerCase().includes('oasis')) {
      setPersona('arjun');
    } else if (routeKey.includes('lim') || destination.toLowerCase().includes('sgh') || destination.toLowerCase().includes('hospital')) {
      setPersona('lim');
    }

    setCurrentStepIndex(0);
    setIsArrivalComplete(false);
    setIsOffRoute(false);
    setActiveTab('travel');
    speakText(`Journey planned to ${destination}. Look up — I'm traveling alongside you.`);
  };

  // Recalculate route upon genuine divergence
  const handleRecalculateOffRoute = async (divergentCoords?: LatLng) => {
    const loc =
      divergentCoords ||
      (userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: 1.309, lng: 103.835 });

    try {
      const res = await fetch('/api/journey/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLocation: loc,
          destination: journey.destination,
        }),
      });

      if (res.ok) {
        const recalculated: Journey = await res.json();
        setJourney(recalculated);
        setCurrentStepIndex(0);
        setIsOffRoute(true);
        speakText(
          `I noticed you're taking an alternative route. Don't worry at all—I've recalculated your quickest connection to ${journey.destination}.`
        );
      }
    } catch (e) {
      console.warn('Off-route recalculation error:', e);
    }
  };

  // Simulate off-route divergence for judges
  const handleTriggerOffRoute = () => {
    const baseLat = activeStep?.geometry?.[0]?.[0] || journey.originCoords?.lat || 1.304;
    const baseLng = activeStep?.geometry?.[0]?.[1] || journey.originCoords?.lng || 103.8318;
    const simCoords = { lat: baseLat + 0.0028, lng: baseLng + 0.0028 };

    geolocationService.setSimulatedLocation(simCoords);
    setUserLocation({
      lat: simCoords.lat,
      lng: simCoords.lng,
      accuracy: 10,
      timestamp: Date.now(),
      isSimulated: true,
    });
    handleRecalculateOffRoute(simCoords);
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Route Familiarity change
  const handleFamiliarityChange = (level: FamiliarityLevel) => {
    setFamiliarity(level);
    const feedbackMap = {
      full: "Switched to Full Guidance. I'll provide detailed reassurance and landmark checks along the way.",
      medium: "Switched to Medium Guidance. I'll offer key visual cues and let you navigate smoothly.",
      light: "Switched to Light Guidance. You're in charge! Put your phone away and I'll stay quietly on standby.",
    };
    speakText(feedbackMap[level]);
  };

  // Simulate Missed Bus Stop
  const handleTriggerMissedStop = () => {
    setMissedStopState((prev) => ({ ...prev, isMissed: true }));

    // Inject the recovery steps into journey
    setJourney((prev) => ({
      ...prev,
      calculatedETA: '6:17 PM',
      steps: MISSED_STOP_RECOVERY_STEPS,
    }));
    setCurrentStepIndex(0);

    const explanation =
      "You've gone one stop past where we planned to get off. That's okay — I've adjusted the journey. Stay at this stop and take Bus 65. Your new ETA is 6:17 PM.";

    const alertMsg: CompanionMessage = {
      id: `missed-${Date.now()}`,
      sender: 'companion',
      text: explanation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'system',
    };
    setMessages((prev) => [...prev, alertMsg]);
    speakText(explanation);
  };

  // Reset Missed Stop / Normal Journey
  const handleResetScenarios = () => {
    setMissedStopState((prev) => ({ ...prev, isMissed: false }));
    setDisruption((prev) => ({ ...prev, active: false }));
    setIsOffRoute(false);
    geolocationService.setSimulatedLocation(null);
    setJourney(DEFAULT_JOURNEY);
    setCurrentStepIndex(0);
    speakText("Journey reset to standard route from Toa Payoh to Bugis Junction.");
  };

  // Trigger Transport Disruption
  const handleTriggerDisruption = () => {
    setDisruption((prev) => ({ ...prev, active: true }));
    const speechPrompt =
      "There's a disruption ahead on the Downtown Line near Bugis. Your current route would arrive at 9:07 AM. I found another route via North East Line that should arrive at 8:49 AM. Would you like to switch?";

    const alertMsg: CompanionMessage = {
      id: `disrupt-${Date.now()}`,
      sender: 'companion',
      text: speechPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'system',
    };
    setMessages((prev) => [...prev, alertMsg]);
    speakText(speechPrompt);
  };

  // Accept alternative route from disruption
  const handleAcceptDisruptionRoute = () => {
    setDisruption((prev) => ({ ...prev, active: false }));
    setJourney((prev) => ({
      ...prev,
      title: 'Toa Payoh to Bugis (Bypass via NEL)',
      calculatedETA: disruption.alternativeRouteETA,
      steps: disruption.alternativeSteps,
    }));
    setCurrentStepIndex(0);

    const confirmSpeech =
      "Switched to North East Line via Dhoby Ghaut. Your new ETA is 8:49 AM, saving you 18 minutes.";
    speakText(confirmSpeech);
  };

  const handleDeclineDisruptionRoute = () => {
    setDisruption((prev) => ({ ...prev, active: false }));
    speakText("Continuing on your current route as planned. I'll monitor for any further delays.");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col items-center select-none ${
        isPowerSaving ? 'bg-black text-white' : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
      }`}
      id="eyes-up-app-root"
    >
      {/* Mobile-first viewport frame */}
      <div className="w-full max-w-md min-h-screen flex flex-col relative pb-20 shadow-2xl bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800/80">
        {/* Main Header */}
        <JourneyHeader
          appName="Eyes Up"
          familiarity={familiarity}
          isPowerSaving={isPowerSaving}
          onTogglePowerSave={() => setIsPowerSaving(!isPowerSaving)}
          isAudioMuted={isAudioMuted}
          onToggleAudioMute={() => {
            const newMuted = !isAudioMuted;
            setIsAudioMuted(newMuted);
            speechService.setMuted(newMuted);
          }}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenPlanModal={() => setIsPlanModalOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          origin={journey.origin}
          destination={journey.destination}
          persona={persona}
          onSelectPersona={handleSelectPersona}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 space-y-4 overflow-y-auto" id="eyes-up-main-content">
          {/* TAB 1: PLANNER (Screen 1 in architecture diagram) */}
          {activeTab === 'plan' && (
            <HomeJourneyPlannerView
              onStartJourney={handleStartPlannedJourney}
              currentRouteId={journey.id}
            />
          )}

          {/* TAB 2: ACTIVE TRAVEL & GIS MAP (Screen 2, 4, 5, 7) */}
          {activeTab === 'travel' && (
            <>
              {isArrivalComplete ? (
                /* Screen 7: Arrival Celebration */
                <ArrivalScreen
                  destination={journey.destination}
                  durationMins={journey.totalDurationMins}
                  onDone={() => {
                    setIsArrivalComplete(false);
                    setActiveTab('plan');
                  }}
                  onPlanNew={() => {
                    setIsArrivalComplete(false);
                    setActiveTab('plan');
                  }}
                />
              ) : (
                <>
                  {/* AI Companion Voice Orb: The conversational centerpiece */}
                  <CompanionVoiceOrb
                    isListening={isListening}
                    isSpeaking={isSpeaking}
                    isThinking={isThinking}
                    onToggleListen={toggleListen}
                    onOpenVoiceDrawer={() => setIsVoiceDrawerOpen(true)}
                    isPowerSaving={isPowerSaving}
                    activeStatusText={
                      isSpeaking
                        ? 'Speaking landmark instructions...'
                        : isListening
                        ? 'Listening to your voice...'
                        : '“Am I going the right way?” • “Do I turn here?”'
                    }
                  />

                  {/* Screen 4: Transport Disruption Alert Banner */}
                  <DisruptionBanner
                    disruption={disruption}
                    onAcceptAlternative={handleAcceptDisruptionRoute}
                    onDeclineAlternative={handleDeclineDisruptionRoute}
                    onSpeakExplanation={() => {
                      const speechPrompt = `There’s a disruption ahead. Your current route would arrive at ${disruption.currentRouteETA}. I found another route that arrives at ${disruption.alternativeRouteETA}. Would you like to switch?`;
                      speakText(speechPrompt);
                    }}
                    isSpeaking={isSpeaking}
                  />

                  {/* Screen 5: Missed Stop Recovery Banner */}
                  <MissedStopBanner
                    missedState={missedStopState}
                    onSpeakExplanation={() => speakText(missedStopState.aiExplanation)}
                    onResetRoute={handleResetScenarios}
                    isSpeaking={isSpeaking}
                  />

                  {/* Screen 2: Active Guidance Card (Prioritises landmark cues) */}
                  <ActiveStepCard
                    step={activeStep}
                    stepIndex={currentStepIndex}
                    totalSteps={journey.steps.length}
                    familiarity={familiarity}
                    eta={journey.calculatedETA}
                    desiredTime={journey.desiredArrivalTime}
                    isPowerSaving={isPowerSaving}
                    persona={persona}
                    onNextStep={handleNextStep}
                    onPrevStep={handlePrevStep}
                    onSpeakInstruction={speakCurrentStep}
                    isSpeaking={isSpeaking}
                  />

                  {/* Section 2.3 & 3.2.2: OpenStreetMap GIS Base with Singapore Station Footprints */}
                  <OpenStreetMapViewer
                    steps={journey.steps}
                    currentStepIndex={currentStepIndex}
                    routeGeometry={journey.geometry}
                    userLocation={userLocation}
                    originCoords={journey.originCoords}
                    destinationCoords={journey.destinationCoords}
                    originName={journey.origin}
                    destinationName={journey.destination}
                    isDisrupted={disruption.active}
                    alternativeRouteActive={journey.title.includes('Bypass')}
                  />

                  {/* Simplified / Gamified Schematic Journey Map */}
                  <SimplifiedJourneyMap
                    steps={journey.steps}
                    currentStepIndex={currentStepIndex}
                    onSelectStep={(idx) => setCurrentStepIndex(idx)}
                    isPowerSaving={isPowerSaving}
                  />

                  {/* Route Familiarity & Learning Philosophy Selector */}
                  <FamiliaritySelector
                    currentFamiliarity={familiarity}
                    onSelectFamiliarity={handleFamiliarityChange}
                    travelHistoryCount={historyCount}
                    onSimulateHistoryChange={(count) => setHistoryCount(count)}
                    isPowerSaving={isPowerSaving}
                  />

                  {/* Interactive Simulation Controls for Missed Stop, Disruption & Off-Route */}
                  <SimulationBar
                    onTriggerMissedStop={handleTriggerMissedStop}
                    onTriggerDisruption={handleTriggerDisruption}
                    onTriggerOffRoute={handleTriggerOffRoute}
                    onResetScenarios={handleResetScenarios}
                    isMissedStopActive={missedStopState.isMissed}
                    isDisruptionActive={disruption.active}
                    isOffRouteActive={isOffRoute}
                    isPowerSaving={isPowerSaving}
                    activePersona={persona}
                    onSelectPersona={handleSelectPersona}
                  />
                </>
              )}
            </>
          )}

          {/* TAB 3: VOICE COMPANION (Screen 3 in architecture diagram) */}
          {activeTab === 'voice' && (
            <VoiceCompanionView
              isListening={isListening}
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              onToggleListen={toggleListen}
              messages={messages}
              onSendMessage={handleSendMessage}
              onReplayAudio={(text) => speakText(text)}
              currentStep={activeStep}
              familiarity={familiarity}
              isPowerSaving={isPowerSaving}
              persona={persona}
              onSelectPersona={handleSelectPersona}
            />
          )}

          {/* TAB 4: ETA SHARING (Screen 6 in architecture diagram) */}
          {activeTab === 'share' && (
            <ETAShareView
              sharedState={sharedState}
              onUpdateRecipientName={(name) =>
                setSharedState((prev) => ({ ...prev, recipientName: name }))
              }
            />
          )}

          {/* TAB 5: SETTINGS (Screen 8 in architecture diagram) */}
          {activeTab === 'settings' && (
            <SettingsScreen
              familiarity={familiarity}
              onChangeFamiliarity={handleFamiliarityChange}
              isVoiceMuted={isAudioMuted}
              onToggleVoiceMuted={() => {
                const newMuted = !isAudioMuted;
                setIsAudioMuted(newMuted);
                speechService.setMuted(newMuted);
              }}
              isPowerSaving={isPowerSaving}
              onTogglePowerSaving={() => setIsPowerSaving(!isPowerSaving)}
              onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            />
          )}
        </main>

        {/* Convenient Accessible Side Control Thumb Trigger */}
        <AccessibleSideTrigger
          onTap={toggleListen}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isPowerSaving={isPowerSaving}
        />

        {/* Bottom Navigation Bar */}
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isPowerSaving={isPowerSaving}
        />

        {/* Modals & Overlays */}
        <DiagnosticConsole
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
          routeSource={journey.routeSource}
          gpsPermissionState={gpsState}
          isOffRoute={isOffRoute}
          activeJourneyId={journey.id}
        />

        <VoiceChatDrawer
          isOpen={isVoiceDrawerOpen}
          onClose={() => setIsVoiceDrawerOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          isListening={isListening}
          onToggleListen={toggleListen}
          isSpeaking={isSpeaking}
          onReplayAudio={(text) => speakText(text)}
          currentStep={activeStep}
          familiarity={familiarity}
          persona={persona}
          onSelectPersona={handleSelectPersona}
        />

        <ETAShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          sharedState={sharedState}
          onUpdateRecipientName={(name) => setSharedState((prev) => ({ ...prev, recipientName: name }))}
        />

        <JourneyPlannerModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          onSelectJourney={(newJourney) => {
            setJourney(newJourney);
            setCurrentStepIndex(0);
            setHistoryCount(newJourney.travelHistoryCount);
            if (newJourney.travelHistoryCount === 0) setFamiliarity('full');
            else if (newJourney.travelHistoryCount < 8) setFamiliarity('medium');
            else setFamiliarity('light');
            speakText(`Route loaded: ${newJourney.title}. Ready when you are.`);
          }}
          activeJourneyId={journey.id}
        />

        <PowerSaverOverlay
          isPowerSaving={isPowerSaving}
          onTogglePowerSave={() => setIsPowerSaving(false)}
          nextStepTitle={activeStep.title}
          landmark={activeStep.landmark}
          eta={journey.calculatedETA}
          onTapVoice={toggleListen}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      </div>
    </div>
  );
}
