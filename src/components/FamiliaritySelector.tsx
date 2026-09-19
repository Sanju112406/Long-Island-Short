import React, { useEffect } from 'react';
import { FamiliarityLevel } from '../types';
import { ShieldCheck, Sparkles, Feather, Compass, Info, Plus, Minus } from 'lucide-react';

interface FamiliaritySelectorProps {
  currentFamiliarity: FamiliarityLevel;
  onSelectFamiliarity: (level: FamiliarityLevel) => void;
  travelHistoryCount: number;
  onSimulateHistoryChange?: (count: number) => void;
  isPowerSaving?: boolean;
}

export const FamiliaritySelector: React.FC<FamiliaritySelectorProps> = ({
  currentFamiliarity,
  onSelectFamiliarity,
  travelHistoryCount,
  onSimulateHistoryChange,
  isPowerSaving = false,
}) => {
  // Automatically calculate suggestion based on history
  const calculatedLevel: FamiliarityLevel =
    travelHistoryCount === 0 ? 'full' : travelHistoryCount < 8 ? 'medium' : 'light';

  // Automatically synchronize guidance mode with history
  useEffect(() => {
    if (currentFamiliarity !== calculatedLevel) {
      onSelectFamiliarity(calculatedLevel);
    }
  }, [travelHistoryCount, calculatedLevel, currentFamiliarity, onSelectFamiliarity]);

  const levelInfo = {
    full: {
      title: 'Full Guidance',
      badge: 'Unfamiliar Corridor (0 Trips)',
      tagColor: 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-200 dark:border-red-800',
      description: 'Step-by-step landmark cues, proactive turn warnings, and continuous reassurance.',
      sample: '“Walk past FairPrice. Turn left after the red pillars towards MRT Concourse.”',
      icon: <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-400" />,
    },
    medium: {
      title: 'Medium Guidance',
      badge: `Familiar Corridor (${travelHistoryCount} Trips)`,
      tagColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      description: 'Streamlined landmark cues at key decision intersections only. Commuter knows general direction.',
      sample: '“Past FairPrice, take the covered linkway to MRT.”',
      icon: <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
    light: {
      title: 'Light Guidance',
      badge: `Mastered Route (${travelHistoryCount}+ Trips)`,
      tagColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      description: 'Minimal intervention. Silent background monitoring with voice alerts only during disruptions.',
      sample: '“MRT Platform B. Voice companion on standby.”',
      icon: <Feather className="w-5 h-5 text-slate-700 dark:text-slate-300" />,
    },
  }[calculatedLevel];

  return (
    <div
      id="familiarity-selector-card"
      className={`p-4 rounded-3xl border transition-all ${
        isPowerSaving
          ? 'bg-neutral-950 border-neutral-800 text-neutral-200'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-red-600 dark:text-red-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Route Familiarity & Adaptive Guidance
          </h3>
        </div>
        <span className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-100 dark:border-red-900">
          {travelHistoryCount} {travelHistoryCount === 1 ? 'trip completed' : 'trips completed'}
        </span>
      </div>

      {/* Automatic Suggestion Banner */}
      <div className="p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/60 mt-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
              {levelInfo.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Suggestion: {levelInfo.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelInfo.tagColor}`}>
                  {levelInfo.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Automatically adapted based on your past travel history along this transit corridor.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
          {levelInfo.description}
        </p>

        {/* Live Audio Guidance Preview */}
        <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-red-100 dark:border-red-900/40 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="font-bold text-red-600 dark:text-red-400 mr-1">Active Eyes-Up Cue:</span>
          <span className="italic">{levelInfo.sample}</span>
        </div>
      </div>

      {/* History Simulation Stepper */}
      {onSimulateHistoryChange && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Simulate Corridor History:</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSimulateHistoryChange(Math.max(0, travelHistoryCount - 1))}
              disabled={travelHistoryCount <= 0}
              className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Decrease simulated trips"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-slate-800 dark:text-slate-200 min-w-[3.5rem] text-center text-xs">
              {travelHistoryCount} trips
            </span>
            <button
              type="button"
              onClick={() => onSimulateHistoryChange(travelHistoryCount + 1)}
              className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
              title="Increase simulated trips"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
