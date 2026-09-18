export type FamiliarityLevel = 'full' | 'medium' | 'light';

export type TransportType = 'walk' | 'bus' | 'mrt' | 'transfer';

export interface JourneyStep {
  id: string;
  type: TransportType;
  title: string;
  lineName?: string;
  lineBadge?: string;
  lineColor?: string; // Tailwind color class or hex
  stopsCount?: number;
  durationMins: number;
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
  statusText: 'On schedule' | 'Slight delay (+7 min)' | 'Alternative route taken' | 'Arrived safely';
  lastUpdated: string;
  isArrived: boolean;
}
