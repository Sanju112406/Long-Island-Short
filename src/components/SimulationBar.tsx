import React from 'react';
import { Route, AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';

interface SimulationBarProps {
  onTriggerMissedStop: () => void;
  onTriggerDisruption: () => void;
  onTriggerOffRoute?: () => void;
  onResetScenarios: () => void;
  isMissedStopActive: boolean;
  isDisruptionActive: boolean;
  isOffRouteActive?: boolean;
  isPowerSaving?: boolean;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  onTriggerMissedStop,
  onTriggerDisruption,
  onTriggerOffRoute,
  onResetScenarios,
  isMissedStopActive,
  isDisruptionActive,
  isOffRouteActive = false,
  isPowerSaving = false,
}) => {
  return (
    <div
      id="simulation-testing-bar"
      className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
        isPowerSaving
          ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
          : 'bg-slate-100/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Journey Simulation & Recovery
          </span>
        </div>
        {(isMissedStopActive || isDisruptionActive || isOffRouteActive) && (
          <button
            id="reset-scenarios-button"
            type="button"
            onClick={onResetScenarios}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Disruption, Missed Stop, & Off-Route Simulation */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          id="simulate-missed-stop-button"
          type="button"
          onClick={onTriggerMissedStop}
          className={`px-2 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            isMissedStopActive
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          <Route className="w-3 h-3 text-indigo-500 shrink-0" />
          <span className="truncate">
            {isMissedStopActive ? 'Missed Stop' : 'Missed Stop'}
          </span>
        </button>

        <button
          id="simulate-disruption-button"
          type="button"
          onClick={onTriggerDisruption}
          className={`px-2 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            isDisruptionActive
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">
            {isDisruptionActive ? 'Disrupted' : 'Disruption'}
          </span>
        </button>

        <button
          id="simulate-off-route-button"
          type="button"
          onClick={onTriggerOffRoute}
          className={`px-2 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            isOffRouteActive
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-rose-400 hover:bg-rose-50/50'
          }`}
        >
          <Route className="w-3 h-3 text-rose-500 shrink-0" />
          <span className="truncate">
            {isOffRouteActive ? 'Off-Route' : 'Off-Route'}
          </span>
        </button>
      </div>
    </div>
  );
};
