export type FamiliarityLevel = 'full' | 'medium' | 'light';

export interface LatLng {
  lat: number;
  lng: number;
}

export type TransportType = 'walk' | 'bus' | 'mrt' | 'transfer' | 'cycle';

export type RouteSource = 'LIVE_ONEMAP' | 'FALLBACK_PRESET';

export interface JourneyStep {
  id: string;
  type: TransportType;
  title: string;
  lineName?: string;
  lineBadge?: string;
  lineColor?: string; // Tailwind color class or hex
  stopsCount?: number;
  durationMins: number;
  distanceMeters?: number;
  boardingStop?: string;
  alightingStop?: string;
  landmark: string;
  landmarkDetail: string;
  landmarkIconName?: 'store' | 'coffee' | 'landmark' | 'building' | 'crosswalk' | 'train' | 'bus';
  guidance: {
    full: string;
    medium: string;
    light: string;
  };
  reassuranceCue?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  geometry?: [number, number][];
}

export interface RendezvousInfo {
  meetingStation: string;
  meetingStationCode?: string;
  meetingPlatformOrExit?: string;
  primaryOrigin: string;
  secondaryOrigin: string;
  destination: string;
  primaryDurationToHubMins: number;
  secondaryDurationToHubMins: number;
  primaryDepartureTime: string;
  secondaryDepartureTime: string;
  rendezvousTime: string;
  jointDurationToDestMins: number;
  summary: string;
}

export interface Journey {
  id: string;
  title: string;
  origin: string;
  destination: string;
  desiredArrivalTime: string;
  calculatedETA: string;
  totalDurationMins: number;
  travelHistoryCount: number;
  steps: JourneyStep[];
  routeSource?: RouteSource;
  totalDistanceMeters?: number;
  geometry?: [number, number][];
  legs?: JourneyStep[];
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  viaStops?: string[];
  rendezvousInfo?: RendezvousInfo;
}

export interface RouteOption {
  id: string;
  tag: string;
  tagType: 'recommended' | 'sheltered' | 'alternative';
  durationMins: number;
  calculatedETA: string;
  transfersCount: number;
  shelteredPercentage: number;
  summary: string;
  journey: Journey;
  rendezvousInfo?: RendezvousInfo;
}

export type GPSPermissionState = 'UNKNOWN' | 'REQUESTING' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  isSimulated?: boolean;
}

export interface OffRouteDetectionResult {
  offRoute: boolean;
  distanceFromRouteMeters: number;
  confidence: number;
  reason?: string;
  nearestStepIndex?: number;
  consecutiveDeviations?: number;
  suggestedAction?: string;
}

export interface JourneyImpactAssessment {
  affectsJourney: boolean;
  actionRequired: boolean;
  severity: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  reason: string;
  currentETA: string;
  alternativeETA?: string;
  minutesSaved?: number;
  recommendedAction: 'CONTINUE' | 'MONITOR' | 'REROUTE' | 'ALIGHT_NOW';
  affectedLegIds: string[];
  disruptionSummary?: string;
}

export interface CompanionMessage {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'local-companion' | 'system' | 'fallback';
}

export interface DisruptionAlert {
  id: string;
  active: boolean;
  title: string;
  affectedLine: string;
  description: string;
  currentRouteETA: string;
  alternativeRouteETA: string;
  alternativeLine: string;
  alternativeSteps: JourneyStep[];
}

export interface MissedStopState {
  isMissed: boolean;
  missedStopName: string;
  nextStopName: string;
  recoveryBus: string;
  originalETA: string;
  newETA: string;
  recoverySteps: JourneyStep[];
  aiExplanation: string;
}

export interface SharedETAState {
  shareId: string;
  recipientName: string;
  destination: string;
  currentETA: string;
  progressPercentage: number;
  statusText: string;
  lastUpdated: string;
  isArrived: boolean;
}
