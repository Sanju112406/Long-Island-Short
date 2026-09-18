import React from 'react';
import { JourneyStep, TransportType } from '../types';
import { Footprints, Bus, Train, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface SimplifiedJourneyMapProps {
  steps: JourneyStep[];
  currentStepIndex: number;
  onSelectStep?: (index: number) => void;
  isPowerSaving?: boolean;
}

export const SimplifiedJourneyMap: React.FC<SimplifiedJourneyMapProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  isPowerSaving = false,
}) => {
  const getStepIcon = (type: TransportType, isActive: boolean, isDone: boolean) => {
    if (isDone) return <CheckCircle2 className="w-3.5 h-3.5 text-white" />;
    switch (type) {
      case 'walk':
        return <Footprints className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />;
      case 'bus':
        return <Bus className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />;
      case 'mrt':
      case 'transfer':
        return <Train className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />;
    }
  };

  const progressPercent = steps.length > 1 ? Math.round((currentStepIndex / (steps.length - 1)) * 100) : 0;

  return (
    <div
      id="simplified-journey-map"
      className={`p-3.5 rounded-2xl border transition-colors ${
        isPowerSaving
          ? 'bg-black border-neutral-800 text-neutral-200'
          : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Schematic Journey Track
        </span>
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
          {progressPercent}% completed
        </span>
      </div>

      {/* Horizontal Thread / Metro schematic */}
      <div className="relative py-2 px-1">
        {/* Track line background */}
        <div className="absolute top-1/2 left-4 right-4 h-1.5 -translate-y-1/2 bg-slate-200 dark:bg-slate-800 rounded-full" />

        {/* Track line filled active progress */}
        <div
          className="absolute top-1/2 left-4 h-1.5 -translate-y-1/2 bg-emerald-500 rounded-full transition-all duration-500"
          style={{
            width: steps.length > 1 ? `${(currentStepIndex / (steps.length - 1)) * 92}%` : '0%',
          }}
        />

        {/* Nodes along the journey */}
        <div className="relative flex justify-between items-center z-10">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <button
                key={step.id}
                id={`map-node-${idx}`}
                type="button"
                onClick={() => onSelectStep && onSelectStep(idx)}
                className="group flex flex-col items-center focus:outline-none cursor-pointer"
                title={`${step.title} — ${step.landmark}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isActive
                      ? 'bg-slate-900 dark:bg-emerald-500 text-white ring-4 ring-emerald-400/30 scale-110 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {getStepIcon(step.type, isActive, isCompleted)}

                  {/* Active commuter avatar pulse ping */}
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  )}
                </div>

                {/* Node micro-label */}
                <div className="mt-1.5 text-center max-w-[68px]">
                  <p
                    className={`text-[10px] truncate leading-tight font-medium ${
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                        : isCompleted
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {step.lineBadge ? `Bus ${step.lineBadge}` : step.type.toUpperCase()}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-400 truncate">
                    {step.durationMins}m
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Immediate Landmark Callout */}
      {steps[currentStepIndex] && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Current Anchor:</span>
            <span className="text-slate-600 dark:text-slate-300 truncate">{steps[currentStepIndex].landmark}</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-400 shrink-0">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
      )}
    </div>
  );
};
