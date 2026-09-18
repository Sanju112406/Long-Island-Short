import React from 'react';
import { FamiliarityLevel } from '../types';
import { ShieldCheck, Sparkles, Feather, Compass, Info } from 'lucide-react';

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
  const modes: {
    id: FamiliarityLevel;
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
    sampleInstruction: string;
  }[] = [
    {
      id: 'full' as FamiliarityLevel,
      title: 'Full Guidance',
      badge: travelHistoryCount === 0 ? 'Recommended (New Route)' : 'Step-by-step',
      description: 'Detailed instructions & frequent reassurance for unfamiliar routes.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      sampleInstruction: '“Walk past FairPrice. Turn left after the orange pillars towards Berth B4.”',
    },
    {
      id: 'medium' as FamiliarityLevel,
      title: 'Medium Guidance',
      badge: travelHistoryCount >= 1 && travelHistoryCount < 8 ? 'Recommended (Familiar)' : 'Key cues',
      description: 'Fewer instructions once you have travelled this route a few times.',
      icon: <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      sampleInstruction: '“Past FairPrice, head left into the interchange.”',
    },
    {
      id: 'light' as FamiliarityLevel,
      title: 'Light Guidance',
      badge: travelHistoryCount >= 8 ? 'Recommended (Mastered)' : 'Autonomous',
      description: 'Minimal prompts. Commuter navigates independently, AI on standby.',
      icon: <Feather className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      sampleInstruction: '“Toa Payoh Berth B4. Reassurance on standby.”',
    },
  ];

  return (
    <div
      id="familiarity-selector-card"
      className={`p-4 rounded-3xl border transition-all ${
        isPowerSaving
          ? 'bg-neutral-950 border-neutral-800 text-neutral-200'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Route Familiarity & Learning
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
          History: {travelHistoryCount} {travelHistoryCount === 1 ? 'trip' : 'trips'}
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-neutral-400 mb-3.5 leading-relaxed">
        The Eyes Up philosophy helps you learn your surroundings so you don’t stay glued to GPS. As you travel, guidance adapts:
      </p>

      {/* Mode selection buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {modes.map((mode) => {
          const isSelected = currentFamiliarity === mode.id;
          return (
            <button
              key={mode.id}
              id={`familiarity-button-${mode.id}`}
              type="button"
              onClick={() => onSelectFamiliarity(mode.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1 rounded-lg bg-white dark:bg-slate-800 shadow-xs">
                    {mode.icon}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {mode.id.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                  {mode.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  {mode.description}
                </p>
              </div>

              {/* Sample AI phrase */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] italic text-slate-500 dark:text-neutral-400 line-clamp-2">
                  {mode.sampleInstruction}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive simulation of user route history */}
      {onSimulateHistoryChange && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Simulate commuter history:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onSimulateHistoryChange(0);
                onSelectFamiliarity('full');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer ${
                travelHistoryCount === 0
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              0 trips (New)
            </button>
            <button
              type="button"
              onClick={() => {
                onSimulateHistoryChange(4);
                onSelectFamiliarity('medium');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer ${
                travelHistoryCount === 4
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              4 trips (Med)
            </button>
            <button
              type="button"
              onClick={() => {
                onSimulateHistoryChange(12);
                onSelectFamiliarity('light');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer ${
                travelHistoryCount >= 8
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              12 trips (Light)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
