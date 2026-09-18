import React from 'react';
import { JourneyStep, FamiliarityLevel } from '../types';
import { LiveTransitTelemetryBadge } from './LiveTransitTelemetryBadge';
import {
  Compass,
  Clock,
  Navigation,
  MapPin,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Store,
  Coffee,
  Building,
  Footprints,
  Bus,
  Train,
  CheckCircle,
} from 'lucide-react';

interface ActiveStepCardProps {
  step: JourneyStep;
  stepIndex: number;
  totalSteps: number;
  familiarity: FamiliarityLevel;
  eta: string;
  desiredTime: string;
  isPowerSaving?: boolean;
  persona?: 'rachel' | 'arjun' | 'lim' | 'default';
  onNextStep: () => void;
  onPrevStep: () => void;
  onSpeakInstruction: () => void;
  isSpeaking?: boolean;
}

export const ActiveStepCard: React.FC<ActiveStepCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  familiarity,
  eta,
  desiredTime,
  isPowerSaving = false,
  persona = 'default',
  onNextStep,
  onPrevStep,
  onSpeakInstruction,
  isSpeaking = false,
}) => {
  const instructionText = step.guidance[familiarity] || step.guidance.full;

  const getLandmarkIcon = () => {
    switch (step.landmarkIconName) {
      case 'store':
        return <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'coffee':
        return <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'building':
        return <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getTransportIcon = () => {
    switch (step.type) {
      case 'bus':
        return <Bus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'mrt':
      case 'transfer':
        return <Train className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Footprints className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div
      id="active-guidance-card"
      className={`rounded-3xl p-5 border transition-all duration-300 relative shadow-sm ${
        isPowerSaving
          ? 'bg-neutral-950 border-neutral-800 text-neutral-100'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100'
      }`}
    >
      {/* Top micro-bar: Next step indicator & ETA badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isPowerSaving
                ? 'bg-neutral-900 text-emerald-400 border border-neutral-800'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {getTransportIcon()}
            <span>
              {step.lineName ? step.lineName : step.type.toUpperCase()}
            </span>
          </span>

          {step.stopsCount && (
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              {step.stopsCount} stops remaining
            </span>
          )}
        </div>

        {/* ETA & Desired Arrival */}
        <div className="flex items-center gap-1.5 text-right">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">ETA {eta}</span>
          <span className="text-[11px] text-slate-400 dark:text-neutral-400">(target {desiredTime})</span>
        </div>
      </div>

      {/* Main What-To-Do-Next Headline: High readability, conversational */}
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug text-slate-900 dark:text-white">
          {step.title}
        </h2>

        {/* Landmark-based instruction bubble */}
        <div
          className={`mt-3 p-3.5 rounded-2xl border ${
            isPowerSaving
              ? 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mt-0.5 shrink-0">
              <Navigation className="w-4 h-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium leading-relaxed">
                {instructionText}
              </p>
              {step.reassuranceCue && familiarity !== 'light' && (
                <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  {step.reassuranceCue}
                </p>
              )}
            </div>

            {/* Audio speak button */}
            <button
              id="hear-instruction-button"
              type="button"
              onClick={onSpeakInstruction}
              aria-label="Listen to Eyes Up voice guidance"
              className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isSpeaking
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-600 shadow-xs'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Landmark Highlight Banner */}
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border ${
          isPowerSaving
            ? 'bg-neutral-900/60 border-neutral-800'
            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30'
        }`}
      >
        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-xs shrink-0">
          {getLandmarkIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Key Singapore Landmark
          </p>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
            {step.landmark}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
            {step.landmarkDetail}
          </p>
        </div>
      </div>

      {/* Real-time LTA Transit & Persona Telemetry */}
      <LiveTransitTelemetryBadge
        stepType={step.type}
        persona={persona}
        isPowerSaving={isPowerSaving}
      />

      {/* Footer Controls: Step progression and progress counter */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
          <span>Step {stepIndex + 1} of {totalSteps}</span>
          <span>•</span>
          <span className="capitalize">{familiarity} guidance</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="step-prev-button"
            type="button"
            disabled={stepIndex === 0}
            onClick={onPrevStep}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            id="step-next-button"
            type="button"
            onClick={onNextStep}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 shadow-xs transition-all cursor-pointer ${
              stepIndex === totalSteps - 1
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-black hover:bg-slate-800'
            }`}
          >
            <span>{stepIndex === totalSteps - 1 ? 'Finish Journey' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
