import React from 'react';
import { Route, AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';

interface SimulationBarProps {
  onTriggerMissedStop: () => void;
  onTriggerDisruption: () => void;
  onResetScenarios: () => void;
  isMissedStopActive: boolean;
  isDisruptionActive: boolean;
  isPowerSaving?: boolean;
  activePersona?: 'rachel' | 'arjun' | 'lim' | 'default';
  onSelectPersona?: (persona: 'rachel' | 'arjun' | 'lim' | 'default') => void;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  onTriggerMissedStop,
  onTriggerDisruption,
  onResetScenarios,
  isMissedStopActive,
  isDisruptionActive,
  isPowerSaving = false,
  activePersona = 'default',
  onSelectPersona,
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
            Journey Recovery & Commuter Scenarios
          </span>
        </div>
        {(isMissedStopActive || isDisruptionActive || activePersona !== 'default') && (
          <button
            id="reset-scenarios-button"
            type="button"
            onClick={() => {
              onResetScenarios();
              if (onSelectPersona) onSelectPersona('default');
            }}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>
        )}
      </div>

      {/* Disruption & Missed Stop Simulation */}
      <div className="grid grid-cols-2 gap-2">
        <button
          id="simulate-missed-stop-button"
          type="button"
          onClick={onTriggerMissedStop}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isMissedStopActive
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          <Route className="w-3.5 h-3.5 text-indigo-500" />
          <span className="truncate">
            {isMissedStopActive ? 'Missed Stop Active' : 'Simulate Missed Stop'}
          </span>
        </button>

        <button
          id="simulate-disruption-button"
          type="button"
          onClick={onTriggerDisruption}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isDisruptionActive
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="truncate">
            {isDisruptionActive ? 'Disruption Active' : 'Simulate Disruption'}
          </span>
        </button>
      </div>

      {/* Persona Scenario Switcher */}
      {onSelectPersona && (
        <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Live Persona Adaptivity (LTA + AI):
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => onSelectPersona('rachel')}
              className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                activePersona === 'rachel'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
              }`}
            >
              Rachel
              <span className="block text-[9px] font-normal opacity-85">1-line / buffer</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPersona('arjun')}
              className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                activePersona === 'arjun'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
              }`}
            >
              Arjun
              <span className="block text-[9px] font-normal opacity-85">Cyclist / PCN</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPersona('lim')}
              className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                activePersona === 'lim'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-500'
              }`}
            >
              Mdm Lim
              <span className="block text-[9px] font-normal opacity-85">Lifts / step-free</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
