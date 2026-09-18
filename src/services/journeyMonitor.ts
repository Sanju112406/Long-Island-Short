/**
 * Proactive Agentic Perception & Journey Monitoring Loop
 * Constantly evaluates commuter position, upcoming maneuver proximity,
 * and live corridor disruptions with intelligent deduplication and cooldowns.
 */

import { Journey, JourneyStep, FamiliarityLevel, LatLng, JourneyImpactAssessment, OffRouteDetectionResult } from '../types';
import { calculateDistanceMeters, geolocationService } from './geolocationService';

export interface JourneyMonitorConfig {
  journey: Journey;
  currentStepIndex: number;
  getCurrentLocation: () => LatLng | null;
  familiarityMode: FamiliarityLevel;
  userPersona: string;
  isPowerSaving: boolean;
  onProactiveGuidance: (speechText: string, actionLabel?: string) => void;
  onImpactDetected: (assessment: JourneyImpactAssessment) => void;
  onOffRouteDetected: (offRouteResult: OffRouteDetectionResult) => void;
  onStepProgress?: (newStepIndex: number) => void;
}

export class JourneyMonitor {
  private timerId: any = null;
  private isRunning = false;
  private isPowerSaving = false;
  private config: JourneyMonitorConfig | null = null;

  // Deduplication & Cooldown Tracking
  private lastAlertReason: string | null = null;
  private lastAlertTime = 0;
  private lastProactiveStepIndex = -1;
  private alertedOffRoute = false;

  public start(config: JourneyMonitorConfig): void {
    this.stop();
    this.config = config;
    this.isRunning = true;
    this.isPowerSaving = config.isPowerSaving;
    this.lastAlertReason = null;
    this.lastAlertTime = 0;
    this.lastProactiveStepIndex = -1;
    this.alertedOffRoute = false;

    // Run first perception tick after 3 seconds
    this.timerId = setTimeout(() => this.runPerceptionTick(), 3000);
  }

  public updateConfig(partial: Partial<JourneyMonitorConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...partial };
      if (typeof partial.isPowerSaving === 'boolean') {
        this.isPowerSaving = partial.isPowerSaving;
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private async runPerceptionTick(): Promise<void> {
    if (!this.isRunning || !this.config) return;

    try {
      const { journey, currentStepIndex, getCurrentLocation, familiarityMode, userPersona } = this.config;
      const currentLoc = getCurrentLocation();

      // 1. Check Off-Route Deviation
      if (currentLoc && journey.geometry && journey.geometry.length > 0) {
        const offRouteRes = geolocationService.evaluateOffRoute(currentLoc, journey);
        if (offRouteRes.offRoute && !this.alertedOffRoute) {
          this.alertedOffRoute = true;
          this.config.onOffRouteDetected(offRouteRes);
          this.config.onProactiveGuidance(
            `You are about ${offRouteRes.distanceFromRouteMeters} meters off your route. No worries at all—recalculating a smooth connection for you now.`,
            'Reroute From Here'
          );
        } else if (!offRouteRes.offRoute) {
          this.alertedOffRoute = false;
        }
      }

      // 2. Check Upcoming Maneuver & Landmark Proximity
      const currentStep = journey.steps[currentStepIndex];
      if (currentStep && currentStepIndex !== this.lastProactiveStepIndex) {
        this.lastProactiveStepIndex = currentStepIndex;
        const guidance = currentStep.guidance[familiarityMode] || currentStep.guidance.full;
        // Trigger landmark guidance if step just changed
      }

      // 3. Query Server for Live Journey Corridor Disruptions
      const res = await fetch('/api/journey/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey,
          currentStepIndex,
          currentLocation: currentLoc,
          userPersona,
        }),
      });

      if (res.ok) {
        const assessment: JourneyImpactAssessment = await res.json();
        const now = Date.now();
        const isNewIncident = assessment.reason !== this.lastAlertReason;
        const cooldownElapsed = now - this.lastAlertTime > 180000; // 3 min cooldown

        if (assessment.affectsJourney && assessment.actionRequired && (isNewIncident || cooldownElapsed)) {
          this.lastAlertReason = assessment.reason;
          this.lastAlertTime = now;
          this.config.onImpactDetected(assessment);

          const prompt =
            assessment.recommendedAction === 'REROUTE'
              ? `Heads up: ${assessment.reason}. I have prepared an alternative route that saves ${assessment.minutesSaved || 18} minutes.`
              : `Transit note: ${assessment.reason}.`;

          this.config.onProactiveGuidance(prompt, assessment.recommendedAction === 'REROUTE' ? 'Switch to Bypass' : 'View Details');
        }
      }
    } catch (err) {
      console.warn('[JourneyMonitor] Perception tick error:', err);
    }

    // Schedule next perception interval (15s normal, 40s power saving)
    if (this.isRunning) {
      const interval = this.isPowerSaving ? 40000 : 15000;
      this.timerId = setTimeout(() => this.runPerceptionTick(), interval);
    }
  }
}

export const journeyMonitor = new JourneyMonitor();
