/**
 * JourneyImpactEngine
 * Evaluates whether external disruptions (LTA train delays, lift maintenance, severe weather)
 * meaningfully intersect with the commuter's active journey.
 * Prevents commuter noise by suppressing irrelevant incidents across Singapore.
 */

import { Journey, JourneyImpactAssessment, LatLng } from '../../src/types';
import { LTATrainAlert, LTABusArrivalInfo, LTAFacilityMaintenance } from './ltaService';
import { WeatherNowcast } from './weatherService';

export interface JourneyImpactInput {
  journey: Journey;
  currentStepIndex: number;
  currentLocation?: LatLng;
  trainAlerts?: LTATrainAlert;
  busArrivals?: LTABusArrivalInfo;
  facilityMaintenance?: LTAFacilityMaintenance[];
  weather?: WeatherNowcast;
  userPersona?: string;
}

export function assessJourneyImpact(input: JourneyImpactInput): JourneyImpactAssessment {
  const { journey, currentStepIndex = 0, trainAlerts, facilityMaintenance, weather, userPersona } = input;

  if (!journey || !journey.steps || journey.steps.length === 0) {
    return {
      affectsJourney: false,
      actionRequired: false,
      severity: 'none',
      reason: 'No active journey in progress.',
      currentETA: '--',
      recommendedAction: 'CONTINUE',
      affectedLegIds: [],
    };
  }

  // Focus only on current and upcoming steps
  const remainingSteps = journey.steps.slice(currentStepIndex);
  const journeyText = remainingSteps
    .map((s) => `${s.title} ${s.lineName || ''} ${s.landmark} ${s.landmarkDetail}`)
    .join(' ')
    .toLowerCase();

  const affectedLegIds: string[] = [];

  // 1. Evaluate Train Service Alerts (e.g. DTL, EWL, NSL, CCL, NEL)
  if (trainAlerts && trainAlerts.status === 2 && trainAlerts.affectedSegments?.length > 0) {
    for (const seg of trainAlerts.affectedSegments) {
      const lineCode = seg.line.toLowerCase(); // e.g. "dtl", "ewl"
      const stations = (seg.stations || '').toLowerCase(); // e.g. "dt12,dt14"

      // Check if any upcoming leg uses this line or stations
      for (const step of remainingSteps) {
        const stepLine = (step.lineName || step.lineBadge || '').toLowerCase();
        const stepTitle = step.title.toLowerCase();
        const stepLandmark = step.landmark.toLowerCase();

        const matchesLine =
          (lineCode === 'dtl' && (stepLine.includes('dtl') || stepLine.includes('downtown') || stepTitle.includes('downtown') || stepLandmark.includes('bugis'))) ||
          (lineCode === 'ewl' && (stepLine.includes('ewl') || stepLine.includes('east-west') || stepTitle.includes('east-west') || stepLandmark.includes('tampines') || stepLandmark.includes('raffles') || stepLandmark.includes('bedok'))) ||
          (lineCode === 'nsl' && (stepLine.includes('nsl') || stepLine.includes('north-south') || stepTitle.includes('orchard') || stepLandmark.includes('orchard'))) ||
          (lineCode === 'ccl' && (stepLine.includes('ccl') || stepLine.includes('circle') || stepTitle.includes('circle') || stepLandmark.includes('one-north')));

        if (matchesLine) {
          affectedLegIds.push(step.id);
        }
      }

      if (affectedLegIds.length > 0) {
        const alertMsg = trainAlerts.messages?.[0]?.content || 'Significant train service delay detected on your route.';
        return {
          affectsJourney: true,
          actionRequired: true,
          severity: 'severe',
          reason: alertMsg,
          currentETA: 'Delayed by ~18-20 mins',
          alternativeETA: 'On schedule via bypass',
          minutesSaved: 18,
          recommendedAction: 'REROUTE',
          affectedLegIds,
          disruptionSummary: `${seg.line.toUpperCase()} Service Disruption: ${alertMsg}`,
        };
      }
    }
  }

  // 2. Evaluate Station Lift Maintenance for Accessibility / Senior Persona (Mdm Lim)
  if (userPersona === 'lim' && facilityMaintenance && facilityMaintenance.length > 0) {
    for (const maint of facilityMaintenance) {
      const station = maint.stationName.toLowerCase();
      if (journeyText.includes(station)) {
        for (const step of remainingSteps) {
          if (step.title.toLowerCase().includes(station) || step.landmark.toLowerCase().includes(station)) {
            affectedLegIds.push(step.id);
          }
        }
        return {
          affectsJourney: true,
          actionRequired: true,
          severity: 'moderate',
          reason: `Priority lift at ${maint.stationName} is under scheduled maintenance (${maint.liftDesc}). Barrier-free ramp suggested.`,
          currentETA: journey.calculatedETA,
          recommendedAction: 'MONITOR',
          affectedLegIds,
          disruptionSummary: `Accessibility Notice: ${maint.liftDesc} at ${maint.stationName}.`,
        };
      }
    }
  }

  // 3. Evaluate Weather Impact on Open / Cycling / Walking segments
  if (weather && weather.isRaining) {
    const hasOutdoorLeg = remainingSteps.some(
      (s) => s.type === 'cycle' || (s.type === 'walk' && !s.landmarkDetail.toLowerCase().includes('sheltered') && !s.landmarkDetail.toLowerCase().includes('underground'))
    );

    if (hasOutdoorLeg) {
      return {
        affectsJourney: true,
        actionRequired: false,
        severity: 'low',
        reason: `${weather.forecast} detected near ${weather.area}. Eyes Up will prioritize covered linkways and underpasses.`,
        currentETA: journey.calculatedETA,
        recommendedAction: 'MONITOR',
        affectedLegIds: remainingSteps.filter((s) => s.type === 'cycle' || s.type === 'walk').map((s) => s.id),
        disruptionSummary: `Weather Alert: ${weather.forecast} in ${weather.area}.`,
      };
    }
  }

  // Incident occurs elsewhere in Singapore and does not impact this commuter's route
  return {
    affectsJourney: false,
    actionRequired: false,
    severity: 'none',
    reason: 'All active transport corridors on your journey are running normally with no delays.',
    currentETA: journey.calculatedETA,
    recommendedAction: 'CONTINUE',
    affectedLegIds: [],
  };
}
